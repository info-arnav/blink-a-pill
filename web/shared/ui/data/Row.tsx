import type { ReactNode } from 'react';
import styles from './Row.module.css';

export function RowList({ children }: { children: ReactNode }) {
  return <ul className={styles.list}>{children}</ul>;
}

export function Row({
  title,
  meta,
  detail,
  status,
  action,
  marked,
}: {
  title: ReactNode;
  meta?: ReactNode;
  detail?: ReactNode;
  status?: ReactNode;
  action?: ReactNode;
  marked?: boolean;
}) {
  return (
    <li className={styles.row} data-marked={marked || undefined}>
      <div className={styles.identity}>
        <span className={styles.title}>{title}</span>
        {meta ? <span className={styles.meta}>{meta}</span> : null}
        {detail ? <span className={styles.detail}>{detail}</span> : null}
      </div>
      {status || action ? (
        <div className={styles.trailing}>
          {status}
          {action}
        </div>
      ) : null}
    </li>
  );
}

export function Mono({ children }: { children: ReactNode }) {
  return <span className={styles.mono}>{children}</span>;
}
