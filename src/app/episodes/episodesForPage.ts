import { type Episode } from "./episode";
import episodeSourceOf from "./episodeSourceOf";

/**
 * 作品ページを作るときに、サーバーで話の一覧を読む。
 *
 * 一覧を HTML に入れておくのは検索のため。画面が開いてから取ると、
 * Google が受け取る HTML には「読み込んでいます…」しか残らない。
 *
 * ページを作る間は読み手か Google が待っている。取得元の締め切り（15秒）までは待たず、
 * 短く切って null を返す。null の一覧は画面が開いてから取り直す。
 */
const waitMs = 5000;

async function withinWait(
  promise: Promise<Episode[]>,
): Promise<Episode[] | null> {
  let timer: ReturnType<typeof setTimeout> | undefined = undefined;

  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => {
      resolve(null);
    }, waitMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } catch (error) {
    console.error(error);

    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** 取れたサイトだけ一覧が入る。鍵はサイトの url */
export default async function episodesForPage(
  sites: { siteUrl: string; url: string }[],
): Promise<Record<string, Episode[] | null>> {
  const entries = await Promise.all(
    sites.flatMap((site) => {
      const source = episodeSourceOf(site.siteUrl);

      return source === undefined
        ? []
        : [
            withinWait(source(site.url)).then(
              (episodes) => [site.siteUrl, episodes] as const,
            ),
          ];
    }),
  );

  return Object.fromEntries(entries);
}
