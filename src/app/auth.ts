import { createNeonAuth } from "@neondatabase/auth/next/server";

/**
 * ログインの土台。Neon Auth（中身は Better Auth）に預ける。
 * 利用者とセッションは同じ Postgres の neon_auth スキーマに入るので、
 * フォローの表とは SQL で繋がる。
 *
 * ログインは任意。ここを通らなくてもサイトは今までどおり動く。
 */
const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL ?? "",
  cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET ?? "" },
});

export default auth;
