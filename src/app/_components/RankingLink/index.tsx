"use client";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaRankingStar } from "react-icons/fa6";
import styles from "./style.module.css";

export const rankingHref = "/ranking";

/**
 * ランキングへの入り口。
 * 曜日の並びとは別の軸なので、サイドメニューやタブには混ぜず、
 * どの画面からも同じ場所にあるヘッダーに置く。
 */
export default function RankingLink(): React.JSX.Element {
  const pathname = usePathname();
  const current = pathname.startsWith(rankingHref);

  return (
    <Link
      aria-current={current ? "page" : undefined}
      aria-label="ランキング"
      className={clsx(styles.button, current && styles.isCurrent)}
      href={rankingHref}
    >
      <FaRankingStar size={18} />
    </Link>
  );
}
