import { useEffect, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { api, errorMessage } from '@/lib/api';
import { usePatient } from '@/lib/session';
import { useData } from '@/lib/use-data';
import type { Flag, Medication } from '@/lib/types';
import { Badge, Body, Button, Card, Field, Heading, Loading, Notice, Screen } from '@/ui/kit';
import { severityColors, useColors } from '@/ui/theme';

function formatWhen(value: string) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default function Concern() {
  const { id, fresh } = useLocalSearchParams<{ id: string; fresh?: string }>();
  const patient = usePatient();
  const c = useColors();
  const [asking, setAsking] = useState(false);
  const [doctor, setDoctor] = useState({ name: '', phone: '' });
  const [clinic, setClinic] = useState({ name: '', phone: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  const { data, reload } = useData(async () => {
    const [flag, meds] = await Promise.all([
      api<Flag>(`/v1/patients/${patient.id}/flags/${id}`),
      api<Medication[]>(`/v1/patients/${patient.id}/medications?all=1`),
    ]);
    return { flag, meds };
  }, [patient.id, id]);

  useEffect(() => {
    if (!data) return;
    const involved = data.meds.filter((m) => data.flag.medication_ids.includes(m.id)).sort((a, b) => (a.prescribed_on ?? '').localeCompare(b.prescribed_on ?? ''));
    const newest = [...involved].reverse().find((m) => m.prescriber?.phone) ?? [...involved].reverse().find((m) => m.prescriber) ?? null;
    if (newest?.prescriber) setDoctor((d) => (d.name ? d : { name: newest.prescriber!.name, phone: newest.prescriber!.phone?.slice(-10) ?? '' }));
    if (newest?.clinic) setClinic((cl) => (cl.name ? cl : { name: newest.clinic!.name, phone: newest.clinic!.reception_phone?.slice(-10) ?? '' }));
  }, [data]);

  if (!data) return <Loading />;
  const { flag } = data;
  const colors = severityColors(c, flag.severity);

  const ask = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await api<{ routed_to: string; doctor: string; clinic?: string }>(`/v1/patients/${patient.id}/flags/${flag.id}/ask`, {
        method: 'POST',
        body: {
          prescriber: { name: doctor.name.trim(), phone: doctor.phone.trim() },
          clinic: clinic.name.trim() ? { name: clinic.name.trim(), reception_phone: clinic.phone.trim() || undefined } : undefined,
        },
      });
      setSent(
        result.routed_to === 'reception'
          ? `Sent. ${result.clinic} reception will first check your list, then ${result.doctor} gets one message to decide.`
          : `Sent. ${result.doctor} gets one message to decide. You will get the answer on WhatsApp and here.`,
      );
      setAsking(false);
      void reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen edges={['bottom']}>
      {fresh ? <Notice tone="warn">We noticed something while adding your medicine. Nothing has been changed.</Notice> : null}
      <View style={{ backgroundColor: colors.bg, borderRadius: 16, padding: 18, gap: 8 }}>
        <Badge label={flag.severity_label} severity={flag.severity} />
        <Text style={{ color: colors.fg, fontSize: 24, fontWeight: '800' }}>{flag.title}</Text>
        <Text style={{ color: c.ink, fontSize: 18, lineHeight: 26 }}>{flag.patient_text}</Text>
      </View>

      {flag.decision ? (
        <Card tone="ok">
          <Heading>Your doctor answered</Heading>
          <Body>{flag.decision.text}</Body>
          <Body small muted>
            {flag.decision.by}
            {flag.decision.registration ? `, Reg. ${flag.decision.registration}` : ''} · {formatWhen(flag.decision.at)}
          </Body>
        </Card>
      ) : (
        <Card>
          <Heading>Where this is</Heading>
          <Body>{flag.status_label}</Body>
        </Card>
      )}

      {sent ? <Notice tone="ok">{sent}</Notice> : null}

      {flag.is_open && !asking ? (
        <Button title={flag.status === 'open' ? 'Ask my doctor' : 'Send to my doctor again'} onPress={() => setAsking(true)} />
      ) : null}

      {asking ? (
        <Card>
          <Heading>Ask my doctor</Heading>
          <Body muted>Check these details. The message only says a patient needs a decision. Medicine names are only shown after they open the link.</Body>
          <Field label="Doctor’s name" value={doctor.name} onChangeText={(name) => setDoctor((d) => ({ ...d, name }))} />
          <Field label="Doctor’s WhatsApp number" value={doctor.phone} onChangeText={(phone) => setDoctor((d) => ({ ...d, phone }))} keyboardType="phone-pad" />
          <Field label="Clinic name (optional)" value={clinic.name} onChangeText={(name) => setClinic((cl) => ({ ...cl, name }))} />
          <Field label="Clinic reception number (optional)" value={clinic.phone} onChangeText={(phone) => setClinic((cl) => ({ ...cl, phone }))} keyboardType="phone-pad" hint="If you add it, reception first confirms your list matches their records." />
          {error ? <Notice tone="error">{error}</Notice> : null}
          <Button title="Send" onPress={ask} busy={busy} disabled={!doctor.name.trim() || doctor.phone.replace(/\D/g, '').length < 10} />
          <Button title="Cancel" variant="ghost" onPress={() => setAsking(false)} />
        </Card>
      ) : null}

      <Card>
        <Heading>Medicines involved</Heading>
        {(flag.medications ?? []).map((m) => (
          <Body key={m.id}>
            {m.name}
            {m.status !== 'active' ? ' (no longer taking)' : ''}
          </Body>
        ))}
      </Card>

      <Card>
        <Heading>Why we flagged this</Heading>
        {flag.reasoning.map((r) => (
          <Body key={r} muted>
            • {r}
          </Body>
        ))}
        {flag.sources.map((s) => (
          <Text key={s.label} style={{ color: s.url ? c.brand : c.inkFaint, fontSize: 15 }} onPress={s.url ? () => Linking.openURL(s.url!) : undefined}>
            {s.label}
          </Text>
        ))}
        <Body small muted>
          Rules version {flag.rules_version}
        </Body>
      </Card>

      {flag.events?.length ? (
        <Card>
          <Heading>What has happened</Heading>
          {flag.events.map((e) => (
            <View key={e.id} style={{ gap: 2 }}>
              <Body small>
                <Text style={{ fontWeight: '700' }}>{e.actor_name}</Text>
                {e.actor_ref ? ` (${e.actor_ref})` : ''} {e.action}
              </Body>
              <Body small muted>
                {formatWhen(e.created_at)}
              </Body>
            </View>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
