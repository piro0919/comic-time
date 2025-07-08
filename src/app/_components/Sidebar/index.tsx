"use client";
import clsx from "clsx";
import Link from "next/link";
import useCurrentDay, { days } from "@/app/useCurrentDay";
import styles from "./style.module.css";

export default function Sidebar(): React.JSX.Element {
  const currentDay = useCurrentDay();

  return (
    <aside className={styles.container}>
      <nav>
        <ul>
          {days.map((day, index) => (
            <li
              className={clsx(styles.item, {
                [styles.currentDay]: currentDay?.index === index,
              })}
              key={day.en}
            >
              <Link className={styles.link} href={`/?day=${day.en}`}>
                {`${day.ja}曜日`}
              </Link>
            </li>
          ))}
          <li
            className={clsx(styles.item, {
              [styles.currentDay]: currentDay?.index === 8,
            })}
          >
            <Link className={styles.link} href={"/?day=irregular"}>
              不定期
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
