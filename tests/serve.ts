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

    const file = Object.entries(pages).find(([part]) =>
      url.includes(part),
    )?.[1];

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
