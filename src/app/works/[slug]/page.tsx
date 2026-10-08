import { type Metadata } from "next";
import { notFound } from "next/navigation";
import episodesForPage from "@/app/episodes/episodesForPage";
import episodeSourceOf from "@/app/episodes/episodeSourceOf";
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
  // 題名で検索してくる人が知りたいのは、どこで無料で読めるかと最新話。
  // 話の一覧を出せるサイトに載っている作品だけ、それを見出しに出す
  const listsEpisodes = work.sites.some(
    (site) => episodeSourceOf(site.siteUrl) !== undefined,
  );

  return pageMetadata({
    description:
      `${where}で読めます。` +
      `${days === "" ? "" : `更新を見たのは${days}、`}` +
      `最後の更新は${dateLabel(work.lastSeen)}。` +
      (listsEpisodes
        ? "無料で読める話・先読み・有料の回を一覧で確かめられます。"
        : "更新曜日と読めるサイトをまとめています。"),
    path: `/works/${encodeURIComponent(work.slug)}`,
    title: listsEpisodes
      ? `${work.title}の最新話と無料で読める話・更新曜日`
      : `${work.title}の更新曜日と読めるサイト`,
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
