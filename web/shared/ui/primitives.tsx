import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';
import Link from 'next/link';
import { Pill } from 'lucide-react';
import styles from './ui.module.css';

export function Shell({ note, children }: { note?: string; children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <span className={styles.mark} aria-hidden>
            <Pill size={18} />
          </span>
          blink-a-pill
        </Link>
        {note ? <span className={styles.headerNote}>{note}</span> : null}
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        blink-a-pill only advises. Every concern is decided by a named professional. It never stops or changes a medicine.
      </footer>
    </div>
  );
}

export function Card({ title, eyebrow, children }: { title?: ReactNode; eyebrow?: string; children: ReactNode }) {
  return (
    <section className={styles.card}>
      {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
      {title ? <h2 className={styles.cardTitle}>{title}</h2> : null}
      {children}
    </section>
  );
}

export function PageTitle({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: ReactNode }) {
  return (
    <div className={styles.stack}>
      {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
      <h1 className={styles.pageTitle}>{title}</h1>
      {lead ? <p className={styles.lead}>{lead}</p> : null}
    </div>
  );
}

type Variant = 'primary' | 'secondary' | 'danger';

export function Button({
  variant = 'primary',
  block,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; block?: boolean }) {
  return <button className={[styles.button, styles[variant], block ? styles.block : '', className ?? ''].join(' ')} {...rest} />;
}

export function Badge({ tone, children }: { tone: 'sev1' | 'sev2' | 'sev3' | 'ok' | 'neutral'; children: ReactNode }) {
  const cls = tone === 'ok' ? styles.okBadge : styles[tone];
  return <span className={`${styles.badge} ${cls}`}>{children}</span>;
}

export function Field({
  label,
  hint,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input className={styles.input} {...input} />
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </label>
  );
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'error' | 'ok' | 'warn'; children: ReactNode }) {
  const cls = { info: styles.noticeInfo, error: styles.noticeError, ok: styles.noticeOk, warn: styles.noticeWarn }[tone];
  return (
    <div className={`${styles.notice} ${cls}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

export function Choice({
  name,
  value,
  title,
  text,
  defaultChecked,
  required,
}: {
  name: string;
  value: string;
  title: string;
  text?: string;
  defaultChecked?: boolean;
  required?: boolean;
}) {
  return (
    <label className={styles.choice}>
      <input type="radio" name={name} value={value} defaultChecked={defaultChecked} required={required} />
      <span className={styles.choiceBody}>
        <span className={styles.choiceTitle}>{title}</span>
        {text ? <span className={styles.choiceText}>{text}</span> : null}
      </span>
    </label>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}

export function Stack({ children }: { children: ReactNode }) {
  return <div className={styles.stack}>{children}</div>;
}

export function Skeleton() {
  return <div className={styles.skeleton} aria-busy="true" aria-label="Loading" />;
}

export function severityTone(severity: number): 'sev1' | 'sev2' | 'sev3' {
  return severity === 1 ? 'sev1' : severity === 2 ? 'sev2' : 'sev3';
}
