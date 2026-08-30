import { type Metadata } from "next";
import { notFound } from "next/navigation";
import WorkDetail from "../../_components/WorkDetail";
import pageMetadata from "../../pageMetadata";
import { catalog, seenDaysLabel, workOf } from "../../workCatalog";
import { dateLabel } from "../../worksOfDay";

export type PageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 3600;

/** 台帳に無い作品は 404 にする */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const work = workOf(slug);

  if (work === undefined) {
    return {};
  }

  const days = seenDaysLabel(work.dayBits);
  const where = work.sites.map((site) => site.name).join("・");

  return pageMetadata({
    description:
      `${work.title}の更新曜日と、読めるサイト。` +
      `${days === "" ? "" : `更新を見たのは${days}。`}` +
      `最後の更新は${dateLabel(work.lastSeen)}。${where}で読めます。`,
    path: `/works/${encodeURIComponent(work.slug)}`,
    title: `${work.title}の更新曜日`,
  });
}

export function generateStaticParams(): { slug: string }[] {
  return catalog().map((work) => ({ slug: work.slug }));
}

export default async function Page({
  params,
}: PageProps): Promise<React.JSX.Element> {
  const { slug } = await params;
  const work = workOf(slug);

  if (work === undefined) {
    notFound();
  }

  return <WorkDetail work={work} />;
}
