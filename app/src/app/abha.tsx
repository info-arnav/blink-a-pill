import { useState } from 'react';
import { router } from 'expo-router';
import { api, errorMessage } from '@/lib/api';
import { usePatient, useSession } from '@/lib/session';
import { Body, Button, Card, Field, Heading, Notice, Screen, Title } from '@/ui/kit';

type Consent = { request_id: string; abha_address: string; purpose: string; hi_types: string[]; date_range: string; expires_in_days: number; sandbox: boolean };
type Imported = { conditions: number; labs: number; medications: number };

export default function Abha() {
  const patient = usePatient();
  const { refresh } = useSession();
  const [address, setAddress] = useState(patient.abha_address ?? '');
  const [consent, setConsent] = useState<Consent | null>(null);
  const [imported, setImported] = useState<Imported | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const request = () =>
    run(async () => {
      setConsent(await api<Consent>(`/v1/patients/${patient.id}/abha/consents`, { method: 'POST', body: { abha_address: address.trim() } }));
    });

  const approve = () =>
    run(async () => {
      setImported(await api<Imported>(`/v1/patients/${patient.id}/abha/consents/${consent!.request_id}/approve`, { method: 'POST' }));
      await refresh();
    });

  const deny = () =>
    run(async () => {
      await api(`/v1/patients/${patient.id}/abha/consents/${consent!.request_id}/deny`, { method: 'POST' });
      router.back();
    });

  return (
    <Screen edges={['bottom']}>
      <Title eyebrow="Ayushman Bharat Digital Mission">Link ABHA records</Title>
      <Notice tone="warn">This prototype is connected to the ABDM sandbox. Only sandbox test addresses ending in @sbx return records, and those records are test data.</Notice>
      {imported ? (
        <Card tone="ok">
          <Heading>Records added</Heading>
          <Body>
            {imported.medications} medicines, {imported.conditions} conditions and {imported.labs} test results were added to your list and checked.
          </Body>
          <Button title="Done" onPress={() => router.back()} />
        </Card>
      ) : consent ? (
        <Card>
          <Heading>Consent request</Heading>
          <Body>blink-a-pill is asking to read these records from {consent.abha_address}:</Body>
          {consent.hi_types.map((t) => (
            <Body key={t}>• {t}</Body>
          ))}
          <Body muted>
            Purpose: {consent.purpose}. Period: {consent.date_range}. This consent ends after {consent.expires_in_days} days.
          </Body>
          {error ? <Notice tone="error">{error}</Notice> : null}
          <Button title="Allow" onPress={approve} busy={busy} />
          <Button title="Do not allow" variant="secondary" onPress={deny} disabled={busy} />
        </Card>
      ) : (
        <Card>
          <Field label="ABHA address" value={address} onChangeText={setAddress} autoCapitalize="none" autoCorrect={false} placeholder="name@sbx" />
          {error ? <Notice tone="error">{error}</Notice> : null}
          <Button title="Continue" onPress={request} busy={busy} disabled={!address.includes('@')} />
        </Card>
      )}
    </Screen>
  );
}
