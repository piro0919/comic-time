import fs from "fs/promises";
import os from "os";
import path from "path";

/**
 * Vercel Web Analytics の数字を端末に出す。
 *
 * ダッシュボードを開かずに済ませるためのもの。認証は Vercel CLI が
 * 置いているトークンをそのまま借りる（`vercel login` 済みが前提）。
 * MCP のコネクタ経由だと Web Analytics だけ 404 で弾かれるので、
 * REST API を直接叩いている。
 *
 * 使い方: npm run analytics [日数]  （既定は30日）
 */
const apiBase = "https://api.vercel.com/v1/query/web-analytics/visits";

/** Vercel CLI がトークンを置く場所。OS で変わる */
function authPath(): string {
  const home = os.homedir();

  return process.platform === "darwin"
    ? path.join(
        home,
        "Library",
        "Application Support",
        "com.vercel.cli",
        "auth.json",
      )
    : path.join(home, ".local", "share", "com.vercel.cli", "auth.json");
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await fs.readFile(file, "utf8")) as T;
}

type Totals = {
  pageviews: number;
  visitors: number;
};

type Row = {
  count?: number;
  pageviews?: number;
  timestamp?: string;
  visitors: number;
} & Record<string, unknown>;

type Client = {
  aggregate: (by: string, limit?: number) => Promise<Row[]>;
  count: (since: string, until: string) => Promise<Totals>;
};

function createClient(
  token: string,
  projectId: string,
  teamId: string,
  since: string,
  until: string,
): Client {
  async function get<T>(
    kind: string,
    params: Record<string, string>,
  ): Promise<T> {
    const query = new URLSearchParams({ projectId, teamId, ...params });
    const response = await fetch(`${apiBase}/${kind}?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`${kind} ${response.status}: ${await response.text()}`);
    }

    const body = (await response.json()) as { data: T };

    return body.data;
  }

  return {
    aggregate: (by, limit = 10) =>
      get<Row[]>("aggregate", { by, limit: String(limit), since, until }),
    count: (from, to) => get<Totals>("count", { since: from, until: to }),
  };
}

/** YYYY-MM-DD。API は日付だけの文字列を受け取る */
function day(offsetDays: number): string {
  const date = new Date();

  date.setUTCDate(date.getUTCDate() - offsetDays);

  return date.toISOString().slice(0, 10);
}

function show(title: string, rows: Row[], key: string): void {
  console.log(`\n[${title}]`);

  for (const row of rows) {
    const name = String(row[key] || row.timestamp?.slice(0, 10) || "(直接)");
    const views = row.count ?? row.pageviews ?? 0;

    console.log(
      `  ${name.padEnd(28)} 訪問者 ${String(row.visitors).padStart(5)}  閲覧 ${String(views).padStart(6)}`,
    );
  }
}

async function main(): Promise<void> {
  const days = Number(process.argv[2] ?? 30);
  const since = day(days);
  const until = day(0);
  const { token } = await readJson<{ token: string }>(authPath());
  const { orgId, projectId } = await readJson<{
    orgId: string;
    projectId: string;
  }>(path.join(process.cwd(), ".vercel", "project.json"));
  const client = createClient(token, projectId, orgId, since, until);
  const [recent, whole] = await Promise.all([
    client.count(day(7), until),
    client.count(since, until),
  ]);

  console.log(`直近7日   訪問者 ${recent.visitors}  閲覧 ${recent.pageviews}`);
  console.log(
    `直近${days}日  訪問者 ${whole.visitors}  閲覧 ${whole.pageviews}`,
  );

  show("日別", await client.aggregate("day", 100), "day");
  show("ページ", await client.aggregate("requestPath"), "requestPath");
  show(
    "参照元",
    await client.aggregate("referrerHostname"),
    "referrerHostname",
  );
  show("端末", await client.aggregate("deviceType"), "deviceType");
  show("国", await client.aggregate("country"), "country");
}

await main();
