/**
 * 公開の日時を日本の日付「2026-09-30」にする。取得元は UTC で返すことが多く、
 * そのまま日付を切ると、日本の0時から9時に出た回が前の日になる。
 * 数は1970年からのミリ秒。読めなければ null。
 */
export default function japanDate(
  value: null | number | string | undefined,
): null | string {
  const time = typeof value === "number" ? value : Date.parse(value ?? "");

  return Number.isNaN(time)
    ? null
    : new Date(time + 9 * 3600 * 1000).toISOString().slice(0, 10);
}
