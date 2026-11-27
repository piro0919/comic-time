# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run type-check` - Run TypeScript type checking without emitting files
- `npm run promote` - Promote the deployment of origin/main's head commit to production. Use it when a scrape push and a local push deploy together and the older one ends up on production

### Linting and Formatting

- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run lint:style` - Run Stylelint on CSS files with auto-fix
- `npm run lint:secret` - Run secretlint to detect secrets (with masking)
- `npm run prettier` - Format all files with Prettier
- `npm run lefthook` - Run pre-commit hooks manually

### Quality Assurance

- `npm run secretlint` - Run secretlint without masking
- `npm run postbuild` - Generate sitemap after build (runs automatically)
- `npm run knip` - Find unused files, exports and dependencies (also runs in CI). Packages that are only named in config strings (ESLint presets, `ress` in CSS, `squawk-cli` in lefthook) are listed in `knip.json`

## Architecture Overview

### Project Structure

- **Next.js 15 App Router** - Uses the modern App Router with React 19
- **TypeScript** - Strict TypeScript configuration with explicit return types required
- **PWA** - Installable via the web app manifest. No service worker: pages are not cached
- **Theming** - next-themes for light/dark mode support

### Key Configuration Files

- `next.config.ts` - Next.js configuration with image optimization disabled
- `tsconfig.json` - TypeScript config with strict mode, path aliases (`@/*` → `./src/*`)
- `eslint.config.mjs` - Comprehensive ESLint setup with multiple plugins for code quality
- `lefthook.yml` - Git hooks for pre-commit linting, formatting, and type checking

### Code Quality Standards

- **ESLint Rules**: Enforces consistent-type-definitions as "type", inline type imports, explicit function return types
- **Shared rules**: `@piro0919/eslint-config` only supplies the magic-number rule (tests are exempt). Every other rule lives in `eslint.config.mjs`, which reads each plugin's flat config directly (no FlatCompat)
- **File Naming**: Supports camel, kebab, and pascal case for exports
- **Code Style**: Double quotes, semicolons required, alphabetical sorting of imports/exports
- **CSS Modules**: Used for styling with global scope restrictions

### Environment and Dependencies

- **Environment Variables**: Server secrets are read through `src/lib/serverEnv.ts`, which names any missing variable when login or follows are first used (not at import, so `next build` runs without secrets). The names are listed in `.env.example`
- **Fonts**: Noto Sans JP for Japanese text support
- **Canvas Fallback**: Webpack configured to handle canvas imports
- **Development Tools**: Window size display utility in development mode

### Pre-commit Quality Gates

All commits are automatically checked for:

- ESLint compliance with auto-fix
- Prettier formatting with auto-fix
- Stylelint CSS validation with auto-fix
- TypeScript type checking
- Secret detection
- Migration safety (squawk, and no edits to committed migrations)
- Conventional commit message format (**written in English**, subject and body)

### 置き場所（リージョン）

- DB（Neon）はシンガポール（ap-southeast-1、東京は無い）。2026-10-13 に us-east-1 の DB から移した。
  前の DB（neon-cyan-envelope）は消さずに残している
- **関数は東京（hnd1）に置く。DB とは揃えない。** カードを押すたびに走る `/go` と作品ページは、日本の取得元を読む。
  DB を使うのはログイン中の同期だけで、東京からシンガポールへの往復は前の米国東部の半分ほど。2026-10-13 に本人と決めた
- **関数のリージョンは経路ごとに変えられない。** Next.js の `preferredRegion` は Vercel の Node の関数では効かず
  （2026-10-13 に `/go` が sin1 で動くのを確かめた）、`vercel.json` の `functions` も Next.js ではメモリと実行時間しか受け付けない

### サイトの追加と取得

- サイトの台帳は `src/data/sites.json`。名前・更新曜日・更新時刻・URL だけを持つ
- 取得の仕方は `scripts/scrape/sources/` に1サイト1ファイルで書き、`sources/index.ts` に URL とともに登録する
- 各ソースは「その日更新された作品」だけを返す。取れなければ例外を投げ、そのサイトはその日が空になる
- `data/works/<日付>.json` に7日ぶんを保存し、古い日は消す
- **comici のサイトは5つとも東京の中継口（`/api/relay`）を通して読む。** 2026-10-21 から、チャンピオンクロス・
  ヤンチャンWeb・竹コミ！・コミプレが日本の外からの接続に CloudFront の 403 を返す。取得は米国の
  GitHub Actions で走るので、そのままでは読めない。コミックライドはまだ断っていないが、同じ作りなので一緒に通す。
  中継口は合言葉 `SCRAPE_RELAY_TOKEN`（Vercel の環境変数と GitHub の secrets に同じ値）を持つ要求だけを受ける。
  行き先は台帳のサイトと同じホストか、その親のホストに限り、転送は追わない。
  手元で走らせるときは合言葉が無いので直接読む。別のサイトが同じように断ち始めたら、
  そのソースの `fetchHtml` に `{ viaJapan: true }` を渡す。読む住所のホストが台帳とも親子とも違うサイトは、
  中継口が 400 で断るので、判定も直す
- サイトを足したら `npm run scrape:site-icons` も走らせる。複数サイトに載る作品の印に使うファビコンを `public/site-icons/` に集める
- 同じく `npm run scrape:site-images` も走らせる。サイト一覧の絵は各サイトの OGP 画像を縮めて
  `public/site-covers/` に置いたもので、取得の workflow には入っていない。走らせないと一覧が no-image のままになる
- サムネイルは取得のあと `npm run scrape:work-thumbs` が 320px の webp に縮めて
  `public/work-thumbs/` に置く。取得の workflow に入っているので手で走らせるのは試すときだけ
- **縮めている理由は通信量。** 原寸のまま並べると重い日で1画面 31.7MB、縮めて 8.3MB。
  携帯回線で開く道具なので、そのぶんを画質と引き換えにしている。メモリ対策ではない
  （落ちていた原因は別。下の「手元の状態」を参照）
- 縮める場所がここなのは、他に置けなかったため。各社の CDN は寸法の指定を受け付けず、
  wsrv.nl は取得先の1つ（comic-walker）を拒み、そこが一番重い。
  Vercel の画像最適化は画像のバイトをこちらの請求に乗せる

### 作品ページの話の一覧

- 作品ページはビルドで作らず、初めて開かれたときにサーバーで取得元から全話を読んで作り、24時間使い回す。
  2026-11-22 に6時間から延ばした。巡回に開かれるたびの作り直しが Vercel の書き込みと転送の費用の上位だった（1日 9 千回前後）
  一覧を HTML に入れるのは検索のため。画面で取ると Google には「読み込んでいます…」しか見えない
- サーバーで5秒以内に取れなかったサイトだけ、画面が `/api/episodes` を呼んで取り直す。答えは CDN に24時間ためる
- 4千件あまりをビルドで作ると全作品ぶん取得元へ頼むことになるので、ビルドの中では読まない。
  サイトマップには台帳（`data/catalog.json`）から作品ページを足している。更新を3回見つけていない作品は
  noindex にしていて、サイトマップにも載せない（下の「検索からの急落と立て直し」）
- 作品の索引のリンクは先読みしない。開いただけで数百件のページ作りが走る
- 作品ページは構造化データ（JSON-LD の `ComicSeries`）を出す。題名・作品ページの住所・サムネイル・最後の更新日だけ。
  作者は台帳に無い
- 台帳に無い作品は 404 ではなく 200 と noindex で返る。`layout.tsx` が全体を `Suspense` で包んでいて、
  404 を出す前に応答が始まっているため
- 取り方は `src/lib/episodes/` に仕組みごとに1ファイルで書き、サイトとの対応は `episodeSourceOf.ts` に置く。
  対応の無いサイトは作品ページに一覧の節が出ない。サイトを足したらここにも足す
- ゼロサムだけは対応が無い。話の住所を画面側の JavaScript が暗号化して作っていて、サーバーでは組めない
- 読みに行くのは台帳に控えた住所だけにする。任意の住所を受け取ると、このサイトが他所を叩く踏み台になる
- 各回は「無料・先読み・有料」の3つで持つ。先読みの印をサイトが出さないところ（comici）は、
  一番新しい無料の回より新しい有料の回を先読みとみなす
- **カードは `/go` を通して、無料で読める最新の回へ送る。** 取得が拾うのはその日に出た回で、
  サイトによってはそれが先読みになり、会員でない人は開いても読めないため
- 設定画面（`/settings`）で「先読みの回を開くサイト」に印を付けたサイトだけは、取得した回へそのまま送る。
  設定は localStorage と `early_site (user_id, site_url)` に置き、同期はお気に入りと同じく `AccountSync` が行う
- `/go` が受け取る住所は、7日ぶんの一覧と台帳に控えたものに限る。任意の住所を受けると誰でも使える転送口になる

### 検索からの急落と立て直し（2026-11-26 に本人と合意。2 の noindex は入れた、1 は履歴と間隔の判定を入れた）

**何が起きたか。** 9/12〜10/7 は作品ページが作品名の検索で8〜10位に出て、多い日で表示1,100・クリック58あった。
10/8 から表示がほぼ0。URL 検査ではトップも上位だった作品ページも「クロール済み - インデックス未登録」で、
最終クロールは7〜9月。手動による対策は「問題は検出されませんでした」。
落ちた日は Google の September 2026 spam update（9/24〜10/8）の完了日と一致する。因果は未確定。
10/7 の `4fed40e3`（一覧を HTML に入れた変更）は、落ちたページがそれ以降クロールされていないので原因の線は薄い。

**見立て。** 作品ページの本文は約315文字で、作品固有の中身は掲載サイト名・最後の更新日・更新曜日・話の題名だけ。
それが約5,400件ある。スパムポリシーの Scraping の例
"Republishing content feeds from other sites without providing some type of unique benefit to the user" に
当てはまると見られた可能性がある。Google の案内は「ポリシーに沿うよう直せば、自動の仕組みが数か月かけて学び直す」で、戻る保証は無い。

**やること（2つとも本人が了承）。**

1. **作品ページに ComicTime だけが持つ観測データを出す。** 他サイトに無いのは、毎日見に行って記録した事実。
   - 過去の更新日の履歴（いつ更新を見つけたか）
   - 隔週・月1・休載の判定
   - 無料・先読み・有料の切り替わりの記録
2. **データが薄い作品は noindex にし、サイトマップからも外す。** 1を入れても薄いままのページを検索に出さない。
   ポリシーにも "If you're hosting such content on your site, exclude it from Search." とある

**手元の事実と未決。**

- **更新の履歴は台帳の `updates` に持つ（2026-11-26 に入れた）。** 更新を見つけた日を古い順に並べたもの。
  8/17〜11/26 のぶんは `npm run catalog:backfill-updates` で git の履歴から書き起こし、それより後は取得のたびに
  `scripts/catalog` が足す。取得の workflow は浅く clone するので、書き起こしは手元でしか走らない。
  push で取得のコミットと台帳がぶつかったら、相手の台帳を採って流し直す。何度流してもよい
- 書き起こしの決まり。8/16 までの日付ファイルは曜日の一覧から作っていて、更新していない作品も入っているので読まない。
  1日のうちに何度も書き直されるので、全版を合わせて読む。最後の版だけだと 10/21 のように取れなかったサイトのぶんが抜ける。
  同じ回の住所を6日以内に見ていた日は数えない。dropRepeats が入った 9/9 より前は、同じ回が毎日載っていたため。
  「新しい住所を見た日」では数えない。マンガUP!は Web で読めるのが冒頭だけで、隔週の更新でも同じ住所が載る
- 照合。最後の更新日は台帳の `lastSeen` と1件を除いて一致した。違う1件（相棒に毒がありまして！）は 9/9 まで同じ回（0317）が載り続けていた作品で、
  `lastSeen` が 9/9 になっていた。2026-11-26 に `lastSeen` を本当の最後の更新の 8/28 に直し、全件一致した。
  いまは書き起こしを流すたびに `firstSeen` と `lastSeen` を履歴の最初と最後に揃える（`scripts/catalog/mergeBackfill.ts`）。
  `lastSeen` は前へ戻ることがあり、サイトマップの lastmod と構造化データの dateModified も動く。一致は `tests/catalogUpdates.test.ts` が見る
- 検索に出す線と間隔の判定は、同じ日を1回と数える（`isIndexed` も `next-sitemap.config.js` も重複を除いた日数）
- **noindex の線は更新3回（`src/lib/isIndexed.ts`）。2026-11-26 に本人から任されて決めた。**
  隔週・月1・休載の判定に更新の間隔が2つ要るため。新作も3回目で自動的に検索に出る。
  入れた時点で 5,354件のうち 3,906件が残り、1,448件が noindex になってサイトマップからも外れる。
  サイトマップの側（`next-sitemap.config.js`）は TypeScript を読めないので同じ数を書いている。食い違えばテストが落ちる
- 無料・先読み・有料の切り替わりも、いまは作品ページを開いたときに取得元から読むだけで記録していない
- 画面にどう見せるかは、2026-11-26 に本人が「すべて良い感じに直して」と任せた。今の作品ページの見た目と部品に合わせて作り、push の前に画面を撮って本人に見せる
- **作品ページに出す形（2026-11-26 に本人と1つずつ決めた）。** 今回は更新の履歴と間隔の判定の2つ。
  切り替わりの記録は、取得の側で記録を始めてから
  - 判定は `src/lib/updateRhythm.ts`。間隔の中央値が5日以下なら週2回以上、6〜8日なら週1、13〜15日なら隔週、
    26〜35日なら月1、それ以外は不定期。最後の更新から中央値の2.5倍を過ぎたら休載中を添える。更新3回未満は判定しない
  - 休載の線を引く中央値は、1日の間隔を除いて取る（2日続けての更新を1回と数える）。木金に更新する作品は間隔が
    1・6・1…と並んで中央値が1日になり、決まった休みの間ずっと休載中と出ていた。間隔が全部1日の作品はそのまま
  - 休載の日数は、ページを作った日ではなく台帳の最新日（全作品の `lastSeen` の最大）から数える。ページは24時間使い回すので、
    今日から数えると取得やデプロイが1日遅れただけで毎日更新の作品が休載中と出る
  - 事実の行の「更新を見た曜日」と「最後の更新」の間に「更新の間隔　隔週」の行を足す。休載中は「隔週・休載中」
  - 「話の一覧」の後、断り書きの前に「更新を見つけた日」の節を置き、月ごとに新しい順で「11月　18日・11日・4日」と並べる。
    升目の暦にしなかったのは、文字なら検索にも本文として読まれ、毎日更新の作品でも1か月が1行に収まるため
  - 断り書きは本人が決めた文言。「更新の曜日・間隔・日付は、ComicTime が毎日見に行って更新を見つけた日から
    作っています。隔週・月1の作品は曜日が1つだけ出ます。更新を見つけた日は、2026年8月17日から記録しています。」
- 入れたら、残すページの URL を Search Console から再クロールしてもらう。効果の判定は数か月単位

### 手元の状態（登録と既読）

- 登録と既読は localStorage にあり、購読は `_components/LocalState` に**1つだけ**置く。
  カードは `useFavorites` / `useOpened` で文脈から値を受け取るだけ
- **一覧に並ぶ部品の中で `useLocalStorage` を新しく呼んではいけない。** 呼ぶと購読が
  カードの枚数だけ増える。usehooks-ts は書き込みのたびに全購読者へイベントを投げ、
  全員が `getItem` して `JSON.parse` する。2026-09-11 まではカードが自前で購読していて、
  登録100件で開いただけで localStorage を19万回読み、385MBぶんを解析していた。
  登録300件で 7.8GB に達し、iOS のホーム画面アプリはそこで落ちていた
- 配る値は `useMemo` で固定する。毎回新しいオブジェクトを返すと、それを依存に置いた
  `useMemo` が一切効かなくなる。お気に入りの画面は7日ぶん1,900作品の組み立てを
  描き直しのたびに繰り返していた
- **トップは今日の一覧とお気に入りの両方を描いて返し、CSS で片方を消す。** どちらを出すかは
  localStorage にしかなく、サーバーは読めない。React で描き分けると組み上がるまで
  違う方が出たままになる（実測1.2秒）。印は `layout.tsx` の小さなスクリプトが
  最初の描画より前に付ける。両方送っても増えるのは 1.8KB で、隠れた側の遅延読み込みは走らない。
  クッキーでサーバーに伝える手もあるが、トップが動的になり応答が 0.03 秒から 0.5 秒に落ちる
- 両方描いているので `h1` は今日の一覧だけが持つ。お気に入り側は `heading={false}` で外す

### ランキング

- 作品カードを押すと Vercel Web Analytics へ `work-open` を1件送る。載せているのは題名だけ
- `/ranking` は1時間ごとに作り直し、そのたびに Analytics の API で直近7日を集計する。
  JSON への書き出しも cron も持たない
- 集計には `VERCEL_ANALYTICS_TOKEN` が要る。無ければページは空で出る（落ちはしない）
- 数字を端末で見るときは `npm run analytics [日数]`。こちらは Vercel CLI のトークンを借りる

### ログインとフォロー

- ログインは任意。ログインしなくても今までどおり動き、お気に入りは端末の localStorage だけで完結する
- 認証は Better Auth を自前で持つ。手段は Google のみ。利用者・セッション・Google との紐付けは
  フォローと同じ Postgres の `public` に入る。受け口は `src/app/api/auth/[...path]/route.ts`
- **受け口をこのサイトに置いているのは、Google の同意画面の表示のため。** Neon Auth に預けると
  リダイレクト先が Neon の接続先になり、同意画面に `neon.tech` と出る
- ログインすると、その端末の登録と既読が初回だけサーバーへ合流し（`_components/AccountSync`）、
  以降は押すたびにサーバーへ書く。手元はその写しになる。削除の記録は持たない
- 別の端末で押したぶんは、開くたびに `AccountSync` がサーバーから読んで取り込む。
  登録は丸ごと置き換え、既読は日付の新しい方を採って足す。既読を置き換えにすると、
  読み出しの往復中に開いた回が消える
- **ログインしたことのある端末だけがセッションを聞きに行く。** 印は localStorage の `signed-in-v1`
  （印を入れる前からの端末は `favorites-synced-v1` で見分ける）。全員が聞きに行くと、
  ログインしていない人でも開くたびに関数が1回動く。セッションは `useAccountSession` で読み、
  `authClient.useSession` を直に呼ぶのは `_components/AccountSession` だけにする
- **セッションを取りに行っている間、`useSession` はログイン中でも `null` を返す。**
  そこで「ログインしていない」と判断すると、合流の控えを消したり、押したぶんをサーバーへ送り損ねたりする
- 表は `db/migrations/` の SQL。`follow_work (user_id, slug, site_url)` と
  `follow_site (user_id, site_url)`。どちらも `neon_auth."user"` へ CASCADE で繋がる
- マイグレーションは `npm run migrate` で当てる。確かめるだけなら `npm run migrate:check`。
  どれを当てたかは `schema_migrations` に残る。デプロイでは当たらないので、使うコードより先に当てる
- **当て忘れたまま配備すると、Vercel のビルドの頭で落ちる。** `vercel.json` の buildCommand が
  `migrate:check` を先に走らせ、当てていない名前を出して止まる。前の版が本番に残る。
  自動で当てる形にしないのは、本番の表を人の確認なしに書き換えないため
- コミットの時点で2つ止める。表や列の削除・型の変更などの危ない書き方（squawk、`.squawk.toml`）と、
  コミット済みのマイグレーションの書き換えや削除（`.lefthook/pre-commit/migrations.sh`）。
  直したいときは新しい番号のファイルを足す
- **0001〜0006 は記録より前に本番へ手で当てたもの。** 表の無い DB では、ランナーは何も当てずに止まる。
  0002 は follow_work を作り直すので、当て直すとフォローが消える。`npm run migrate -- --baseline` が
  0006 までの表を確かめてから 0007 を当て、0001〜0006 を当たったものとして記す
- **フォローはサイトごと。** 題名だけで持つと、同じ作品を載せている別サイトの更新まで一覧に出る。
  読むのは1つのサイトなので、作品の鍵は台帳の slug とサイトの url の組にする
- 画面と `useFavorites` は短いハッシュの見出しのままで、slug への変換は `src/lib/followKeys.ts` に閉じる
- セッションは署名付きクッキーに5分キャッシュされる。DB 側で利用者を変えても画面に届くまで間がある
- アカウントは、ログイン中のメニューの「アカウントを削除」で本人が消せる（Better Auth の deleteUser）。
  フォロー・既読・先読みの設定は CASCADE で一緒に消える。ログインから1日を過ぎたセッションは
  Better Auth が断るので、ログインし直してもらう
- 預かる情報は `/privacy`、利用の決まりは `/terms` に書いてある。集める情報や Analytics に送るものを
  変えたら、両方の本文と最終更新日を直す。入り口は設定の画面の一番下。問い合わせ先は GitHub の Issues（`src/lib/legal.ts`）
- 端末をまたぐ受け渡しは、以前は共有リンクとQRで行っていた。ログインの同期に置き換えて削除した。
  ログインしない人は端末を移せない

### Application Structure

- `src/app/` - Next.js App Router pages and components. Only routes and Next's special files live here
- `src/lib/` - Everything else the pages use: hooks, server actions, catalog readers, auth, DB access, and the episode fetchers (`src/lib/episodes/`). Import it as `@/lib/...`
- `src/app/_components/` - Reusable React components
- PWA manifest for installable web app experience
- `src/app/sw.js/route.ts` serves a service worker that removes itself. It is only there
  to clear out the caching one that used to live at the same path
