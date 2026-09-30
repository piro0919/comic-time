"use client";
import { useEffect, useState } from "react";
import { type Episode } from "@/app/episodes/episode";
import styles from "./style.module.css";

export type EpisodeListProps = {
  siteUrl: string;
  slug: string;
};

type State =
  | { episodes: Episode[]; status: "done" }
  | { status: "failed" }
  | { status: "loading" };

/**
 * 1サイトぶんの話の一覧。開いてから /api/episodes に取りに行く。
 * 作品ページは静的に作っていて、取得元を読むのはこの画面が開かれたときだけにしたい。
 */
export default function EpisodeList({
  siteUrl,
  slug,
}: EpisodeListProps): React.JSX.Element {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ site: siteUrl, slug });

    async function load(): Promise<void> {
      try {
        const res = await fetch(`/api/episodes?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(String(res.status));
        }

        const { episodes } = (await res.json()) as { episodes: Episode[] };

        setState({ episodes, status: "done" });
      } catch {
        if (!controller.signal.aborted) {
          setState({ status: "failed" });
        }
      }
    }

    void load();

    return (): void => {
      controller.abort();
    };
  }, [siteUrl, slug]);

  if (state.status === "loading") {
    return <p className={styles.note}>話の一覧を読み込んでいます…</p>;
  }

  if (state.status === "failed") {
    return <p className={styles.note}>話の一覧を取れませんでした。</p>;
  }

  if (state.episodes.length === 0) {
    return <p className={styles.note}>話が見つかりませんでした。</p>;
  }

  return (
    <ol className={styles.list}>
      {state.episodes.map((episode) => (
        <li key={episode.url}>
          <a
            className={styles.item}
            href={episode.url}
            rel="noreferrer"
            target="_blank"
          >
            <span className={styles.title}>{episode.title}</span>
            <span className={styles.meta}>
              {episode.access === "early" || episode.access === "paid" ? (
                <span className={styles.lock}>
                  {episode.access === "early" ? "先読み" : "有料"}
                </span>
              ) : null}
              {episode.date === null ? null : (
                <time dateTime={episode.date}>
                  {episode.date.replaceAll("-", "/")}
                </time>
              )}
            </span>
          </a>
        </li>
      ))}
    </ol>
  );
}
