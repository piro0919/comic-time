/**
 * 登録を置いている localStorage の鍵。
 *
 * 使うのは useFavorites と、layout が最初の描画より前に走らせる小さなスクリプト。
 * あちらは文字列として埋め込むので、"use client" の付いたファイルからは読めない。
 * だから鍵だけをここに置く。
 */
const favoritesKey = "favorites-v3";

export default favoritesKey;
