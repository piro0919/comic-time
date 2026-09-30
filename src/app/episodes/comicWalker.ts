import { type Episode } from "./episode";
import fetchText from "./fetchText";
import japanDate from "./japanDate";

/**
 * カドコミの話の一覧。ヤングエースUPの作品もカドコミで配信されるので、これで読む。
 *
 * 作品の符号（KC_…_S）を作品詳細の API に渡すと、latestEpisodes に全話が新しい順で返る。
 * 公開日は並び替えのあとに付け直されることがあり、日付の順にはなっていない。画面と同じ並びのまま返す。
 *
 * ウェブ版には鍵付きの回が無く、公開中の回は誰でも読める。そこで公開中の回は無料とする。
 * 公開期間を過ぎた回（isActive が false）は画面でも「公開終了しました」と出て読めないので外す。
 * type が pr の回は単行本の告知の1枚で、話ではないので外す。
 */
type WalkerEpisode = {
  code: string;
  isActive: boolean;
  subTitle?: string;
  title: string;
  type?: string;
  updateDate?: null | string;
};

type WorkResponse = {
  latestEpisodes?: { result?: WalkerEpisode[] };
};

const origin = "https://comic-walker.com";

export default async function comicWalker(url: string): Promise<Episode[]> {
  const workCode = /\/detail\/(KC_\w+?_S)(?:[/?#]|$)/.exec(url)?.[1];

  if (workCode === undefined) {
    throw new Error(`カドコミ: 作品の符号が読めない ${url}`);
  }

  const response = JSON.parse(
    await fetchText(
      `${origin}/api/contents/details/work?${new URLSearchParams({ workCode }).toString()}`,
      { headers: { Accept: "application/json" } },
    ),
  ) as WorkResponse;
  const episodes = response.latestEpisodes?.result;

  if (episodes === undefined) {
    throw new Error(`カドコミ: 話の一覧が見つからない ${url}`);
  }

  return episodes
    .filter((episode) => episode.isActive && episode.type !== "pr")
    .map((episode) => ({
      access: "free",
      date: japanDate(episode.updateDate),
      title: [episode.title, episode.subTitle ?? ""]
        .filter((part) => part !== "")
        .join(" "),
      url: `${origin}/detail/${workCode}/episodes/${episode.code}`,
    }));
}
