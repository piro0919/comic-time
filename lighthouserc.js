/**
 * 手元で走らせる速度と品質の計測。`npm run lighthouse` で、
 * 本番ビルドを立ち上げて主要な4画面を測る。
 *
 * 結果は .lighthouseci に書き出すだけで、どこへも送らない。
 * 外へ上げると誰でも見られる場所に置かれるため、その形は選ばない。
 */
const port = 3200;

module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      startServerCommand: `npx next start -p ${port}`,
      url: [
        `http://localhost:${port}/day/wed`,
        `http://localhost:${port}/sites`,
        `http://localhost:${port}/sites/shonenjumpplus`,
        `http://localhost:${port}/search`,
      ],
    },
    upload: {
      outputDir: "./.lighthouseci",
      target: "filesystem",
    },
  },
};
