/** 取得のときと同じ名乗り。相手が誰に読まれているか分かるようにする */
const userAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 ComicTimeBot/1.0 (+https://comictime.kkweb.io/)";

/**
 * 取得元のページや API を読む。画面を開いた人が待っているので、やり直さずに短く切る。
 * 取れなければ例外を投げ、その作品は「取れませんでした」と出す。
 */
export default async function fetchText(
  url: string,
  init: RequestInit = {},
): Promise<string> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Accept-Language": "ja,en;q=0.8",
      "User-Agent": userAgent,
      ...init.headers,
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} ${url}`);
  }

  return res.text();
}
