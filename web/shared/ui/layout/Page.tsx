import type { ReactNode } from 'react';
import Link from 'next/link';
import { Mark } from '@/shared/ui/brand/Mark';
import styles from './Page.module.css';

export function Page({ context, actions, width = 'reading', children }: { context?: string; actions?: ReactNode; width?: 'reading' | 'page'; children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner} data-width={width}>
          <Link href="/" className={styles.brand} aria-label="link-a-pill home">
            <Mark />
            <span>link-a-pill</span>
          </Link>
          {context ? <span className={styles.context}>{context}</span> : null}
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </div>
      </header>
      <main className={styles.main} data-width={width}>
        {children}
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerInner} data-width={width}>
          <span>Advises only. A named professional decides.</span>
        </div>
      </footer>
    </div>
  );
}

export function PageTitle({ overline, title, description, children }: { overline?: string; title: string; description?: ReactNode; children?: ReactNode }) {
  return (
    <div className={styles.title}>
      {overline ? <span className={styles.overline}>{overline}</span> : null}
      <h1>{title}</h1>
      {description ? <p className={styles.description}>{description}</p> : null}
      {children}
    </div>
  );
}

export function Section({ title, description, action, children }: { title: string; description?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <div className={styles.sectionText}>
          <h2>{title}</h2>
          {description ? <p className={styles.sectionDescription}>{description}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function Panel({ children }: { children: ReactNode }) {
  return <div className={styles.panel}>{children}</div>;
}

export function Stack({ gap = 3, children }: { gap?: 2 | 3 | 4 | 6; children: ReactNode }) {
  return (
    <div className={styles.stack} data-gap={gap}>
      {children}
    </div>
  );
}

export function Inline({ children }: { children: ReactNode }) {
  return <div className={styles.inline}>{children}</div>;
}
