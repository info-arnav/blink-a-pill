import { Suspense } from 'react';
import { api } from '@/shared/api/server';
import { Badge, Card, Notice, PageTitle, Shell, Skeleton } from '@/shared/ui/primitives';
import { PatientLine, type PatientSummary } from '@/entities/record';
import { ReceptionForm } from '@/features/reception-check';
import styles from './reception.module.css';

type View = {
  clinic: string;
  doctor: string;
  answered: boolean;
  result: string | null;
  patient: PatientSummary;
  medications: { name: string; dose: string; how_often: string; prescriber: string | null; flagged: boolean }[];
};

async function Content({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const view = await api<View>(`/v1/links/reception/${encodeURIComponent(token)}`);
  if (!view.ok) return <Notice tone="error">{view.message}</Notice>;
  const { data } = view;
  return (
    <>
      <PageTitle
        eyebrow={`${data.clinic} · reception`}
        title="Does this medicine list match your records?"
        lead={`A patient of ${data.doctor} asked for this check. This is a clerical check only. You are not asked about doses or safety.`}
      />
      <Card>
        <PatientLine patient={data.patient} />
        <ul className={styles.list}>
          {data.medications.map((m) => (
            <li key={m.name} className={styles.item}>
              <div>
                <strong>{m.name}</strong>
                <div className={styles.meta}>
                  {m.dose} · {m.how_often} · {m.prescriber ? `by ${m.prescriber}` : 'prescriber not recorded'}
                </div>
              </div>
              {m.flagged ? <Badge tone="sev2">Check this one</Badge> : null}
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Your answer">
        {data.answered ? (
          <Notice tone="ok">This check was answered: {data.result === 'matches' ? 'the list matches.' : 'the list does not match.'}</Notice>
        ) : (
          <ReceptionForm token={token} doctor={data.doctor} />
        )}
      </Card>
    </>
  );
}

export function ReceptionPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Shell note="Clinic check">
      <Suspense fallback={<Skeleton />}>
        <Content params={params} />
      </Suspense>
    </Shell>
  );
}
