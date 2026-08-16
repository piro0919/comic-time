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
- **PWA Support** - Configured with Serwist for service worker and PWA functionality
- **Theming** - next-themes for light/dark mode support
- **Internationalization Ready** - Uses next-intl for translations (manifest.ts references)

### Key Configuration Files

- `next.config.ts` - Next.js configuration with Serwist PWA setup, image optimization disabled
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
- Conventional commit message format

### サイトの追加と取得

- サイトの台帳は `src/data/sites.json`。名前・更新曜日・更新時刻・URL だけを持つ
- 取得の仕方は `scripts/scrape/sources/` に1サイト1ファイルで書き、`sources/index.ts` に URL とともに登録する
- 各ソースは「その日更新された作品」だけを返す。取れなければ例外を投げ、そのサイトはその日が空になる
- `data/works/<日付>.json` に7日ぶんを保存し、古い日は消す

### Application Structure

- `src/app/` - Next.js App Router pages and components
- `src/app/_components/` - Reusable React components
- `src/env.ts` - Environment variable configuration
- Service worker configured for offline functionality
- PWA manifest for installable web app experience
