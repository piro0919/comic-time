"use client";
import dayjs from "dayjs";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { type DayKey } from "@/types/work";
import { days } from "./days";

/**
 * 表示中の曜日。/day/xxx はそのまま、トップは端末の今日を使う。
 * 端末の日付はサーバと食い違うため、描画後に確定させる。
 */
export default function useSelectedDay(): DayKey | undefined {
  const pathname = usePathname();
  const [today, setToday] = useState<DayKey | undefined>(undefined);

  useEffect(() => {
    setToday(days.at(dayjs().day())?.key);
  }, []);

  const fromPath = days.find(({ key }) => pathname === `/day/${key}`)?.key;

  // 曜日以外のページ（検索など）では、どの曜日も選択状態にしない
  if (pathname !== "/" && fromPath === undefined) {
    return undefined;
  }

  return fromPath ?? today;
}
