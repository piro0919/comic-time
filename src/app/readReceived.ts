/**
 * 読み取った文字列をどう扱うか決める。
 * QR にもリンクにも、短縮された住所と長いままの住所の両方が入りうる。
 */
export type Received =
  | {
      /** そのまま断片として読み解けるもの */
      encoded: string;
      kind: "encoded";
    }
  | {
      /** 短縮された住所。開いてみないと中身が分からない */
      kind: "url";
      url: string;
    }
  | {
      kind: "unreadable";
    };

/** 取り込みの画面の住所。断片はこの後ろに付く */
const importPath = "/import#";

export default function readReceived(text: string): Received {
  const trimmed = text.trim();

  if (trimmed === "") {
    return { kind: "unreadable" };
  }

  const at = trimmed.indexOf(importPath);

  if (at !== -1) {
    const encoded = trimmed.slice(at + importPath.length);

    return encoded === ""
      ? { kind: "unreadable" }
      : { encoded, kind: "encoded" };
  }

  if (/^https?:\/\//.test(trimmed)) {
    return { kind: "url", url: trimmed };
  }

  // 住所ではない文字列は、断片だけを渡されたものとして扱う
  return { encoded: trimmed, kind: "encoded" };
}
