import clsx from "clsx";
import { Righteous } from "next/font/google";
import Link from "next/link";
import InstallButton from "../InstallButton";
import styles from "./style.module.css";

const righteous = Righteous({
  subsets: ["latin"],
  weight: "400",
});

export default function Header(): React.JSX.Element {
  return (
    <header className={styles.header}>
      <h1 className={clsx(righteous.className, styles.h1)}>
        <Link href="/">ComicTime</Link>
      </h1>
      <div className={styles.actions}>
        <InstallButton />
      </div>
    </header>
  );
}
