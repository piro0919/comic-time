"use client";
import { useEffect } from "react";
import { writeFavoritesCookie } from "@/app/favoritesCookie";
import useFavorites from "@/app/useFavorites";

/**
 * 登録の有無をクッキーへ写す。画面には何も出さない。
 *
 * 置き場所を Layout の直下に1つだけにしているのは、useFavorites を呼ぶ部品が
 * カードの数だけあるため。カード側に持たせると、一覧を開くたびに400回書くことになる。
 */
export default function FavoriteFlag(): null {
  const { workUrls } = useFavorites();
  const has = workUrls.length > 0;

  useEffect(() => {
    writeFavoritesCookie(has);
  }, [has]);

  return null;
}
