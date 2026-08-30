/**
 * 作品の突き合わせと、作品ページの住所。
 *
 * 取得の script からも読むので、ここには別名解決の要る import を置かない。
 */

/**
 * 突き合わせのためにタイトルを揃える。
 * 全角半角（NFKC）と、波ダッシュ・全角チルダの違い、空白だけを吸収する。
 * 括弧の中身は落とさない。落とすと別作品を同じものとして扱ってしまう。
 */
export function titleKey(title: string): string {
  return title
    .normalize("NFKC")
    .replace(/[〜～]/g, "~")
    .replace(/\s+/g, "")
    .toLowerCase();
}

/**
 * 作品ページの住所のもと。日本語はそのまま残す。
 * 住所やサイトマップで意味が変わってしまう字だけを落とす。
 * 角括弧は Next の動的な区間と同じ形なので、これも落とす。
 *
 * 落とした結果ぶつかることがあるので、実際に配る住所は台帳側で重なりを見て決める。
 * 一度配った住所は台帳に残り、題名の表記が直っても変わらない。
 */
export default function workSlug(title: string): string {
  const slug = titleKey(title).replace(/["#%&'+/<>?[\\\]^`{|}]/g, "");

  return slug === "" ? "work" : slug;
}
