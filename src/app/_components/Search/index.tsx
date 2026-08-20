"use client";
import { useDeferredValue, useMemo, useState } from "react";
import { FaRegStar, FaStar } from "react-icons/fa";
import { dayLabel, days } from "@/app/days";
import useFavorites from "@/app/useFavorites";
import { workKey } from "@/app/workCards";
import { daysOf, type SearchIndex, type Weekday } from "@/types/work";
import styles from "./style.module.css";

export type SearchProps = {
  index: SearchIndex;
};

/** 「月・金」のように、更新曜日を短く並べる */
function daysText(dayKeys: Weekday[]): string {
  if (dayKeys.length === days.length) {
    return "毎日";
  }

  return days
    .filter(({ key }) => dayKeys.includes(key))
    .map(({ label }) => label.replace("曜日", ""))
    .join("・");
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "");
}

export default function Search({ index }: SearchProps): React.JSX.Element {
  const { siteNames, works } = index;
  const [keyword, setKeyword] = useState("");
  const deferred = useDeferredValue(keyword);
  const favorites = useFavorites();
  const [onlyFavorite, setOnlyFavorite] = useState(false);
  const found = useMemo(() => {
    const needle = normalize(deferred);
    const filtered = works.filter(([title, url, siteIndex]) => {
      if (
        onlyFavorite &&
        !favorites.hasWork(workKey(siteNames[siteIndex] ?? "", title), [url])
      ) {
        return false;
      }

      return (
        needle === "" ||
        normalize(title).includes(needle) ||
        normalize(siteNames[siteIndex] ?? "").includes(needle)
      );
    });

    // 未入力のまま全件並べても読めないので、絞り込むまでは件数だけ伝える
    return needle === "" && !onlyFavorite ? [] : filtered;
  }, [deferred, favorites, onlyFavorite, siteNames, works]);

  return (
    <div className={styles.container}>
      <h1 className="visually-hidden">作品を探す</h1>
      <div className={styles.searchBar}>
        <input
          onChange={(e) => {
            setKeyword(e.target.value);
          }}
          className={styles.input}
          placeholder="作品名・作者名・サイト名で探す"
          type="search"
          value={keyword}
        />
        <button
          onClick={() => {
            setOnlyFavorite((prev) => !prev);
          }}
          className={onlyFavorite ? styles.toggleOn : styles.toggle}
          type="button"
        >
          お気に入りのみ
        </button>
      </div>
      <p className={styles.count}>
        {found.length === 0
          ? `${works.length}作品から探せます`
          : `${found.length}件`}
      </p>
      <ul className={styles.list}>
        {found.slice(0, 200).map(([title, url, siteIndex, dayBits]) => (
          <li className={styles.item} key={url}>
            <button
              onClick={() => {
                favorites.toggleWork(
                  workKey(siteNames[siteIndex] ?? "", title),
                  [url],
                );
              }}
              className={styles.favoriteButton}
              type="button"
            >
              {favorites.hasWork(workKey(siteNames[siteIndex] ?? "", title), [
                url,
              ]) ? (
                <FaStar color="#ffcd3b" size={21} />
              ) : (
                <FaRegStar color="#ffcd3b" size={21} />
              )}
            </button>
            <div className={styles.body}>
              <a
                className={styles.title}
                href={url}
                rel="noopener noreferrer"
                target="_blank"
              >
                {title}
              </a>
              <div className={styles.meta}>
                {[siteNames[siteIndex], daysText(daysOf(dayBits))]
                  .filter((text) => text !== undefined && text !== "")
                  .join(" / ")}
              </div>
            </div>
          </li>
        ))}
      </ul>
      {found.length > 200 ? (
        <p className={styles.count}>
          先頭200件を表示しています。絞り込むと残りが出ます。
        </p>
      ) : null}
      {found.length === 0 && onlyFavorite ? (
        <p className={styles.count}>
          お気に入りはまだありません。作品名で検索して星を付けると、
          {dayLabel("mon")}などの曜日ページに出るようになります。
        </p>
      ) : null}
    </div>
  );
}
