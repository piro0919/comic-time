import comicBoost from "./comicBoost";
import comicFuz from "./comicFuz";
import comici from "./comici";
import comicMeteor from "./comicMeteor";
import comicWalker from "./comicWalker";
import { type EpisodeSource } from "./episode";
import ganganOnline from "./ganganOnline";
import gaugauMonster from "./gaugauMonster";
import gigaViewer from "./gigaViewer";
import magazinePocket from "./magazinePocket";
import mangaOne from "./mangaOne";
import mangaUp from "./mangaUp";
import shuro from "./shuro";
import twi4 from "./twi4";
import yanmaga from "./yanmaga";

/** 話の一覧を取れるサイト。鍵は台帳（src/data/sites.json）の url */
const sources: Record<string, EpisodeSource> = {
  "https://championcross.jp/": comici,
  "https://comic-action.com/": gigaViewer,
  "https://comic-boost.com/": comicBoost,
  "https://comic-days.com/": gigaViewer,
  "https://comic-fuz.com/": comicFuz,
  "https://comic-gardo.com/": gigaViewer,
  "https://comic-ogyaaa.com/": gigaViewer,
  "https://comic-walker.com/": comicWalker,
  "https://comic-zenon.com/": gigaViewer,
  "https://comicride.jp/": comici,
  "https://gaugau.futabanet.jp/": gaugauMonster,
  "https://getsumagakichi.com/": gigaViewer,
  "https://kirapo.jp/meteor": comicMeteor,
  "https://kuragebunch.com/": gigaViewer,
  "https://magcomi.com/": gigaViewer,
  "https://manga-one.com/": mangaOne,
  "https://pocket.shonenmagazine.com/": magazinePocket,
  "https://sai-zen-sen.jp/comics/twi4/": twi4,
  "https://shonenjumpplus.com/": gigaViewer,
  "https://shuro.world/": shuro,
  "https://takecomic.jp/": comici,
  "https://tonarinoyj.jp/": gigaViewer,
  "https://viewer.heros-web.com/": comici,
  "https://web-ace.jp/youngaceup/": comicWalker,
  "https://www.ganganonline.com/": ganganOnline,
  "https://www.manga-up.com/": mangaUp,
  "https://www.sunday-webry.com/": gigaViewer,
  "https://yanmaga.jp/": yanmaga,
  "https://youngchampion.jp/": comici,
};
/**
 * 先読みの回が一覧に出てこない取り方。先読みがサイトに無いか、
 * あっても Web で開ける住所が無くて外している。設定に並べても何も変わらない
 */
const withoutEarly = new Set<EpisodeSource>([
  comicMeteor,
  comicWalker,
  ganganOnline,
  gaugauMonster,
  shuro,
  twi4,
]);

/** 先読みの回を開くかどうかを選べるサイトか */
export function offersEarly(siteUrl: string): boolean {
  const source = episodeSourceOf(siteUrl);

  return source !== undefined && !withoutEarly.has(source);
}

/** そのサイトの話の一覧の取り方。取れないサイトは undefined */
export default function episodeSourceOf(
  siteUrl: string,
): EpisodeSource | undefined {
  return Object.hasOwn(sources, siteUrl) ? sources[siteUrl] : undefined;
}
