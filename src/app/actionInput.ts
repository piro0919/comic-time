/**
 * Server Action が受け取る値を確かめる。
 *
 * Server Action は画面からしか呼ばれないように見えるが、実際は誰でも好きな値で叩ける
 * 公開の受け口になる。型の注釈は実行時には何も守らないので、形・長さ・件数をここで見る。
 * 形が違えば例外を投げる。画面が正しく呼んでいる限り、ここで落ちることはない。
 *
 * 台帳に無いサイトを弾くのは呼ぶ側の仕事にする。合流では古い控えが混じるので、
 * 投げずに落としたいことがあるため。
 */

/** 配列の上限。台帳の作品とサイトの組は 2026-10 時点で 4,661。その倍あまりを取る */
export const maxWorks = 10000;

/** 台帳のサイトは 2026-10 時点で30。増えても百には届かない */
export const maxSites = 100;

/** 既読は30日ぶん持つ。1日に出る回は300前後なので、その倍を取る */
export const maxOpens = 20000;

/** 作品の見出しは36進で14文字ほど */
export const maxKeyLength = 32;

export const maxUrlLength = 2048;

export class InvalidInput extends Error {
  constructor(message: string) {
    super(`invalid input: ${message}`);
    this.name = "InvalidInput";
  }
}

/** 空でない、上限以下の長さの文字列 */
export function stringOf(value: unknown, maxLength: number): string {
  if (typeof value !== "string" || value === "" || value.length > maxLength) {
    throw new InvalidInput("expected a non-empty string within the limit");
  }

  return value;
}

/** 文字列の配列。重複は1つにまとめる */
export function stringsOf(
  value: unknown,
  maxItems: number,
  maxLength: number,
): string[] {
  if (!Array.isArray(value) || value.length > maxItems) {
    throw new InvalidInput("expected an array within the limit");
  }

  return [...new Set(value.map((item) => stringOf(item, maxLength)))];
}

export function booleanOf(value: unknown): boolean {
  if (typeof value !== "boolean") {
    throw new InvalidInput("expected a boolean");
  }

  return value;
}

/** http か https の住所 */
export function httpUrlOf(value: unknown): string {
  const url = stringOf(value, maxUrlLength);

  if (!/^https?:\/\//.test(url)) {
    throw new InvalidInput("expected an http(s) url");
  }

  return url;
}

/** 「2026-10-01」の形の日付 */
export function dateOf(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new InvalidInput("expected a YYYY-MM-DD date");
  }

  return value;
}

/** 合流で受け取る登録。{ sites, works } の形だけを通す */
export function followsOf(value: unknown): {
  sites: string[];
  works: string[];
} {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new InvalidInput("expected { sites, works }");
  }

  const { sites, works } = value as Record<string, unknown>;

  return {
    sites: stringsOf(sites, maxSites, maxUrlLength),
    works: stringsOf(works, maxWorks, maxKeyLength),
  };
}

/**
 * 合流で受け取る既読。住所から開いた日への対応。
 * 形の崩れた項目は投げずに落とす。8月末まで使っていた古い形の控えが混じっているため
 */
export function opensOf(value: unknown): [string, string][] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new InvalidInput("expected a record of url to date");
  }

  const entries = Object.entries(value as Record<string, unknown>);

  if (entries.length > maxOpens) {
    throw new InvalidInput("too many entries");
  }

  return entries.flatMap(([url, date]) => {
    try {
      return [[httpUrlOf(url), dateOf(date)] as [string, string]];
    } catch {
      return [];
    }
  });
}
