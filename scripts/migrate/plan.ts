/**
 * どのファイルを当てるかを決める。DB に触らないので、テストから確かめられる。
 */

/** 記録の表を作るファイル。これより前は、表ができる前に手で当てたもの */
export const baselineName = "0007_schema_migrations";

/** db/migrations/ のファイル名から、番号順の名前の一覧へ。.sql は落とす */
export function migrationNames(files: string[]): string[] {
  return files
    .filter((file) => /^\d{4}_[a-z0-9_]+\.sql$/.test(file))
    .map((file) => file.replace(/\.sql$/, ""))
    .sort();
}

/** まだ当てていないもの。番号順 */
export function pendingOf(names: string[], applied: Set<string>): string[] {
  return names.filter((name) => !applied.has(name));
}

/** DB には記録があるのに、ファイルが無いもの */
export function goneOf(names: string[], applied: Set<string>): string[] {
  return [...applied].filter((name) => !names.includes(name)).sort();
}
