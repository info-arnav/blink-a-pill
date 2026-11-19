import { useState } from 'react';
import { router } from 'expo-router';
import { api, errorMessage } from '@/lib/api';
import { usePatient } from '@/lib/session';
import { useData } from '@/lib/use-data';
import { formatDate } from '@/lib/format';
import type { Condition, Flag, Lab, Visit } from '@/lib/types';
import { Cell, ErrorText, Group, Input, Loading, Screen, Tile, Txt } from '@/ui/kit';
import { useColors } from '@/ui/theme';

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

  const { data, loading, refreshing, reload, refresh } = useData(async () => {
    const base = `/v1/patients/${patient.id}`;
    const [labs, conditions, visits, flags] = await Promise.all([
      api<{ latest: Lab[] }>(`${base}/labs`),
      api<Condition[]>(`${base}/conditions`),
      api<Visit[]>(`${base}/prescriptions`),
      api<Flag[]>(`${base}/flags`),
    ]);
    return { labs: labs.latest, conditions, visits, flags: flags.filter((f) => f.status !== 'no_longer_applies') };
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

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
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
          <Cell
            key={cond.id}
            title={cond.certainty === 'provisional' ? `${cond.name} (provisional)` : cond.name}
            subtitle={`${cond.first.label[0].toUpperCase()}${cond.first.label.slice(1)}${cond.first.on ? `, ${formatDate(cond.first.on)}` : ''}${cond.notes.length > 1 ? ` · noted ${cond.notes.length} times` : ''}`}
            value={cond.code ?? undefined}
          />
        ))}
        <Input label="Add a condition" value={condition} onChangeText={setCondition} onSubmitEditing={addCondition} returnKeyType="done" placeholder="Diabetes" />
      </Group>
      {error ? <ErrorText>{error}</ErrorText> : null}

      {data.visits.length ? (
        <Group header="Prescriptions">
          {data.visits.map((v) => (
            <Cell
              key={v.id}
              title={`${v.doctor ?? 'Doctor not recorded'}${v.clinic ? ` · ${v.clinic}` : ''}`}
              subtitle={[
                formatDate(v.prescribed_on ?? v.added_on) + (v.source === 'abha' ? ' · ABHA' : ''),
                v.reason ? `For ${v.reason}` : null,
                v.diagnoses.length ? `Diagnosis: ${v.diagnoses.map((d) => (d.certainty === 'provisional' ? `${d.name}?` : d.name)).join(', ')}` : null,
                v.medications.length ? v.medications.map((m) => m.name).join(', ') : null,
              ]
                .filter(Boolean)
                .join('\n')}
            />
          ))}
        </Group>
      ) : null}

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
