const fs = require("fs");
const path = require("path");

/**
 * 更新の日時は、そのページに出している中身から作る。
 * 全ページに同じビルド時刻を入れると、毎回すべてが更新されたことになり、
 * Google が「次にいつ見に来るか」を決める材料として使えなくなる。
 * 中身から日時を出せないページには、そもそも入れない。
 */
const worksDir = path.join(process.cwd(), "data", "works");
const weekdays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

/** data/works にある日付。古い順 */
function dateKeys() {
  try {
    return fs
      .readdirSync(worksDir)
      .filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name))
      .map((name) => name.slice(0, 10))
      .sort();
  } catch {
    return [];
  }
}

function weekdayOf(date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    weekday: "short",
  })
    .format(new Date(`${date}T00:00:00+09:00`))
    .toLowerCase();
}

/** その日のうちで最後に作品を見つけた時刻。日本時間で読む */
function foundAtOf(date, works) {
  const last = works
    .map((work) => work.foundAt)
    .sort()
    .at(-1);

  return last === undefined
    ? undefined
    : new Date(`${date}T${last}:00+09:00`).toISOString();
}

/**
 * 住所からサイトを引くための対応表。
 * 住所の作り方は src/app/siteCatalog.ts と揃える
 */
function siteUrlBySlug() {
  const sites = readJson(
    path.join(process.cwd(), "src", "data", "sites.json"),
    [],
  );

  return new Map(
    sites.map((site) => {
      const { hostname, pathname } = new URL(site.url);
      const host = hostname
        .replace(/^www\./, "")
        .split(".")
        .slice(0, -1)
        .join("-");
      const tail = pathname.split("/").filter(Boolean).at(-1);

      return [tail === undefined ? host : `${host}-${tail}`, site.url];
    }),
  );
}

function lastmodOf(loc) {
  const dates = dateKeys();

  if (dates.length === 0) {
    return undefined;
  }

  // トップは直近7日ぶんをまとめて出している
  if (loc === "/") {
    const latest = dates.at(-1);

    return foundAtOf(
      latest,
      readJson(path.join(worksDir, `${latest}.json`), []),
    );
  }

  const day = /^\/day\/([a-z]+)$/.exec(loc)?.[1];

  if (day !== undefined && weekdays.includes(day)) {
    const date = dates.filter((key) => weekdayOf(key) === day).at(-1);

    return date === undefined
      ? undefined
      : foundAtOf(date, readJson(path.join(worksDir, `${date}.json`), []));
  }

  const slug = /^\/sites\/(.+)$/.exec(loc)?.[1];

  if (slug !== undefined) {
    const siteUrl = siteUrlBySlug().get(slug);

    if (siteUrl === undefined) {
      return undefined;
    }

    const stamps = dates
      .map((date) => {
        const works = readJson(path.join(worksDir, `${date}.json`), []).filter(
          (work) => work.siteUrl === siteUrl,
        );

        return foundAtOf(date, works);
      })
      .filter((stamp) => stamp !== undefined);

    return stamps.sort().at(-1);
  }

  // 中身が日々変わらない画面。日時は入れない
  return undefined;
}

/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl: "https://comictime.kkweb.io/",
  generateRobotsTxt: true,
  // 圏外のときだけ出る画面と、ページではないもの。検索結果に載せない
  exclude: [
    "/~offline",
    "/import",
    "/apple-icon.png",
    "/manifest.webmanifest",
    "/opengraph-image",
  ],
  transform: async (conf, loc) => ({
    loc,
    changefreq: conf.changefreq,
    priority: conf.priority,
    lastmod: lastmodOf(loc),
    alternateRefs: conf.alternateRefs ?? [],
  }),
};

module.exports = config;
