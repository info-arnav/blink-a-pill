import { useState } from 'react';
import { router } from 'expo-router';
import { api, errorMessage } from '@/lib/api';
import { usePatient, useSession } from '@/lib/session';
import { Banner, Button, Cell, ErrorText, Group, Input, Screen } from '@/ui/kit';

type Consent = { request_id: string; abha_address: string; purpose: string; hi_types: string[]; date_range: string; expires_in_days: number };
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

  if (imported) {
    return (
      <Screen>
        <Banner tone="green" symbol="checkmark.circle.fill" title="Records added">
          {`${imported.medications} medicines, ${imported.conditions} conditions, ${imported.labs} results.`}
        </Banner>
        <Button title="Done" onPress={() => router.back()} />
      </Screen>
    );
  }

  if (consent) {
    return (
      <Screen>
        <Group header="Consent Request" footer={`For ${consent.purpose.toLowerCase()}. Ends after ${consent.expires_in_days} days.`}>
          <Cell title="ABHA" value={consent.abha_address} />
          <Cell title="Records" value={consent.hi_types.join(', ')} titleLines={1} />
          <Cell title="Period" value={consent.date_range} />
        </Group>
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button
          title="Allow"
          busy={busy}
          onPress={() =>
            run(async () => {
              setImported(await api<Imported>(`/v1/patients/${patient.id}/abha/consents/${consent.request_id}/approve`, { method: 'POST' }));
              await refresh();
            })
          }
        />
        <Button
          title="Don’t Allow"
          kind="gray"
          disabled={busy}
          onPress={() =>
            run(async () => {
              await api(`/v1/patients/${patient.id}/abha/consents/${consent.request_id}/deny`, { method: 'POST' });
              router.back();
            })
          }
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Group footer="Sandbox: addresses ending in @sbx return test records.">
        <Input label="ABHA address" value={address} onChangeText={setAddress} autoCapitalize="none" autoCorrect={false} placeholder="name@sbx" autoFocus />
      </Group>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button
        title="Continue"
        busy={busy}
        disabled={!address.includes('@')}
        onPress={() => run(async () => setConsent(await api<Consent>(`/v1/patients/${patient.id}/abha/consents`, { method: 'POST', body: { abha_address: address.trim() } })))}
      />
    </Screen>
  );
}
