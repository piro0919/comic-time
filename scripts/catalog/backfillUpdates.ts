import { execFileSync, spawnSync } from "child_process";
import fs from "fs/promises";
import path from "path";
import { titleKey } from "../../src/lib/workSlug.ts";
import { type CatalogEntry, type DateKey } from "../../src/types/work.ts";

/**
 * 台帳の updates を git の履歴から書き起こす。手元で1回流すためのもの。
 *
 * data/works は7日で消えるが、取得のたびにコミットしているので、全日ぶんが履歴に残っている。
 * 取得の workflow は浅く clone するので、ここは手元でしか走らない。
 *
 * - 読むのは、1サイト1ファイルで取る形に書き直したコミット（2026-08-17）から後。
 *   それより前の日付のファイルは曜日の一覧から作っていて、その日に更新していない作品も入っている
 * - 1日のうちに何度も書き直されるので、その日のファイルの全版を合わせて読む。
 *   最後の版だけだと、2026-10-21 のように後の回で取れなかったサイトのぶんが抜ける
 * - 同じ回の住所を6日以内に見ていた日は更新と数えない。今の取得では dropRepeats が外しているが、
 *   入ったのが 2026-09-09 で、それより前は同じ回が毎日載っていた
 *
 * 台帳に既にある日付は残して足すだけなので、何度流してもよい。
 * 取得のコミットと台帳がぶつかったら、相手の台帳を採ってこれを流し直す。
 */
const rewriteCommit = "7b31153c";
const firstDate = "2026-08-17";
/** 同じ回をこの日数より前に見ていれば、また載っても更新とみなす。dropRepeats が見る7日ぶんと揃える */
const repeatDays = 7;
const msPerDay = 86_400_000;
const catalogPath = path.join(process.cwd(), "data", "catalog.json");

function git(args: string[]): string {
  return execFileSync("git", args, { maxBuffer: 2 ** 30 }).toString();
}

/**
 * 日付ファイルの blob と、その日付。同じ中身の版は1回だけ読む。
 * 別の日のファイルが同じ中身になることもあるので、日付は複数持つ
 */
function dateBlobs(): Map<string, Set<DateKey>> {
  const blobs = new Map<string, Set<DateKey>>();
  const commits = git([
    "log",
    "--format=%H",
    `${rewriteCommit}^..HEAD`,
    "--",
    "data/works",
  ])
    .trim()
    .split("\n");

  commits.forEach((commit) => {
    git(["ls-tree", commit, "data/works/"])
      .trim()
      .split("\n")
      .forEach((line) => {
        const match =
          /blob ([0-9a-f]+)\tdata\/works\/(\d{4}-\d{2}-\d{2})\.json$/.exec(
            line,
          );

        if (match !== null && match[2] >= firstDate) {
          blobs.set(
            match[1],
            new Set([...(blobs.get(match[1]) ?? []), match[2]]),
          );
        }
      });
  });

  return blobs;
}

/** 題名の鍵 → 回の住所 → その住所が載っていた日 */
function sightings(
  blobs: Map<string, Set<DateKey>>,
): Map<string, Map<string, Set<DateKey>>> {
  const output = spawnSync("git", ["cat-file", "--batch"], {
    input: `${[...blobs.keys()].join("\n")}\n`,
    maxBuffer: 2 ** 32,
  }).stdout;
  const seen = new Map<string, Map<string, Set<DateKey>>>();

  let position = 0;

  while (position < output.length) {
    const headerEnd = output.indexOf("\n", position);
    const [hash, , size] = output
      .subarray(position, headerEnd)
      .toString()
      .split(" ");
    const bodyEnd = headerEnd + 1 + Number(size);
    const dates = blobs.get(hash);
    const works = JSON.parse(
      output.subarray(headerEnd + 1, bodyEnd).toString(),
    ) as { title: string; url: string }[];

    position = bodyEnd + 1;

    if (dates === undefined) {
      continue;
    }

    works.forEach((work) => {
      const key = titleKey(work.title);
      const byUrl = seen.get(key) ?? new Map<string, Set<DateKey>>();
      const listed = byUrl.get(work.url) ?? new Set<DateKey>();

      dates.forEach((date) => listed.add(date));
      byUrl.set(work.url, listed);
      seen.set(key, byUrl);
    });
  }

  return seen;
}

/** 同じ回が続けて載った日を外して、更新を見つけた日にする */
function updatesOf(byUrl: Map<string, Set<DateKey>>): Set<DateKey> {
  const updates = new Set<DateKey>();

  byUrl.forEach((dates) => {
    const sorted = [...dates].sort();

    sorted.forEach((date, index) => {
      const previous = sorted[index - 1];

      if (
        previous === undefined ||
        Date.parse(date) - Date.parse(previous) >= repeatDays * msPerDay
      ) {
        updates.add(date);
      }
    });
  });

  return updates;
}

const catalog = JSON.parse(
  await fs.readFile(catalogPath, "utf-8"),
) as CatalogEntry[];
const seen = sightings(dateBlobs());

let filled = 0;

const entries = catalog.map((entry) => {
  const byUrl = seen.get(titleKey(entry.title));
  const updates = new Set<DateKey>(entry.updates ?? []);

  if (byUrl !== undefined) {
    filled += 1;
    updatesOf(byUrl).forEach((date) => updates.add(date));
  }

  const sorted = [...updates].sort();
  const first = sorted[0];

  // 台帳は 8/24 から貯めていて、履歴はそれより前まである。初めて見た日も履歴に揃える。
  // 更新を見た曜日（dayBits）は画面の文言に出るので、ここでは触らない
  return {
    ...entry,
    firstSeen:
      first !== undefined && first < entry.firstSeen ? first : entry.firstSeen,
    updates: sorted,
  };
});

await fs.writeFile(catalogPath, `${JSON.stringify(entries, null, 2)}\n`);
console.log(
  `[backfill] ${entries.length}件のうち ${filled}件に履歴を書き起こした`,
);
