"use client";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { dayHref } from "@/app/days";
import useDayMenu from "@/app/useDayMenu";
import useFavorites from "@/app/useFavorites";
import useSelectedDay from "@/app/useSelectedDay";
import styles from "./style.module.css";

export default function MobileNav(): React.JSX.Element {
  const items = useDayMenu();
  const selectedDay = useSelectedDay();
  const favorites = useFavorites();
  const pathname = usePathname();
  const currentRef = useRef<HTMLLIElement>(null);
  const onFavorites = pathname === "/favorites" || pathname === "/";
  const onSites = pathname.startsWith("/sites");

  /*
   * 横スクロールするナビなので、選ばれているタブが画外だと分からない。
   * 日付の付いた見出しへ差し替わると幅が変わるため、そのときも寄せ直す。
   */
  useEffect(() => {
    currentRef.current?.scrollIntoView({
      block: "nearest",
      inline: "center",
    });
  }, [items, pathname]);

  return (
    <nav className={styles.container}>
      <ul className={styles.list}>
        <li
          className={clsx(styles.item, { [styles.currentDay]: onFavorites })}
          ref={onFavorites ? currentRef : null}
        >
          <Link className={styles.button} href="/favorites">
            お気に入り
            {favorites.visibleWorkCount === 0 ? null : (
              <span className={styles.count}>{favorites.visibleWorkCount}</span>
            )}
          </Link>
        </li>
        {items.map((day) => (
          <li
            className={clsx(styles.item, {
              [styles.currentDay]: selectedDay === day.key,
            })}
            key={day.key}
            ref={selectedDay === day.key ? currentRef : null}
          >
            <Link className={styles.button} href={dayHref(day.key)}>
              {day.label}
            </Link>
          </li>
        ))}
        <li
          className={clsx(styles.item, { [styles.currentDay]: onSites })}
          ref={onSites ? currentRef : null}
        >
          <Link className={styles.button} href="/sites">
            サイト一覧
          </Link>
        </li>
      </ul>
    </nav>
  );
}
