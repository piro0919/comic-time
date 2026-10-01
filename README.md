# ComicTime

> Update schedule tracker for web manga titles.

[🔗 Live Site](https://comictime.kkweb.io/)

## ✨ Features

- 📅 One page per weekday (`/day/mon` … `/day/irregular`), grouped by site
- 📖 Per-title update days, scraped daily from each site
- ⭐ Follow a title, or a whole site, and see today's updates first
- 🔍 Search across every title (`/search`)
- 👁 Titles opened today are dimmed, so a second visit shows what is left
- 👆 Touch gestures for mobile
- 📱 PWA-ready, installable to the home screen

## 🛠 Tech Stack

- Next.js + React + TypeScript
- @use-gesture/react
- @react-spring/web (animations)

## 🚀 Development

```bash
npm install
npm run dev
```

## 🗺 Routes

`/` renders today's weekday in JST and revalidates hourly. Each weekday is also
a statically generated page under `/day/<weekday>`, so a visitor downloads one
day instead of the whole week. All nine pages are precached by the service
worker, keeping every weekday available offline.

## 🕸 Data

Titles live in `data/works/<weekday>.json`, one file per weekday, refreshed by a
daily GitHub Actions run. Only the sites that update on that weekday are
scraped; any site untouched for a week is refreshed regardless.

```bash
npm run scrape       # today's sites
npm run scrape:all   # every supported site
npm run scrape:ogp   # card images for sites without a title list
```

`src/data/sites.json` is the site registry. `mode` picks how a site is read:

| mode     | meaning                                                        |
| -------- | -------------------------------------------------------------- |
| `weekly` | title list is split by weekday headings                        |
| `flat`   | title list has no weekdays; the site's update days are applied |
| `site`   | no title list yet, so the site itself is shown as one card     |

Sites whose page structure needs custom handling declare an `adapter`; the
implementations live in `scripts/scrape/adapters/`.

## 🗄 Database

Login, follows, opened episodes and early-access sites live in Postgres (Neon).
Schema changes are the SQL files in `db/migrations/`, applied in number order by
`scripts/migrate`, which records each one in the `schema_migrations` table and
holds an advisory lock so two runs never apply the same file twice. Each file
runs in its own transaction.

```bash
npm run migrate:check   # list migrations the database does not have yet
npm run migrate         # apply them, one transaction per file
```

Both read `DATABASE_URL` from `.env.local`, which points at production. To try a
migration first, point `DATABASE_URL` at a Neon branch. Nothing runs migrations
automatically; deploying does not apply them.

**Baseline.** `0001`–`0006` were applied to production by hand before
`schema_migrations` existed. On a database without that table the runner stops
instead of applying them, because `0002` recreates `follow_work` and would wipe
every follow. Run `npm run migrate -- --baseline` once: it checks that the
tables from `0001`–`0006` exist, then applies `0007_schema_migrations`, which
records `0001`–`0006` as applied without running them. Building a database from
empty is not supported — `0001` expects Neon Auth's `neon_auth."user"`.

Never edit a migration once it has been applied; it is recorded by file name
and will not run again. Add a new file instead.

The variables the server needs are listed in `.env.example`.

## 📄 License

MIT
