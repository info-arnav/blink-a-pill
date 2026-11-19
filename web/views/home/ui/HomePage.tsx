import Link from 'next/link';
import { Card, PageTitle, Shell } from '@/shared/ui/primitives';
import styles from './home.module.css';

const STEPS = [
  { who: 'Patient or caregiver', what: 'Photographs each prescription. The app builds one list, reminds them of each dose, and checks for the same ingredient twice, interactions and kidney or liver limits.' },
  { who: 'Clinic reception', what: 'Gets one WhatsApp link: does this list match your records? A yes or no, nothing clinical.' },
  { who: 'Prescriber', what: 'Gets one link, enters their registration number once, and answers Intended or Not intended. The patient hears back in the doctor’s name.' },
  { who: 'Pharmacist', what: 'Scans the patient’s card at the counter, sees only open concerns and the doctor’s answer, and records what they told the patient.' },
];

export function HomePage() {
  return (
    <Shell>
      <PageTitle
        eyebrow="One patient, one medication record"
        title="Every medicine on one list, checked, and confirmed by a named professional."
        lead="blink-a-pill is for people living with more than one long-term condition and the doctors, clinics and pharmacies who look after them. It flags concerns. It never stops or changes a medicine."
      />
      <div className={styles.grid}>
        {STEPS.map((s) => (
          <Card key={s.who} title={s.who}>
            <p className={styles.text}>{s.what}</p>
          </Card>
        ))}
      </div>
      <Card title="Are you a pharmacy?">
        <p className={styles.text}>Sign in with your shop phone number to check patient cards.</p>
        <Link className={styles.link} href="/pharmacy">
          Pharmacy sign in
        </Link>
      </Card>
      <Card title="Got a link from a patient or clinic?">
        <p className={styles.text}>Open it on your phone. Links expire, are logged, and never contain medicine names in the message itself.</p>
      </Card>
    </Shell>
  );
}
