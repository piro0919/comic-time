"use client";
import { config, useSpring } from "@react-spring/web";
import { createUseGesture, dragAction } from "@use-gesture/react";
import clsx from "clsx";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useCallback, useMemo } from "react";
import { FaRegStar, FaStar } from "react-icons/fa";
import Spacer from "react-spacer";
import Swal, { type SweetAlertTheme } from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { dayHref, dayLabel, days } from "@/app/days";
import useFavorites from "@/app/useFavorites";
import useOpened from "@/app/useOpened";
import { type DayKey, type SiteGroup } from "@/types/work";
import styles from "./style.module.css";

const _config = {
  soft: config.default,
  stiff: { friction: 20, tension: 200 },
};
const MySwal = withReactContent(Swal);
const useGesture = createUseGesture([dragAction]);

/** カードひとつぶん。作品のこともあれば、作品一覧を取れないサイトそのもののこともある */
type Card = {
  siteName: string;
  subtitle: string;
  thumbnailUrl: null | string;
  title: string;
  url: string;
};

type GroupEntry = {
  cards: Card[];
  group: SiteGroup;
};

export type AppProps = {
  day: DayKey;
  groups: SiteGroup[];
};

/** 作品を1件も取れていないサイトは、サイト自身を1枚のカードにする */
function toCards(group: SiteGroup): Card[] {
  if (group.works.length === 0) {
    return [
      {
        siteName: group.siteName,
        subtitle: group.updateTime === "" ? "" : `${group.updateTime} 更新`,
        thumbnailUrl: group.thumbnailUrl,
        title: group.siteName,
        url: group.siteUrl,
      },
    ];
  }

  return group.works.map<Card>((work) => ({
    siteName: group.siteName,
    subtitle: work.author ?? "",
    thumbnailUrl: work.thumbnailUrl,
    title: work.title,
    url: work.url,
  }));
}

