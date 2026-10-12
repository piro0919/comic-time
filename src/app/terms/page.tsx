import { type Metadata } from "next";
import Link from "next/link";
import { contactUrl, operator } from "@/lib/legal";
import pageMetadata from "@/lib/pageMetadata";
import Legal from "../_components/Legal";

export const metadata: Metadata = pageMetadata({
  description: "ComicTime の利用規約です。",
  path: "/terms",
  title: "利用規約",
});

export default function Page(): React.JSX.Element {
  return (
    <Legal title="利用規約" updated="2026年10月12日">
      <p>
        この規約は、{operator} が運営する
        ComicTime（以下「本サイト」）の利用について定めます。本サイトを利用した時点で、この規約に同意したものとみなします。
      </p>
      <h2>本サイトについて</h2>
      <p>
        本サイトは、各社のマンガのサイトで更新された作品を曜日ごとに一覧にし、それぞれのサイトへ案内する、個人の非公式サイトです。掲載しているサイトの運営会社、出版社、作者とは関係ありません。
      </p>
      <p>
        本サイトはマンガの本文を保存・配信していません。作品は、それぞれのサイトで読んでいただくものです。
      </p>
      <h2>権利について</h2>
      <p>
        作品の題名・作者名・サムネイル・各サイトの名前と画像の著作権その他の権利は、それぞれの権利者に帰属します。本サイトは、各サイトが公開している情報をもとに一覧を作っています。サムネイルは、表示を軽くするために縮めた写しを本サイトに置いています。
      </p>
      <h2>掲載の取り下げ</h2>
      <p>
        掲載している作品やサイトについて、権利者の方から削除のご依頼をいただいた場合は、確認のうえ速やかに掲載を取り下げます。
        <a href={contactUrl} rel="noopener noreferrer" target="_blank">
          GitHub の Issues
        </a>
        からご連絡ください。
      </p>
      <h2>禁止事項</h2>
      <ul>
        <li>本サイトの運営を妨げる行為</li>
        <li>本サイトに大量のアクセスを自動で送る行為</li>
        <li>法令や公序良俗に反する行為</li>
      </ul>
      <h2>免責</h2>
      <p>
        本サイトの情報の正確さ・完全さは保証しません。掲載しているサイトの都合により、更新の一覧に載らない作品や、リンク先で読めなくなる作品があります。
      </p>
      <p>
        本サイトの利用によって生じた損害について、{operator}
        は責任を負いません。本サイトは、予告なく内容を変更し、または公開を終了することがあります。
      </p>
      <h2>この規約の変更</h2>
      <p>
        この規約は、必要に応じて変更することがあります。変更したときは、このページでお知らせします。利用者の情報の扱いは
        <Link href="/privacy" prefetch={false}>
          プライバシーポリシー
        </Link>
        をご覧ください。
      </p>
    </Legal>
  );
}
