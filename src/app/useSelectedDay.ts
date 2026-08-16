"use client";
import { usePathname } from "next/navigation";
import { type Weekday } from "@/types/work";
import { days } from "./days";

/** 表示中の曜日。曜日のページ以外では、どの曜日も選択状態にしない */
export default function useSelectedDay(): undefined | Weekday {
  const pathname = usePathname();

  return days.find(({ key }) => pathname === `/day/${key}`)?.key;
}
