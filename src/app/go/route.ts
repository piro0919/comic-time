/* eslint-disable import/prefer-default-export */
import { type NextRequest, NextResponse } from "next/server";
import episodeSourceOf from "@/app/episodes/episodeSourceOf";
import { catalog } from "@/app/workCatalog";
import { recentWorks } from "@/app/worksOfDay";

/**
 * カードから無料で読める最新の回へ送る中継。
 *
 * 取得が拾うのはその日に出た回で、サイトによってはそれが先読みになる。
 * 会員でない人が開いても読めないので、話の一覧から無料の回のうち一番新しいものへ送る。
 * 先読みを開くと決めたサイトのカードはここを通らない。
 *
 * 一覧が取れない、無料の回が無い、無料かどうかをサイトが示さない、のいずれかなら、
 * 取得した回へそのまま送る。押して何も起きないよりはよい。
 *
 * 受け取る住所はこちらが控えたものに限る。任意の住所を受けると、
 * 誰でも好きな所へ飛ばせる転送口になってしまう。
 */
let known: Set<string> | undefined = undefined;

function knownUrls(): Set<string> {
  known ??= new Set([
    ...recentWorks().flatMap((day) =>
      day.works.map((work) => `${work.siteUrl}\n${work.url}`),
    ),
    ...catalog().flatMap((entry) =>
      entry.sites.map((site) => `${site.siteUrl}\n${site.url}`),
    ),
  ]);

  return known;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const siteUrl = request.nextUrl.searchParams.get("site") ?? "";
  const url = request.nextUrl.searchParams.get("url") ?? "";

  if (!knownUrls().has(`${siteUrl}\n${url}`)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const source = episodeSourceOf(siteUrl);
  const episodes =
    source === undefined ? [] : await source(url).catch(() => undefined);
  const free = episodes?.find((episode) => episode.access === "free");

  return NextResponse.redirect(free?.url ?? url, {
    headers: {
      // 取得元の不調で取った回へ送ったときは、長くためずに早めに読み直す
      "Cache-Control":
        episodes === undefined
          ? "public, s-maxage=300"
          : "public, s-maxage=21600, stale-while-revalidate=86400",
    },
    status: 302,
  });
}
