/**
 * 同時に走らせる数を絞って順に流す。
 *
 * 最新話の住所は作品ページにしか無いサイトがあり、更新された作品のぶんだけ
 * ページを取りに行くことになる。まとめて投げると、その日更新の多いサイトには
 * 20本近くが同時に飛ぶ。相手の負担を平らにするために少しずつ流す。
 */
const defaultLimit = 3;

export default async function mapLimited<T, U>(
  items: T[],
  run: (item: T) => Promise<U>,
  limit = defaultLimit,
): Promise<U[]> {
  const results: U[] = new Array<U>(items.length);

  let next = 0;

  const worker = async (): Promise<void> => {
    for (let index = next; index < items.length; index = next) {
      next += 1;
      // eslint-disable-next-line security/detect-object-injection -- 添字は自前の連番
      results[index] = await run(items[index] as T);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );

  return results;
}
