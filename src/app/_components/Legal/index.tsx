import styles from "./style.module.css";

export type LegalProps = {
  children: React.ReactNode;
  title: string;
  /** 最終更新日。本文を変えたら書き換える */
  updated: string;
};

/** 規約やポリシーの本文。読みやすい幅に絞り、見出しと段落の間を空ける */
export default function Legal({
  children,
  title,
  updated,
}: LegalProps): React.JSX.Element {
  return (
    <article className={styles.container}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.updated}>最終更新日: {updated}</p>
      <div className={styles.body}>{children}</div>
    </article>
  );
}
