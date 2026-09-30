"use client";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MdSettings } from "react-icons/md";
import styles from "../RankingLink/style.module.css";

export const settingsHref = "/settings";

/** 設定への入り口。ランキングと同じく、どの画面からも同じ場所にあるヘッダーに置く */
export default function SettingsLink(): React.JSX.Element {
  const pathname = usePathname();
  const current = pathname.startsWith(settingsHref);

  return (
    <Link
      aria-current={current ? "page" : undefined}
      aria-label="設定"
      className={clsx(styles.button, current && styles.isCurrent)}
      href={settingsHref}
      prefetch={false}
    >
      <MdSettings size={18} />
    </Link>
  );
}
