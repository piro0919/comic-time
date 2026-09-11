/**
 * 「登録があるか」だけをサーバーへ伝える印。
 *
 * 登録そのものは今までどおり localStorage にある。サーバーはそれを読めないので、
 * トップは必ず今日の一覧を描いて返し、ブラウザが組み上がってからお気に入りへ
 * 差し替わっていた。その差し替えに1.2秒かかり、その間ずっと今日の一覧が出ている。
 *
 * 有無の1ビットだけならクッキーに載せられる。中身は "1" のみで、
 * 何を登録しているかは載せない。これで最初からお気に入りを描いて返せる。
 *
 * 手元とクッキーが食い違うことはある（クッキーだけ消した、別の端末から来た）。
 * だから画面側の差し替えは残してある。クッキーは当て推量の精度を上げるだけで、
 * 正本は変わらず localStorage にある。
 */
export const favoritesCookie = "ct-fav";

/** 1年。登録を消すまで持たせる */
const maxAge = 60 * 60 * 24 * 365;

/** ブラウザ側で印を合わせる。サーバーでは呼ばない */
export function writeFavoritesCookie(has: boolean): void {
  try {
    document.cookie = has
      ? `${favoritesCookie}=1; path=/; max-age=${maxAge}; samesite=lax`
      : `${favoritesCookie}=; path=/; max-age=0; samesite=lax`;
  } catch {
    // 印が付けられなくても、今までどおり描いた後に差し替わるだけ
  }
}
