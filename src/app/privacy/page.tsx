import { type Metadata } from "next";
import Link from "next/link";
import Legal from "../_components/Legal";
import { contactUrl, operator } from "../legal";
import pageMetadata from "../pageMetadata";

export const metadata: Metadata = pageMetadata({
  description: "ComicTime での利用者の情報の扱いです。",
  path: "/privacy",
  title: "プライバシーポリシー",
});

export default function Page(): React.JSX.Element {
  return (
    <Legal title="プライバシーポリシー" updated="2026年10月12日">
      <p>
        ComicTime（以下「本サイト」）は、{operator}
        が運営しています。本サイトでの利用者の情報の扱いを、次のとおり定めます。
      </p>
      <h2>ブラウザの中に保存する情報</h2>
      <p>
        お気に入りに入れた作品とサイト（作品の題名を含む）、開いた回とその日付、先読みの回を開くサイトの設定、画面の明るさの設定、この端末でログインしたことがあるかの印は、お使いのブラウザの中（localStorage）に保存します。ログインしていなければ本サイトには送られず、ブラウザのデータを消すと消えます。
      </p>
      <h2>ログインしたときに預かる情報</h2>
      <p>
        ログインは任意で、Google アカウントで行います。ログインすると、Google
        から受け取るお名前・メールアドレス・プロフィール画像と、お気に入りに入れた作品とサイト、開いた回とその日付、先読みの回を開くサイトの設定を、本サイトのデータベースに保存します。これらは、ほかの端末でも同じお気に入りと既読を使えるようにするためと、ログインの状態を保つためにだけ使い、法令に基づく場合を除いて第三者に渡しません。
      </p>
      <p>
        ログインの状態を保つため、ログインした方のブラウザに Cookie
        を保存します。
      </p>
      <p>
        アカウントと預かった情報は、ログイン中に右上の顔写真から開くメニューの「アカウントを削除」で、いつでも消せます。消すと、本サイトのデータベースからお名前・メールアドレス・プロフィール画像・お気に入り・既読・設定がすべて消え、元に戻せません。ブラウザの中に保存した情報は残ります。
      </p>
      <h2>アクセスの集計</h2>
      <p>
        どのページがどれくらい見られているかを知るため、Vercel Web Analytics
        を使っています。閲覧したページ、参照元、国、端末やブラウザの種類を、個人を特定しない形で集計します。あわせて、作品のカードを押したときにその作品の題名を、お気に入りに入れたときにそれが作品かサイトかを、お気に入りのある端末で本サイトを開いたときにお気に入りの件数を送り、人気の作品の順位づけと、本サイトの改善に使います。Cookie
        は使いません。
      </p>
      <p>
        ページの表示の速さを測るため、Vercel Speed Insights
        を使っています。表示にかかった時間などを、個人を特定しない形で集計します。
      </p>
      <p>
        詳しくは
        <a
          href="https://vercel.com/docs/analytics/privacy-policy"
          rel="noopener noreferrer"
          target="_blank"
        >
          Vercel のプライバシーについての説明
        </a>
        をご覧ください。
      </p>
      <h2>お問い合わせ</h2>
      <p>
        このポリシーについてのお問い合わせは、
        <a href={contactUrl} rel="noopener noreferrer" target="_blank">
          GitHub の Issues
        </a>
        で受け付けています。書き込んだ内容は誰でも読めるため、個人の情報は書かないでください。
      </p>
      <h2>このポリシーの変更</h2>
      <p>
        このポリシーは、必要に応じて変更することがあります。変更したときは、このページでお知らせします。本サイトの利用については
        <Link href="/terms" prefetch={false}>
          利用規約
        </Link>
        をご覧ください。
      </p>
    </Legal>
  );
}
