import * as cheerio from "cheerio";
import { type ParsedWork } from "../../../src/types/work.ts";
import fetchHtml from "../fetchHtml.ts";

/**
 * ガンガンONLINEのトップには「今日の更新作品」の節がある。
 * 画面に出ている札には作品への道しかないが、__NEXT_DATA__ の同じ節には
 * 話の番号まで入っているので、そちらから最新話の住所を組み立てる。
 */
const topUrl = "https://www.ganganonline.com/";
const heading = "今日の更新作品";

type NextData = {
  props: {
    pageProps: {
      data: {
        sections: {
          titleSection?: {
            header?: string;
            titles: {
              chapterId?: null | number;
              header: string;
              imageUrl?: null | string;
              titleId: number;
            }[];
          };
        }[];
      };
    };
  };
};

export default async function ganganOnline(): Promise<ParsedWork[]> {
  const $ = cheerio.load(await fetchHtml(topUrl));
  const embedded = $("#__NEXT_DATA__").first().text();

  if (embedded === "") {
    throw new Error("__NEXT_DATA__ が見つからない");
  }

  const sections = (JSON.parse(embedded) as NextData).props.pageProps.data
    .sections;
  const section = sections.find(
    (entry) => entry.titleSection?.header === heading,
  )?.titleSection;

  if (section === undefined) {
    throw new Error(`「${heading}」の節が見つからない`);
  }

  const works: ParsedWork[] = [];
  const seen = new Set<string>();

  section.titles.forEach((title) => {
    if (title.header === "" || seen.has(title.header)) {
      return;
    }

    seen.add(title.header);

    const workUrl = `${topUrl}title/${title.titleId}`;

    works.push({
      thumbnailUrl:
        title.imageUrl == null
          ? null
          : new URL(title.imageUrl, topUrl).toString(),
      title: title.header,
      url:
        title.chapterId == null
          ? workUrl
          : `${workUrl}/chapter/${title.chapterId}`,
    });
  });

  return works;
}
