"use client";
import { createAuthClient } from "@neondatabase/auth/next";

/**
 * ログインの窓口。ログインは任意なので、ここを一度も呼ばなくてもサイトは動く。
 * 入り口は Google だけにしている。
 */
const authClient = createAuthClient();

export default authClient;
