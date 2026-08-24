/* eslint-disable import/prefer-default-export -- 使う側が名前で読む */
import { readFileSync } from "node:fs";

/** 取得のテストは fetch を差し替えて、保存しておいたページを返す */
export function serve(pages: Record<string, string>): {
  asked: string[];
  restore: () => void;
} {
  const realFetch = globalThis.fetch;
  const asked: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    asked.push(url);

    /**
     * 並びに頼らず、当てはまるうちで一番長い鍵を採る。
     * 鍵は書いた順ではなく名前順に並べ替えられるので、
     * 「/titles/」と「/titles/prebl」のような重なりを順番で表せない。
     */
    const file = Object.entries(pages)
      .filter(([part]) => url.includes(part))
      .sort(([left], [right]) => right.length - left.length)[0]?.[1];

    if (file === undefined) {
      return new Response("", { status: 404 });
    }

    // protobuf の応答もあるので、中身は読まずにそのまま渡す
    return new Response(
      readFileSync(new URL(`./fixtures/${file}`, import.meta.url)),
      { status: 200 },
    );
  }) as typeof fetch;

  return {
    asked,
    restore: (): void => {
      globalThis.fetch = realFetch;
    },
  };
}
