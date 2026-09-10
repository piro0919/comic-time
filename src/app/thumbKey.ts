import { createHash } from "crypto";

/**
 * サムネイルの控えの名前。元の住所から作る。
 *
 * 台帳に持たせないのは、住所さえ同じなら誰が計算しても同じ名前になるため。
 * 取得の script と画面が、互いを見ずに同じファイルを指せる。
 *
 * 版が変わると各社の住所も変わるので、名前も変わる。古い絵が残り続けることはない。
 */
export default function thumbKey(url: string): string {
  return createHash("sha1").update(url).digest("hex").slice(0, 16);
}
