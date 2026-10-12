/**
 * サーバーが使う環境変数を確かめて返す。
 *
 * 以前は `process.env.X ?? ""` で読んでいて、無ければ空のまま Google やデータベースに渡り、
 * どこで何が足りないのか分からない失敗になっていた。ここで足りない名前を並べて止める。
 *
 * 確かめるのは使う瞬間で、読み込んだ瞬間ではない。ビルド（CI と e2e の next build）は
 * 秘密を持たずに走るので、読み込みで投げるとビルドごと落ちる。
 * ログインもフォローも使わないページは、これが無くても動く。
 *
 * 名前の一覧は .env.example にも置いている。足したら両方を直す。
 */
const required = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
] as const;

type Name = (typeof required)[number];

export type ServerEnv = Record<Name, string> & {
  /** 無ければ Better Auth が受けた要求の住所から割り出す */
  BETTER_AUTH_URL: string | undefined;
};

let checked: ServerEnv | undefined = undefined;

/** 足りない名前を全部並べて投げる。1つずつ直して何度もやり直さずに済むように */
export function readServerEnv(
  env: Record<string, string | undefined>,
): ServerEnv {
  const missing = required.filter(
    (name) => env[name] === undefined || env[name] === "",
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing environment variables: ${missing.join(", ")}. See .env.example.`,
    );
  }

  const values = Object.fromEntries(
    required.map((name) => [name, env[name] ?? ""] as const),
  ) as Record<Name, string>;

  return {
    ...values,
    BETTER_AUTH_URL:
      env.BETTER_AUTH_URL === "" ? undefined : env.BETTER_AUTH_URL,
  };
}

export default function serverEnv(): ServerEnv {
  checked ??= readServerEnv(process.env);

  return checked;
}
