import { betterAuth } from "better-auth";
import { Pool } from "pg";
import serverEnv from "@/lib/serverEnv";

/**
 * ログインの土台。Better Auth を自前で持つ。
 *
 * 以前は Neon Auth（管理された Better Auth）に預けていたが、認証の受け口が
 * Neon の接続先になるため、Google の同意画面に neon.tech と出ていた。
 * 受け口をこのサイト自身に置くと、同意画面もこのサイトの名前になる。
 *
 * 利用者とセッションはフォローの表と同じ Postgres に入る。手段は Google だけ。
 *
 * 初めて使うときに作る。環境変数が足りなければ、そこで名前を挙げて止まる。
 * 読み込みの時点で作ると、秘密を持たないビルドが落ちる。
 */
type Options = {
  baseURL: string | undefined;
  database: Pool;
  secret: string;
  socialProviders: { google: { clientId: string; clientSecret: string } };
  user: { deleteUser: { enabled: boolean } };
};

type Auth = ReturnType<typeof betterAuth<Options>>;

let auth: Auth | undefined = undefined;

export default function getAuth(): Auth {
  if (auth === undefined) {
    const env = serverEnv();

    auth = betterAuth<Options>({
      baseURL: env.BETTER_AUTH_URL,
      database: new Pool({ connectionString: env.DATABASE_URL }),
      secret: env.BETTER_AUTH_SECRET,
      socialProviders: {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
      },
      /*
       * 利用者が自分で消せるようにする（プライバシーポリシーで約束している）。
       * フォロー・既読・先読みの設定は利用者へ CASCADE で繋がっているので、一緒に消える。
       * ログインから1日を過ぎたセッションでは、Better Auth が SESSION_EXPIRED で断る
       */
      user: { deleteUser: { enabled: true } },
    });
  }

  return auth;
}
