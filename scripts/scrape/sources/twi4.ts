import * as cheerio from "cheerio";
import { type ParsedWork } from "../../../src/types/work.ts";
import fetchHtml from "../fetchHtml.ts";
import resolveEpisodes from "../resolveEpisodes.ts";

/**
 * ツイ４は更新日をどこにも出していない。
 * ただし作品ごとに「毎日17:00更新」のような決まりが書かれているので、
 * その時刻を過ぎていれば今日更新されたとみなす。
 *
 * 対象は「人気作品」より上の2区画だけにする。
 * それより下には完結作品や休載中のものが並ぶ。
 *
 * 一覧にも作品ページにも「最新話」の道は無い。作品ページのバックナンバーが
 * 新しい順に並ぶので、その先頭を最新話とする。
 */
const topUrl = "https://sai-zen-sen.jp/comics/twi4/";
const sectionSelector =
  "#lineup_latest > .section-body > section, #lineup_recent > .section-body > section";

/** 作品ページのバックナンバーの先頭。読み取れなければ null にして、その作品だけ作品ページに戻す */
async function latestEpisode(workUrl: string): Promise<null | string> {
  try {
    const $ = cheerio.load(await fetchHtml(workUrl));
    const href = $("#backnumbers a[href]").first().attr("href");

    return href === undefined ? null : new URL(href, workUrl).toString();
  } catch {
    return null;
  }
}

/** 日本時間の今の「時×60＋分」と曜日 */
function nowInTokyo(): { minutes: number; weekday: string } {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
    weekday: "short",
  }).formatToParts(new Date());
  const get = (type: string): string =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
    weekday: get("weekday").replace(/[^日月火水木金土]/g, ""),
  };
}

/**
 * 「毎日17:00更新」「毎日8:00と16:00の2回更新」「毎週火曜7:30更新」から、
 * 今日この時刻までに更新されたかを見る。決まりが読み取れないものは出さない。
 */
export function isUpdated(schedule: string, now = nowInTokyo()): boolean {
  const daily = schedule.includes("毎日");
  const weekly = schedule.includes(`毎週${now.weekday}`);

  if (!daily && !weekly) {
    return false;
  }

  const times = [...schedule.matchAll(/(\d{1,2})\s*[:：]\s*(\d{2})/g)].map(
    (matched) => Number(matched[1]) * 60 + Number(matched[2]),
  );

  return times.length > 0 && Math.min(...times) <= now.minutes;
}

export default async function twi4(): Promise<ParsedWork[]> {
  const $ = cheerio.load(await fetchHtml(topUrl));
  const works: ParsedWork[] = [];
  const seen = new Set<string>();

  $(sectionSelector).each((_, el) => {
    const section = $(el);
    const link = section.find("h3 a").first();
    const href = link.attr("href");
    const title = link.text().trim();
    const schedule = section.children("ul").first().find("li").text();

    if (href === undefined || title === "" || seen.has(title)) {
      return;
    }

    if (section.find("em.is-completed").length > 0 || !isUpdated(schedule)) {
      return;
    }

    seen.add(title);

    const thumbnail = section.find("figure img").first().attr("src");

    works.push({
      thumbnailUrl:
        thumbnail === undefined ? null : new URL(thumbnail, topUrl).toString(),
      title,
      url: new URL(href, topUrl).toString(),
    });
  });

  // 話への道は作品ページにしか無いので、1作品につき1枚見に行く
  return resolveEpisodes(works, latestEpisode);
}
