import { type Episode } from "./episode";
import fetchText from "./fetchText";

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

/** React の受け渡しを1本の文字列につなぐ */
function flightOf(html: string): string {
  return [
    ...html.matchAll(/self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g),
  ]
    .map((matched) => JSON.parse(`"${matched[1] ?? ""}"`) as string)
    .join("");
}

/** start から始まる JSON の配列か塊を、閉じ括弧まで切り出す。文字列の中の括弧は数えない */
function sliceJson(text: string, start: number): string {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (escaped) {
      escaped = false;
    } else if (inString) {
      escaped = char === "\\";
      inString = char !== '"';
    } else if (char === '"') {
      inString = true;
    } else if (char === "[" || char === "{") {
      depth += 1;
    } else if ((char === "]" || char === "}") && --depth === 0) {
      return text.slice(start, index + 1);
    }
  }

  throw new Error("comici: 話の一覧が途中で切れている");
}

function episodesOf(flight: string): ComiciEpisode[] {
  const key = '"episodes":';
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

function japanDate(seconds: number): string {
  return new Date((seconds + 9 * 3600) * 1000).toISOString().slice(0, 10);
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
      date: japanDate(episode.datePublished),
      title: episode.title,
      url: `${episodeUrl.origin}/episodes/${episode.id}`,
    };
  });
}
