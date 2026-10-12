export type JsonLdProps = {
  data: Record<string, unknown>;
};

/**
 * 検索エンジン向けの構造化データ（JSON-LD）。画面には何も出ない。
 * 題名に < が入っても script を抜け出さないよう、Next.js の手引きどおり置き換える
 */
export default function JsonLd({ data }: JsonLdProps): React.JSX.Element {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
      type="application/ld+json"
    />
  );
}
