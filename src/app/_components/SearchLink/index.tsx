"use client";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaMagnifyingGlass } from "react-icons/fa6";
import styles from "../RankingLink/style.module.css";

const searchHref = "/search";

/**
 * 作品の検索への入り口。ランキングと同じく、どの画面からも同じ場所にあるヘッダーに置く。
 * 台帳の全作品を積んでいて重いので、押されてから取りに行く
 */
export default function SearchLink(): React.JSX.Element {
  const pathname = usePathname();
  const current = pathname.startsWith(searchHref);

  return (
    <Link
      aria-current={current ? "page" : undefined}
      aria-label="作品を探す"
      className={clsx(styles.button, current && styles.isCurrent)}
      href={searchHref}
      prefetch={false}
    >
      <FaMagnifyingGlass size={16} />
    </Link>
  );
}
