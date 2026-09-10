/**
 * next/image に縮めさせてよい取得先。
 *
 * 原寸のまま並べると、一覧1画面で展開後 110MB ほどになる。iOS のホーム画面アプリは
 * Safari のタブより使えるメモリが狭く、超えると表示ごと落ちて読み直し、また落ちる。
 * 数回続くと「問題が繰り返し発生しました」で開かなくなる。
 *
 * ここに無いホストは縮めずにそのまま出す。next/image は知らないホストを渡されると
 * 描画で例外を投げるので、載せ忘れたサイトを足した日に画面ごと落ちる。
 * その1サイトだけ重いほうがましなので、判断は isOptimizable に寄せる。
 */
const imageHosts: string[] = [
  "app.manga-one.com",
  "cdn-img.comic-action.com",
  "cdn-img.comic-gardo.com",
  "cdn-img.magcomi.com",
  "cdn-public.comici.jp",
  "cdn-scissors.gigaviewer.com",
  "cdn.comic-walker.com",
  "eh96lnrmau.user-space.cdn.idcfcloud.net",
  "gaugau.futabanet.jp",
  "img.comic-fuz.com",
  "img.shuro.world",
  "ja-img.manga-up.com",
  "kirapo.jp",
  // ログインした人の Google の写真
  "lh3.googleusercontent.com",
  "mgpk-cdn.magazinepocket.com",
  "sai-zen-sen.jp",
  "www.ganganonline.com",
];

export default imageHosts;

/** その画像を next/image に任せられるか。手元に置いたものは常に任せる */
export function isOptimizable(src: string): boolean {
  if (!src.startsWith("http")) {
    return true;
  }

  try {
    return imageHosts.includes(new URL(src).hostname);
  } catch {
    return false;
  }
}
