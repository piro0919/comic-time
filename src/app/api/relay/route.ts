/* eslint-disable import/prefer-default-export */
import { type NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import fetchText from "@/lib/episodes/fetchText";
import isKnownSite from "@/lib/isKnownSite";

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/**
 * 取得（GitHub Actions）の中継口。日本の外からの接続を断つサイトを、関数のある東京から読む。
 *
 * 2026-10-21 から、comici の一部のサイトが海外からの接続に 403 を返している。
 * Actions は米国で動くので、そこからは読めない。
 *
 * 誰でも使える転送口にしないよう、合言葉（SCRAPE_RELAY_TOKEN）を持つ要求だけを受け、
 * 読みに行く先も台帳に載ったサイトに限る。合言葉が無いときは口ごと無いことにする。
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = process.env.SCRAPE_RELAY_TOKEN;
  const auth = request.headers.get("authorization") ?? "";

  if (
    token === undefined ||
    token === "" ||
    !timingSafeEqual(digest(auth), digest(`Bearer ${token}`))
  ) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const url = request.nextUrl.searchParams.get("url") ?? "";

  if (!URL.canParse(url) || !isKnownSite(`${new URL(url).origin}/`)) {
    return NextResponse.json({ error: "not allowed" }, { status: 400 });
  }

  try {
    return new NextResponse(await fetchText(url), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "fetch failed" },
      { headers: { "Cache-Control": "no-store" }, status: 502 },
    );
  }
}
