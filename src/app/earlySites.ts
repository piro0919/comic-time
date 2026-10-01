"use server";
import { headers } from "next/headers";
import {
  booleanOf,
  maxSites,
  maxUrlLength,
  stringOf,
  stringsOf,
} from "@/app/actionInput";
import db from "@/app/db";
import getAuth from "@/app/getAuth";
import isKnownSite from "@/app/isKnownSite";

/**
 * ログインした人の「先読みの回を開くサイト」を Neon に読み書きする。
 * ログインしていなければ何もせず空を返す。画面は localStorage だけで動く。
 */
async function currentUserId(): Promise<null | string> {
  const session = await getAuth().api.getSession({ headers: await headers() });

  return session?.user.id ?? null;
}

export async function readEarlySites(): Promise<string[]> {
  const userId = await currentUserId();

  if (userId === null) {
    return [];
  }

  const rows =
    await db()`select site_url from early_site where user_id = ${userId} order by chosen_at`;

  return rows.map((row) => String(row.site_url));
}

/** 1サイトぶんを入れるか外す。台帳に無いサイトは入れない。外すのは台帳と突き合わせない */
export async function setEarlySite(
  siteInput: string,
  earlyInput: boolean,
): Promise<void> {
  const siteUrl = stringOf(siteInput, maxUrlLength);
  const early = booleanOf(earlyInput);
  const userId = await currentUserId();

  if (userId === null || (early && !isKnownSite(siteUrl))) {
    return;
  }

  await (early
    ? db()`insert into early_site (user_id, site_url) values (${userId}, ${siteUrl}) on conflict do nothing`
    : db()`delete from early_site where user_id = ${userId} and site_url = ${siteUrl}`);
}

/** 初回のログインで、端末に溜まっていたぶんをサーバーへ足す。足すだけで消さない */
export async function mergeEarlySites(input: string[]): Promise<string[]> {
  // 台帳に無いものは古い控え。投げずに落とす
  const local = stringsOf(input, maxSites, maxUrlLength).filter((siteUrl) =>
    isKnownSite(siteUrl),
  );
  const userId = await currentUserId();

  if (userId === null) {
    return [];
  }

  if (local.length > 0) {
    await db()`insert into early_site (user_id, site_url)
              select ${userId}, unnest(${local}::text[])
              on conflict do nothing`;
  }

  return readEarlySites();
}
