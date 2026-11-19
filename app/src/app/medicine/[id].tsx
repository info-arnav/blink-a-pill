import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { api, errorMessage } from '@/lib/api';
import { usePatient } from '@/lib/session';
import { useData } from '@/lib/use-data';
import { MEAL_LABEL, formatDate } from '@/lib/format';
import type { Medication } from '@/lib/types';
import { FREQUENCY_OPTIONS, MEAL_OPTIONS } from '@/features/medicine-editor';
import { Button, Cell, ErrorText, Group, Input, Loading, Pills, Screen, Txt } from '@/ui/kit';
import { useColors } from '@/ui/theme';

const SOURCE: Record<string, string> = { photo: 'Prescription photo', manual: 'Typed in', abha: 'ABHA record' };

const REASONS = [
  { value: 'doctor_stopped' as const, label: 'Doctor stopped it' },
  { value: 'course_finished' as const, label: 'Course finished' },
  { value: 'not_taking' as const, label: 'Not taking it' },
  { value: 'added_by_mistake' as const, label: 'Added by mistake' },
];

export default function MedicineDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const patient = usePatient();
  const c = useColors();
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [frequency, setFrequency] = useState<(typeof FREQUENCY_OPTIONS)[number]['value']>('OD');
  const [meal, setMeal] = useState<(typeof MEAL_OPTIONS)[number]['value']>('any');
  const [duration, setDuration] = useState('');
  const [reason, setReason] = useState<(typeof REASONS)[number]['value'] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, reload } = useData(async () => (await api<Medication[]>(`/v1/patients/${patient.id}/medications?all=1`)).find((m) => m.id === id) ?? null, [patient.id, id]);

  useEffect(() => {
    if (!data) return;
    setFrequency((FREQUENCY_OPTIONS.find((f) => f.value === data.frequency)?.value ?? 'OD') as typeof frequency);
    setMeal(data.meal === 'with' ? 'after' : data.meal);
    setDuration(data.duration_days ? String(data.duration_days) : '');
  }, [data]);

  if (!data) return <Loading />;
  const m = data;

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

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <Txt style="title2">{m.name}</Txt>
        <Txt style="subhead" color={c.secondaryLabel}>
          {m.status === 'active' ? (m.days_left != null ? `${m.days_left} days left` : 'Ongoing') : (m.status_reason ?? 'Not taking')}
        </Txt>
      </View>

      <Group header="Contains" footer={m.ingredients.length ? undefined : 'Unknown contents, so it can’t be checked.'}>
        {m.ingredients.map((i) => (
          <Cell key={i.key} title={i.display} value={i.value ? `${i.value} ${i.unit ?? ''}` : undefined} />
        ))}
      </Group>

      <Group header="Schedule">
        <Cell title="Dose" value={`${m.dose_amount} ${m.dose_unit}`} />
        <Cell title="How often" value={m.frequency_label} />
        {m.times.length ? <Cell title="Times" value={m.times.join(', ')} /> : null}
        <Cell title="With food" value={MEAL_LABEL[m.meal]} />
        <Cell title="Until" value={m.end_date ? formatDate(m.end_date) : 'Ongoing'} />
        {m.status === 'active' && !editing ? <Cell title="Edit Schedule" tint onPress={() => setEditing(true)} /> : null}
      </Group>

      {editing ? (
        <View style={{ gap: 14 }}>
          <Pills value={frequency} onChange={setFrequency} options={FREQUENCY_OPTIONS} />
          <Pills value={meal} onChange={setMeal} options={MEAL_OPTIONS} />
          <Group footer="Match what your doctor wrote.">
            <Input label="Days (empty if ongoing)" value={duration} onChangeText={(v) => setDuration(v.replace(/\D/g, ''))} keyboardType="number-pad" />
          </Group>
          <Button
            title="Save"
            busy={busy}
            onPress={() =>
              run(async () => {
                await api(`/v1/patients/${patient.id}/medications/${m.id}`, { method: 'PATCH', body: { frequency, meal, duration_days: duration ? Number(duration) : null } });
                setEditing(false);
                await reload();
              })
            }
          />
          <Button title="Cancel" kind="plain" size="medium" onPress={() => setEditing(false)} />
        </View>
      ) : null}

      <Group header="Source">
        <Cell title="Doctor" value={m.prescriber?.name ?? 'Unknown'} />
        {m.clinic ? <Cell title="Clinic" value={m.clinic.name} /> : null}
        {m.prescribed_on ? <Cell title="Date" value={formatDate(m.prescribed_on)} /> : null}
        <Cell title="Added from" value={SOURCE[m.source]} />
        <Cell title="Confirmed by" value={m.confirmed_by} />
      </Group>

      {error ? <ErrorText>{error}</ErrorText> : null}

      {m.status === 'active' && !removing ? (
        <Group>
          <Cell title="I No Longer Take This" destructive onPress={() => setRemoving(true)} />
        </Group>
      ) : null}
      {removing ? (
        <Group header="Why?" footer="This only updates your list. Ask your doctor before stopping any medicine.">
          <View style={{ padding: 16, gap: 14 }}>
            <Pills value={reason} onChange={setReason} options={REASONS} />
            <Button
              title="Update List"
              kind="destructive"
              busy={busy}
              disabled={!reason}
              onPress={() =>
                run(async () => {
                  await api(`/v1/patients/${patient.id}/medications/${m.id}/not-taking`, { method: 'POST', body: { reason } });
                  router.back();
                })
              }
            />
          </View>
        </Group>
      ) : null}
    </Screen>
  );
}
