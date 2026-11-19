import { Suspense } from 'react';
import type { Metadata } from 'next';
import { pharmacySession } from '@/shared/session';
import { Page, PageTitle, Section } from '@/shared/ui/layout/Page';
import { Button } from '@/shared/ui/action/Button';
import { Mono } from '@/shared/ui/data/Row';
import { Skeleton } from '@/shared/ui/status/Skeleton';
import { PharmacyLogin, signOutPharmacy } from '@/features/pharmacy-auth';
import { OpenCardForm } from './OpenCardForm';
import styles from './pharmacy.module.css';

export const metadata: Metadata = {
  title: 'For pharmacies',
  description: 'Scan a patient’s link-a-pill card at the counter to see open medicine concerns and the doctor’s answer. Register once with your drug licence number.',
  alternates: { canonical: '/pharmacy' },
};

async function Content({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const session = await pharmacySession();
  const { next } = await searchParams;
  if (!session) {
    return (
      <>
        <PageTitle
          overline="For pharmacies"
          title="Pharmacy sign in"
          description="Sign in with the shop’s mobile number."
        />
        <PharmacyLogin next={next} />
      </>
    );
  }
  return (
    <>
      <PageTitle overline={session.name} title="Scan the patient’s card">
        <p className={styles.licence}>
          Drug licence <Mono>{session.licence}</Mono>
        </p>
      </PageTitle>
      <Section title="How it works">
        <ol className={styles.steps}>
          <li>
            <span>Point your phone camera at the QR code in the patient’s app.</span>
          </li>
          <li>
            <span>Open the link. It opens here, signed in as your shop.</span>
          </li>
          <li>
            <span>The first time, type the patient’s six digit PIN. After that your shop is remembered until the patient removes it.</span>
          </li>
        </ol>
      </Section>
      <Section title="Paste a card link instead">
        <OpenCardForm />
      </Section>
      <form action={signOutPharmacy}>
        <Button type="submit" variant="quiet">
          Sign out
        </Button>
      </form>
    </>
  );
}

export function PharmacyHome({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return (
    <Page context="Pharmacy">
      <Suspense fallback={<Skeleton />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}
