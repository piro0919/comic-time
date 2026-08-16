import * as cheerio from "cheerio";
import { type Element } from "domhandler";
import {
  type DailyOptions,
  type DailyWorks,
  type DateKey,
  type ParsedWork,
} from "../../src/types/work.ts";
import { findMonthDay, todayKey } from "./dates.ts";

type Selection = cheerio.Cheerio<Element>;

const spacerPattern = /spacer|placeholder|blank|dummy/i;

function absolute(baseUrl: string, href: string): null | string {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

/** カードの中から作品名・URL・サムネイルを拾う */
function extractItem(node: Selection, baseUrl: string): null | ParsedWork {
  const href = node.is("a[href]")
    ? node.attr("href")
    : node.find("a[href]").first().attr("href");

  if (typeof href !== "string") {
    return null;
  }

  const url = absolute(baseUrl, href);

  if (url === null) {
    return null;
  }

  const img = node.find("img").first();
  const alt = img.attr("alt")?.trim();
  /** 話単位のカードは、見出しが話タイトルになるので作品名の属性を先に見る */
  const seriesTitle = (
    node.attr("data-series-title") ??
    node.find("[data-series-title]").first().attr("data-series-title") ??
    ""
  ).trim();
  const headingText =
    seriesTitle.length > 0
      ? seriesTitle
      : node.find("h1, h2, h3, h4, h5, h6").first().text().trim();
  const labelText = node
    .find("[class*='title'], [class*='name']")
    .first()
    .text()
    .trim();
  // 見出しを優先する。画像の alt はバッジ画像などが混ざることがある
  const title =
    headingText.length > 0
      ? headingText
      : alt !== undefined && alt.length > 0
        ? alt
        : labelText;

  if (title.length === 0) {
    return null;
  }

  const rawThumbnail =
    img.attr("data-src") ??
    img.attr("data-original") ??
    img.attr("src") ??
    node.find("[data-bg]").first().attr("data-bg");
  const thumbnail =
    typeof rawThumbnail === "string" && !spacerPattern.test(rawThumbnail)
      ? absolute(baseUrl, rawThumbnail)
      : null;
  const author = node.find("[class*='author']").first().text().trim();

  return {
    author: author.length > 0 ? author : null,
    thumbnailUrl: thumbnail,
    title,
    url,
  };
}

/** 節が大きくなりすぎないよう、祖先を辿る回数を抑える */
const maxClimb = 6;

function collectItems(
  $: cheerio.CheerioAPI,
  scope: Selection,
  itemSelector: string,
  baseUrl: string,
): ParsedWork[] {
  const works: ParsedWork[] = [];
  const seen = new Set<string>();

  scope
    .find(itemSelector)
    .addBack(itemSelector)
    .each((_, el) => {
      const work = extractItem($(el) as Selection, baseUrl);

      if (work === null || seen.has(work.url)) {
        return;
      }

      seen.add(work.url);
      works.push(work);
    });

  return works;
}

/** 見出しから、その節にあたる祖先まで辿る */
function sectionOfHeading(
  heading: Selection,
  itemSelector: string,
): null | Selection {
  let node = heading.parent();

  for (let climb = 0; climb < maxClimb && node.length > 0; climb += 1) {
    if (node.find(itemSelector).length > 0) {
      return node as Selection;
    }

    node = node.parent();
  }

  return null;
}

/**
 * その日更新された作品を取り出す。
 * 日付を持つ節があるサイトは過去ぶんもまとめて拾えるので、
 * 一度の取得で数日ぶんが埋まる。
 */
export default function parseDailyList(
  html: string,
  baseUrl: string,
  options: DailyOptions,
  today: DateKey = todayKey(),
): DailyWorks {
  const $ = cheerio.load(html);
  const result: DailyWorks = {};

  if (typeof options.sectionSelector === "string") {
    /** 日付の見出しは節の先頭にだけ置かれることがあるので、次に出るまで引き継ぐ */
    let carried: null | DateKey = null;

    $(options.sectionSelector).each((_, el) => {
      const section = $(el) as Selection;
      const dateText =
        typeof options.dateSelector === "string"
          ? section.find(options.dateSelector).first().text()
          : section.text().slice(0, 200);
      const date = findMonthDay(dateText, today) ?? carried;

      if (date === null || date > today) {
        return;
      }

      carried = date;

      const works = collectItems($, section, options.itemSelector, baseUrl);

      if (works.length === 0) {
        return;
      }

      result[date] = [...(result[date] ?? []), ...works];
    });

    return result;
  }

  if (typeof options.todaySelector === "string") {
    const works = collectItems(
      $,
      $(options.todaySelector) as Selection,
      options.itemSelector,
      baseUrl,
    );

    if (works.length > 0) {
      result[today] = works;
    }

    return result;
  }

  if (typeof options.headingText !== "string") {
    return result;
  }

  const wanted = options.headingText;
  const heading = $("h1, h2, h3, h4, h5, h6, p, span, div")
    .filter((_, el) => {
      const node = $(el);

      return (
        node.find(options.itemSelector).length === 0 &&
        node.find("a[href]").length === 0 &&
        node.text().replace(/\s+/g, "").includes(wanted)
      );
    })
    .first() as Selection;

  if (heading.length === 0) {
    return result;
  }

  const section = sectionOfHeading(heading, options.itemSelector);

  if (section === null) {
    return result;
  }

  const works = collectItems($, section, options.itemSelector, baseUrl);

  if (works.length > 0) {
    result[today] = works;
  }

  return result;
}
