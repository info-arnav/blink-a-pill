import { useState } from 'react';
import { router } from 'expo-router';
import { api, errorMessage } from '@/lib/api';
import { usePatient } from '@/lib/session';
import type { Flag } from '@/lib/types';
import { Body, Button, Card, Chips, Field, Heading, Notice, Screen, Title } from '@/ui/kit';

const KINDS = [
  { value: 'creatinine' as const, label: 'Creatinine', unit: 'mg/dL', hint: 'From a kidney function test (KFT/RFT). We work out your eGFR from it.' },
  { value: 'egfr' as const, label: 'eGFR', unit: 'mL/min/1.73m²', hint: 'If your report already shows eGFR.' },
  { value: 'hba1c' as const, label: 'HbA1c', unit: '%', hint: 'Your 3 month sugar average.' },
  { value: 'fasting_glucose' as const, label: 'Fasting sugar', unit: 'mg/dL', hint: '' },
  { value: 'potassium' as const, label: 'Potassium', unit: 'mmol/L', hint: '' },
  { value: 'child_pugh' as const, label: 'Liver (Child-Pugh)', unit: '', hint: 'Only if a doctor has told you your Child-Pugh class.' },
];

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

export default function AddLab() {
  const patient = usePatient();
  const [kind, setKind] = useState<(typeof KINDS)[number]['value']>('creatinine');
  const [value, setValue] = useState('');
  const [cls, setCls] = useState<'A' | 'B' | 'C' | null>(null);
  const [date, setDate] = useState(today());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const meta = KINDS.find((k) => k.value === kind)!;

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await api<{ new_flags: Flag[] }>(`/v1/patients/${patient.id}/labs`, {
        method: 'POST',
        body: kind === 'child_pugh' ? { kind, value_text: cls, measured_on: date } : { kind, value: Number(value), measured_on: date },
      });
      if (result.new_flags.length) router.replace(`/concern/${result.new_flags[0].id}?fresh=1`);
      else router.back();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const valid = kind === 'child_pugh' ? Boolean(cls) : Number(value) > 0;

  return (
    <Screen edges={['bottom']}>
      <Title>Add a test result</Title>
      <Body muted>Type the value exactly as it is printed on your report. Your doctor sees it marked as typed by you.</Body>
      <Card>
        <Heading>Which test?</Heading>
        <Chips value={kind} onChange={setKind} options={KINDS.map((k) => ({ value: k.value, label: k.label }))} />
        {meta.hint ? <Body small muted>{meta.hint}</Body> : null}
        {kind === 'child_pugh' ? (
          <Chips
            value={cls}
            onChange={setCls}
            options={[
              { value: 'A', label: 'Class A' },
              { value: 'B', label: 'Class B' },
              { value: 'C', label: 'Class C' },
            ]}
          />
        ) : (
          <Field label={`Value${meta.unit ? ` (${meta.unit})` : ''}`} value={value} onChangeText={setValue} keyboardType="decimal-pad" maxLength={7} />
        )}
        <Field label="Date of the test (YYYY-MM-DD)" value={date} onChangeText={setDate} maxLength={10} />
      </Card>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Button title="Save" onPress={save} busy={busy} disabled={!valid || !/^\d{4}-\d{2}-\d{2}$/.test(date)} />
    </Screen>
  );
}
