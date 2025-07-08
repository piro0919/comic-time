import { parse } from "csv-parse/sync";
import fs from "fs/promises";
import ogs from "open-graph-scraper";
import { type OgObject } from "open-graph-scraper/types";
import pLimit from "p-limit";
import { Suspense } from "react";
import env from "@/env";
import App from "./_components/App";

type Site = {
  name: string;
  ogp: null | OgObject;
  updateDay: string;
  updateTime: string;
  url: string;
};

async function getSites(): Promise<Site[]> {
  if (process.env.NODE_ENV === "development") {
    try {
      const data = await fs.readFile("sites.json", "utf-8");

      return JSON.parse(data) as Site[];
    } catch {
      console.warn("ローカルJSON読み込み失敗、リモートから取得します");
    }
  }

  const res = await fetch(env.NEXT_PUBLIC_SITES_CSV_URL, {
    next: {
      revalidate: 86400,
    },
  });
  const csv = await res.text();
  const parsed = parse(csv, {
    columns: true,
    skip_empty_lines: true,
  }) as Site[];
  const limit = pLimit(5);
  const sitesWithOgp = await Promise.all(
    parsed.map(async (site) =>
      limit(async () => {
        try {
          const { result } = await ogs({ url: site.url });

          return { ...site, ogp: result };
        } catch {
          return { ...site, ogp: null };
        }
      }),
    ),
  );

  if (process.env.NODE_ENV === "development") {
    try {
      await fs.writeFile("sites.json", JSON.stringify(sitesWithOgp, null, 2));
    } catch (err) {
      console.warn("sites.json の保存に失敗しました:", err);
    }
  }

  return sitesWithOgp;
}

export default async function Page(): Promise<React.JSX.Element> {
  const sites = await getSites();

  return (
    <Suspense>
      <App sites={sites} />
    </Suspense>
  );
}
