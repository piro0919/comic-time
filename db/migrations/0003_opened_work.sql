-- 既読の控え。ログインした人のぶんだけサーバーに置く。
--
-- 鍵は回のURL。フォローと違って作品としての同一性は要らない。
-- 話が変わればURLも変わり、それが「まだ読んでいない」の合図になるため。
-- ツイ４のように話が変わってもURLが変わらないサイトがあるので、開いた日も持つ。
-- 同じURLでも、開いたのがその日より前なら未読として扱う。
--
-- 古い行は30日で捨てる。一覧は7日ぶんしか持たないので、それより先は使い道がない。

create table if not exists opened_work (
  user_id uuid not null references neon_auth."user"(id) on delete cascade,
  url text not null,
  opened_on date not null,
  primary key (user_id, url)
);
