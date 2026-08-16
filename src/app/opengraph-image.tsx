/* eslint-disable filenames/match-exported, filenames/match-regex */
import { ImageResponse } from "next/og";

export const alt = "ComicTime";

export const size = { height: 630, width: 1200 };

export const contentType = "image/png";

const TITLE = "ComicTime";
const DESCRIPTION = "Web漫画サイトの更新曜日と時間を一覧でチェックできます。";

export default function Image(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0b0b0f",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "center",
          padding: "0 90px",
          width: "100%",
        }}
      >
        <div
          style={{
            background: "linear-gradient(90deg, #fbbf24 0%, #d97706 100%)",
            borderRadius: 999,
            display: "flex",
            height: 10,
            marginBottom: 44,
            width: 120,
          }}
        />
        <div
          style={{
            display: "flex",
            fontSize: 84,
            fontWeight: 700,
            letterSpacing: -1,
          }}
        >
          {TITLE}
        </div>
        <div
          style={{
            color: "#a1a1aa",
            display: "flex",
            fontSize: 32,
            lineHeight: 1.4,
            marginTop: 28,
          }}
        >
          {DESCRIPTION}
        </div>
        <div
          style={{
            color: "#71717a",
            display: "flex",
            fontSize: 26,
            marginTop: 56,
          }}
        >
          kkweb.io
        </div>
      </div>
    ),
    size,
  );
}
