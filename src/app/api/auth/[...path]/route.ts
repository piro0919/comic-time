/* eslint-disable filenames/match-exported */
import auth from "@/app/auth";

/**
 * Neon Auth の受け口。ログインの往復はすべてここを通る。
 * 中身は預けているので、こちらで組み立てるものは無い。
 */
export const { GET, POST } = auth.handler();
