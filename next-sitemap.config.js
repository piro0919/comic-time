/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl: "https://comictime.kkweb.io/",
  generateRobotsTxt: true,
  // 圏外のときだけ出る画面。検索結果に載せない
  exclude: ["/~offline", "/import"],
};

module.exports = config;
