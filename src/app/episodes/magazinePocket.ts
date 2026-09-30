import { createHash } from "node:crypto";
import { type Episode } from "./episode";
import fetchText from "./fetchText";

/**
 * マガポケの話の一覧。Web 版が使っている API を叩く。
 *
 * 作品の詳細（web/title/detail）に全話の番号が古い順で入っている。それを
 * episode/list に50件ずつ POST すると、題名・公開日・読み方が返る。
 * どちらも x-manga-hash が合っていないと断られる。
 *
 * 読み方は badge と use_status で分かる。
 * point が 0（badge 2）の回は、何も使わずに読める。
 * use_status 1 はポイントでしか読めない回で、最新の数話がこれになる。
 * ただ、途中の回にも混ざるので、一番新しい無料の回より新しいものだけを先読みとみなす。
 * それ以外の鍵付きの回（チケットやポイントで読む回）は有料とする。
 */
type PocketEpisode = {
  episode_id: number;
  episode_name: string;
  point: number;
  start_time: null | string;
  use_status: null | number;
};

const origin = "https://pocket.shonenmagazine.com";
const api = "https://api.pocket.shonenmagazine.com";
/** 1回で頼む数。サイト自身もこの数で区切っている */
const pageSize = 50;

function hex(algorithm: "sha256" | "sha512", text: string): string {
  return createHash(algorithm).update(text).digest("hex");
}

/**
 * 頼む中身から x-manga-hash を作る。Web 版の読む画面の計算をなぞったもの。
 * 鍵の順に「鍵の sha256 _ 値の sha512」を並べて sha256 し、空の組を足して sha512 する。
 */
export function mangaHash(params: Record<string, string>): string {
  const pairs = Object.entries(params)
    .toSorted(([left], [right]) => (left < right ? -1 : 1))
    .map(([key, value]) => `${hex("sha256", key)}_${hex("sha512", value)}`)
    .join(",");

  return hex(
    "sha512",
    `${hex("sha256", pairs)}${hex("sha256", "")}_${hex("sha512", "")}`,
  );
}

function headersOf(params: Record<string, string>): Record<string, string> {
  return {
    accept: "application/json",
    referer: `${origin}/`,
    "x-manga-hash": mangaHash(params),
    "x-manga-platform": "3",
  };
}

/** 台帳の住所は /title/01872/episode/427302 の形。作品の番号は5桁に0で埋めてある */
function titleIdOf(url: string): string {
  const matched = /\/title\/(\d+)/.exec(url);

  if (matched?.[1] === undefined) {
    throw new Error(`マガポケ: 作品の番号が読めない ${url}`);
  }

  return matched[1];
}

async function episodeIdsOf(titleId: string): Promise<number[]> {
  const params = { title_id: String(Number(titleId)) };
  const detail = JSON.parse(
    await fetchText(
      `${api}/web/title/detail?${new URLSearchParams(params).toString()}`,
      { headers: headersOf(params) },
    ),
  ) as { web_title?: { episode_id_list?: number[] } };
  const ids = detail.web_title?.episode_id_list;

  if (ids === undefined) {
    throw new Error(`マガポケ: 話の番号が読めない ${titleId}`);
  }

  return ids;
}

async function episodesOf(ids: number[]): Promise<PocketEpisode[]> {
  const params = { episode_id_list: ids.join(",") };
  const list = JSON.parse(
    await fetchText(`${api}/episode/list`, {
      body: new URLSearchParams(params).toString(),
      headers: {
        ...headersOf(params),
        "content-type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    }),
  ) as { episode_list?: PocketEpisode[] };

  if (list.episode_list === undefined) {
    throw new Error("マガポケ: 話の一覧が読めない");
  }

  return list.episode_list;
}

export default async function magazinePocket(url: string): Promise<Episode[]> {
  const titleId = titleIdOf(url);
  const ids = await episodeIdsOf(titleId);
  const chunks = await Promise.all(
    Array.from({ length: Math.ceil(ids.length / pageSize) }, async (_, index) =>
      episodesOf(ids.slice(index * pageSize, (index + 1) * pageSize)),
    ),
  );
  // 返ってくる順は当てにせず、番号の並び（古い順）に揃えてから裏返す
  const byId = new Map(
    chunks.flat().map((episode) => [episode.episode_id, episode]),
  );
  const newestFirst = ids.toReversed().flatMap((id) => byId.get(id) ?? []);
  const latestFree = newestFirst.findIndex((episode) => episode.point === 0);

  return newestFirst.map((episode, index) => ({
    access:
      episode.point === 0
        ? "free"
        : episode.use_status === 1 && (latestFree === -1 || index < latestFree)
          ? "early"
          : "paid",
    // 「2026-09-16 00:00:00」は日本の時刻で入っている
    date: episode.start_time?.slice(0, 10) ?? null,
    title: episode.episode_name,
    url: `${origin}/title/${titleId}/episode/${episode.episode_id}`,
  }));
}
