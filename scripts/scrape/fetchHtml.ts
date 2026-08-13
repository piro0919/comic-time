const userAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 ComicTimeBot/1.0 (+https://comictime.kkweb.io/)";

export default async function fetchHtml(
  url: string,
  retry = 2,
): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "Accept-Language": "ja,en;q=0.8",
        "User-Agent": userAgent,
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    return await res.text();
  } catch (error) {
    if (retry <= 0) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    return fetchHtml(url, retry - 1);
  }
}
