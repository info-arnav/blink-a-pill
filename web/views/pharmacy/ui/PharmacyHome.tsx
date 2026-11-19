import { Suspense } from 'react';
import { Button, Card, PageTitle, Shell, Skeleton } from '@/shared/ui/primitives';
import { pharmacySession } from '@/shared/session';
import { PharmacyLogin, signOutPharmacy } from '@/features/pharmacy-auth';
import { OpenCardForm } from './OpenCardForm';
import styles from './pharmacy.module.css';

async function Content({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const session = await pharmacySession();
  const { next } = await searchParams;
  if (!session) {
    return (
      <>
        <PageTitle eyebrow="For pharmacies" title="Sign in to check patient cards" lead="Register once with your shop name and drug licence number. Every check you record carries your licence number and the time." />
        <Card>
          <PharmacyLogin next={next} />
        </Card>
      </>
    );
  }
  return (
    <>
      <PageTitle eyebrow={`${session.name} · DL ${session.licence}`} title="Scan the patient’s card" />
      <Card>
        <ol className={styles.steps}>
          <li>Open your phone camera and point it at the QR code on the patient’s app.</li>
          <li>Tap the link that appears. It opens here, signed in as your shop.</li>
          <li>The first time, type the patient’s 6 digit PIN. After that your shop is remembered.</li>
        </ol>
      </Card>
      <Card title="Or paste the card link">
        <OpenCardForm />
      </Card>
      <form action={signOutPharmacy}>
        <Button type="submit" variant="secondary" block>
          Sign out
        </Button>
      </form>
    </>
  );
}

export function PharmacyHome({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return (
    <Shell note="Pharmacy">
      <Suspense fallback={<Skeleton />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </Shell>
  );
}
