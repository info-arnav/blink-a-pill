import { useState } from 'react';
import { router } from 'expo-router';
import { api, errorMessage } from '@/lib/api';
import { usePatient } from '@/lib/session';
import type { Flag, Medication } from '@/lib/types';
import { MedicineEditor, draftReady, draftToBody, type Draft } from '@/features/medicine-editor';
import { Button, Card, Field, Heading, Notice, Screen, Title } from '@/ui/kit';

export default function AddManual() {
  const patient = usePatient();
  const [draft, setDraft] = useState<Draft>({
    include: true,
    written: '',
    product: null,
    typedName: '',
    candidates: [],
    dose_amount: '1',
    frequency: 'OD',
    meal: 'after',
    duration: '',
  });
  const [doctor, setDoctor] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await api<{ medication: Medication; new_flags: Flag[] }>(`/v1/patients/${patient.id}/medications`, {
        method: 'POST',
        body: {
          ...draftToBody(draft),
          source: 'manual',
          prescriber: doctor.name.trim() ? { name: doctor.name.trim(), phone: doctor.phone.trim() || undefined } : undefined,
        },
      });
      if (result.new_flags.length) router.replace(`/concern/${result.new_flags[0].id}?fresh=1`);
      else router.back();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen edges={['bottom']}>
      <Title>Type a medicine</Title>
      <Card>
        <MedicineEditor patientId={patient.id} draft={draft} onChange={setDraft} />
      </Card>
      <Card>
        <Heading>Who prescribed it? (optional)</Heading>
        <Field label="Doctor’s name" value={doctor.name} onChangeText={(name) => setDoctor((d) => ({ ...d, name }))} />
        <Field label="Doctor’s mobile" value={doctor.phone} onChangeText={(phone) => setDoctor((d) => ({ ...d, phone }))} keyboardType="phone-pad" />
      </Card>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Button title="Add medicine" onPress={save} busy={saving} disabled={!draftReady(draft)} />
    </Screen>
  );
}
