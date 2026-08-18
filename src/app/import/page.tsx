import { type Metadata } from "next";
import Import from "../_components/Import";

export const metadata: Metadata = {
  description: "別の端末から渡されたお気に入りを取り込みます。",
  robots: { follow: false, index: false },
  title: "お気に入りの取り込み",
};

export default function Page(): React.JSX.Element {
  return <Import />;
}
