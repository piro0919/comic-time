"use client";
import clsx from "clsx";
import Link from "next/link";
import { dayHref, days } from "@/app/days";
import useSelectedDay from "@/app/useSelectedDay";
import styles from "./style.module.css";

export default function Sidebar(): React.JSX.Element {
  const selectedDay = useSelectedDay();

  return (
    <aside className={styles.container}>
      <nav>
        <ul className={styles.list}>
          {days.map((day) => (
            <li
              className={clsx(styles.item, {
                [styles.currentDay]: selectedDay === day.key,
              })}
              key={day.key}
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
    </aside>
  );
}
