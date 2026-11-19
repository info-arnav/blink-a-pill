import type { Metadata } from 'next';
import { homeJsonLd } from '@/shared/lib/seo';
import { Page } from '@/shared/ui/layout/Page';
import { LinkButton } from '@/shared/ui/action/Button';
import { JsonLd } from '@/shared/ui/system/JsonLd';
import styles from './home.module.css';

export const metadata: Metadata = { alternates: { canonical: '/' } };

export function HomePage() {
  return (
    <Page width="page">
      <JsonLd data={homeJsonLd} />
      <section className={styles.hero}>
        <h1 className={styles.display}>
          One medicine list. <span>Confirmed by the doctor who prescribed it.</span>
        </h1>
        <p className={styles.lead}>Patients use the app. Clinics, doctors and pharmacies open links from it here.</p>
        <div className={styles.ctas}>
          <LinkButton href="/pharmacy" variant="primary" size="large">
            Pharmacy sign in
          </LinkButton>
        </div>
      </section>
    </Page>
  );
}
