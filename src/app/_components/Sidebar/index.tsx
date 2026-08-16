"use client";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { dayHref } from "@/app/days";
import useDayMenu from "@/app/useDayMenu";
import useSelectedDay from "@/app/useSelectedDay";
import styles from "./style.module.css";

export default function Sidebar(): React.JSX.Element {
  const items = useDayMenu();
  const selectedDay = useSelectedDay();
  const pathname = usePathname();

  return (
    <aside className={styles.container}>
      <nav>
        <ul className={styles.list}>
          <li
            className={clsx(styles.item, {
              [styles.currentDay]:
                pathname === "/favorites" || pathname === "/",
            })}
          >
            <Link className={styles.button} href="/favorites">
              お気に入り
            </Link>
          </li>
          {items.map((day) => (
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
        </ul>
      </nav>
    </aside>
  );
}
