import { type Metadata } from "next";
import Settings from "../_components/Settings";
import episodeSourceOf from "../episodes/episodeSourceOf";
import pageMetadata from "../pageMetadata";
import { sites } from "../siteCatalog";

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
      // 話の一覧を取れないサイトでは、どちらを選んでも送り先が変わらない
      sites={sites()
        .filter((site) => episodeSourceOf(site.url) !== undefined)
        .map((site) => ({ name: site.name, slug: site.slug, url: site.url }))}
    />
  );
}
