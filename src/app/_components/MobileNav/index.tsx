import clsx from "clsx";
import { useQueryState } from "nuqs";
import useCurrentDay, { days } from "@/app/useCurrentDay";
import styles from "./style.module.css";

export default function MobileNav(): React.JSX.Element {
  const currentDay = useCurrentDay();
  const [, setDay] = useQueryState("day");

  return (
    <nav className={styles.container}>
      <ul className={styles.list}>
        {days.map((day, index) => (
          <li
            className={clsx(styles.item, {
              [styles.currentDay]: currentDay?.index === index,
            })}
            key={day.en}
          >
            <button
              onClick={() => {
                setDay(day.en);
              }}
              className={styles.link}
            >
              {`${day.ja}曜日`}
            </button>
          </li>
        ))}
        <li
          className={clsx(styles.item, {
            [styles.currentDay]: currentDay?.index === 8,
          })}
        >
          <button
            onClick={() => {
              setDay("irregular");
            }}
            className={styles.link}
          >
            不定期
          </button>
        </li>
      </ul>
    </nav>
  );
}
