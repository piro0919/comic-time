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
- 📱 PWA-ready for offline browsing

## 🛠 Tech Stack

- Next.js + React + TypeScript
- @serwist/next (PWA)
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

## 📄 License

MIT
