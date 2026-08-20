import clsx from "clsx";
import { Righteous } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import InstallButton from "../InstallButton";
import ShareFavorites from "../ShareFavorites";
import ThemeToggle from "../ThemeToggle";
import styles from "./style.module.css";

const righteous = Righteous({
  subsets: ["latin"],
  weight: "400",
});

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
          ComicTime
        </Link>
      </div>
      <div className={styles.actions}>
        <ShareFavorites />
        <InstallButton />
        <ThemeToggle />
      </div>
    </header>
  );
}
