"use server";
import { neon } from "@neondatabase/serverless";
import auth from "@/app/auth";

/**
 * ログインした人の既読を Neon に読み書きする。
 *
 * ログインしていなければ何もせず空を返す。画面は今までどおり localStorage で動くので、
 * ここが空を返すことと「まだ何も開いていない」ことは別の話になる。
 *
 * 鍵は回のURL。話が変わればURLも変わり、それがそのまま「まだ読んでいない」になる。
 * 開いた日も持つのは、話が変わってもURLが変わらないサイトがあるため。
 */
const sql = neon(process.env.DATABASE_URL ?? "");
/** 記録を残す日数。一覧は7日ぶんしか持たないので、これだけあれば取りこぼさない */
const keepDays = 30;

/** 今ログインしている人の id。していなければ null */
async function currentUserId(): Promise<null | string> {
  const { data } = await auth.getSession();

  return data?.user.id ?? null;
}

/** その人の既読全部。URLから開いた日への対応で返す */
export async function readOpens(): Promise<Record<string, string>> {
  const userId = await currentUserId();

  if (userId === null) {
    return {};
  }

  const rows =
    await sql`select url, to_char(opened_on, 'YYYY-MM-DD') as opened_on
                         from opened_work where user_id = ${userId}`;

  return Object.fromEntries(
    rows.map((row) => [String(row.url), String(row.opened_on)] as const),
  );
}

/**
 * 1回ぶん記録する。同じURLを開き直したら日付を進める。
 * ついでに古い行を捨てる。溜め続けても使い道がない。
 */
export async function markOpen(url: string, date: string): Promise<void> {
  const userId = await currentUserId();

  if (userId === null) {
    return;
  }

  await sql`insert into opened_work (user_id, url, opened_on)
            values (${userId}, ${url}, ${date}::date)
            on conflict (user_id, url)
            do update set opened_on = greatest(opened_work.opened_on, excluded.opened_on)`;
  await sql`delete from opened_work
            where user_id = ${userId}
              and opened_on < ${date}::date - ${keepDays}::integer`;
}

/**
 * 初回のログインで、端末に溜まっていた既読をサーバーへ合流させる。
 * 同じURLが両方にあれば、新しい方の日付を採る。読んだ事実は消さない。
 */
export async function mergeOpens(
  local: Record<string, string>,
): Promise<Record<string, string>> {
  const userId = await currentUserId();

  if (userId === null) {
    return {};
  }

  // 8月末まで使っていた古い形の記録を弾く。あの頃は作品の見出しで持っていて、
  // いまは回のURLで引くので、混ぜても二度と照合されない行になるだけ
  const entries = Object.entries(local).filter(([url]) =>
    url.startsWith("http"),
  );

  if (entries.length > 0) {
    await sql`insert into opened_work (user_id, url, opened_on)
              select ${userId}, url, opened_on::date
              from unnest(${entries.map(([url]) => url)}::text[],
                          ${entries.map(([, date]) => date)}::text[])
                   as pair(url, opened_on)
              on conflict (user_id, url)
              do update set opened_on = greatest(opened_work.opened_on, excluded.opened_on)`;
  }

  return readOpens();
}
