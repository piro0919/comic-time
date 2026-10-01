import { readdir, readFile } from "node:fs/promises";
import pg from "pg";
import { baselineName, goneOf, migrationNames, pendingOf } from "./plan.ts";

/**
 * db/migrations/ を DB に当てる。どれを当てたかは schema_migrations 表に残す。
 * koidamashii の scripts/migrate.ts と同じ作り。
 *
 *   npm run migrate                まだ当てていないものを、番号順に1本ずつ当てる
 *   npm run migrate:check          まだ当てていないものがあれば、名前を出して失敗する
 *   npm run migrate -- --baseline  schema_migrations が無い DB に、0007 だけを当てて記録を始める
 *
 * 当てる先は DATABASE_URL。.env.local の値は本番を指す。Neon のブランチで試すときは
 * DATABASE_URL をそのブランチの接続文字列にして走らせる。
 *
 * schema_migrations が無いときは、--baseline が無い限り何もしない。0001〜0006 は
 * 本番に手で当ててあり、0002 は follow_work を作り直す。表が無いのを「何も当たっていない」と
 * 読むと、フォローを全部消してしまう。--baseline は 0006 までの表がそろっているのを
 * 確かめてから 0007 を当て、0001〜0006 を当たったものとして記す。
 *
 * 1本ずつトランザクションで包むので、途中で失敗したファイルは何も残さない。
 * 2本が同時に走っても、advisory lock で後の方が待ち、同じものを二度当てない。
 */
const dir = new URL("../../db/migrations/", import.meta.url);
/** --baseline の前に確かめる、0001〜0006 が作った表 */
const baselineTables = [
  "follow_work",
  "follow_site",
  "opened_work",
  "user",
  "session",
  "account",
  "verification",
  "early_site",
];

async function hasTable(
  client: pg.Pool | pg.PoolClient,
  name: string,
): Promise<boolean> {
  const { rows } = await client.query<{ found: null | string }>(
    "select to_regclass($1)::text as found",
    [`public."${name}"`],
  );

  return rows[0]?.found !== null && rows[0]?.found !== undefined;
}

async function apply(pool: pg.Pool, name: string): Promise<void> {
  const body = await readFile(new URL(`${name}.sql`, dir), "utf8");
  const client = await pool.connect();

  try {
    await client.query("begin");
    // 2本が重なっても、同じものを二度当てない。後から来た方はここで待ち、
    // 先の方が当て終えていれば何もしない
    await client.query(
      "select pg_advisory_xact_lock(hashtext('schema_migrations'))",
    );

    if (await hasTable(client, "schema_migrations")) {
      const { rows } = await client.query(
        "select 1 from schema_migrations where name = $1",
        [name],
      );

      if (rows.length > 0) {
        await client.query("commit");

        return;
      }
    }

    // 引数を渡さなければ、複数の文をまとめて送れる
    await client.query(body);
    await client.query(
      "insert into schema_migrations (name, applied_at) values ($1, now())",
      [name],
    );
    await client.query("commit");
    console.log(`applied: ${name}`);
  } catch (error) {
    await client.query("rollback");
    throw new Error(`${name} failed and was rolled back`, { cause: error });
  } finally {
    client.release();
  }
}

async function baseline(pool: pg.Pool): Promise<void> {
  const missing: string[] = [];

  for (const table of baselineTables) {
    if (!(await hasTable(pool, table))) {
      missing.push(table);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      [
        `--baseline expects the tables of 0001-0006, but these are missing: ${missing.join(", ")}`,
        "Apply the missing migrations by hand first, or check DATABASE_URL points at the right database.",
      ].join("\n"),
    );
  }

  await apply(pool, baselineName);
}

async function main(): Promise<void> {
  const argv = process.argv;
  const check = argv.includes("--check");
  const url = process.env.DATABASE_URL;

  if (url === undefined || url === "") {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new pg.Pool({ connectionString: url });

  try {
    if (!(await hasTable(pool, "schema_migrations"))) {
      if (check || !argv.includes("--baseline")) {
        console.error(
          [
            "schema_migrations does not exist yet.",
            "If this database already has 0001-0006 (production does), run:",
            "  npm run migrate -- --baseline",
            "It checks those tables exist, then records 0001-0006 as applied without running them again.",
          ].join("\n"),
        );
        process.exitCode = 1;

        return;
      }

      await baseline(pool);
    }

    const names = migrationNames(await readdir(dir));
    const { rows } = await pool.query<{ name: string }>(
      "select name from schema_migrations",
    );
    const applied = new Set(rows.map((row) => row.name));
    const gone = goneOf(names, applied);

    if (gone.length > 0) {
      console.warn(
        `recorded in the database but missing as files: ${gone.join(", ")}`,
      );
    }

    const pending = pendingOf(names, applied);

    if (pending.length === 0) {
      console.log(`all ${names.length} migrations are applied`);

      return;
    }

    if (check) {
      console.error(
        ["pending migrations:", ...pending.map((name) => `  ${name}`)].join(
          "\n",
        ),
      );
      process.exitCode = 1;

      return;
    }

    for (const name of pending) {
      await apply(pool, name);
    }
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
