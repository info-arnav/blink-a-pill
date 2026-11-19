import { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { api } from '@/shared/api/server';
import { NOINDEX } from '@/shared/lib/seo';
import { cardAccess, pharmacySession } from '@/shared/session';
import { Page, PageTitle, Section, Stack } from '@/shared/ui/layout/Page';
import { Button } from '@/shared/ui/action/Button';
import { Callout } from '@/shared/ui/status/Callout';
import { Skeleton } from '@/shared/ui/status/Skeleton';
import { Concern, LabFacts, MedicationRows, PatientFacts, Timeline, type PatientRecord } from '@/entities/record';
import { PinForm, VerifyForm, closeCard } from '@/features/card-access';

export const metadata: Metadata = { title: 'Patient card', ...NOINDEX };

async function Content({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{10,64}$/.test(token)) return <Callout tone="danger" title="This card link is not valid." />;
  if (await pharmacySession()) redirect(`/pharmacy/card/${token}`);

  const pin = await cardAccess(token);
  if (!pin) {
    return (
      <>
        <PageTitle overline="Patient card" title="Enter the patient’s PIN" description="Shown under the QR code in the patient’s app." />
        <PinForm token={token} forPharmacy={false} />
      </>
    );
  }

  const view = await api<PatientRecord>(`/v1/cards/${encodeURIComponent(token)}/view`, { method: 'POST', body: { pin } });
  if (!view.ok) return <Callout tone="danger" title={view.message} />;
  const rec = view.data;
  const open = rec.flags.filter((f) => f.is_open);
  const decided = rec.flags.filter((f) => !f.is_open);
  const names = (ids: string[]) => ids.map((id) => rec.medications.find((m) => m.id === id)?.name).filter((n): n is string => Boolean(n));

  return (
    <>
      <PageTitle overline="Patient card" title={rec.patient.full_name} />
      <PatientFacts patient={rec.patient} conditions={rec.conditions} />
      {open.length ? null : <Callout tone="success" title="No open concerns on this list." />}
      {open.length ? (
        <Section title="Open concerns">
          <Stack gap={3}>
            {open.map((f) => (
              <Concern key={f.id} flag={f} medicationNames={names(f.medication_ids)} />
            ))}
          </Stack>
        </Section>
      ) : null}
      <Section title="Current medicines">
        <MedicationRows medications={rec.medications} flagged={open.flatMap((f) => f.medication_ids)} />
      </Section>
      <Section title="Latest results">
        <LabFacts labs={rec.labs} />
      </Section>
      {decided.length ? (
        <Section title="Decided by a professional">
          <Stack gap={3}>
            {decided.map((f) => (
              <Stack key={f.id} gap={2}>
                <Concern flag={f} medicationNames={names(f.medication_ids)} />
                {f.events?.length ? (
                  <details>
                    <summary>Audit trail</summary>
                    <Timeline events={f.events} />
                  </details>
                ) : null}
              </Stack>
            ))}
          </Stack>
        </Section>
      ) : null}
      <Section title="Verify this list">
        <VerifyForm token={token} medications={rec.medications.map((m) => ({ id: m.id, name: m.name }))} />
      </Section>
      <form action={closeCard}>
        <Button type="submit" variant="quiet">
          Close card on this device
        </Button>
      </form>
    </>
  );
}

export function CardPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Page context="Patient card">
      <Suspense fallback={<Skeleton lines={8} />}>
        <Content params={params} />
      </Suspense>
    </Page>
  );
}
