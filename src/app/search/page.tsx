import { type Metadata } from "next";
import pageMetadata from "@/lib/pageMetadata";
import searchIndex from "@/lib/searchIndex";
import Search from "../_components/Search";

export const metadata: Metadata = pageMetadata({
  description: "作品を検索して、お気に入りに追加できます。",
  path: "/search",
  title: "作品を探す",
});

export default function Page(): React.JSX.Element {
  return <Search index={searchIndex()} />;
}
