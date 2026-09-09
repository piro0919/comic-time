"use server";
import { neon } from "@neondatabase/serverless";
import { headers } from "next/headers";
import auth from "@/app/auth";
import { named, refOf } from "@/app/followKeys";

/**
 * ログインした人のフォローを Neon に読み書きする。
 *
 * ログインしていなければ何もせず空を返す。画面は今までどおり localStorage で動くので、
 * ここが空を返すことと「フォローが無い」ことは別の話になる。
 *
 * やり取りは画面が使う見出しのままにして、台帳の slug への変換は followKeys に閉じる。
 * 画面と共有リンクの形を変えずに、長く残す側だけ変わらない住所で持つため。
 *
 * 題名も一緒に返す。手元の控えしか名前の出どころが無いと、初めて開いた端末では
 * 名前の付かない登録になり、画面がそれを「捨ててよいもの」として扱ってしまう。
 */
type Follows = {
  sites: string[];
  /** 見出しから題名へ。台帳から引いたもの */
  titles: Record<string, string>;
  works: string[];
};

const sql = neon(process.env.DATABASE_URL ?? "");

/** 今ログインしている人の id。していなければ null */
async function currentUserId(): Promise<null | string> {
  const session = await auth.api.getSession({ headers: await headers() });

  return session?.user.id ?? null;
}

/** その人のフォロー全部。ログインしていなければ空 */
export async function readFollows(): Promise<Follows> {
  const userId = await currentUserId();

  if (userId === null) {
    return { sites: [], titles: {}, works: [] };
  }

  const [works, sites] = await Promise.all([
    sql`select slug, site_url from follow_work where user_id = ${userId} order by followed_at`,
    sql`select site_url from follow_site where user_id = ${userId} order by followed_at`,
  ]);
  // 台帳から消えた作品は見出しに戻せない。出しても押せないので落とす
  const found = works
    .map((row) =>
      named({ siteUrl: String(row.site_url), slug: String(row.slug) }),
    )
    .filter((entry) => entry !== undefined);

  return {
    sites: sites.map((row) => String(row.site_url)),
    titles: Object.fromEntries(
      found.map((entry) => [entry.key, entry.title] as const),
    ),
    works: found.map((entry) => entry.key),
  };
}

/** 作品を1つ足す。すでに入っていれば何もしない */
export async function followWork(key: string): Promise<void> {
  const userId = await currentUserId();
  const ref = refOf(key);

  if (userId === null || ref === undefined) {
    return;
  }

  await sql`insert into follow_work (user_id, slug, site_url)
            values (${userId}, ${ref.slug}, ${ref.siteUrl})
            on conflict do nothing`;
}

/** 作品を1つ外す */
export async function unfollowWork(key: string): Promise<void> {
  const userId = await currentUserId();
  const ref = refOf(key);

  if (userId === null || ref === undefined) {
    return;
  }

  await sql`delete from follow_work
            where user_id = ${userId} and slug = ${ref.slug} and site_url = ${ref.siteUrl}`;
}

/** サイトを1つ足す。すでに入っていれば何もしない */
export async function followSite(siteUrl: string): Promise<void> {
  const userId = await currentUserId();

  if (userId === null) {
    return;
  }

  await sql`insert into follow_site (user_id, site_url) values (${userId}, ${siteUrl}) on conflict do nothing`;
}

/** サイトを1つ外す */
export async function unfollowSite(siteUrl: string): Promise<void> {
  const userId = await currentUserId();

  if (userId === null) {
    return;
  }

  await sql`delete from follow_site where user_id = ${userId} and site_url = ${siteUrl}`;
}

/**
 * 初回のログインで、端末に溜まっていたぶんをサーバーへ足す。
 * 足すだけで消さない。ここで消すと「登録したのに」が起きる。
 * 以降はサーバーが正本になるので、この合流は一度きりでよい。
 */
export async function mergeFollows(local: {
  sites: string[];
  works: string[];
}): Promise<Follows> {
  const userId = await currentUserId();

  if (userId === null) {
    return { sites: [], titles: {}, works: [] };
  }

  const refs = local.works
    .map((key) => refOf(key))
    .filter((ref) => ref !== undefined);

  await Promise.all([
    refs.length === 0
      ? Promise.resolve()
      : sql`insert into follow_work (user_id, slug, site_url)
            select ${userId}, slug, site_url
            from unnest(${refs.map((ref) => ref.slug)}::text[],
                        ${refs.map((ref) => ref.siteUrl)}::text[])
                 as pair(slug, site_url)
            on conflict do nothing`,
    local.sites.length === 0
      ? Promise.resolve()
      : sql`insert into follow_site (user_id, site_url)
            select ${userId}, unnest(${local.sites}::text[])
            on conflict do nothing`,
  ]);

  return readFollows();
}
