import type { ReactNode } from 'react';
import styles from './Badge.module.css';

export type BadgeTone = 'neutral' | 'accent' | 'danger' | 'warning' | 'success';

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}

export function severityTone(severity: number): BadgeTone {
  return severity === 1 ? 'danger' : severity === 2 ? 'warning' : 'neutral';
}
