"use client";
import { ProgressProvider } from "@bprogress/next/app";
import { useTheme } from "next-themes";
import { type ReactNode } from "react";
import { Toaster } from "sonner";
import useShowWindowSize from "use-show-window-size";
import Header from "../Header";
import MobileNav from "../MobileNav";
import Sidebar from "../Sidebar";
import styles from "./style.module.css";

export type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps): React.JSX.Element {
  const { resolvedTheme } = useTheme();

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
      <Toaster
        mobileOffset="calc(var(--header-height) + var(--mobile-nav-height) + var(--space-2))"
        offset="calc(var(--header-height) + var(--mobile-nav-height) + var(--space-2))"
        position="top-center"
        theme={resolvedTheme === "dark" ? "dark" : "light"}
      />
    </ProgressProvider>
  );
}
