"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import styles from "./style.module.css";

/** globals.css の --background と揃える。ブラウザの上端に出る色 */
const themeColors = { dark: "#202124", light: "#FFFFFF" };
/** 自分が作った meta だけを見分けるための印 */
const ownedAttribute = "data-theme-color";

/**
 * 明暗の切り替え。最初は端末の設定に従い、押した時点から手動の選択になる。
 * 描画前は端末の設定が読めないので、組み上がるまでは何も出さない。
 */
export default function ThemeToggle(): null | React.JSX.Element {
  const { resolvedTheme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (resolvedTheme === undefined) {
      return;
    }

    // 自分で作った1つだけを使い回す。React が描いた要素には触らない
    const existing = document.head.querySelector(`meta[${ownedAttribute}]`);
    const meta = existing ?? document.createElement("meta");

    meta.setAttribute(ownedAttribute, "");
    meta.setAttribute("name", "theme-color");
    meta.setAttribute(
      "content",
      resolvedTheme === "dark" ? themeColors.dark : themeColors.light,
    );

    if (existing === null) {
      document.head.append(meta);
    }
  }, [resolvedTheme]);

  if (!isMounted) {
    return null;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => {
        setTheme(isDark ? "light" : "dark");
      }}
      aria-label={isDark ? "明るい配色にする" : "暗い配色にする"}
      className={styles.button}
      type="button"
    >
      {isDark ? <MdLightMode size={18} /> : <MdDarkMode size={18} />}
    </button>
  );
}
