import * as cheerio from "cheerio";
import { type Element } from "domhandler";
import {
  type ParsedWork,
  type ParseOptions,
  type Weekday,
  weekdayJa,
  weekdays,
} from "../../src/types/work.ts";

type Selection = cheerio.Cheerio<Element>;

const dayIdSelector = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
]
  .map((day) => `[id="${day}"]`)
  .concat([1, 2, 3, 4, 5, 6, 7].map((day) => `[id="day-${day}"]`))
  .join(", ");
const spacerPattern = /spacer|placeholder|blank|dummy/i;

function absolute(baseUrl: string, href: string): null | string {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

/**
 * その曜日ぶんの領域を切り出す。
 * まず「この見出ししか含まない一番外側の祖先」を探し、そこにリンクが無ければ
 * 見出しの後ろの兄弟を、次の曜日見出しに当たるまで拾う。
 */
function collectSection(
  $: cheerio.CheerioAPI,
  heading: Selection,
  headings: Selection,
): Selection {
  let section = heading;
  let ancestor = heading.parent();

  while (
    ancestor.length > 0 &&
    ancestor.get(0)?.tagName !== "body" &&
    ancestor.find(headings).length <= 1
  ) {
    section = ancestor as Selection;
    ancestor = ancestor.parent();
  }

  if (section.find("a[href]").length > 0) {
    return section;
  }

  const following: Element[] = [];
  /** 同じ見た目の見出しが並ぶ作りなら、そこも区切りとして扱う（「その他」「読み切り」など） */
  const sameLook = (heading.attr("class") ?? "")
    .split(/\s+/)
    .filter((name) => name.length > 0)
    .map((name) => `.${name}`)
    .join("");

  let sibling = heading.next();

  while (sibling.length > 0) {
    if (
      sibling.is(headings) ||
      sibling.find(headings).length > 0 ||
      (sameLook.length > 0 && sibling.is(sameLook))
    ) {
      break;
    }

    const node = sibling.get(0);

    if (node !== undefined) {
      following.push(node);
    }

    sibling = sibling.next();
  }

  return $(following) as Selection;
}

/**
 * 曜日見出しの候補。作品名にも「月曜日のたわわ」のような曜日入りの
 * タイトルがあるため、リンクやリスト項目の内側は見出しとみなさない。
 */
function headingCandidates(
  $: cheerio.CheerioAPI,
  options: ParseOptions,
): Selection {
  const selector = options.headingSelector ?? "h1, h2, h3, h4, h5, h6";

  return $(selector).filter(
    (_, el) => $(el).closest("li, a").length === 0,
  ) as Selection;
}

function findHeading(
  $: cheerio.CheerioAPI,
  weekday: Weekday,
  index: number,
  options: ParseOptions,
): null | Selection {
  const ja = weekdayJa[weekday];
  const en = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ][index];
  const byId = $(`#${en}, [id="day-${index === 0 ? 7 : index}"]`);

  if (byId.length > 0) {
    return byId.first() as Selection;
  }

  const byText = headingCandidates($, options).filter((_, el) => {
    const text = $(el).text().replace(/\s+/g, "");

    return text.startsWith(`${ja}曜`) || text === ja;
  });

  return byText.length > 0 ? byText.first() : null;
}

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
  const headingText = node.find("h1, h2, h3, h4, h5, h6").first().text().trim();
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

/** 与えられた HTML から作品カードを拾う。曜日で分かれていないページ向け */
export function extractWorks(
  html: string,
  baseUrl: string,
  selector: string,
): ParsedWork[] {
  const $ = cheerio.load(html);
  const works: ParsedWork[] = [];
  const seen = new Set<string>();

  $(selector).each((_, el) => {
    const work = extractItem($(el) as Selection, baseUrl);

    if (work === null || seen.has(work.url)) {
      return;
    }

    seen.add(work.url);
    works.push(work);
  });

  return works;
}

/**
 * 曜日見出しで区切られた作品一覧ページから、曜日ごとの作品を取り出す。
 * GigaViewer 系はサイトごとにクラス名が違うため、見出しと画像altという
 * 共通部分だけに頼って拾う。
 */
export default function parseWeeklyList(
  html: string,
  baseUrl: string,
  options: ParseOptions = {},
): Record<Weekday, ParsedWork[]> {
  const $ = cheerio.load(html);
  const result = {} as Record<Weekday, ParsedWork[]>;
  const allHeadings = headingCandidates($, options)
    .filter((_, el) => {
      const text = $(el).text().replace(/\s+/g, "");

      return weekdays.some(
        (weekday) =>
          text.startsWith(`${weekdayJa[weekday]}曜`) ||
          text === weekdayJa[weekday],
      );
    })
    .add(dayIdSelector) as Selection;

  weekdays.forEach((weekday, index) => {
    result[weekday] = [];

    const heading = findHeading($, weekday, index, options);

    if (heading === null) {
      return;
    }

    const section = collectSection($, heading, allHeadings);
    const selectors =
      typeof options.itemSelector === "string"
        ? [options.itemSelector]
        : ["li", "[class*='item'], [class*='card']", "a[href]"];

    for (const selector of selectors) {
      const candidates = section.find(selector).addBack(selector);
      const works: ParsedWork[] = [];
      const seen = new Set<string>();

      candidates.each((_, el) => {
        const work = extractItem($(el) as Selection, baseUrl);

        if (work === null || seen.has(work.url)) {
          return;
        }

        seen.add(work.url);
        works.push(work);
      });

      if (works.length > 0) {
        result[weekday] = works;

        break;
      }
    }
  });

  return result;
}
