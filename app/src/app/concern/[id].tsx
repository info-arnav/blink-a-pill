import { useEffect, useState } from 'react';
import { Linking, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { api, errorMessage } from '@/lib/api';
import { usePatient } from '@/lib/session';
import { useData } from '@/lib/use-data';
import type { Flag, Medication } from '@/lib/types';
import { Banner, Button, Cell, ErrorText, Group, Icon, Input, Loading, Screen, Txt } from '@/ui/kit';
import { severityColor, useColors } from '@/ui/theme';

const when = (value: string) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value));

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
    const [flag, meds] = await Promise.all([api<Flag>(`/v1/patients/${patient.id}/flags/${id}`), api<Medication[]>(`/v1/patients/${patient.id}/medications?all=1`)]);
    return { flag, meds };
  }, [patient.id, id]);

  useEffect(() => {
    if (!data) return;
    const involved = data.meds.filter((m) => data.flag.medication_ids.includes(m.id)).sort((a, b) => (b.prescribed_on ?? '').localeCompare(a.prescribed_on ?? ''));
    const newest = involved.find((m) => m.prescriber?.phone) ?? involved.find((m) => m.prescriber) ?? null;
    if (newest?.prescriber) setDoctor((d) => (d.name ? d : { name: newest.prescriber!.name, phone: newest.prescriber!.phone?.slice(-10) ?? '' }));
    if (newest?.clinic) setClinic((cl) => (cl.name ? cl : { name: newest.clinic!.name, phone: newest.clinic!.reception_phone?.slice(-10) ?? '' }));
  }, [data]);

  if (!data) return <Loading />;
  const { flag } = data;
  const tone = severityColor(c, flag.severity);

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
      setSent(result.routed_to === 'reception' ? `Sent to ${result.clinic}. Then ${result.doctor} decides.` : `Sent to ${result.doctor}.`);
      setAsking(false);
      void reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="exclamationmark.triangle.fill" size={18} color={tone.fg} fallback="!" />
          <Txt style="subhead" color={tone.fg} weight="600">
            {flag.severity_label}
          </Txt>
        </View>
        <Txt style="title1">{flag.title}</Txt>
        <Txt style="body" color={c.secondaryLabel}>
          {flag.patient_text}
        </Txt>
      </View>

      {fresh ? <Banner tone="tint" symbol="info.circle.fill" title="Nothing has been changed." /> : null}

      {flag.decision ? (
        <Banner tone="green" symbol="checkmark.seal.fill" title={flag.decision.text ?? 'Answered'}>
          {`${flag.decision.by}${flag.decision.registration ? ` · Reg. ${flag.decision.registration}` : ''} · ${when(flag.decision.at)}`}
        </Banner>
      ) : null}

      {sent ? <Banner tone="green" symbol="paperplane.fill" title={sent} /> : null}

      {flag.is_open && !asking ? <Button title={flag.status === 'open' ? 'Ask My Doctor' : 'Ask Again'} symbol="stethoscope" onPress={() => setAsking(true)} /> : null}

      {asking ? (
        <View style={{ gap: 16 }}>
          <Group header="Ask My Doctor" footer="The message has no medicine names. They see details after opening the link.">
            <Input label="Doctor" value={doctor.name} onChangeText={(name) => setDoctor((d) => ({ ...d, name }))} />
            <Input label="Doctor’s WhatsApp" value={doctor.phone} onChangeText={(phone) => setDoctor((d) => ({ ...d, phone }))} keyboardType="phone-pad" />
            <Input label="Clinic (optional)" value={clinic.name} onChangeText={(name) => setClinic((cl) => ({ ...cl, name }))} />
            <Input label="Reception WhatsApp (optional)" value={clinic.phone} onChangeText={(phone) => setClinic((cl) => ({ ...cl, phone }))} keyboardType="phone-pad" />
          </Group>
          {error ? <ErrorText>{error}</ErrorText> : null}
          <Button title="Send" onPress={ask} busy={busy} disabled={!doctor.name.trim() || doctor.phone.replace(/\D/g, '').length < 10} />
          <Button title="Cancel" kind="plain" size="medium" onPress={() => setAsking(false)} />
        </View>
      ) : null}

      <Group header="Medicines">
        {(flag.medications ?? []).map((m) => (
          <Cell key={m.id} title={m.name} value={m.status !== 'active' ? 'Stopped' : undefined} />
        ))}
      </Group>

      <Group header="Why" footer={`Rules ${flag.rules_version}`}>
        {flag.reasoning.map((r) => (
          <Cell key={r} title={r} />
        ))}
        {flag.sources
          .filter((s) => s.url)
          .map((s) => (
            <Cell key={s.label} title={s.label} tint onPress={() => Linking.openURL(s.url!)} />
          ))}
      </Group>

      {flag.events?.length ? (
        <Group header="History">
          {flag.events.map((e) => (
            <Cell key={e.id} title={`${e.actor_name} ${e.action}`} subtitle={`${e.actor_ref ? `${e.actor_ref} · ` : ''}${when(e.created_at)}`} />
          ))}
        </Group>
      ) : null}
    </Screen>
  );
}
