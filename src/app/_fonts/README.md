# OGP画像で使う書体

`opengraph-image.tsx` から読む。外へ取りに行かずに済むよう、リポジトリに置いてある。

| ファイル | 用途 | 出どころ |
| --- | --- | --- |
| `Righteous-Regular.ttf` | 題字。画面のロゴと同じ書体 | [google/fonts](https://github.com/google/fonts/tree/main/ofl/righteous) |
| `NotoSans-Latin.ttf` | 本文のラテン文字 | [google/fonts](https://github.com/google/fonts/tree/main/ofl/notosans) の可変フォントを、太さ400に固定して U+0020〜U+007E だけに絞ったもの |

日本語は next/og が持っている書体に任せている。ここには置いていない。

どちらも SIL Open Font License 1.1。`OFL-Righteous.txt` と `OFL-NotoSans.txt` を参照。
