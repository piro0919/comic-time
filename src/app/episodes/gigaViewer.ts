import { type Episode } from "./episode";
import fetchText from "./fetchText";

/**
 * GigaViewer（少年ジャンプ＋、コミックDAYS、となりのヤングジャンプなど10サイト）の話の一覧。
 *
 * 話のページに作品の番号（data-aggregate-id）が載っている。それを一覧の API に渡すと、
 * 新しい順に50件ずつ JSON で返ってくる。空の配列が返ったら終わり。
 *
 * 読めるかどうかはログインしていない人から見た値で入っている。
 * can_read が true なら無料、is_sakiyomi が true なら先読み、どちらでもなければ有料の回。
 * 公開の終わった回（status.type が private）も並ぶが、読めないので外す。
 */
type Product = {
  display_open_at: null | string;
  is_sakiyomi?: boolean;
  purchase_info?: { can_read?: boolean };
  status: null | { type?: string };
  title: string;
  viewer_uri: string;
};

const aggregatePattern = /data-aggregate-id="(\d+)"/;

/** 「2026-09-13T03:00:00Z」を日本の日付にする */
function japanDate(iso: null | string): null | string {
  if (iso === null) {
    return null;
  }

  const time = Date.parse(iso);

  return Number.isNaN(time)
    ? null
    : new Date(time + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

function toEpisode(product: Product): Episode {
  return {
    access:
      product.purchase_info?.can_read === true
        ? "free"
        : product.is_sakiyomi === true
          ? "early"
          : "paid",
    date: japanDate(product.display_open_at),
    title: product.title,
    url: product.viewer_uri,
  };
}

export default async function gigaViewer(url: string): Promise<Episode[]> {
  const { origin } = new URL(url);
  const aggregateId = aggregatePattern.exec(await fetchText(url))?.[1];

  if (aggregateId === undefined) {
    throw new Error(`GigaViewer: 作品の番号が読めない ${url}`);
  }

  const episodes: Episode[] = [];

  // 公開の終わった回も送りの位置には数える。外した数で進めると同じ回を読み直す
  for (let offset = 0; ;) {
    const params = new URLSearchParams({
      aggregate_id: aggregateId,
      offset: String(offset),
      sort_order: "desc",
      type: "episode",
    });
    const products = JSON.parse(
      await fetchText(
        `${origin}/api/viewer/pagination_readable_products?${params.toString()}`,
      ),
    ) as Product[];

    if (products.length === 0) {
      return episodes;
    }

    offset += products.length;
    episodes.push(
      ...products
        .filter((product) => product.status?.type !== "private")
        .map(toEpisode),
    );
  }
}
