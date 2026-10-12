# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run type-check` - Run TypeScript type checking without emitting files

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

- DB（Neon）はシンガポール（ap-southeast-1）、関数の既定も sin1。関数と DB を同じ場所に置く。
  2026-10-13 に us-east-1 の DB から移した。前の DB（neon-cyan-envelope）は消さずに残している
- 日本の取得元を読む `/works/[slug]`・`/api/episodes`・`/go` だけは `preferredRegion = "hnd1"` で東京に置く。
  DB をほとんど使わず、取得元への往復の方が多い。取得元を読む経路を足したら、ここにも足す

### サイトの追加と取得

- サイトの台帳は `src/data/sites.json`。名前・更新曜日・更新時刻・URL だけを持つ
- 取得の仕方は `scripts/scrape/sources/` に1サイト1ファイルで書き、`sources/index.ts` に URL とともに登録する
- 各ソースは「その日更新された作品」だけを返す。取れなければ例外を投げ、そのサイトはその日が空になる
- `data/works/<日付>.json` に7日ぶんを保存し、古い日は消す
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

- 作品ページはビルドで作らず、初めて開かれたときにサーバーで取得元から全話を読んで作り、6時間使い回す。
  一覧を HTML に入れるのは検索のため。画面で取ると Google には「読み込んでいます…」しか見えない
- サーバーで5秒以内に取れなかったサイトだけ、画面が `/api/episodes` を呼んで取り直す。答えは CDN に6時間ためる
- 4千件あまりをビルドで作ると全作品ぶん取得元へ頼むことになるので、ビルドの中では読まない。
  サイトマップには台帳（`data/catalog.json`）から作品ページを足している
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
