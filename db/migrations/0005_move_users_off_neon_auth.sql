-- 利用者を neon_auth から自前の表へ移し、フォローと既読の外部キーを張り替える。
--
-- ここを飛ばして Neon Auth を無効にすると、neon_auth."user" が消え、
-- CASCADE でフォローと既読も道連れになる。必ず先にこれを当てる。
--
-- 利用者の id は uuid から text へ移すが、値は変わらない。
-- account も移す。Google 側の識別子を引き継がないと、同じアカウントで入っても別人になる。

insert into "user" ("id", "name", "email", "emailVerified", "image", "createdAt", "updatedAt")
select id::text, name, email, "emailVerified", image, "createdAt", "updatedAt"
from neon_auth."user"
on conflict ("id") do nothing;

insert into "account" ("id", "accountId", "providerId", "userId", "accessToken", "refreshToken",
                       "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", "scope",
                       "password", "createdAt", "updatedAt")
select id::text, "accountId", "providerId", "userId"::text, "accessToken", "refreshToken",
       "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", "scope",
       "password", "createdAt", "updatedAt"
from neon_auth.account
on conflict ("id") do nothing;

-- 外部キーを外してから型を移し、自前の利用者へ張り直す
alter table follow_work drop constraint follow_work_user_id_fkey;
alter table follow_site drop constraint follow_site_user_id_fkey;
alter table opened_work drop constraint opened_work_user_id_fkey;

alter table follow_work alter column user_id type text using user_id::text;
alter table follow_site alter column user_id type text using user_id::text;
alter table opened_work alter column user_id type text using user_id::text;

alter table follow_work add constraint follow_work_user_id_fkey
  foreign key (user_id) references "user" ("id") on delete cascade;
alter table follow_site add constraint follow_site_user_id_fkey
  foreign key (user_id) references "user" ("id") on delete cascade;
alter table opened_work add constraint opened_work_user_id_fkey
  foreign key (user_id) references "user" ("id") on delete cascade;
