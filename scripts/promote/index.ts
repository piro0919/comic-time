import { execFileSync } from "child_process";

/**
 * main の先頭のコミットの配備を本番にする。
 *
 * 取得の push と手元の push が続くと、Vercel は両方を別々に配備し、
 * 後に終わった方が本番に付く。古いコミットの配備が後に終わると、
 * 新しい変更が本番から外れたままになる（2026-11-27 に検索の変更で起きた）。
 *
 * 配備はコミットに付いた GitHub の Vercel の記録から引く。
 * 使い方: npm run promote
 */
const productionHost = "comictime.kkweb.io";

function run(command: string, args: string[]): string {
  return execFileSync(command, args, { encoding: "utf8" }).trim();
}

function headSha(): string {
  run("git", ["fetch", "--quiet", "origin", "main"]);

  return run("git", ["rev-parse", "origin/main"]);
}

/** コミットに付いた Vercel の記録から配備の id を取る。まだ無ければ undefined */
function deploymentOf(sha: string): undefined | { id: string; state: string } {
  const { statuses } = JSON.parse(
    run("gh", ["api", `repos/{owner}/{repo}/commits/${sha}/status`]),
  ) as { statuses: { context: string; state: string; target_url: string }[] };
  const vercel = statuses.find((status) => status.context === "Vercel");
  const id = vercel?.target_url.split("/").at(-1) ?? "";

  return vercel === undefined || id === ""
    ? undefined
    : { id: `dpl_${id}`, state: vercel.state };
}

function currentProductionId(): string {
  const json = JSON.parse(
    run("npx", ["vercel", "inspect", productionHost, "--format", "json"]),
  ) as { id: string };

  return json.id;
}

const sha = headSha();
const deployment = deploymentOf(sha);

console.log(`main の先頭: ${sha.slice(0, 8)}`);

if (deployment === undefined) {
  console.error(
    "このコミットの配備がまだありません。少し待ってから流し直してください",
  );
  process.exit(1);
}

if (deployment.state !== "success") {
  console.error(
    `このコミットの配備は ${deployment.state} です。終わってから流し直してください`,
  );
  process.exit(1);
}

const current = currentProductionId();

if (current === deployment.id) {
  console.log(`本番はすでにこの配備です（${deployment.id}）`);
  process.exit(0);
}

console.log(`本番を ${current} から ${deployment.id} に切り替えます`);
execFileSync("npx", ["vercel", "promote", deployment.id, "--yes"], {
  stdio: "inherit",
});
