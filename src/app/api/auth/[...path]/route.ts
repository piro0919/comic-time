 
import { toNextJsHandler } from "better-auth/next-js";
import auth from "@/app/auth";

/**
 * ログインの受け口。ここがこのサイトの住所にあることが大事で、
 * Google の同意画面に出るのはこの住所のホスト名になる。
 */
export const { GET, POST } = toNextJsHandler(auth);
