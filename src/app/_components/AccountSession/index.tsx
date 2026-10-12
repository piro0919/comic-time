"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import authClient, { hasSignInHint, setSignInHint } from "@/app/authClient";
import {
  AccountSessionContext,
  pendingSession,
  type AccountSession as Session,
} from "@/app/useAccountSession";

export type AccountSessionProps = {
  children: React.ReactNode;
};

const signedOut: Session = { data: null, isPending: false };
const subscribe = (): (() => void) => (): void => undefined;
const getServerSnapshot = (): null => null;

/**
 * セッションを聞きに行く係。ログインしたことのある端末でだけ置く。
 * authClient.useSession は置かれた時点でサーバーへ聞きに行くので、ここ以外では呼ばない
 */
function Watcher({ onChange }: { onChange: (session: Session) => void }): null {
  const { data, error, isPending } = authClient.useSession();

  useEffect(() => {
    onChange({ data, isPending });

    // セッションが切れていた。次からは聞きに行かない。
    // 往復の失敗でも data は null になる。そこで消すと、ログイン中の人が黙ってログアウトして見える
    if (!isPending && data === null && error === null) {
      setSignInHint(false);
    }
  }, [data, error, isPending, onChange]);

  return null;
}

/**
 * セッションを画面ぜんぶに配る。
 *
 * 聞きに行く係は子と並べて置き、子を包まない。印の有無で包む部品を差し替えると、
 * 組み上がった直後に画面ぜんぶが作り直される。
 */
export default function AccountSession({
  children,
}: AccountSessionProps): React.JSX.Element {
  // サーバーでは印を読めない。null のあいだは「確かめている」として扱う
  const hinted = useSyncExternalStore(
    subscribe,
    hasSignInHint,
    getServerSnapshot,
  );
  const [session, setSession] = useState<Session>(pendingSession);
  const value = hinted === null ? pendingSession : hinted ? session : signedOut;

  return (
    <AccountSessionContext.Provider value={value}>
      {hinted === true ? <Watcher onChange={setSession} /> : null}
      {children}
    </AccountSessionContext.Provider>
  );
}
