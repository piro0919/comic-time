"use client";
import { ProgressProvider } from "@bprogress/next/app";
import dynamic from "next/dynamic";
import { type ReactNode } from "react";
import useShowWindowSize from "use-show-window-size";
import env from "@/env";
import Header from "../Header";
import MobileNav from "../MobileNav";
import Sidebar from "../Sidebar";
import styles from "./style.module.css";

const PWAPrompt = dynamic(async () => import("react-ios-pwa-prompt"), {
  ssr: false,
});

export type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps): React.JSX.Element {
  useShowWindowSize({
    disable: process.env.NODE_ENV === "production",
  });

  return (
    <>
      <ProgressProvider
        color="#c2e7ff"
        disableSameURL={false}
        height="3px"
        options={{ showSpinner: true }}
        shallowRouting={true}
      >
        <div className={styles.container}>
          <div className={styles.header}>
            <Header />
            <div className={styles.mobileNav}>
              <MobileNav />
            </div>
          </div>
          <div className={styles.sidebar}>
            <Sidebar />
          </div>
          <main className={styles.main}>{children}</main>
        </div>
      </ProgressProvider>
      <PWAPrompt
        appIconPath="/apple-icon.png"
        copyAddToHomeScreenStep="2) 「ホーム画面に追加」をタップします。"
        copyDescription="このウェブサイトにはアプリ機能があります。ホーム画面に追加してフルスクリーンおよびオフラインで使用できます。"
        copyShareStep="1) （四角から矢印が飛び出したマーク）をタップします。"
        copyTitle="ホーム画面に追加"
        isShown={env.NEXT_PUBLIC_IS_SHOWN_PWA_PROMPT}
        promptOnVisit={1}
        timesToShow={1}
      />
    </>
  );
}
