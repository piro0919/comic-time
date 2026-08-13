import { type DayKey } from "@/types/work";

export const days: { key: DayKey; label: string }[] = [
  { key: "sun", label: "日曜日" },
  { key: "mon", label: "月曜日" },
  { key: "tue", label: "火曜日" },
  { key: "wed", label: "水曜日" },
  { key: "thu", label: "木曜日" },
  { key: "fri", label: "金曜日" },
  { key: "sat", label: "土曜日" },
  { key: "irregular", label: "不定期" },
];

export function dayHref(day: DayKey): string {
  return `/day/${day}`;
}

export function dayLabel(day: DayKey): string {
  return days.find(({ key }) => key === day)?.label ?? "";
}
