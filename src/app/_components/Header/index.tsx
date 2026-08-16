import clsx from "clsx";
import { Grape_Nuts } from "next/font/google";
import Link from "next/link";
import styles from "./style.module.css";

const grapeNuts = Grape_Nuts({
  subsets: ["latin"],
  weight: "400",
});

export default function Header(): React.JSX.Element {
  return (
    <header className={styles.header}>
      <h1 className={clsx(grapeNuts.className, styles.h1)}>
        <Link href="/">ComicTime</Link>
      </h1>
    </header>
  );
}
