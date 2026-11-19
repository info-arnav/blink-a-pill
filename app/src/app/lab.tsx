import { useState } from 'react';
import { router } from 'expo-router';
import { api, errorMessage } from '@/lib/api';
import { usePatient } from '@/lib/session';
import type { Flag } from '@/lib/types';
import { Button, ErrorText, Group, Input, Pills, Screen } from '@/ui/kit';

const KINDS = [
  { value: 'creatinine' as const, label: 'Creatinine', unit: 'mg/dL' },
  { value: 'egfr' as const, label: 'eGFR', unit: 'mL/min/1.73m²' },
  { value: 'hba1c' as const, label: 'HbA1c', unit: '%' },
  { value: 'fasting_glucose' as const, label: 'Fasting sugar', unit: 'mg/dL' },
  { value: 'potassium' as const, label: 'Potassium', unit: 'mmol/L' },
  { value: 'child_pugh' as const, label: 'Child-Pugh', unit: '' },
];

const CLASSES = [
  { value: 'A' as const, label: 'Class A' },
  { value: 'B' as const, label: 'Class B' },
  { value: 'C' as const, label: 'Class C' },
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

  const valid = (kind === 'child_pugh' ? Boolean(cls) : Number(value) > 0) && /^\d{4}-\d{2}-\d{2}$/.test(date);

  return (
    <Screen>
      <Pills value={kind} onChange={setKind} options={KINDS} />
      {kind === 'child_pugh' ? (
        <Pills value={cls} onChange={setCls} options={CLASSES} />
      ) : (
        <Group footer={kind === 'creatinine' ? 'We calculate eGFR from it (CKD-EPI 2021).' : 'Exactly as printed on the report.'}>
          <Input label={meta.unit ? `${meta.label} (${meta.unit})` : meta.label} value={value} onChangeText={setValue} keyboardType="decimal-pad" maxLength={7} autoFocus />
          <Input label="Test date (YYYY-MM-DD)" value={date} onChangeText={setDate} maxLength={10} />
        </Group>
      )}
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button title="Save" onPress={save} busy={busy} disabled={!valid} />
    </Screen>
  );
}
