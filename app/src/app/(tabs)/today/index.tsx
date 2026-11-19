import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { api, errorMessage } from '@/lib/api';
import { usePatient } from '@/lib/session';
import { useData } from '@/lib/use-data';
import { syncReminders } from '@/lib/reminders';
import type { Day, Dose, Flag, Medication } from '@/lib/types';
import { CoursePrompt } from '@/features/course-prompt';
import { Banner, Button, Cell, Empty, ErrorText, Group, Icon, Loading, Screen, Txt } from '@/ui/kit';
import { useColors } from '@/ui/theme';

type Notification = { id: string; kind: string; title: string; body: string; flag_id: string | null; read_at: string | null };

function clock(time: string) {
  const [h, m] = time.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

function DoseStatus({ dose, onLog, busy }: { dose: Dose; onLog: (status: 'taken' | 'missed') => void; busy: string | null }) {
  const c = useColors();
  if (dose.status === 'taken') return <Icon name="checkmark.circle.fill" size={26} color={c.green} fallback="✓" />;
  if (dose.status === 'missed') return <Txt style="subhead" color={c.orange}>Missed</Txt>;
  if (dose.status === 'on_hold') return <Txt style="subhead" color={c.red}>On hold</Txt>;
  const key = `${dose.medication_id}${dose.time}`;
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Button title="Skip" kind="gray" size="small" onPress={() => onLog('missed')} busy={busy === `${key}missed`} />
      <Button title="Taken" kind="tinted" size="small" onPress={() => onLog('taken')} busy={busy === `${key}taken`} />
    </View>
  );
}

export default function Today() {
  const patient = usePatient();
  const c = useColors();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const { data, loading, reload, setData } = useData(async () => {
    const base = `/v1/patients/${patient.id}`;
    const [day, flags, meds, courses, notes] = await Promise.all([
      api<Day>(`${base}/schedule`),
      api<Flag[]>(`${base}/flags?open=1`),
      api<Medication[]>(`${base}/medications`),
      api<Medication[]>(`${base}/medications/courses-due`),
      api<Notification[]>(`${base}/me/notifications`),
    ]);
    return { day, flags, meds, courses, notes };
  }, [patient.id]);

  useEffect(() => {
    if (!data) return;
    const held = new Set(data.day.doses.filter((d) => d.status === 'on_hold').map((d) => d.medication_id));
    void syncReminders(patient.full_name, data.meds, held);
  }, [data, patient.full_name]);

  const log = async (dose: Dose, status: 'taken' | 'missed') => {
    setBusy(`${dose.medication_id}${dose.time}${status}`);
    setError(null);
    try {
      const day = await api<Day>(`/v1/patients/${patient.id}/schedule/doses`, { method: 'POST', body: { medication_id: dose.medication_id, time: dose.time, status } });
      if (status === 'taken') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
      setData((prev) => (prev ? { ...prev, day } : prev));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const readAnswers = async () => {
    await api(`/v1/patients/${patient.id}/me/notifications/read`, { method: 'POST' }).catch(() => null);
    void reload();
  };

  if (!data) return <Screen>{loading ? <Loading /> : null}</Screen>;

  const answers = data.notes.filter((n) => (n.kind === 'decision' || n.kind === 'reception') && !n.read_at);
  const course = data.courses.find((m) => !dismissed.includes(m.id));
  const next = data.day.next;
  const slots = [...new Set(data.day.doses.map((d) => d.time))];
  const done = data.day.doses.filter((d) => d.status === 'taken').length;

  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <Txt style="subhead" color={c.secondaryLabel}>
        {patient.role === 'caregiver' ? `${patient.full_name} · ` : ''}
        {new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
        {data.day.doses.length ? ` · ${done} of ${data.day.doses.length} taken` : ''}
      </Txt>

      {data.flags.map((f) => (
        <Banner key={f.id} tone={f.severity === 1 ? 'red' : 'orange'} symbol="exclamationmark.triangle.fill" title={f.title} onPress={() => router.push(`/concern/${f.id}`)}>
          {`${f.status_label}. Don’t stop anything on your own.`}
        </Banner>
      ))}

      {answers.map((n) => (
        <Banner key={n.id} tone="green" symbol="stethoscope" title={n.title} onPress={() => (n.flag_id ? router.push(`/concern/${n.flag_id}`) : readAnswers())}>
          {n.body}
        </Banner>
      ))}

      {course ? <CoursePrompt patientId={patient.id} medication={course} onDone={() => { setDismissed((d) => [...d, course.id]); void reload(); }} /> : null}

      {!data.day.doses.length && !data.day.as_needed.length ? (
        <Empty symbol="pills" title="No medicines yet" detail="Photograph a prescription to add them." action={<Button title="Add Medicine" kind="filled" size="medium" onPress={() => router.push('/add-photo')} />} />
      ) : null}

      {next ? (
        <Group header={next.status === 'due' ? 'Due Now' : `Up Next · ${clock(next.time)}`}>
          <View style={{ padding: 16, gap: 14 }}>
            <View style={{ gap: 2 }}>
              <Txt style="title2">{next.name}</Txt>
              <Txt style="subhead" color={c.secondaryLabel}>
                {[next.amount, next.meal].filter(Boolean).join(' · ')}
              </Txt>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Button title="Skipped" kind="gray" onPress={() => log(next, 'missed')} busy={busy === `${next.medication_id}${next.time}missed`} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Taken" symbol="checkmark" onPress={() => log(next, 'taken')} busy={busy === `${next.medication_id}${next.time}taken`} />
              </View>
            </View>
          </View>
        </Group>
      ) : null}

      {error ? <ErrorText>{error}</ErrorText> : null}

      {slots.map((time) => (
        <Group key={time} header={clock(time)}>
          {data.day.doses
            .filter((d) => d.time === time)
            .map((d) => (
              <Cell
                key={`${d.medication_id}${d.time}`}
                title={d.name}
                subtitle={d.hold_note ?? [d.amount, d.meal].filter(Boolean).join(' · ')}
                trailing={<DoseStatus dose={d} busy={busy} onLog={(status) => log(d, status)} />}
              />
            ))}
        </Group>
      ))}

      {data.day.as_needed.length ? (
        <Group header="When Needed">
          {data.day.as_needed.map((m) => (
            <Cell key={m.medication_id} title={m.name} chevron onPress={() => router.push(`/medicine/${m.medication_id}`)} />
          ))}
        </Group>
      ) : null}
    </Screen>
  );
}
