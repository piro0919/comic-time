/**
 * 来た人が道具として使い始めたかを測るイベントの名前。
 *
 * 検索から作品ページに来る人の数は Analytics の閲覧で分かるが、
 * その先で登録したか、登録した人がまた開いたかは閲覧からは読めない。
 * 送るのは画面、読むのは `npm run analytics` なので、名前だけをここに置く。
 */

/** 作品かサイトをお気に入りに入れた。first はその端末で最初の1件か */
export const favoriteAddEvent = "favorite-add";

/** お気に入りが1件以上ある端末で、サイトを開いた。1つのタブで1回だけ送る */
export const favoritesVisitEvent = "favorites-visit";
