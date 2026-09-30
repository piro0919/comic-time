import { type Episode } from "./episode";
import fetchText from "./fetchText";
import { flightOf, sliceJson } from "./flight";
import japanDate from "./japanDate";

/**
 * comici（コミックライド、コミプレ、チャンピオンクロス、ヤンチャンWeb、竹コミ！）の話の一覧。
 *
 * 話のページから作品ページ（/series/<id>）を割り出し、/series/<id>/<n> を順に読む。
 * 1ページ30話で古い順に並ぶ。総話数はページに埋め込まれた numEpisodes にある。
 *
 * 題名・公開日・読める条件は、ページに埋め込まれた React の受け渡し
 * （self.__next_f.push の中身）に JSON で入っている。画面の文字より崩れにくいのでこちらを読む。
 *
 * 読める条件は accessType。free と trial はログインせずに読める。
 * comici には先読みの印が無い。最新の数話が有料になっている形なので、
 * 一番新しい無料の回より新しい有料の回を先読みとみなす。無料の回が無ければ全部有料とする。
 */
type ComiciEpisode = {
  datePublished: number;
  id: string;
  title: string;
};

const perPage = 30;
const freeTypes = new Set(["free", "trial"]);

/** コミプレの話の住所は viewer. 付きで、そのままではトップへ飛ばされる */
function canonicalUrl(url: string): URL {
  const parsed = new URL(url);

  if (parsed.hostname === "viewer.heros-web.com") {
    parsed.hostname = "heros-web.com";
  }

  return parsed;
}

function episodesOf(flight: string): ComiciEpisode[] {
  const key = "\"episodes\":";
  const start = flight.indexOf(`${key}[`);

  return start === -1
    ? []
    : (JSON.parse(sliceJson(flight, start + key.length)) as ComiciEpisode[]);
}

function accessOf(flight: string): Map<string, string> {
  const access = new Map<string, string>();

  for (const matched of flight.matchAll(/"access":(\{[^{}]*\})/g)) {
    const entry = JSON.parse(matched[1] ?? "{}") as {
      accessType?: string;
      episodeId?: string;
    };

    if (entry.episodeId !== undefined && entry.accessType !== undefined) {
      access.set(entry.episodeId, entry.accessType);
    }
  }

  return access;
}

export default async function comici(url: string): Promise<Episode[]> {
  const episodeUrl = canonicalUrl(url);
  const seriesId = /\/series\/(?!list\/)([0-9a-f]{10,})/.exec(
    await fetchText(episodeUrl.toString()),
  )?.[1];

  if (seriesId === undefined) {
    throw new Error(`comici: 作品ページが見つからない ${url}`);
  }

  const pageUrl = (page: number): string =>
    `${episodeUrl.origin}/series/${seriesId}/${page}`;
  const first = flightOf(await fetchText(pageUrl(1)));
  const total = Number(/"numEpisodes":(\d+)/.exec(first)?.[1] ?? "0");
  const rest = await Promise.all(
    Array.from(
      { length: Math.max(0, Math.ceil(total / perPage) - 1) },
      async (_, index) => flightOf(await fetchText(pageUrl(index + 2))),
    ),
  );
  const flights = [first, ...rest];
  const access = new Map(flights.flatMap((flight) => [...accessOf(flight)]));
  const newestFirst = flights.flatMap(episodesOf).toReversed();
  const latestFree = newestFirst.findIndex((episode) =>
    freeTypes.has(access.get(episode.id) ?? ""),
  );

  return newestFirst.map((episode, index) => {
    const type = access.get(episode.id);

    return {
      access:
        type === undefined
          ? null
          : freeTypes.has(type)
            ? "free"
            : index < latestFree
              ? "early"
              : "paid",
      date: japanDate(episode.datePublished * 1000),
      title: episode.title,
      url: `${episodeUrl.origin}/episodes/${episode.id}`,
    };
  });
}
