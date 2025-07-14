"use client";
import { config, useSpring } from "@react-spring/web";
import { createUseGesture, dragAction } from "@use-gesture/react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useQueryState } from "nuqs";
import { type OgObject } from "open-graph-scraper/types";
import { type ReactNode, useCallback, useMemo } from "react";
import { FaRegStar, FaStar } from "react-icons/fa";
import Spacer from "react-spacer";
import sortArray from "sort-array";
import Swal, { type SweetAlertTheme } from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useLocalStorage } from "usehooks-ts";
import useCurrentDay, { type CurrentDay, days } from "@/app/useCurrentDay";
import styles from "./style.module.css";

const _config = {
  soft: config.default,
  stiff: { friction: 20, tension: 200 },
};
const MySwal = withReactContent(Swal);
const useGesture = createUseGesture([dragAction]);

type Site = {
  name: string;
  ogp: null | OgObject;
  updateDay: string;
  updateTime: string;
  url: string;
};

type FavoriteSite = {
  [day in NonNullable<CurrentDay>["en"]]: string[];
};

export type AppProps = {
  sites: Site[];
};

export default function App({ sites }: AppProps): React.JSX.Element {
  const currentDay = useCurrentDay();
  const [favoriteSite, setFavoriteSite] = useLocalStorage<FavoriteSite>(
    "favorite-sites",
    days.reduce(
      (acc, day) => {
        acc[day.en] = [];

        return acc;
      },
      {
        irregular: [],
      } as unknown as FavoriteSite,
    ),
  );
  const { theme } = useTheme();
  const sitesByDay = useMemo(
    () =>
      typeof currentDay?.ja === "string"
        ? sortArray(sites, { by: ["name"] }).filter((site) =>
            site.updateDay.includes(currentDay.ja),
          )
        : [],
    [currentDay?.ja, sites],
  );
  const getList = useCallback<(isFavorite: boolean) => ReactNode>(
    (isFavorite) =>
      currentDay?.en ? (
        <ul className={styles.list}>
          {sortArray(
            sitesByDay.filter((site) =>
              isFavorite
                ? favoriteSite[currentDay.en].includes(site.url)
                : !favoriteSite[currentDay.en].includes(site.url),
            ),
            { by: ["updateTime"] },
          ).map((site) => (
            <li className={styles.item} key={site.url}>
              <a
                className={styles.link}
                href={site.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                <div className={styles.thumbnail}>
                  <Image
                    alt={site.name}
                    fill={true}
                    quality={100}
                    src={site.ogp?.ogImage?.[0]?.url ?? "/no-image.png"}
                  />
                </div>
                <div>
                  <div className={styles.name}>{site.name}</div>
                  <div>
                    {site.updateDay.length === 7 ? "毎日" : site.updateDay}
                  </div>
                  {site.updateTime ? (
                    <div>{`${site.updateTime} 更新`}</div>
                  ) : null}
                </div>
              </a>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  setFavoriteSite((prev) => {
                    if (prev[currentDay.en].includes(site.url)) {
                      return {
                        ...prev,
                        [currentDay.en]: prev[currentDay.en].filter(
                          (url) => url !== site.url,
                        ),
                      };
                    }

                    return {
                      ...prev,
                      [currentDay.en]: [...prev[currentDay.en], site.url],
                    };
                  });
                }}
                className={styles.favoriteButton}
              >
                {favoriteSite[currentDay.en].includes(site.url) ? (
                  <FaStar color="#ffcd3b" size={21} />
                ) : (
                  <FaRegStar color="#ffcd3b" size={21} />
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : null,
    [currentDay?.en, favoriteSite, setFavoriteSite, sitesByDay],
  );
  const hasFavorite = useMemo(
    () =>
      currentDay?.en
        ? sitesByDay.some((site) =>
            favoriteSite[currentDay.en].includes(site.url),
          )
        : false,
    [currentDay?.en, sitesByDay, favoriteSite],
  );
  const hasNotFavorite = useMemo(
    () =>
      currentDay?.en
        ? sitesByDay.some(
            (site) => !favoriteSite[currentDay.en].includes(site.url),
          )
        : false,
    [currentDay?.en, sitesByDay, favoriteSite],
  );
  const [day, setDay] = useQueryState("day");
  const [props, api] = useSpring(() => ({ x: 0 }));
  const bind = useGesture(
    {
      onDrag: ({ active, offset: [x], swipe: [swipeX] }) => {
        if (swipeX) {
          const en = typeof day === "string" ? day : currentDay?.en;
          const dayIndex = days.findIndex((d) => d.en === en);
          const nextDayIndex = dayIndex + (swipeX > 0 ? 1 : -1);

          setDay(
            days.at(nextDayIndex >= days.length ? 0 : nextDayIndex)?.en ?? null,
          );
        }

        api.start(
          active
            ? { config: _config.stiff, x }
            : { config: _config.soft, x: 0 },
        );
      },
    },
    {
      drag: {
        axis: "x",
        from: () => [props.x.get(), 0],
        pointer: { capture: false },
      },
    },
  );

  return (
    <div {...bind()} className={styles.container}>
      {hasFavorite ? (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.h2}>お気に入り</h2>
            <Spacer grow={1} />
            <button
              onClick={() => {
                if (!currentDay?.en) {
                  return;
                }

                favoriteSite[currentDay.en].forEach((url) =>
                  window.open(url, "_blank"),
                );
              }}
              className={styles.button}
            >
              すべて開く
            </button>
            <button
              onClick={() => {
                void (async (): Promise<void> => {
                  const result = await MySwal.fire({
                    cancelButtonText: "キャンセル",
                    html: (
                      <p>
                        {`${currentDay?.ja}${currentDay?.ja && "曜日"}のお気に入りをすべて外します。`}
                        <br />
                        よろしいですか？
                      </p>
                    ),
                    icon: "question",
                    showCancelButton: true,
                    theme: theme as SweetAlertTheme,
                  });

                  if (!result.isConfirmed) {
                    return;
                  }

                  setFavoriteSite((prev) =>
                    currentDay?.en
                      ? {
                          ...prev,
                          [currentDay.en]: [],
                        }
                      : prev,
                  );
                })();
              }}
              className={styles.button}
            >
              すべて外す
            </button>
          </div>
          {getList(true)}
        </section>
      ) : null}
      {hasFavorite && hasNotFavorite ? <hr className={styles.hr} /> : null}
      {hasNotFavorite ? (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.h2}>サイト一覧</h2>
          </div>
          {getList(false)}
        </section>
      ) : null}
    </div>
  );
}
