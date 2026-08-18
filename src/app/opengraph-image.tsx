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
/** 題字は白抜き。地色が明るいので、影で浮かせる */
const TITLE_COLOR = "#FFFFFF";
const TITLE_SHADOW = "0 4px 14px rgba(12, 42, 70, 0.45)";
/** 本文のラテン文字。日本語は next/og が持っている書体に任せる */
const BODY_FONT = "NotoSansLatin";
/**
 * 右半分にアイコンの絵をそのまま置き、左に題字を入れる。
 * 絵は読み込み時に埋め込む。書き出し先が外へ取りに行かなくて済む。
 */
const character = fs
  .readFileSync(path.join(process.cwd(), "public", "og-character.png"))
  .toString("base64");
/** 画面の題字と同じ書体。外へ取りに行かないよう、リポジトリに置いてある */
const fontsDir = path.join(process.cwd(), "src", "app", "_fonts");
const righteous = fs.readFileSync(path.join(fontsDir, "Righteous-Regular.ttf"));
const notoSansLatin = fs.readFileSync(
  path.join(fontsDir, "NotoSans-Latin.ttf"),
);

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
              color: TITLE_COLOR,
              display: "flex",
              fontFamily: "Righteous",
              fontSize: 82,
              letterSpacing: -1,
              textShadow: TITLE_SHADOW,
            }}
          >
            {TITLE}
          </div>
          <div
            style={{
              color: INK,
              display: "flex",
              fontFamily: BODY_FONT,
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
              fontFamily: BODY_FONT,
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
    {
      ...size,
      fonts: [
        {
          data: righteous,
          name: "Righteous",
          style: "normal",
          weight: 400,
        },
        {
          data: notoSansLatin,
          name: BODY_FONT,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}
