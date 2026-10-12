import { type Metadata } from "next";
import { offersEarly } from "@/lib/episodes/episodeSourceOf";
import pageMetadata from "@/lib/pageMetadata";
import { sites } from "@/lib/siteCatalog";
import Settings from "../_components/Settings";

export const metadata: Metadata = {
  ...pageMetadata({
    description: "ComicTime の設定です。",
    path: "/settings",
    title: "設定",
  }),
  // 読み手ごとの設定で、検索から来ても読むものが無い
  robots: { index: false },
};

export default function Page(): React.JSX.Element {
  return (
    <Settings
      // 先読みの回が出てこないサイトでは、どちらを選んでも送り先が変わらない
      sites={sites()
        .filter((site) => offersEarly(site.url))
        .map((site) => ({ name: site.name, slug: site.slug, url: site.url }))}
    />
  );
}
