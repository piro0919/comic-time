/* eslint-disable import/prefer-default-export */
import { type NextRequest, NextResponse } from "next/server";
import episodeSourceOf from "@/app/episodes/episodeSourceOf";
import { workOf } from "@/app/workCatalog";

/**
 * 作品ページの話の一覧の取り直し口。ページを作るときにサーバーで取れなかったサイトだけ、
 * 画面が開かれてからここに取りに来る。
 *
 * 答えは CDN に6時間ためる。取得元に頼むのは、作品とサイトの組ごとに6時間に1回で済む。
 *
 * 読みに行く先は台帳に控えた住所だけにする。任意の住所を受け取ると、
 * このサイトを踏み台にして他所を叩けてしまう。
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const slug = request.nextUrl.searchParams.get("slug") ?? "";
  const siteUrl = request.nextUrl.searchParams.get("site") ?? "";
  const site = workOf(slug)?.sites.find((entry) => entry.siteUrl === siteUrl);
  const source = episodeSourceOf(siteUrl);

  if (site === undefined || source === undefined) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  try {
    return NextResponse.json(
      { episodes: await source(site.url) },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=21600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    console.error(error);

    // 取得元の不調はしばらく続くことが多い。5分は同じ答えを返し、叩き直さない
    return NextResponse.json(
      { error: "fetch failed" },
      { headers: { "Cache-Control": "public, s-maxage=300" }, status: 502 },
    );
  }
}
