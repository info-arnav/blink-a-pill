import { useState } from 'react';
import { router } from 'expo-router';
import { api, errorMessage } from '@/lib/api';
import { usePatient } from '@/lib/session';
import { useData } from '@/lib/use-data';
import { formatDate } from '@/lib/format';
import type { Flag, Lab, Medication } from '@/lib/types';
import { Cell, ErrorText, Group, Input, Loading, Screen, Tile, Txt } from '@/ui/kit';
import { useColors } from '@/ui/theme';

type Condition = { id: string; name: string; source: string };

const LAB_NAME: Record<string, string> = {
  egfr: 'eGFR',
  creatinine: 'Creatinine',
  child_pugh: 'Child-Pugh',
  potassium: 'Potassium',
  hba1c: 'HbA1c',
  fasting_glucose: 'Fasting Sugar',
};

export default function Record() {
  const patient = usePatient();
  const c = useColors();
  const [condition, setCondition] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data, loading, reload } = useData(async () => {
    const base = `/v1/patients/${patient.id}`;
    const [labs, conditions, meds, flags] = await Promise.all([
      api<{ latest: Lab[] }>(`${base}/labs`),
      api<Condition[]>(`${base}/conditions`),
      api<Medication[]>(`${base}/medications?all=1`),
      api<Flag[]>(`${base}/flags`),
    ]);
    return { labs: labs.latest, conditions, meds, flags: flags.filter((f) => f.status !== 'no_longer_applies') };
  }, [patient.id]);

  const addCondition = async () => {
    if (!condition.trim()) return;
    setError(null);
    try {
      await api(`/v1/patients/${patient.id}/conditions`, { method: 'POST', body: { name: condition.trim() } });
      setCondition('');
      void reload();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (!data) return <Screen>{loading ? <Loading /> : null}</Screen>;

  const doctors = new Map<string, Medication[]>();
  for (const m of data.meds) {
    const key = m.prescriber?.name ?? 'Unknown doctor';
    doctors.set(key, [...(doctors.get(key) ?? []), m]);
  }

  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <Group header="Results" footer="Values you type are marked as typed by you.">
        {data.labs.map((l) => (
          <Cell
            key={l.id}
            title={LAB_NAME[l.kind] ?? l.kind}
            subtitle={`${formatDate(l.measured_on)}${l.source === 'abha' ? ' · ABHA' : l.source === 'computed' ? ' · calculated' : ''}`}
            value={`${l.value ?? l.value_text}${l.kind === 'child_pugh' || !l.unit ? '' : ` ${l.unit}`}`}
          />
        ))}
        <Cell title="Add Result" tint onPress={() => router.push('/lab')} />
      </Group>

      <Group header="Conditions">
        {data.conditions.map((cond) => (
          <Cell key={cond.id} title={cond.name} value={cond.source === 'abha' ? 'ABHA' : undefined} />
        ))}
        <Input label="Add a condition" value={condition} onChangeText={setCondition} onSubmitEditing={addCondition} returnKeyType="done" placeholder="Diabetes" />
      </Group>
      {error ? <ErrorText>{error}</ErrorText> : null}

      <Group header="Prescriptions">
        {[...doctors.entries()].map(([doctor, meds]) => (
          <Cell key={doctor} title={doctor} subtitle={meds.map((m) => m.name).join(', ')} />
        ))}
      </Group>

      {data.flags.length ? (
        <Group header="Checked With Doctor">
          {data.flags.map((f) => (
            <Cell
              key={f.id}
              title={f.title}
              subtitle={f.decision?.text ?? f.status_label}
              leading={<Tile symbol={f.is_open ? 'exclamationmark.triangle.fill' : 'checkmark.seal.fill'} color={f.is_open ? (f.severity === 1 ? c.red : c.orange) : c.green} />}
              chevron
              onPress={() => router.push(`/concern/${f.id}`)}
            />
          ))}
        </Group>
      ) : null}

      <Group header="ABHA">
        <Cell
          title={patient.abha_address ?? 'Link ABHA'}
          subtitle={patient.abha_address ? 'Linked' : undefined}
          leading={<Tile symbol="link" color={c.blue} />}
          chevron
          onPress={() => router.push('/abha')}
        />
      </Group>
      <Txt style="footnote" color={c.tertiaryLabel} align="center">
        {patient.full_name}, {patient.age}
      </Txt>
    </Screen>
  );
}
