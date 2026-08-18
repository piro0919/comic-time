/* eslint-disable import/prefer-default-export */
import { type NextRequest, NextResponse } from "next/server";
import { maxShortenableLength } from "@/app/shareLink";

/**
 * 共有用のリンクを短縮する。X.gd の鍵を隠すため、ここを通す。
 * 断片（#以降）に載せたお気に入りが、この経路だけはこちらのサーバを通る。
 * 記録に残さないよう、中身には触らずそのまま渡す。
 */
const endpoint = "https://xgd.io/V1/shorten";
/**
 * 自分のサイトへのリンクだけを短縮する。誰でも使える短縮屋にしないため。
 * 手元で試せるよう、開発の起動のときだけ localhost も通す。
 */
const allowedOrigins = [
  "https://comictime.kkweb.io",
  ...(process.env.NODE_ENV === "production" ? [] : ["http://localhost:3210"]),
];

export async function POST(request: NextRequest): Promise<NextResponse> {
  const apiKey = process.env.XGD_API_KEY;

  if (apiKey === undefined || apiKey === "") {
    return NextResponse.json({ reason: "設定がありません" }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as null | {
    url?: unknown;
  };
  const url = typeof body?.url === "string" ? body.url : "";

  if (!allowedOrigins.some((origin) => url.startsWith(`${origin}/`))) {
    return NextResponse.json({ reason: "宛先が違います" }, { status: 400 });
  }

  if (url.length > maxShortenableLength) {
    return NextResponse.json({ reason: "長すぎます" }, { status: 413 });
  }

  const query = new URLSearchParams({
    analytics: "false",
    key: apiKey,
    url,
  });
  const response = await fetch(`${endpoint}?${query.toString()}`, {
    signal: AbortSignal.timeout(10000),
  }).catch(() => null);

  if (response === null) {
    return NextResponse.json({ reason: "つながりません" }, { status: 502 });
  }

  const result = (await response.json().catch(() => null)) as null | {
    shorturl?: unknown;
    status?: unknown;
  };
  const shortUrl =
    typeof result?.shorturl === "string" ? result.shorturl : null;

  if (shortUrl === null) {
    return NextResponse.json({ reason: "短縮できません" }, { status: 502 });
  }

  return NextResponse.json({ shortUrl });
}
