import { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { api } from '@/shared/api/server';
import { NOINDEX } from '@/shared/lib/seo';
import { formatDateTime, genderLabel } from '@/shared/lib/format';
import { pharmacySession } from '@/shared/session';
import { Page, PageTitle, Section, Stack } from '@/shared/ui/layout/Page';
import { Mono } from '@/shared/ui/data/Row';
import { Badge, severityTone } from '@/shared/ui/status/Badge';
import { Callout } from '@/shared/ui/status/Callout';
import { Skeleton } from '@/shared/ui/status/Skeleton';
import { PinForm } from '@/features/card-access';
import { FlagActions, MedicineCheck } from '@/features/pharmacy-check';
import styles from './pharmacy.module.css';

export const metadata: Metadata = { title: 'Pharmacy checkpoint', ...NOINDEX };

type Checkpoint =
  | { needs_pin: true }
  | {
      needs_pin: false;
      patient: { full_name: string; age: number; gender: string };
      nothing_open: boolean;
      open: { id: string; severity: number; title: string; medicines: string[]; status_label: string; say: string }[];
      answered: { id: string; title: string; medicines: string[]; answer: string; by: string; registration: string | null; at: string }[];
      medication_count: number;
      note: string;
    };

async function Content({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await pharmacySession();
  if (!session) redirect(`/pharmacy?next=/pharmacy/card/${token}`);
  const view = await api<Checkpoint>(`/v1/pharmacy/cards/${encodeURIComponent(token)}`, { token: session.token });
  if (!view.ok) return <Callout tone="danger" title={view.message} />;
  const v = view.data;
  if (v.needs_pin) {
    return (
      <>
        <PageTitle overline={session.name} title="First visit: enter the patient’s PIN" description="Only needed once for your shop." />
        <PinForm token={token} forPharmacy />
      </>
    );
  }
  return (
    <>
      <PageTitle
        overline={`${session.name} · checkpoint`}
        title={v.nothing_open ? 'Nothing open' : `${v.open.length} open ${v.open.length === 1 ? 'concern' : 'concerns'}`}
        description={`${v.patient.full_name}, ${v.patient.age}, ${genderLabel(v.patient.gender).toLowerCase()} · ${v.medication_count} medicines on their list`}
      />
      {v.nothing_open ? <Callout tone="success" title="Nothing is waiting for a doctor. Carry on as usual." /> : null}
      {v.open.length ? (
        <Section title="Open concerns">
          <Stack gap={3}>
            {v.open.map((f) => (
              <article key={f.id} className={styles.item}>
                <header className={styles.itemHead}>
                  <h3>{f.title}</h3>
                  <Badge tone={severityTone(f.severity)}>{f.status_label}</Badge>
                </header>
                <p className={styles.meds}>{f.medicines.join(' and ')}</p>
                <blockquote className={styles.say}>
                  <span>Say to the patient</span>
                  {f.say}
                </blockquote>
                <FlagActions token={token} flagId={f.id} />
              </article>
            ))}
          </Stack>
        </Section>
      ) : null}
      {v.answered.length ? (
        <Section title="Doctor’s answers">
          <Stack gap={3}>
            {v.answered.map((f) => (
              <article key={f.id} className={styles.item}>
                <header className={styles.itemHead}>
                  <h3>{f.title}</h3>
                  <Badge tone="success">Answered</Badge>
                </header>
                <p className={styles.meds}>{f.medicines.join(' and ')}</p>
                <p className={styles.answer}>{f.answer}</p>
                <p className={styles.meds}>
                  {f.by}
                  {f.registration ? (
                    <>
                      {' · Reg. '}
                      <Mono>{f.registration}</Mono>
                    </>
                  ) : null}
                  {' · '}
                  {formatDateTime(f.at)}
                </p>
                <FlagActions token={token} flagId={f.id} answered />
              </article>
            ))}
          </Stack>
        </Section>
      ) : null}
      <Section title="Check one medicine">
        <MedicineCheck token={token} />
      </Section>
      <p className={styles.meds}>A limited check, not an all-clear.</p>
    </>
  );
}

export function PharmacyCardPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Page context="Pharmacy checkpoint">
      <Suspense fallback={<Skeleton lines={6} />}>
        <Content params={params} />
      </Suspense>
    </Page>
  );
}
