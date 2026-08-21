import Link from "next/link";
import { MdQrCodeScanner } from "react-icons/md";
import styles from "./style.module.css";

/**
 * 別の端末から渡されたお気に入りを受け取る画面への入口。
 * 渡す側と違い、登録が無い人ほど使うので、いつでも押せるようにしておく。
 */
export default function ReceiveButton(): React.JSX.Element {
  return (
    <Link
      aria-label="お気に入りを別の端末から受け取る"
      className={styles.link}
      href="/import"
      title="お気に入りを別の端末から受け取る"
    >
      <MdQrCodeScanner size={18} />
    </Link>
  );
}
