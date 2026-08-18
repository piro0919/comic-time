/**
 * ページの住所は URL から作る。台帳には持たせない。
 * 末尾のラベル（.com や .jp）は住所として意味がないので落とす。
 * パスを持つサイトは、その最後の区切りまで入れて他と区別する。
 *
 * 取得の script からも読むので、ここには別名解決の要る import を置かない。
 */
export default function siteSlug(url: string): string {
  const { hostname, pathname } = new URL(url);
  const labels = hostname.replace(/^www\./, "").split(".");
  const host = labels.slice(0, -1).join("-");
  const tail = pathname.split("/").filter(Boolean).at(-1);

  return tail === undefined ? host : `${host}-${tail}`;
}
