import { betterAuth } from "better-auth";
import { Pool } from "pg";

/**
 * ログインの土台。Better Auth を自前で持つ。
 *
 * 以前は Neon Auth（管理された Better Auth）に預けていたが、認証の受け口が
 * Neon の接続先になるため、Google の同意画面に neon.tech と出ていた。
 * 受け口をこのサイト自身に置くと、同意画面もこのサイトの名前になる。
 *
 * 利用者とセッションはフォローの表と同じ Postgres に入る。手段は Google だけ。
 */
const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  secret: process.env.BETTER_AUTH_SECRET,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
});

export default auth;
