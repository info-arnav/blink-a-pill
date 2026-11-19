import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { api, errorMessage } from '@/lib/api';
import { usePatient } from '@/lib/session';
import { useData } from '@/lib/use-data';
import { syncReminders } from '@/lib/reminders';
import type { Day, Dose, Flag, Medication } from '@/lib/types';
import { PatientSwitcher } from '@/features/patient-switcher';
import { CoursePrompt } from '@/features/course-prompt';
import { Badge, Body, Button, Card, Heading, Loading, Notice, Row, Screen, Title } from '@/ui/kit';
import { severityColors, useColors } from '@/ui/theme';

type Notification = { id: string; kind: string; title: string; body: string; flag_id: string | null; read_at: string | null };

const STATUS: Record<Dose['status'], string> = {
  taken: 'Taken',
  missed: 'Missed',
  due: 'Due now',
  upcoming: 'Later',
  on_hold: 'On hold',
};

function greeting(now: string) {
  const hour = Number(now.slice(0, 2));
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
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
    const key = `${dose.medication_id}${dose.time}${status}`;
    setBusy(key);
    setError(null);
    try {
      const day = await api<Day>(`/v1/patients/${patient.id}/schedule/doses`, {
        method: 'POST',
        body: { medication_id: dose.medication_id, time: dose.time, status },
      });
      setData((prev) => (prev ? { ...prev, day } : prev));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const answers = data?.notes.filter((n) => n.kind === 'decision' || n.kind === 'reception').filter((n) => !n.read_at) ?? [];
  const course = data?.courses.find((m) => !dismissed.includes(m.id));
  const next = data?.day.next;

  return (
    <Screen refreshing={loading && Boolean(data)} onRefresh={reload}>
      <PatientSwitcher />
      <Title eyebrow={data ? greeting(data.day.now) : ' '}>{patient.role === 'caregiver' ? `${patient.full_name.split(' ')[0]}'s medicines` : 'Your medicines today'}</Title>
      {!data ? <Loading /> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}

      {data?.flags.map((f) => {
        const colors = severityColors(c, f.severity);
        return (
          <Pressable key={f.id} accessibilityRole="button" onPress={() => router.push(`/concern/${f.id}`)}>
            <View style={{ backgroundColor: colors.bg, borderRadius: 14, padding: 16, gap: 6 }}>
              <Text style={{ color: colors.fg, fontWeight: '700', fontSize: 18 }}>Ask your doctor: {f.title}</Text>
              <Text style={{ color: c.ink, fontSize: 16 }}>Don’t stop anything on your own. {f.status_label}. Tap to see more.</Text>
            </View>
          </Pressable>
        );
      })}

      {answers.map((n) => (
        <Card key={n.id} tone="ok">
          <Heading>{n.title}</Heading>
          <Body>{n.body}</Body>
          {n.flag_id ? <Button title="See details" variant="secondary" onPress={() => router.push(`/concern/${n.flag_id}`)} /> : null}
          <Button
            title="Got it"
            variant="ghost"
            onPress={async () => {
              await api(`/v1/patients/${patient.id}/me/notifications/read`, { method: 'POST' }).catch(() => null);
              void reload();
            }}
          />
        </Card>
      ))}

      {course ? <CoursePrompt patientId={patient.id} medication={course} onDone={() => { setDismissed((d) => [...d, course.id]); void reload(); }} /> : null}

      {data && !data.day.doses.length ? (
        <Card>
          <Heading>No medicines yet</Heading>
          <Body muted>Add your first medicine by taking a photo of a prescription or a medicine strip.</Body>
          <Button title="Add a medicine" onPress={() => router.push('/add-photo')} />
        </Card>
      ) : null}

      {next ? (
        <Card tone="brand">
          <Text style={{ color: c.inkSoft, fontWeight: '700', fontSize: 14, letterSpacing: 0.6 }}>{next.status === 'due' ? 'DUE NOW' : `NEXT AT ${next.time}`}</Text>
          <Text style={{ color: c.ink, fontSize: 28, fontWeight: '800' }}>{next.name}</Text>
          <Body>
            {next.amount}
            {next.meal ? `, ${next.meal}` : ''}
          </Body>
          <Button title="I took it" onPress={() => log(next, 'taken')} busy={busy === `${next.medication_id}${next.time}taken`} />
          <Button title="I missed it" variant="secondary" onPress={() => log(next, 'missed')} busy={busy === `${next.medication_id}${next.time}missed`} />
        </Card>
      ) : data?.day.doses.length ? (
        <Notice tone="ok">All done for today. Well done.</Notice>
      ) : null}

      {data?.day.doses.length ? <Heading>Today</Heading> : null}
      {data?.day.doses.map((d) => (
        <Card key={`${d.medication_id}${d.time}`}>
          <Row>
            <Text style={{ color: c.ink, fontSize: 22, fontWeight: '800', width: 70 }}>{d.time}</Text>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: c.ink, fontSize: 18, fontWeight: '600' }}>{d.name}</Text>
              <Text style={{ color: c.inkSoft, fontSize: 15 }}>
                {d.amount}
                {d.meal ? `, ${d.meal}` : ''}
              </Text>
            </View>
            <Badge label={STATUS[d.status]} tone={d.status === 'taken' ? 'ok' : d.status === 'due' ? 'brand' : 'neutral'} severity={d.status === 'missed' ? 2 : d.status === 'on_hold' ? 1 : undefined} />
          </Row>
          {d.hold_note ? <Notice tone="warn">{d.hold_note}</Notice> : null}
          {d.status === 'due' || d.status === 'upcoming' ? (
            <Row>
              <View style={{ flex: 1 }}>
                <Button title="Took it" variant="secondary" onPress={() => log(d, 'taken')} busy={busy === `${d.medication_id}${d.time}taken`} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Missed" variant="ghost" onPress={() => log(d, 'missed')} busy={busy === `${d.medication_id}${d.time}missed`} />
              </View>
            </Row>
          ) : null}
        </Card>
      ))}

      {data?.day.as_needed.length ? (
        <Card>
          <Heading>Only when needed</Heading>
          {data.day.as_needed.map((m) => (
            <Body key={m.medication_id}>{m.name}</Body>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
