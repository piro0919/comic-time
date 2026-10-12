import { type Metadata } from "next";
import { notFound } from "next/navigation";
import episodesForPage from "@/lib/episodes/episodesForPage";
import episodeSourceOf from "@/lib/episodes/episodeSourceOf";
import pageMetadata from "@/lib/pageMetadata";
import siteOrigin from "@/lib/siteOrigin";
import { seenDaysLabel, workHref, workOf } from "@/lib/workCatalog";
import { dateLabel } from "@/lib/worksOfDay";
import JsonLd from "../../_components/JsonLd";
import WorkDetail from "../../_components/WorkDetail";

export type PageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * 取得元はどれも日本のサイトなので、関数は東京に置く。
 * 既定のシンガポールは DB に合わせたもので、ここは DB をほとんど使わない
 */
export const preferredRegion = "hnd1";

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

  const url = `${siteOrigin}${workHref(encodeURIComponent(work.slug))}`;

  return (
    <>
      {/*
       * 作品として読ませる。作者は台帳に無いので入れない。
       * 各サイトの住所は sameAs に入れない。作品ページの無いサイトでは話の住所を控えていて、作品と同じものではない
       */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ComicSeries",
          dateModified: work.lastSeen,
          ...(work.thumbnailUrl === null
            ? {}
            : { image: new URL(work.thumbnailUrl, siteOrigin).href }),
          inLanguage: "ja",
          name: work.title,
          url,
        }}
      />
      <WorkDetail episodes={await episodesForPage(work.sites)} work={work} />
    </>
  );
}
