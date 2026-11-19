import { Suspense } from 'react';
import { api } from '@/shared/api/server';
import { Card, Notice, PageTitle, Shell, Skeleton } from '@/shared/ui/primitives';
import { ConcernCard, LabGrid, MedicationList, PatientLine, Timeline, type Flag, type PatientRecord } from '@/entities/record';
import { DecisionForm } from '@/features/prescriber-decision';
import styles from './prescriber.module.css';

type View = {
  doctor: { name: string | null; speciality: string | null; needs_registration: boolean };
  answered: boolean;
  concern: Flag & { medications: { id: string; name: string; status: string }[] };
  record: PatientRecord;
};

async function Content({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const view = await api<View>(`/v1/links/prescriber/${encodeURIComponent(token)}`);
  if (!view.ok) return <Notice tone="error">{view.message}</Notice>;
  const { doctor, concern, record, answered } = view.data;
  return (
    <>
      <PageTitle
        eyebrow={`For ${doctor.name ?? 'the prescriber'}`}
        title="One patient needs your decision"
        lead="Please confirm whether this combination is intended. Nothing changes for the patient unless you say so."
      />
      <Card>
        <PatientLine patient={record.patient} />
        {record.conditions.length ? <div className={styles.muted}>Conditions: {record.conditions.map((c) => c.name).join(', ')}</div> : null}
      </Card>
      <ConcernCard flag={concern} audience="clinician" medicationNames={concern.medications.map((m) => m.name)} />
      <Card title={answered || concern.decision ? 'Decision recorded' : 'Your decision'}>
        {answered || concern.decision ? (
          <Notice tone="ok">{concern.decision?.text ?? 'This has already been answered.'}</Notice>
        ) : (
          <DecisionForm
            token={token}
            doctorName={doctor.name}
            needsRegistration={doctor.needs_registration}
            medications={concern.medications.filter((m) => m.status === 'active').map((m) => ({ id: m.id, name: m.name }))}
          />
        )}
      </Card>
      <Card title="Full current list" eyebrow="Who confirmed each entry">
        <MedicationList medications={record.medications} flagged={concern.medication_ids} />
      </Card>
      <Card title="Latest values">
        <LabGrid labs={record.labs} />
      </Card>
      {concern.events?.length ? (
        <Card title="What has happened so far">
          <Timeline events={concern.events} />
        </Card>
      ) : null}
      {record.flags.length ? (
        <Card title="Other notes on this patient">
          {record.flags.map((f) => (
            <div key={f.id} className={styles.other}>
              <strong>{f.title}</strong>
              <span className={styles.muted}>{f.decision?.text ?? f.status_label}</span>
            </div>
          ))}
        </Card>
      ) : null}
    </>
  );
}

export function PrescriberPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Shell note="Prescriber decision">
      <Suspense fallback={<Skeleton />}>
        <Content params={params} />
      </Suspense>
    </Shell>
  );
}
