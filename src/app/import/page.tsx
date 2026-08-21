import { type Metadata } from "next";
import Import from "../_components/Import";

export const metadata: Metadata = {
  description: "別のデバイスから送信されたお気に入りを受信します。",
  robots: { follow: false, index: false },
  title: "お気に入りの受信",
};

export default function Page(): React.JSX.Element {
  return <Import />;
}
