-- 先読みの回を開くサイト。ログインした人のぶんだけサーバーに置く。
--
-- 会員になっているサイトでは、先読みの回まで読める。そういうサイトだけ、
-- カードから最新の回へそのまま飛ばす。載っていないサイトは無料で読める最新の回へ送る。

create table if not exists early_site (
  user_id text not null references "user"(id) on delete cascade,
  site_url text not null,
  chosen_at timestamptz not null default now(),
  primary key (user_id, site_url)
);
