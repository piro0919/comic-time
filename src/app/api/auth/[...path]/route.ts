import { toNextJsHandler } from "better-auth/next-js";
import getAuth from "@/app/getAuth";

/**
 * ログインの受け口。ここがこのサイトの住所にあることが大事で、
 * Google の同意画面に出るのはこの住所のホスト名になる。
 *
 * Better Auth は要求が来てから作る。読み込みで作ると、秘密を持たないビルドが落ちる。
 */
export async function GET(request: Request): Promise<Response> {
  return toNextJsHandler(getAuth()).GET(request);
}

export async function POST(request: Request): Promise<Response> {
  return toNextJsHandler(getAuth()).POST(request);
}
