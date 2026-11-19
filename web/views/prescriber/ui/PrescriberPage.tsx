import { Suspense } from 'react';
import type { Metadata } from 'next';
import { api } from '@/shared/api/server';
import { NOINDEX } from '@/shared/lib/seo';
import { Page, PageTitle, Section } from '@/shared/ui/layout/Page';
import { Row, RowList } from '@/shared/ui/data/Row';
import { Callout } from '@/shared/ui/status/Callout';
import { Skeleton } from '@/shared/ui/status/Skeleton';
import { Concern, LabFacts, MedicationRows, PatientFacts, Timeline, type Flag, type PatientRecord } from '@/entities/record';
import { DecisionForm } from '@/features/prescriber-decision';

export const metadata: Metadata = { title: 'Decision needed', ...NOINDEX };

type ConcernMed = { id: string; name: string; status: string; is_new: boolean; prescriber: { id: string; name: string } | null };

type View = {
  doctor: { id: string; name: string | null; speciality: string | null; needs_registration: boolean };
  answered: boolean;
  concern: Omit<Flag, 'medications'> & { medications: ConcernMed[] };
  record: PatientRecord;
};

async function Content({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const view = await api<View>(`/v1/links/prescriber/${encodeURIComponent(token)}`);
  if (!view.ok) return <Callout tone="danger" title={view.message} />;
  const { doctor, concern, record, answered } = view.data;
  const decided = answered || Boolean(concern.decision);
  const mine = concern.medications.filter((m) => m.prescriber?.id === doctor.id);
  const others = concern.medications.filter((m) => m.prescriber?.id !== doctor.id);
  const context = mine.length
    ? `You prescribed ${mine.map((m) => m.name).join(' and ')}${others.length ? `. It overlaps with ${others.map((m) => `${m.name} (${m.prescriber?.name ?? 'prescriber not recorded'})`).join(' and ')}` : ''}.`
    : `None of these medicines are recorded as prescribed by you: ${concern.medications.map((m) => `${m.name} (${m.prescriber?.name ?? 'prescriber not recorded'})`).join(', ')}.`;
  return (
    <>
      <PageTitle
        overline={doctor.name ? `For ${doctor.name}` : 'For the prescriber'}
        title={decided ? 'Decision recorded' : 'One patient needs your decision'}
        description="Is this combination intended?"
      />
      <PatientFacts patient={record.patient} conditions={record.conditions} />
      <Callout tone={mine.length ? 'info' : 'warning'} title={context} />
      <Concern flag={concern} medicationNames={concern.medications.map((m) => m.name)} />
      {!decided ? (
        <Section title="Your decision">
          <DecisionForm
            token={token}
            doctorName={doctor.name}
            needsRegistration={doctor.needs_registration}
            medications={concern.medications.filter((m) => m.status === 'active').map((m) => ({ id: m.id, name: m.name }))}
          />
        </Section>
      ) : null}
      <Section title="Current medicines">
        <MedicationRows medications={record.medications} flagged={concern.medication_ids} />
      </Section>
      <Section title="Latest results">
        <LabFacts labs={record.labs} />
      </Section>
      {concern.events?.length ? (
        <Section title="Audit trail">
          <Timeline events={concern.events} />
        </Section>
      ) : null}
      {record.flags.length ? (
        <Section title="Other concerns">
          <RowList>
            {record.flags.map((f) => (
              <Row key={f.id} title={f.title} meta={f.decision?.text ?? f.status_label} />
            ))}
          </RowList>
        </Section>
      ) : null}
    </>
  );
}

export function PrescriberPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Page context="Prescriber decision">
      <Suspense fallback={<Skeleton lines={8} />}>
        <Content params={params} />
      </Suspense>
    </Page>
  );
}
