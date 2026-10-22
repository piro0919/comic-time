/* eslint-disable import/prefer-default-export -- node は名前で resolve を探す */
import { type ResolveHook } from "node:module";

/**
 * 画面側のモジュールは "@/..." で書かれ、拡張子も省く。tsconfig の設定は node が読まないので、
 * テストを走らせるときだけ src/ へ読み替え、見つからなければ .ts を補って引き直す。
 * "next/server" のように exports を持たないパッケージの中は、.js を補って引き直す。
 * 画面側は JSON を import 属性なしで読むので、ここで type: json を補う。
 */
const find: ResolveHook = async (specifier, context, nextResolve) => {
  const target = specifier.startsWith("@/")
    ? new URL(`../src/${specifier.slice(2)}`, import.meta.url).href
    : specifier;

  try {
    return await nextResolve(target, context);
  } catch (error) {
    if (/\.[a-z]+$/.test(target)) {
      throw error;
    }

    try {
      return await nextResolve(`${target}.ts`, context);
    } catch {
      return nextResolve(`${target}.js`, context);
    }
  }
};

export const resolve: ResolveHook = async (specifier, context, nextResolve) => {
  const isJson = specifier.endsWith(".json");
  const resolved = await find(
    specifier,
    isJson
      ? {
          ...context,
          importAttributes: { ...context.importAttributes, type: "json" },
        }
      : context,
    nextResolve,
  );

  return isJson
    ? {
        ...resolved,
        importAttributes: { ...context.importAttributes, type: "json" },
      }
    : resolved;
};
