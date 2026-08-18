/* eslint-disable filenames/match-exported, filenames/match-regex */
import fs from "fs";
import { ImageResponse } from "next/og";
import path from "path";

export const alt = "ComicTime";

export const size = { height: 630, width: 1200 };

export const contentType = "image/png";

const TITLE = "ComicTime";
const DESCRIPTION = "Web漫画サイトの更新曜日と時間を一覧でチェックできます。";
const DOMAIN = "comictime.kkweb.io";
/** アイコンと同じ地色。globals.css ではなくアイコン側に合わせる */
const BACKGROUND = "#87CBFC";
const INK = "#16181D";
/**
 * 右半分にアイコンの絵をそのまま置き、左に題字を入れる。
 * 絵は読み込み時に埋め込む。書き出し先が外へ取りに行かなくて済む。
 */
const character = fs
  .readFileSync(path.join(process.cwd(), "public", "og-character.png"))
  .toString("base64");

export default function Image(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          background: BACKGROUND,
          display: "flex",
          height: "100%",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 56px",
            width: 570,
          }}
        >
          <div
            style={{
              color: INK,
              display: "flex",
              fontSize: 82,
              fontWeight: 700,
              letterSpacing: -2,
            }}
          >
            {TITLE}
          </div>
          <div
            style={{
              color: INK,
              display: "flex",
              fontSize: 27,
              lineHeight: 1.5,
              marginTop: 24,
              opacity: 0.78,
            }}
          >
            {DESCRIPTION}
          </div>
          <div
            style={{
              color: INK,
              display: "flex",
              fontSize: 23,
              marginTop: 40,
              opacity: 0.55,
            }}
          >
            {DOMAIN}
          </div>
        </div>
        <img
          alt=""
          height={630}
          src={`data:image/png;base64,${character}`}
          width={630}
        />
      </div>
    ),
    size,
  );
}
