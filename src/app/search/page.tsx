import { type Metadata } from "next";
import Search from "../_components/Search";
import searchIndex from "../searchIndex";

export const metadata: Metadata = {
  description: "追いかけたい作品を探して、お気に入りに登録できます。",
  title: "作品を探す",
};

export default function Page(): React.JSX.Element {
  return <Search index={searchIndex()} />;
}