export default function App({ day, groups }: AppProps): React.JSX.Element {
  const router = useRouter();
  const { theme } = useTheme();
  const favorites = useFavorites();
  const opened = useOpened();
  const cardsByGroup = useMemo<GroupEntry[]>(
    () => groups.map((group) => ({ cards: toCards(group), group })),
    [groups],
  );
  const followedGroups = useMemo(
    () =>
      cardsByGroup.filter(({ group }) => favorites.followsSite(group.siteUrl)),
    [cardsByGroup, favorites],
  );
  const otherGroups = useMemo(
    () =>
      cardsByGroup.filter(({ group }) => !favorites.followsSite(group.siteUrl)),
    [cardsByGroup, favorites],
  );
  const favoriteCards = useMemo(
    () =>
      otherGroups
        .flatMap(({ cards }) => cards)
        .filter((card) => favorites.hasWork(card.url)),
    [favorites, otherGroups],
  );
  /** 何も登録していない人に空の画面を見せないよう、先頭のサイトだけ開いておく */
  const isEmpty = favoriteCards.length === 0 && followedGroups.length === 0;
  const openCount = 3;
  const getList = useCallback<(cards: Card[], showSite: boolean) => ReactNode>(
    (cards, showSite) => (
      <ul className={styles.grid}>
        {cards.map((card) => (
          <li
            className={clsx(styles.card, {
              [styles.isOpened]: opened.isOpened(card.url),
            })}
            key={card.url}
          >
            <a
              onClick={() => {
                opened.markOpened(card.url);
              }}
              className={styles.cardLink}
              href={card.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              <div className={styles.cover}>
                <Image
                  alt=""
                  fill={true}
                  quality={100}
                  sizes="(width < 768px) 45vw, 180px"
                  src={card.thumbnailUrl ?? "/no-image.png"}
                />
                {opened.isOpened(card.url) ? (
                  <span className={styles.openedMark}>開いた</span>
                ) : null}
              </div>
              <div className={styles.cardBody}>
                <span className={styles.cardTitle}>{card.title}</span>
                {showSite ? (
                  <span className={styles.cardMeta}>{card.siteName}</span>
                ) : null}
                {card.subtitle === "" ? null : (
                  <span className={styles.cardMeta}>{card.subtitle}</span>
                )}
              </div>
            </a>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                favorites.toggleWork(card.url);
              }}
              aria-label={`${card.title}をお気に入りに入れる`}
              className={styles.cardStar}
              type="button"
            >
              {favorites.hasWork(card.url) ? (
                <FaStar color="#ffcd3b" size={18} />
              ) : (
                <FaRegStar color="#fff" size={18} />
              )}
            </button>
          </li>
        ))}
      </ul>
    ),
    [favorites, opened],
  );
  const getSiteSection = useCallback<
    (entry: GroupEntry, open: boolean) => ReactNode
  >(
    ({ cards, group }, open) => (
      <details className={styles.details} key={group.siteUrl} open={open}>
        <summary className={styles.summary}>
          <span className={styles.siteName}>{group.siteName}</span>
          <span className={styles.meta}>
            {group.works.length === 0
              ? "サイトを開く"
              : `${cards.length}作品${group.updateTime === "" ? "" : ` / ${group.updateTime} 更新`}`}
          </span>
          <Spacer grow={1} />
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              favorites.toggleSite(group.siteUrl);
            }}
            aria-label={`${group.siteName}をまるごと追う`}
            className={styles.siteStar}
            type="button"
          >
            {favorites.followsSite(group.siteUrl) ? (
              <FaStar color="#ffcd3b" size={21} />
            ) : (
              <FaRegStar color="#ffcd3b" size={21} />
            )}
          </button>
        </summary>
        {getList(cards, false)}
      </details>
    ),
    [favorites, getList],
  );
  const [props, api] = useSpring(() => ({ x: 0 }));
  const bind = useGesture(
    {
      onDrag: ({ active, offset: [x], swipe: [swipeX] }) => {
        if (swipeX) {
          const dayIndex = days.findIndex(({ key }) => key === day);
          const nextIndex = dayIndex + (swipeX > 0 ? 1 : -1);
          const next = days.at(nextIndex >= days.length ? 0 : nextIndex);

          if (next !== undefined) {
            router.push(dayHref(next.key));
          }
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
      {isEmpty ? null : (
        <>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.h2}>{`${dayLabel(day)}のお気に入り`}</h2>
              <Spacer grow={1} />
              {favoriteCards.length > 0 ? (
                <>
                  <button
                    onClick={() => {
                      favoriteCards.forEach((card) => {
                        window.open(card.url, "_blank");
                      });
                    }}
                    className={styles.button}
                    type="button"
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
                              {`${dayLabel(day)}に更新されるお気に入りをすべて外します。`}
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

                        favoriteCards.forEach((card) => {
                          favorites.toggleWork(card.url);
                        });
                      })();
                    }}
                    className={styles.button}
                    type="button"
                  >
                    すべて外す
                  </button>
                </>
              ) : null}
            </div>
            {favoriteCards.length > 0 ? (
              getList(favoriteCards, true)
            ) : (
              <p className={styles.empty}>
                {`登録した作品のうち、${dayLabel(day)}に更新されるものはありません。`}
              </p>
            )}
            {followedGroups.map(
              (entry): ReactNode => getSiteSection(entry, true),
            )}
          </section>
          <hr className={styles.hr} />
        </>
      )}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.h2}>
            {isEmpty
              ? `${dayLabel(day)}に更新される作品`
              : `${dayLabel(day)}に更新されるその他の作品`}
          </h2>
          <Spacer grow={1} />
          <Link className={styles.button} href="/search">
            作品を探す
          </Link>
        </div>
        {isEmpty ? (
          <p className={styles.empty}>
            星を押すと、その作品やサイトが更新される曜日のページの先頭に出ます。
          </p>
        ) : null}
        {otherGroups.map(
          (entry, index): ReactNode =>
            getSiteSection(entry, isEmpty && index < openCount),
        )}
      </section>
    </div>
  );
}
