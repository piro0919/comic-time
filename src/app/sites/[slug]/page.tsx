import { type Metadata } from "next";
import { notFound } from "next/navigation";
import SiteDetail from "../../_components/SiteDetail";
import { siteOf, sites, updateDayLabel, worksOfSite } from "../../siteCatalog";

export type PageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 3600;

/** 台帳に無いサイトは 404 にする */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const site = siteOf(slug);

  if (site === undefined) {
    return {};
  }

  const time = site.updateTime === "" ? "" : `${site.updateTime}に`;

  return {
    description: `${site.name}の更新曜日は${updateDayLabel(site.updateDay)}。${time}更新されます。この一週間に更新された作品をまとめています。`,
    title: `${site.name}の更新曜日と最新話`,
  };
}

export function generateStaticParams(): { slug: string }[] {
  return sites().map((site) => ({ slug: site.slug }));
}

export default async function Page({
  params,
}: PageProps): Promise<React.JSX.Element> {
  const { slug } = await params;
  const site = siteOf(slug);

  if (site === undefined) {
    notFound();
  }

  return <SiteDetail days={worksOfSite(site)} site={site} />;
}
