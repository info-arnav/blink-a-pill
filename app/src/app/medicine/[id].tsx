import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { api, errorMessage } from '@/lib/api';
import { usePatient } from '@/lib/session';
import { useData } from '@/lib/use-data';
import { MEAL_LABEL, formatDate } from '@/lib/format';
import type { Medication } from '@/lib/types';
import { FREQUENCY_OPTIONS, MEAL_OPTIONS } from '@/features/medicine-editor';
import { Badge, Body, Button, Card, Chips, Field, Heading, Loading, Notice, Row, Screen, Title } from '@/ui/kit';

const SOURCE: Record<string, string> = { photo: 'Added from a prescription photo', manual: 'Typed in', abha: 'Imported from ABHA records' };

const REASONS = [
  { value: 'doctor_stopped' as const, label: 'A doctor stopped it' },
  { value: 'course_finished' as const, label: 'Course finished' },
  { value: 'not_taking' as const, label: 'I am not taking it' },
  { value: 'added_by_mistake' as const, label: 'Added by mistake' },
];

export default function MedicineDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const patient = usePatient();
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [frequency, setFrequency] = useState<(typeof FREQUENCY_OPTIONS)[number]['value']>('OD');
  const [meal, setMeal] = useState<(typeof MEAL_OPTIONS)[number]['value']>('any');
  const [duration, setDuration] = useState('');
  const [reason, setReason] = useState<(typeof REASONS)[number]['value'] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, reload } = useData(async () => {
    const all = await api<Medication[]>(`/v1/patients/${patient.id}/medications?all=1`);
    return all.find((m) => m.id === id) ?? null;
  }, [patient.id, id]);

  useEffect(() => {
    if (!data) return;
    setFrequency((FREQUENCY_OPTIONS.find((f) => f.value === data.frequency)?.value ?? 'OD') as typeof frequency);
    setMeal(data.meal === 'with' ? 'after' : data.meal);
    setDuration(data.duration_days ? String(data.duration_days) : '');
  }, [data]);

  if (!data) return <Loading />;
  const m = data;

  const saveSchedule = async () => {
    setBusy(true);
    setError(null);
    try {
      await api(`/v1/patients/${patient.id}/medications/${m.id}`, {
        method: 'PATCH',
        body: { frequency, meal, duration_days: duration ? Number(duration) : null },
      });
      setEditing(false);
      void reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!reason) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/v1/patients/${patient.id}/medications/${m.id}/not-taking`, { method: 'POST', body: { reason } });
      router.back();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen edges={['bottom']}>
      <Title eyebrow={m.status === 'active' ? 'Taking now' : (m.status_reason ?? 'Not taking')}>{m.name}</Title>
      <Row wrap>
        {m.is_antibiotic ? <Badge label="Antibiotic" tone="brand" /> : null}
        {m.days_left != null ? <Badge label={`${m.days_left} days left`} /> : null}
      </Row>
      <Card>
        <Heading>What is in it</Heading>
        {m.ingredients.length ? (
          m.ingredients.map((i) => (
            <Body key={i.key}>
              {i.display}
              {i.value ? ` ${i.value} ${i.unit ?? ''}` : ''}
            </Body>
          ))
        ) : (
          <Notice tone="warn">We could not find what this contains, so it cannot be checked against your other medicines. Show it to your pharmacist.</Notice>
        )}
      </Card>
      <Card>
        <Heading>How to take it</Heading>
        <Body>
          {m.dose_amount} {m.dose_unit}, {m.frequency_label.toLowerCase()}
          {m.times.length ? ` at ${m.times.join(', ')}` : ''}, {MEAL_LABEL[m.meal]}.
        </Body>
        {m.end_date ? <Body muted>Until {formatDate(m.end_date)}.</Body> : <Body muted>No end date. Keep taking it until your doctor says otherwise.</Body>}
        {m.status === 'active' && !editing ? <Button title="Change how often" variant="secondary" onPress={() => setEditing(true)} /> : null}
        {editing ? (
          <>
            <Chips value={frequency} onChange={setFrequency} options={FREQUENCY_OPTIONS} />
            <Chips value={meal} onChange={setMeal} options={MEAL_OPTIONS} />
            <Field label="For how many days" value={duration} onChangeText={(v) => setDuration(v.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="Leave empty if ongoing" />
            <Body small muted>
              Only change this to match what your doctor wrote.
            </Body>
            <Button title="Save" onPress={saveSchedule} busy={busy} />
            <Button title="Cancel" variant="ghost" onPress={() => setEditing(false)} />
          </>
        ) : null}
      </Card>
      <Card>
        <Heading>Where it came from</Heading>
        <Body>{m.prescriber ? `Prescribed by ${m.prescriber.name}${m.prescriber.speciality ? ` (${m.prescriber.speciality})` : ''}` : 'Prescriber not recorded'}</Body>
        {m.clinic ? <Body muted>{m.clinic.name}</Body> : null}
        {m.prescribed_on ? <Body muted>On {formatDate(m.prescribed_on)}</Body> : null}
        <Body muted>{SOURCE[m.source]}</Body>
        <Body muted>Confirmed by: {m.confirmed_by}</Body>
      </Card>
      {error ? <Notice tone="error">{error}</Notice> : null}
      {m.status === 'active' && !removing ? <Button title="I no longer take this" variant="ghost" onPress={() => setRemoving(true)} /> : null}
      {removing ? (
        <Card>
          <Heading>Why are you removing it?</Heading>
          <Notice tone="warn">This only updates your list. Do not stop a medicine on your own. Ask your doctor first.</Notice>
          <Chips value={reason} onChange={setReason} options={REASONS} />
          <Button title="Update my list" variant="danger" onPress={remove} busy={busy} disabled={!reason} />
          <Button title="Cancel" variant="ghost" onPress={() => setRemoving(false)} />
        </Card>
      ) : null}
    </Screen>
  );
}
