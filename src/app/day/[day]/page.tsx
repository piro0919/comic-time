import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { type DayKey } from "@/types/work";
import App from "../../_components/App";
import { dayLabel } from "../../days";
import groupsOfDay, { dayKeys } from "../../groupsOfDay";

export type PageProps = {
  params: Promise<{ day: string }>;
};

/** 生成した8曜日以外は 404 にする */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { day } = await params;
  const label = dayLabel(day as DayKey);

  return {
    description: `${label}に更新されるWeb漫画の一覧です。`,
    title: `${label}の更新`,
  };
}

export function generateStaticParams(): { day: string }[] {
  return dayKeys.map((day) => ({ day }));
}

export default async function Page({
  params,
}: PageProps): Promise<React.JSX.Element> {
  const { day } = await params;

  if (!dayKeys.includes(day as DayKey)) {
    notFound();
  }

  return <App day={day as DayKey} groups={groupsOfDay(day as DayKey)} />;
}
