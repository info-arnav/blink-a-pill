import { Suspense } from 'react';
import type { Metadata } from 'next';
import { api } from '@/shared/api/server';
import { NOINDEX } from '@/shared/lib/seo';
import { Page, PageTitle, Section } from '@/shared/ui/layout/Page';
import { Row, RowList } from '@/shared/ui/data/Row';
import { Badge } from '@/shared/ui/status/Badge';
import { Callout } from '@/shared/ui/status/Callout';
import { Skeleton } from '@/shared/ui/status/Skeleton';
import { PatientFacts, type PatientSummary } from '@/entities/record';
import { ReceptionForm } from '@/features/reception-check';

export const metadata: Metadata = { title: 'Clinic list check', ...NOINDEX };

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
  if (!view.ok) return <Callout tone="danger" title={view.message} />;
  const { data } = view;
  return (
    <>
      <PageTitle
        overline={`${data.clinic} · reception`}
        title="Does this medicine list match your records?"
        description={`For ${data.doctor}. A clerical check only.`}
      />
      <PatientFacts patient={data.patient} />
      <Section title="Patient’s list">
        <RowList>
          {data.medications.map((m) => (
            <Row
              key={m.name}
              marked={m.flagged}
              title={m.name}
              meta={`${m.dose} · ${m.how_often}`}
              detail={m.prescriber ? `Prescribed by ${m.prescriber}` : 'Prescriber not recorded'}
              status={m.flagged ? <Badge tone="warning">Check this</Badge> : undefined}
            />
          ))}
        </RowList>
      </Section>
      <Section title="Your answer">
        {data.answered ? (
          <Callout tone="success" title={data.result === 'matches' ? 'Answered: the list matches your records.' : 'Answered: the list does not match your records.'} />
        ) : (
          <ReceptionForm token={token} doctor={data.doctor} />
        )}
      </Section>
    </>
  );
}

export function ReceptionPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Page context="Clinic check">
      <Suspense fallback={<Skeleton lines={6} />}>
        <Content params={params} />
      </Suspense>
    </Page>
  );
}
