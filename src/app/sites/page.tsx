import { type Metadata } from "next";
import SiteList from "../_components/SiteList";
import pageMetadata from "../pageMetadata";
import { sites } from "../siteCatalog";

/** 作品の並びは日ごとに変わる。1時間ごとに作り直す */
export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return pageMetadata({
    description:
      "ComicTime が更新を追跡している Web 漫画サイトの一覧です。サイトごとの更新曜日と更新時刻を掲載しています。",
    path: "/sites",
    title: "サイト一覧",
  });
}

export default function Page(): React.JSX.Element {
  return <SiteList sites={sites()} />;
}
