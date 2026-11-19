import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { api } from '@/shared/api/server';
import { Badge, Card, Notice, PageTitle, Shell, Skeleton, severityTone } from '@/shared/ui/primitives';
import { formatDateTime, genderLabel } from '@/shared/lib/format';
import { pharmacySession } from '@/shared/session';
import { PinForm } from '@/features/card-access';
import { FlagActions, MedicineCheck } from '@/features/pharmacy-check';
import styles from './pharmacy.module.css';

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
  if (!view.ok) return <Notice tone="error">{view.message}</Notice>;
  const v = view.data;
  if (v.needs_pin) {
    return (
      <>
        <PageTitle eyebrow={session.name} title="First visit: enter the patient’s PIN" />
        <Card>
          <PinForm token={token} forPharmacy />
        </Card>
      </>
    );
  }
  return (
    <>
      <PageTitle
        eyebrow={`${session.name} · checkpoint`}
        title={v.nothing_open ? 'Nothing open' : `${v.open.length} open ${v.open.length === 1 ? 'concern' : 'concerns'}`}
        lead={`${v.patient.full_name}, ${v.patient.age} · ${genderLabel(v.patient.gender)} · ${v.medication_count} medicines on their list`}
      />
      {v.nothing_open ? <Notice tone="ok">There is nothing waiting for a doctor. Carry on as usual.</Notice> : null}
      {v.open.map((f) => (
        <Card key={f.id}>
          <div className={styles.head}>
            <strong>{f.title}</strong>
            <Badge tone={severityTone(f.severity)}>{f.status_label}</Badge>
          </div>
          <div className={styles.muted}>Medicines: {f.medicines.join(', ')}</div>
          <div className={styles.say}>
            <span className={styles.sayLabel}>One line to say</span>
            {f.say}
          </div>
          <FlagActions token={token} flagId={f.id} />
        </Card>
      ))}
      {v.answered.map((f) => (
        <Card key={f.id} eyebrow="Doctor’s answer">
          <strong>{f.title}</strong>
          <div className={styles.muted}>Medicines: {f.medicines.join(', ')}</div>
          <Notice tone="ok">{f.answer}</Notice>
          <div className={styles.muted}>
            {f.by}
            {f.registration ? `, Reg. ${f.registration}` : ''} · {formatDateTime(f.at)}
          </div>
        </Card>
      ))}
      <Card title="Not sure about one medicine?">
        <MedicineCheck token={token} />
      </Card>
      <Notice tone="info">{v.note} Billing never waits on this page.</Notice>
    </>
  );
}

export function PharmacyCardPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Shell note="Pharmacy checkpoint">
      <Suspense fallback={<Skeleton />}>
        <Content params={params} />
      </Suspense>
    </Shell>
  );
}
