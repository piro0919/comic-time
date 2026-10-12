import comicBoost from "@/lib/episodes/comicBoost";
import comicFuz from "@/lib/episodes/comicFuz";
import comici from "@/lib/episodes/comici";
import comicMeteor from "@/lib/episodes/comicMeteor";
import comicWalker from "@/lib/episodes/comicWalker";
import { type EpisodeSource } from "@/lib/episodes/episode";
import ganganOnline from "@/lib/episodes/ganganOnline";
import gaugauMonster from "@/lib/episodes/gaugauMonster";
import gigaViewer from "@/lib/episodes/gigaViewer";
import magazinePocket from "@/lib/episodes/magazinePocket";
import mangaOne from "@/lib/episodes/mangaOne";
import mangaUp from "@/lib/episodes/mangaUp";
import shuro from "@/lib/episodes/shuro";
import twi4 from "@/lib/episodes/twi4";
import yanmaga from "@/lib/episodes/yanmaga";

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
