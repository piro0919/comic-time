// eslint-disable-next-line filenames/match-exported
import { Analytics } from "@vercel/analytics/next";
import { type Metadata, type Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Noto_Sans_JP } from "next/font/google";
import { Suspense } from "react";
import AccountSync from "./_components/AccountSync";
import Layout from "./_components/Layout";
import favoritesKey from "./favoritesKey";

/**
 * トップでどちらを出すかの印を、最初の描画より前に付ける。
 *
 * 登録は localStorage にしかなく、サーバーは読めない。React で描き分けると
 * 組み上がるまで判断が付かず、その間ずっと違う方が出る。実測で1.2秒あった。
 * ここで印だけ先に付けておけば、出し分けは CSS が済ませる。
 *
 * 落ちても構わない作りにしてある。印が付かなければ今日の一覧が出るだけで、
 * そのあと React が正しい方へ直す。
 */
const markFavorites = `try{var w=JSON.parse(localStorage.getItem(${JSON.stringify(favoritesKey)})||"{}").works;document.documentElement.dataset.fav=w&&w.length?"1":"0"}catch(e){}`;
const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
});

/**
 * ブラウザの上端に出る色はここで指定しない。
 * React が描いた meta を後から差し替えると、React の管理下の要素を
 * 横から消すことになり、描画が落ちる。ThemeToggle が自前の meta を持つ。
 */
export const viewport: Viewport = {
  initialScale: 1,
  width: "device-width",
};

export function generateMetadata(): Metadata {
  const APP_NAME = "ComicTime";
  const APP_DEFAULT_TITLE = "ComicTime";
  const APP_TITLE_TEMPLATE = "%s - ComicTime";
  const APP_DESCRIPTION =
    "毎日更新される Web 漫画サイトの更新曜日と更新時刻を一覧で確認できます。";

  return {
    appleWebApp: {
      capable: true,
      statusBarStyle: "default" as const,
      title: APP_DEFAULT_TITLE,
      // startUpImage: [],
    },
    applicationName: APP_NAME,
    description: APP_DESCRIPTION,
    formatDetection: {
      telephone: false,
    },
    metadataBase: new URL("https://comictime.kkweb.io"),
    openGraph: {
      description: APP_DESCRIPTION,
      siteName: APP_NAME,
      title: {
        default: APP_DEFAULT_TITLE,
        template: APP_TITLE_TEMPLATE,
      },
      type: "website" as const,
    },
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    twitter: {
      card: "summary_large_image" as const,
      description: APP_DESCRIPTION,
      title: {
        default: APP_DEFAULT_TITLE,
        template: APP_TITLE_TEMPLATE,
      },
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="ja" suppressHydrationWarning={true}>
      <body className={notoSansJP.className}>
        <script
          dangerouslySetInnerHTML={{ __html: markFavorites }}
          // eslint-disable-next-line react/no-danger
        />
        <ThemeProvider>
          <Suspense>
            <Layout>{children}</Layout>
          </Suspense>
          <AccountSync />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
