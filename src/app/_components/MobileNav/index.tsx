"use client";
import clsx from "clsx";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { dayHref, days } from "@/app/days";
import useSelectedDay from "@/app/useSelectedDay";
import styles from "./style.module.css";

export default function MobileNav(): React.JSX.Element {
  const selectedDay = useSelectedDay();
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
        {days.map((day) => (
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
        <li className={clsx(styles.item, styles.searchItem)}>
          <Link className={styles.button} href="/search">
            作品を探す
          </Link>
        </li>
      </ul>
    </nav>
  );
}
