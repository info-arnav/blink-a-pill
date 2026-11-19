import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import styles from './Callout.module.css';

type Tone = 'info' | 'warning' | 'danger' | 'success';

const ICON = { info: Info, warning: TriangleAlert, danger: CircleAlert, success: CircleCheck };

export function Callout({ tone, title, children }: { tone: Tone; title?: ReactNode; children?: ReactNode }) {
  const Icon = ICON[tone];
  return (
    <div className={`${styles.callout} ${styles[tone]}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon size={16} aria-hidden />
      <div className={styles.body}>
        {title ? <span className={styles.title}>{title}</span> : null}
        {children ? <div className={styles.detail}>{children}</div> : null}
      </div>
    </div>
  );
}
