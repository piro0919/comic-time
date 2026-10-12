/** 取得元の HTML を正規表現で読むときに、文字参照を元の文字へ戻す */
const namedEntities = new Map([
  ["amp", "&"],
  ["apos", "'"],
  ["gt", ">"],
  ["lt", "<"],
  ["quot", "\""],
]);

export default function decodeEntities(text: string): string {
  return text.replaceAll(
    /&(#x[0-9a-f]+|#\d+|[a-z]+);/giu,
    (whole: string, entity: unknown) => {
      const name = String(entity).toLowerCase();

      if (name.startsWith("#x")) {
        return String.fromCodePoint(Number.parseInt(name.slice(2), 16));
      }

      if (name.startsWith("#")) {
        return String.fromCodePoint(Number(name.slice(1)));
      }

      return namedEntities.get(name) ?? whole;
    },
  );
}
