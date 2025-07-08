"use client";
import { ProgressProvider } from "@bprogress/next/app";
import { type ReactNode } from "react";
import useShowWindowSize from "use-show-window-size";
import Header from "../Header";
import MobileNav from "../MobileNav";
import Sidebar from "../Sidebar";
import styles from "./style.module.css";

export type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps): React.JSX.Element {
  useShowWindowSize({
    disable: process.env.NODE_ENV === "production",
  });

  return (
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
  );
}
