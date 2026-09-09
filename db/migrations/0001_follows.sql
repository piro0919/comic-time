-- フォローの控え。ログインした人のぶんだけサーバーに置く。
-- ログイン前は今までどおり localStorage で動くので、ここに行が無い＝フォローが無い、ではない。
--
-- 作品はサイトを跨いで1件にまとめる。鍵は data/catalog.json の slug で、
-- 一度配ったら変えない住所なので、題名の表記が直っても行は生き残る。
-- サイトは src/data/sites.json の url。こちらも入り口の住所で、名前ではない。
--
-- user_id は Neon Auth（Better Auth）が neon_auth スキーマに作る利用者の id。
-- 外部キーはまだ張らない。管理側の表の名前と id の型を実際に繋いで確かめてから決める。

create table if not exists follow_work (
  user_id text not null,
  -- data/catalog.json の slug
  slug text not null,
  followed_at timestamptz not null default now(),
  primary key (user_id, slug)
);

create table if not exists follow_site (
  user_id text not null,
  -- src/data/sites.json の url
  site_url text not null,
  followed_at timestamptz not null default now(),
  primary key (user_id, site_url)
);

-- 引くのは必ず「この人のぶん全部」なので、主キーの先頭が user_id であれば足りる。
-- 別の索引は置かない。
