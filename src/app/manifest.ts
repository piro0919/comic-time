import type { MetadataRoute } from "next";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  return {
    background_color: "#FFFFFF",
    description:
      "毎日更新されるWeb漫画サイトの更新曜日・時間を一覧でチェックできるサービスです。",
    display: "standalone",
    icons: [
      {
        purpose: "maskable",
        sizes: "192x192",
        src: "/icon-192x192.png",
        type: "image/png",
      },
      {
        sizes: "512x512",
        src: "/icon-512x512.png",
        type: "image/png",
      },
    ],
    id: "/",
    lang: "en",
    name: "ComicTime",
    orientation: "portrait",
    scope: "/",
    short_name: "ComicTime",
    start_url: "/",
    theme_color: "#FFFFFF",
  };
}
