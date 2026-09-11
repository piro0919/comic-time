import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import thumbKey from "../../src/app/thumbKey.ts";
import { type Work } from "../../src/types/work.ts";

/**
 * 一覧に並ぶサムネイルを縮めて public/work-thumbs に置く。
 *
 * 各社の CDN が持っているのは 320〜800px の絵で、画面では 177px の枠に出している。
 * 多い日は368件並び、下まで見た時点で展開後のビットマップが300MBを超える。
 * iOS のホーム画面アプリは Safari のタブより使えるメモリが狭く、超えると表示ごと
 * 落ちて読み直し、また落ちる。数回続くと「問題が繰り返し発生しました」で開かなくなる。
 *
 * 縮める場所をここにしているのは、他のどこにも置けなかったため。各社の CDN は
 * 寸法の指定を受け付けず、wsrv.nl は取得先の1つを拒み、その1つが一番重い。
 * Vercel の画像最適化は画像のバイトをこちらの請求に乗せる。ここで済ませれば
 * 費用はかからず、取得先が増えても同じように効く。
 *
 * 持つのは data/works にある7日ぶんだけ。日が落ちれば絵も落とす。
 * 台帳にしか無い古い作品は元の住所のまま出る。作品ページは1枚しか出さないので、
 * そこは重くならない。
 */
const worksDir = path.join(process.cwd(), "data", "works");
const thumbDir = path.join(process.cwd(), "public", "work-thumbs");
const listPath = path.join(process.cwd(), "data", "workThumbs.json");
/**
 * 画面に出す幅の1.5倍。ここは見た目の好みではなく、iOS のホーム画面アプリが
 * 持てるメモリで決まる。展開後のビットマップは幅の2乗で効く。
 * 一番重い日（368件）で 256px なら42MB、320px なら65MB、原寸だと314MB。
 *
 * 320px は一度出して戻している。実機で落ちないと分かっているのは 256px だけ。
 * 上げたくなったら、重い日を実機で下まで送って確かめてから。
 */
const width = 256;
/** 輪郭を立てたぶん、圧縮を緩めないと粗が出る。ここはファイルの大きさだけの話 */
const quality = 78;
/** 一度に走らせる取得の数。相手の負荷を上げすぎない */
const concurrency = 8;

/** 7日ぶんに出てくるサムネイルの住所。重複は畳む */
async function wantedUrls(): Promise<string[]> {
  const files = await fs.readdir(worksDir).catch(() => []);
  const urls = new Set<string>();

  for (const file of files) {
    if (!file.endsWith(".json")) {
      continue;
    }

    const works = JSON.parse(
      await fs.readFile(path.join(worksDir, file), "utf-8"),
    ) as Work[];

    works.forEach((work) => {
      if (work.thumbnailUrl !== null) {
        urls.add(work.thumbnailUrl);
      }
    });
  }

  return [...urls];
}

/** 取ってきて縮め、webp で置く */
async function save(url: string, key: string): Promise<void> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "ComicTimeBot/1.0 (+https://comictime.kkweb.io/)",
    },
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }

  const resized = await sharp(Buffer.from(await res.arrayBuffer()))
    .resize({ width, withoutEnlargement: true })
    // 縮めると輪郭が鈍る。立て直すぶんには画素が増えないので、メモリは変わらない
    .sharpen({ m1: 0, m2: 3, sigma: 0.8 })
    .webp({ quality })
    .toBuffer();

  await fs.writeFile(path.join(thumbDir, `${key}.webp`), resized);
}

export default async function workThumbs(): Promise<void> {
  await fs.mkdir(thumbDir, { recursive: true });

  const urls = await wantedUrls();
  const wanted = new Map(urls.map((url) => [thumbKey(url), url] as const));
  const onDisk = new Set(
    (await fs.readdir(thumbDir))
      .filter((name) => name.endsWith(".webp"))
      .map((name) => name.replace(/\.webp$/, "")),
  );
  const missing = [...wanted].filter(([key]) => !onDisk.has(key));

  console.log(
    `[workThumbs] 7日ぶん ${wanted.size}件、手元に ${onDisk.size}件、取るのは ${missing.length}件`,
  );

  const failed: string[] = [];

  let done = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const next = missing[done];

      done += 1;

      if (next === undefined) {
        return;
      }

      const [key, url] = next;

      try {
        await save(url, key);
      } catch (error) {
        // 取れなかったぶんは元の住所のまま出る。次の回でまた試す
        console.error(`[workThumbs] ${url}: 失敗`, error);
        failed.push(url);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, async () => worker()));

  // 7日から落ちた作品の絵は捨てる。溜め続けても使い道がない
  const dropped = [...onDisk].filter((key) => !wanted.has(key));

  await Promise.all(
    dropped.map(async (key) =>
      fs.rm(path.join(thumbDir, `${key}.webp`), { force: true }),
    ),
  );

  // 画面はこの一覧を見て、控えがあるものだけ手元の絵に差し替える
  const kept = (await fs.readdir(thumbDir))
    .filter((name) => name.endsWith(".webp"))
    .map((name) => name.replace(/\.webp$/, ""))
    .toSorted((a, b) => a.localeCompare(b));

  await fs.writeFile(listPath, `${JSON.stringify(kept, null, 2)}\n`);

  console.log(
    `[workThumbs] ${kept.length}件を保持、${dropped.length}件を削除、${failed.length}件が失敗`,
  );
}

await workThumbs();
