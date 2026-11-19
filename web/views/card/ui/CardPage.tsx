import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { api } from '@/shared/api/server';
import { Button, Card, Notice, PageTitle, Shell, Skeleton } from '@/shared/ui/primitives';
import { cardAccess, pharmacySession } from '@/shared/session';
import { ConcernCard, LabGrid, MedicationList, PatientLine, type PatientRecord } from '@/entities/record';
import { PinForm, VerifyForm, closeCard } from '@/features/card-access';

async function Content({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{10,64}$/.test(token)) return <Notice tone="error">This card link is not valid.</Notice>;
  if (await pharmacySession()) redirect(`/pharmacy/card/${token}`);

  const pin = await cardAccess(token);
  if (!pin) {
    return (
      <>
        <PageTitle eyebrow="Patient card" title="Enter the patient’s PIN" lead="The patient can show you the PIN on the card screen of their app." />
        <Card>
          <PinForm token={token} forPharmacy={false} />
        </Card>
      </>
    );
  }

  const view = await api<PatientRecord>(`/v1/cards/${encodeURIComponent(token)}/view`, { method: 'POST', body: { pin } });
  if (!view.ok) return <Notice tone="error">{view.message}</Notice>;
  const rec = view.data;
  const open = rec.flags.filter((f) => f.is_open);
  const decided = rec.flags.filter((f) => !f.is_open);
  const names = (ids: string[]) => ids.map((id) => rec.medications.find((m) => m.id === id)?.name).filter((n): n is string => Boolean(n));

  return (
    <>
      <PageTitle eyebrow="Patient card · one verified list" title={rec.patient.full_name} />
      <Card>
        <PatientLine patient={rec.patient} />
        {rec.conditions.length ? <div>Conditions: {rec.conditions.map((c) => c.name).join(', ')}</div> : null}
      </Card>
      <Card title="Current medicines" eyebrow="Who confirmed each entry is shown under it">
        <MedicationList medications={rec.medications} flagged={open.flatMap((f) => f.medication_ids)} />
      </Card>
      <Card title="Latest values">
        <LabGrid labs={rec.labs} />
      </Card>
      {open.length ? <h2>Open concerns</h2> : <Notice tone="ok">No open concerns on this list.</Notice>}
      {open.map((f) => (
        <ConcernCard key={f.id} flag={f} audience="clinician" medicationNames={names(f.medication_ids)} />
      ))}
      {decided.length ? <h2>Decided by a professional</h2> : null}
      {decided.map((f) => (
        <ConcernCard key={f.id} flag={f} audience="clinician" medicationNames={names(f.medication_ids)} />
      ))}
      <Card title="Reviewing this list with the patient?" eyebrow="For clinicians">
        <VerifyForm token={token} medications={rec.medications.map((m) => ({ id: m.id, name: m.name }))} />
      </Card>
      <form action={closeCard}>
        <Button type="submit" variant="secondary" block>
          Close this card
        </Button>
      </form>
    </>
  );
}

export function CardPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Shell note="Patient card">
      <Suspense fallback={<Skeleton />}>
        <Content params={params} />
      </Suspense>
    </Shell>
  );
}
