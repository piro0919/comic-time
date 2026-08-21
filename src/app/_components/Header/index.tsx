import clsx from "clsx";
import { Righteous } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import InstallButton from "../InstallButton";
import ReceiveButton from "../ReceiveButton";
import ShareFavorites from "../ShareFavorites";
import ThemeToggle from "../ThemeToggle";
import styles from "./style.module.css";

const righteous = Righteous({
  subsets: ["latin"],
  weight: "400",
});

/** 題字のまわりに散らす星。飾りなので読み上げには出さない */
function Star({ className }: { className: string }): React.JSX.Element {
  return (
    <svg
      aria-hidden={true}
      className={className}
      focusable="false"
      viewBox="0 0 24 24"
    >
      <path d="M12 0c1.1 8.2 2.7 9.8 12 12-9.3 2.2-10.9 3.8-12 12-1.1-8.2-2.7-9.8-12-12C9.3 9.8 10.9 8.2 12 0Z" />
    </svg>
  );
}

export default function Header(): React.JSX.Element {
  return (
    <header className={styles.header}>
      {/* 見出しではなく、どの画面にも出る帰り道。h1 は画面ごとに置く */}
      <div className={clsx(righteous.className, styles.h1)}>
        <Link className={styles.home} href="/">
          <Image
            alt=""
            className={styles.icon}
            height={256}
            priority={true}
            src="/header-icon.png"
            width={256}
          />
          <span className={styles.wordmark}>
            ComicTime
            <Star className={clsx(styles.star, styles.starLead)} />
            <Star className={clsx(styles.star, styles.starTrail)} />
            <Star className={clsx(styles.star, styles.starFoot)} />
          </span>
        </Link>
      </div>
      <div className={styles.actions}>
        <ShareFavorites />
        <ReceiveButton />
        <InstallButton />
        <ThemeToggle />
      </div>
    </header>
  );
}
