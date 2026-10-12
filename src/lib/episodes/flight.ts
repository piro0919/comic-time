/**
 * Next.js で作られたサイトがページに埋め込んでいる React の受け渡し
 * （self.__next_f.push の中身）を、1本の文字列につなぐ。
 * 画面の文字より崩れにくいので、題名や読める条件はこちらから拾う。
 */
export function flightOf(html: string): string {
  return [
    ...html.matchAll(/self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g),
  ]
    .map((matched) => JSON.parse(`"${matched[1] ?? ""}"`) as string)
    .join("");
}

/** start から始まる JSON の配列か塊を、閉じ括弧まで切り出す。文字列の中の括弧は数えない */
export function sliceJson(text: string, start: number): string {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (escaped) {
      escaped = false;
    } else if (inString) {
      escaped = char === "\\";
      inString = char !== "\"";
    } else if (char === "\"") {
      inString = true;
    } else if (char === "[" || char === "{") {
      depth += 1;
    } else if ((char === "]" || char === "}") && --depth === 0) {
      return text.slice(start, index + 1);
    }
  }

  throw new Error("埋め込まれた JSON が途中で切れている");
}
