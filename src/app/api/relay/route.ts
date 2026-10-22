/* eslint-disable import/prefer-default-export */
import { type NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import sitesJson from "@/data/sites.json";
import fetchText from "@/lib/episodes/fetchText";
import { type SiteEntry } from "@/types/work";

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

let knownHosts: string[] | undefined = undefined;

/**
 * 台帳（src/data/sites.json）のサイトと同じホストか、その親のホストか。
 * コミプレは台帳が viewer.heros-web.com で、一覧は飛び先の heros-web.com から読む。
 */
function isRelayable(url: string): boolean {
  if (!URL.canParse(url)) {
    return false;
  }

  const { hostname, protocol } = new URL(url);

  knownHosts ??= (sitesJson as SiteEntry[]).map(
    (site) => new URL(site.url).hostname,
  );

  return (
    protocol === "https:" &&
    knownHosts.some(
      (known) => known === hostname || known.endsWith(`.${hostname}`),
    )
  );
}

/**
 * 取得（GitHub Actions）の中継口。日本の外からの接続を断つサイトを、関数のある東京から読む。
 *
 * 2026-10-21 から、comici の一部のサイトが海外からの接続に 403 を返している。
 * Actions は米国で動くので、そこからは読めない。
 *
 * 誰でも使える転送口にしないよう、合言葉（SCRAPE_RELAY_TOKEN）を持つ要求だけを受け、
 * 読みに行く先も台帳に載ったサイトに限る。転送は追わない。追うと台帳の外へ出られる。
 * 合言葉が無いときは口ごと無いことにする。
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

  if (!isRelayable(url)) {
    return NextResponse.json({ error: "not allowed" }, { status: 400 });
  }

  try {
    return new NextResponse(await fetchText(url, { redirect: "manual" }), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error(error);

    // 取得のログで原因を切り分けられるよう、取得先の答えを添えて返す
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "fetch failed" },
      { headers: { "Cache-Control": "no-store" }, status: 502 },
    );
  }
}
