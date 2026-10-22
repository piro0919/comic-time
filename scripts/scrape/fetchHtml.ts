const userAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 ComicTimeBot/1.0 (+https://comictime.kkweb.io/)";
const timeoutMs = 30000;
/** 東京の関数に置いた中継口。src/app/api/relay/route.ts */
const relayUrl = "https://comictime.kkweb.io/api/relay";

type Options = {
  /**
   * 日本の外からの接続を断つサイト向け。合言葉（SCRAPE_RELAY_TOKEN）があれば中継口を通して読む。
   * 手元の端末は日本にあるので、合言葉が無ければそのまま読む
   */
  viaJapan?: boolean;
};

async function request(url: string, viaJapan: boolean): Promise<Response> {
  const token = process.env.SCRAPE_RELAY_TOKEN;

  if (viaJapan && token !== undefined && token !== "") {
    return fetch(`${relayUrl}?url=${encodeURIComponent(url)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(timeoutMs),
    });
  }

  return fetch(url, {
    headers: {
      "Accept-Language": "ja,en;q=0.8",
      "User-Agent": userAgent,
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
}

export default async function fetchHtml(
  url: string,
  { viaJapan = false }: Options = {},
  retry = 2,
): Promise<string> {
  try {
    const res = await request(url, viaJapan);

    if (!res.ok) {
      // 中継口は取得先の答えを本文に入れて返す。直接読んだときの本文は長いので載せない
      const detail = res.url.startsWith(relayUrl) ? ` ${await res.text()}` : "";

      throw new Error(`${res.status} ${res.statusText}${detail}`);
    }

    return await res.text();
  } catch (error) {
    if (retry <= 0) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    return fetchHtml(url, { viaJapan }, retry - 1);
  }
}
