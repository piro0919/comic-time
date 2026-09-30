import comici from "./comici";
import { type EpisodeSource } from "./episode";
import gigaViewer from "./gigaViewer";
import mangaOne from "./mangaOne";

/** 話の一覧を取れるサイト。鍵は台帳（src/data/sites.json）の url */
const sources: Record<string, EpisodeSource> = {
  "https://championcross.jp/": comici,
  "https://comic-action.com/": gigaViewer,
  "https://comic-days.com/": gigaViewer,
  "https://comic-gardo.com/": gigaViewer,
  "https://comic-ogyaaa.com/": gigaViewer,
  "https://comic-zenon.com/": gigaViewer,
  "https://comicride.jp/": comici,
  "https://getsumagakichi.com/": gigaViewer,
  "https://kuragebunch.com/": gigaViewer,
  "https://magcomi.com/": gigaViewer,
  "https://manga-one.com/": mangaOne,
  "https://shonenjumpplus.com/": gigaViewer,
  "https://takecomic.jp/": comici,
  "https://tonarinoyj.jp/": gigaViewer,
  "https://viewer.heros-web.com/": comici,
  "https://www.sunday-webry.com/": gigaViewer,
  "https://youngchampion.jp/": comici,
};

/** そのサイトの話の一覧の取り方。取れないサイトは undefined */
export default function episodeSourceOf(
  siteUrl: string,
): EpisodeSource | undefined {
  return Object.hasOwn(sources, siteUrl) ? sources[siteUrl] : undefined;
}
