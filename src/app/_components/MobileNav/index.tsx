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

  // 横スクロールするナビなので、選ばれている曜日が画面外だと分からない
  useEffect(() => {
    currentRef.current?.scrollIntoView({
      block: "nearest",
      inline: "center",
    });
  }, [selectedDay]);

  return (
    <nav className={styles.container}>
      <ul className={styles.list}>
        <li
          className={clsx(styles.item, {
            [styles.currentDay]: pathname === "/favorites" || pathname === "/",
          })}
        >
          <Link className={styles.button} href="/favorites">
            お気に入り
            {favorites.workUrls.length === 0 ? null : (
              <span className={styles.count}>{favorites.workUrls.length}</span>
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
      </ul>
    </nav>
  );
}
