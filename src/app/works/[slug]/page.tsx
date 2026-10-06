import { type Metadata } from "next";
import { notFound } from "next/navigation";
import episodesForPage from "@/app/episodes/episodesForPage";
import WorkDetail from "../../_components/WorkDetail";
import pageMetadata from "../../pageMetadata";
import { seenDaysLabel, workOf } from "../../workCatalog";
import { dateLabel } from "../../worksOfDay";

export type PageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * 作ったページは6時間使い回す。話の一覧の取得元に頼むのも、作品ごとに6時間に1回で済む。
 * デプロイのたびに作り直しになるので、最後の更新日が古いまま残ることはない
 */
export const revalidate = 21600;

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

/**
 * ビルドでは1件も作らない。開かれたときに作って保存する。
 *
 * 作品ページは話の一覧を HTML に入れている。4千件あまりをビルドで作ると、
 * そのたびに全作品ぶん取得元へ頼むことになる。台帳に無い作品は Page が 404 にする
 */
export function generateStaticParams(): { slug: string }[] {
  return [];
}

export default async function Page({
  params,
}: PageProps): Promise<React.JSX.Element> {
  const { slug } = await params;
  const work = workOf(slug);

  if (work === undefined) {
    notFound();
  }

  return (
    <WorkDetail episodes={await episodesForPage(work.sites)} work={work} />
  );
}
