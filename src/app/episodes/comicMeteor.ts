import decodeEntities from "./decodeEntities";
import { type Episode } from "./episode";
import fetchText from "./fetchText";

/**
 * COMICメテオ（きら星ポータル）の話の一覧。作品ページに .episode-item が新しい順で並ぶ。
 *
 * 読める回にだけ a.episode-read（data-episode-id 付き）が置かれ、どれもログインせずに読める。
 * 公開の終わった回は「第44話の公開は終了しました。」の文字だけで、
 * 未公開話は外の書店への道しか無い。どちらも読めないので外す。
 * 公開日は載っていない。
 */
const origin = "https://kirapo.jp";

/** 台帳の住所は作品ページ（/meteor/titles/<作品>）か読む画面（/pt/meteor/<作品>/<番号>/viewer） */
function slugOf(url: string): string {
  const matched = /\/(?:meteor\/titles|pt\/meteor)\/([^/?#]+)/.exec(url);

  if (matched?.[1] === undefined) {
    throw new Error(`COMICメテオ: 作品の住所が読めない ${url}`);
  }

  return matched[1];
}

export default async function comicMeteor(url: string): Promise<Episode[]> {
  const slug = slugOf(url);
  const html = await fetchText(`${origin}/meteor/titles/${slug}`);

  return html
    .split("<div class=\"episode-item\">")
    .slice(1)
    .flatMap((chunk) => {
      const id = /\bepisode-read\b[^>]*data-episode-id="(\d+)"/.exec(
        chunk,
      )?.[1];
      const title = /<div class="fw-bold[^"]*">([^<]*)<\/div>/.exec(chunk)?.[1];

      if (id === undefined || title === undefined) {
        return [];
      }

      return [
        {
          access: "free" as const,
          date: null,
          title: decodeEntities(title.trim()),
          url: `${origin}/pt/meteor/${slug}/${id}/viewer`,
        },
      ];
    });
}
