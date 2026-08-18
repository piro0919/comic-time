"use client";
import { MdInstallMobile } from "react-icons/md";
import usePwa from "use-pwa";
import styles from "./style.module.css";

/**
 * インストールを促せるブラウザでだけ出す。
 * iOS は手順の案内が別にあるため、ここには出ない。
 */
export default function InstallButton(): null | React.JSX.Element {
  const { canInstallprompt, enabledPwa, isPwa, showInstallPrompt } = usePwa();

  if (!enabledPwa || !canInstallprompt || isPwa) {
    return null;
  }

  return (
    <button className={styles.button} onClick={showInstallPrompt} type="button">
      <MdInstallMobile className={styles.icon} />
      <span className={styles.label}>インストール</span>
    </button>
  );
}
