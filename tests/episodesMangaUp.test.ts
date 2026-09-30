import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import mangaUp from "../src/app/episodes/mangaUp.ts";

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

/** 作品ページだけを差し替える。頼まれた住所は asked に残す */
function serve(html: string): { asked: string[] } {
  const asked: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    asked.push(url);

    return url.endsWith("/titles/1612")
      ? new Response(html, { status: 200 })
      : new Response("", { status: 404 });
  }) as typeof fetch;

  return { asked };
}

/** React の受け渡しを、サイトと同じく途中で切って2つの push に分ける */
function page(flight: string): string {
  const middle = Math.floor(flight.length / 2);

  return [flight.slice(0, middle), flight.slice(middle)]
    .map(
      (part) =>
        `<script>self.__next_f.push([1,${JSON.stringify(part)}])</script>`,
    )
    .join("");
}

test("マンガUP!: 古い順の一覧を裏返し、publishingStatus で読み方を分ける", async () => {
  const chapters = [
    { id: 1, name: "涙に魔法", publishingStatus: 3, subName: "第1話" },
    { id: 2, name: "指先に[ときめき]", publishingStatus: 2, subName: "第2話" },
    {
      daysToChangeStatus: "10月7日にチケットが使えます",
      id: 3,
      name: "ビターに真心",
      publishingStatus: 1,
      subName: "",
    },
    { id: 4, name: "おまけ", publishingStatus: 9 },
  ];
  const { asked } = serve(
    page(
      `1:["$","div",{"chapters":${JSON.stringify(chapters)},"currentChapter":{"id":1}}]`,
    ),
  );
  const episodes = await mangaUp(
    "https://www.manga-up.com/titles/1612/chapters/2",
  );

  assert.equal(asked[0], "https://www.manga-up.com/titles/1612");
  assert.deepEqual(episodes, [
    {
      access: null,
      date: null,
      title: "おまけ",
      url: "https://www.manga-up.com/titles/1612/chapters/4",
    },
    {
      access: "early",
      date: null,
      title: "ビターに真心",
      url: "https://www.manga-up.com/titles/1612/chapters/3",
    },
    {
      access: "paid",
      date: null,
      title: "第2話 指先に[ときめき]",
      url: "https://www.manga-up.com/titles/1612/chapters/2",
    },
    {
      access: "free",
      date: null,
      title: "第1話 涙に魔法",
      url: "https://www.manga-up.com/titles/1612/chapters/1",
    },
  ]);
});

test("マンガUP!: 話の一覧が無ければ例外にする", async () => {
  serve(page('1:["$","div",{"children":[]}]'));

  await assert.rejects(
    async () => mangaUp("https://www.manga-up.com/titles/1612"),
    /話の一覧/,
  );
});
