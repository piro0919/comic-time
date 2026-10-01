-- どのマイグレーションを当てたかの記録。scripts/migrate が読み書きする。
--
-- それまでは手で当てていて、当たっているかを確かめる手段が無かった。
-- 0001〜0006 はこの表ができる前に本番へ手で当てたものなので、当たったものとして記す。
-- 0002 は follow_work を作り直し、0005 は外部キーを外すので、もう一度当てると
-- フォローが消えるか、途中で失敗する。二度と当てさせないための行でもある。
--
-- この表が無い DB には、scripts/migrate を --baseline 付きで走らせてこのファイルを当てる。
-- 走らせる前に、0006 までの表がそろっていることを確かめる。
-- 空の DB に一から当てる道は無い。0001 は Neon Auth の neon_auth."user" を前提にしている。

create table if not exists schema_migrations (
  -- ファイル名から .sql を落としたもの。「0007_schema_migrations」
  name       text        primary key,
  -- 0001〜0006 は当てた日がわからないので空
  applied_at timestamptz
);

insert into schema_migrations (name) values
  ('0001_follows'),
  ('0002_follow_work_by_site'),
  ('0003_opened_work'),
  ('0004_better_auth'),
  ('0005_move_users_off_neon_auth'),
  ('0006_early_site')
on conflict (name) do nothing;
