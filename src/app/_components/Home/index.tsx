"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { dayHref } from "@/app/days";
import { storedWorkUrls } from "@/app/useFavorites";
import { type Weekday } from "@/types/work";
import Favorites, { type FavoritesProps } from "../Favorites";

export type HomeProps = {
  crossSites: FavoritesProps["crossSites"];
  days: FavoritesProps["days"];
  today: Weekday;
};

/**
 * 追いかける作品を登録している人には、その更新をまとめて見せる。
 * 何も登録していない人には今日の一覧を見せたいので、そちらへ送る。
 * 登録はブラウザにあるため、判断は描画後になる。
 */
export default function Home({
  crossSites,
  days,
  today,
}: HomeProps): React.JSX.Element {
  const router = useRouter();
  const [registered, setRegistered] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const has = storedWorkUrls().length > 0;

    setRegistered(has);

    if (!has) {
      router.replace(dayHref(today));
    }
  }, [router, today]);

  if (registered !== true) {
    // 判断は描画後になる。それまでも見出しだけは置く
    return <h1 className="visually-hidden">この一週間の更新</h1>;
  }

  return <Favorites crossSites={crossSites} days={days} />;
}
