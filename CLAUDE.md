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

## Architecture Overview

### Project Structure

- **Next.js 15 App Router** - Uses the modern App Router with React 19
- **TypeScript** - Strict TypeScript configuration with explicit return types required
- **PWA** - Installable via the web app manifest. No service worker: pages are not cached
- **Theming** - next-themes for light/dark mode support
- **Internationalization Ready** - Uses next-intl for translations (manifest.ts references)

### Key Configuration Files

- `next.config.ts` - Next.js configuration with image optimization disabled
- `tsconfig.json` - TypeScript config with strict mode, path aliases (`@/*` → `./src/*`)
- `eslint.config.mjs` - Comprehensive ESLint setup with multiple plugins for code quality
- `lefthook.yml` - Git hooks for pre-commit linting, formatting, and type checking

### Code Quality Standards

- **ESLint Rules**: Enforces consistent-type-definitions as "type", inline type imports, explicit function return types
- **Import Restrictions**: Must use `@/i18n/navigation` instead of Next.js navigation imports
- **File Naming**: Supports camel, kebab, and pascal case for exports
- **Code Style**: Double quotes, semicolons required, alphabetical sorting of imports/exports
- **CSS Modules**: Used for styling with global scope restrictions

### Environment and Dependencies

- **Environment Variables**: Configured with T3 env for type-safe environment handling
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
- Conventional commit message format (**written in English**, subject and body)

### サイトの追加と取得

- サイトの台帳は `src/data/sites.json`。名前・更新曜日・更新時刻・URL だけを持つ
- 取得の仕方は `scripts/scrape/sources/` に1サイト1ファイルで書き、`sources/index.ts` に URL とともに登録する
- 各ソースは「その日更新された作品」だけを返す。取れなければ例外を投げ、そのサイトはその日が空になる
- `data/works/<日付>.json` に7日ぶんを保存し、古い日は消す
- サイトを足したら `npm run scrape:site-icons` も走らせる。複数サイトに載る作品の印に使うファビコンを `public/site-icons/` に集める

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
- ログインすると、その端末の登録が初回だけサーバーへ合流し（`_components/FollowSync`）、
  以降は押すたびにサーバーへ書く。手元はその写しになる。削除の記録は持たない
- 表は `db/migrations/` の SQL。`follow_work (user_id, slug, site_url)` と
  `follow_site (user_id, site_url)`。どちらも `neon_auth."user"` へ CASCADE で繋がる
- **フォローはサイトごと。** 題名だけで持つと、同じ作品を載せている別サイトの更新まで一覧に出る。
  読むのは1つのサイトなので、作品の鍵は台帳の slug とサイトの url の組にする
- 画面と `useFavorites` は短いハッシュの見出しのままで、slug への変換は `src/app/followKeys.ts` に閉じる
- セッションは署名付きクッキーに5分キャッシュされる。DB 側で利用者を変えても画面に届くまで間がある
- 端末をまたぐ受け渡しは、以前は共有リンクとQRで行っていた。ログインの同期に置き換えて削除した。
  ログインしない人は端末を移せない

### Application Structure

- `src/app/` - Next.js App Router pages and components
- `src/app/_components/` - Reusable React components
- PWA manifest for installable web app experience
- `src/app/sw.js/route.ts` serves a service worker that removes itself. It is only there
  to clear out the caching one that used to live at the same path
