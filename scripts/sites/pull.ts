import fs from "fs/promises";
import path from "path";
import { type DailyOptions, type SiteEntry } from "../../src/types/work.ts";

/**
 * Notion の「ComicTime サイト一覧」から src/data/sites.json を書き出す。
 * サイトを足したり直したりするのは Notion 側で、サイトが読むのはこの JSON。
 * ビルドからは叩かない。手で走らせて、差分をコミットする。
 */
const apiVersion = "2022-06-28";
const token = process.env.NOTION_TOKEN;
const databaseId = process.env.NOTION_SITES_DATABASE_ID;
const outPath = path.join(process.cwd(), "src", "data", "sites.json");
/** 取得設定に書けるキー。ここに無いものは無視する */
const dailyKeys = [
  "dateSelector",
  "headingText",
  "itemSelector",
  "sectionSelector",
  "todaySelector",
  "url",
] as const;

type NotionPage = {
  properties: Record<
    string,
    {
      rich_text?: { plain_text: string }[];
      select?: null | { name: string };
      title?: { plain_text: string }[];
      type: string;
      url?: null | string;
    }
  >;
};

function textOf(page: NotionPage, name: string): string {
  const property = page.properties[name];

  if (property === undefined) {
    return "";
  }

  if (property.type === "title") {
    return (property.title ?? []).map((part) => part.plain_text).join("");
  }

  if (property.type === "rich_text") {
    return (property.rich_text ?? []).map((part) => part.plain_text).join("");
  }

  if (property.type === "select") {
    return property.select?.name ?? "";
  }

  return property.url ?? "";
}

/** 「itemSelector=.foo; headingText=今日の更新」の形を読む */
function parseDaily(text: string): DailyOptions | undefined {
  const entries = text
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part): [string, string] => {
      const at = part.indexOf("=");

      return [part.slice(0, at).trim(), part.slice(at + 1).trim()];
    })
    .filter(([key, value]) =>
      dailyKeys.some((allowed) => allowed === key && value.length > 0),
    );

  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries) as unknown as DailyOptions;
}

async function fetchPages(): Promise<NotionPage[]> {
  const pages: NotionPage[] = [];

  let cursor: string | undefined = undefined;

  do {
    const res: Response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        body: JSON.stringify(
          cursor === undefined ? {} : { start_cursor: cursor },
        ),
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Notion-Version": apiVersion,
        },
        method: "POST",
      },
    );

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText} ${await res.text()}`);
    }

    const body = (await res.json()) as {
      has_more: boolean;
      next_cursor: null | string;
      results: NotionPage[];
    };

    pages.push(...body.results);
    cursor = body.has_more ? (body.next_cursor ?? undefined) : undefined;
  } while (cursor !== undefined);

  return pages;
}

export default async function pull(): Promise<void> {
  if (token === undefined || databaseId === undefined) {
    throw new Error(
      "NOTION_TOKEN と NOTION_SITES_DATABASE_ID を .env.local に書いてください",
    );
  }

  const pages = await fetchPages();
  const sites = pages
    .map((page): null | SiteEntry => {
      const name = textOf(page, "サイト名");
      const url = textOf(page, "サイトURL");

      if (name === "" || url === "") {
        return null;
      }

      const adapter = textOf(page, "アダプタ");
      const daily = parseDaily(textOf(page, "取得設定"));

      return {
        ...(adapter === "" ? {} : { adapter }),
        ...(daily === undefined ? {} : { daily }),
        mode: textOf(page, "種別") === "サイト" ? "site" : "works",
        name,
        updateDay: textOf(page, "更新曜日"),
        updateTime: textOf(page, "更新時刻"),
        url,
      };
    })
    .filter((site) => site !== null)
    .toSorted((a, b) => a.name.localeCompare(b.name, "ja"));

  if (sites.length === 0) {
    throw new Error("1件も読めませんでした。共有設定を確かめてください");
  }

  await fs.writeFile(outPath, `${JSON.stringify(sites, null, 2)}\n`);

  console.log(`[sites] ${sites.length}件を書き出しました`);
}

await pull();
