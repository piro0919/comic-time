// eslint-disable-next-line filenames/match-exported
import { Analytics } from "@vercel/analytics/next";
import { type Metadata, type Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Noto_Sans_JP } from "next/font/google";
import "@szhsin/react-menu/dist/index.css";
import "@szhsin/react-menu/dist/transitions/zoom.css";
import "@szhsin/react-menu/dist/theme-dark.css";
import { Suspense } from "react";
import Layout from "./_components/Layout";
import "sweetalert2/dist/sweetalert2.css";

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
    "毎日更新されるWeb漫画サイトの更新曜日・時間を一覧でチェックできるサービスです。";

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
        <ThemeProvider>
          <Suspense>
            <Layout>{children}</Layout>
          </Suspense>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
