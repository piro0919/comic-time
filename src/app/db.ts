import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import serverEnv from "@/app/serverEnv";

/**
 * フォロー・既読・先読みの設定を読み書きする口。
 * 初めて使うときに作る。読み込みの時点で作ると、DATABASE_URL の無いビルドが落ちる。
 */
let client: NeonQueryFunction<false, false> | undefined = undefined;

export default function db(): NeonQueryFunction<false, false> {
  client ??= neon(serverEnv().DATABASE_URL);

  return client;
}
