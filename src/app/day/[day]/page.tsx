import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { type Weekday } from "@/types/work";
import App from "../../_components/App";
import WorkIndex from "../../_components/WorkIndex";
import crossSiteWorks from "../../crossSiteWorks";
import { dayLabel } from "../../days";
import pageMetadata from "../../pageMetadata";
import { worksOfWeekday } from "../../workCatalog";
import worksOfDay, { dayKeys, recentDateOf } from "../../worksOfDay";

export type PageProps = {
  params: Promise<{ day: string }>;
};

/** 生成した7曜日以外は 404 にする */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { day } = await params;
  const label = dayLabel(day as Weekday);

  return pageMetadata({
    description: `${label}に更新された Web 漫画の一覧です。`,
    path: `/day/${day}`,
    title: `${label}の更新`,
  });
}

export function generateStaticParams(): { day: string }[] {
  return dayKeys.map((day) => ({ day }));
}

export default async function Page({
  params,
}: PageProps): Promise<React.JSX.Element> {
  const { day } = await params;

  if (!dayKeys.includes(day as Weekday)) {
    notFound();
  }

  return (
    <>
      <App
        crossSites={crossSiteWorks()}
        date={recentDateOf(day as Weekday)}
        day={day as Weekday}
        works={worksOfDay(day as Weekday)}
      />
      <WorkIndex
        heading={`${dayLabel(day as Weekday)}に更新される作品`}
        works={worksOfWeekday(day as Weekday)}
      />
    </>
  );
}
