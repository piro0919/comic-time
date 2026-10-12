import { type Metadata } from "next";

type PageMetadataOptions = {
  description: string;
  /** サイト内の絶対パス。canonical と og:url に使う */
  path: string;
  /** 省略するとルートの既定値がそのまま出る。トップページ用 */
  title?: string;
};

/**
 * ページ単位の metadata を組み立てる。
 *
 * Next は title と description を openGraph へ自動では流さない。
 * 明示しないと、下層ページを共有したときのカードが全部トップと
 * 同じ見出しになる。canonical と og:url も併せてここで埋める。
 */
export default function pageMetadata({
  description,
  path,
  title,
}: PageMetadataOptions): Metadata {
  return {
    alternates: { canonical: path },
    description,
    openGraph: {
      description,
      url: path,
      ...(title === undefined ? {} : { title }),
    },
    twitter: { description, ...(title === undefined ? {} : { title }) },
    ...(title === undefined ? {} : { title }),
  };
}
