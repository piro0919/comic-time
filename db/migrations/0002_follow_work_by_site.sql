-- フォローは「この作品を、ここで読む」という登録にする。
-- 題名だけで持つと、同じ作品を載せている別サイトの更新まで一覧に出る。
-- 読むのは1つのサイトなので、作品の鍵は slug とサイトの url の組にする。
--
-- 0001 で作った表はまだ誰も使っていないので、作り直す。

drop table if exists follow_work;

create table follow_work (
  user_id uuid not null references neon_auth."user"(id) on delete cascade,
  -- data/catalog.json の slug
  slug text not null,
  -- src/data/sites.json の url。どのサイトで読むぶんかを表す
  site_url text not null,
  followed_at timestamptz not null default now(),
  primary key (user_id, slug, site_url)
);
