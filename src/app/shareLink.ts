/**
 * お気に入りを URL の断片に載せて持ち運ぶ。
 * 断片はサーバに送られないので、短縮を挟まない限り中身は端末の外に出ない。
 *
 * 先頭1文字は詰め方の印。後から変えられるように付けてある。
 * 1 = gzip して base64、0 = そのまま base64。
 */
const GZIPPED = "1";
const PLAIN = "0";

export type SharedFavorites = {
  sites: string[];
  works: string[];
};

/** 短縮サービスが受け付ける入力の上限。実測で約2000文字 */
export const maxShortenableLength = 2000;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));

  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function collect(
  stream: ReadableStream<Uint8Array>,
): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();

  for (;;) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    chunks.push(value);
  }

  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(total);

  let offset = 0;

  chunks.forEach((chunk) => {
    merged.set(chunk, offset);
    offset += chunk.length;
  });

  return merged;
}

/** お気に入りを断片用の文字列にする */
export async function encodeFavorites(
  favorites: SharedFavorites,
): Promise<string> {
  const json = JSON.stringify({ s: favorites.sites, w: favorites.works });
  const bytes = new TextEncoder().encode(json);

  // 古い端末には gzip が無い。そのときは詰めずに運ぶ
  if (typeof CompressionStream === "undefined") {
    return PLAIN + toBase64Url(bytes);
  }

  const compressed = await collect(
    new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip")),
  );

  return GZIPPED + toBase64Url(compressed);
}

/** 断片用の文字列をお気に入りに戻す。読めなければ null */
export async function decodeFavorites(
  encoded: string,
): Promise<null | SharedFavorites> {
  try {
    const marker = encoded.slice(0, 1);
    const body = fromBase64Url(encoded.slice(1));
    const bytes =
      marker === GZIPPED
        ? await collect(
            new Blob([body])
              .stream()
              .pipeThrough(new DecompressionStream("gzip")),
          )
        : body;
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as {
      s?: unknown;
      w?: unknown;
    };
    const onlyStrings = (value: unknown): string[] =>
      Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string")
        : [];

    return { sites: onlyStrings(parsed.s), works: onlyStrings(parsed.w) };
  } catch {
    return null;
  }
}

/** 重なりを除いて1つにまとめる */
export function mergeFavorites(
  base: SharedFavorites,
  added: SharedFavorites,
): SharedFavorites {
  return {
    sites: [...new Set([...base.sites, ...added.sites])],
    works: [...new Set([...base.works, ...added.works])],
  };
}
