import { type ParsedWork } from "../../../src/types/work.ts";
import championCross from "./championCross.ts";
import comicAction from "./comicAction.ts";
import comicDays from "./comicDays.ts";
import comicMeteor from "./comicMeteor.ts";
import comicOgyaaa from "./comicOgyaaa.ts";
import comicFuz from "./comicFuz.ts";
import comicWalker from "./comicWalker.ts";
import comicZenon from "./comicZenon.ts";
import comiplex from "./comiplex.ts";
import ganganOnline from "./ganganOnline.ts";
import getsumagakichi from "./getsumagakichi.ts";
import kurageBunch from "./kurageBunch.ts";
import magcomi from "./magcomi.ts";
import magazinePocket from "./magazinePocket.ts";
import mangaOne from "./mangaOne.ts";
import shonenJumpPlus from "./shonenJumpPlus.ts";
import shuro from "./shuro.ts";
import takeComic from "./takeComic.ts";
import tonariNoYoungJump from "./tonariNoYoungJump.ts";
import twi4 from "./twi4.ts";
import yanmaga from "./yanmaga.ts";
import youngAceUp from "./youngAceUp.ts";
import youngChampion from "./youngChampion.ts";
import zerosumOnline from "./zerosumOnline.ts";
import sundayWebry from "./sundayWebry.ts";

/**
 * サイトごとの取り方。その日更新された作品だけを返す。
 * 取れなかったときは例外を投げる。空配列は「今日は更新が無かった」を意味する。
 */
export type Source = {
  /** その日更新された作品 */
  fetchToday: () => Promise<ParsedWork[]>;
  /** src/data/sites.json の url と揃える */
  siteUrl: string;
};

const sources: Source[] = [
  { fetchToday: comicFuz, siteUrl: "https://comic-fuz.com/" },
  {
    fetchToday: magazinePocket,
    siteUrl: "https://pocket.shonenmagazine.com/",
  },
  { fetchToday: shonenJumpPlus, siteUrl: "https://shonenjumpplus.com/" },
  { fetchToday: comicWalker, siteUrl: "https://comic-walker.com/" },
  { fetchToday: sundayWebry, siteUrl: "https://www.sunday-webry.com/" },
  { fetchToday: comicZenon, siteUrl: "https://comic-zenon.com/" },
  { fetchToday: ganganOnline, siteUrl: "https://www.ganganonline.com/" },
  { fetchToday: kurageBunch, siteUrl: "https://kuragebunch.com/" },
  { fetchToday: tonariNoYoungJump, siteUrl: "https://tonarinoyj.jp/" },
  { fetchToday: comicDays, siteUrl: "https://comic-days.com/" },
  { fetchToday: comicAction, siteUrl: "https://comic-action.com/" },
  { fetchToday: magcomi, siteUrl: "https://magcomi.com/" },
  { fetchToday: comicOgyaaa, siteUrl: "https://comic-ogyaaa.com/" },
  { fetchToday: championCross, siteUrl: "https://championcross.jp/" },
  { fetchToday: youngChampion, siteUrl: "https://youngchampion.jp/" },
  { fetchToday: takeComic, siteUrl: "https://takecomic.jp/" },
  { fetchToday: comiplex, siteUrl: "https://viewer.heros-web.com/" },
  { fetchToday: yanmaga, siteUrl: "https://yanmaga.jp/" },
  { fetchToday: zerosumOnline, siteUrl: "https://zerosumonline.com/" },
  { fetchToday: getsumagakichi, siteUrl: "https://getsumagakichi.com/" },
  { fetchToday: comicMeteor, siteUrl: "https://kirapo.jp/meteor" },
  { fetchToday: twi4, siteUrl: "https://sai-zen-sen.jp/comics/twi4/" },
  { fetchToday: mangaOne, siteUrl: "https://manga-one.com/" },
  { fetchToday: shuro, siteUrl: "https://shuro.world/" },
  { fetchToday: youngAceUp, siteUrl: "https://web-ace.jp/youngaceup/" },
];

export default sources;
