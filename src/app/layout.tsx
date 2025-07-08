// eslint-disable-next-line filenames/match-exported
import { type Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Noto_Sans_JP } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "@szhsin/react-menu/dist/index.css";
import "@szhsin/react-menu/dist/transitions/zoom.css";
import "@szhsin/react-menu/dist/theme-dark.css";
import { Suspense } from "react";
import Layout from "./_components/Layout";
import "sweetalert2/dist/sweetalert2.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
});

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
      card: "summary" as const,
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
        <ThemeProvider enableSystem={false}>
          <NuqsAdapter>
            <Suspense>
              <Layout>{children}</Layout>
            </Suspense>
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
