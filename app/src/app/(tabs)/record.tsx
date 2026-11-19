import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { api, errorMessage } from '@/lib/api';
import { usePatient } from '@/lib/session';
import { useData } from '@/lib/use-data';
import { formatDate } from '@/lib/format';
import type { Flag, Lab, Medication } from '@/lib/types';
import { PatientSwitcher } from '@/features/patient-switcher';
import { Badge, Body, Button, Card, Divider, Field, Heading, ListItem, Loading, Notice, Row, Screen, Title } from '@/ui/kit';

type Condition = { id: string; name: string; source: string };

export default function Record() {
  const patient = usePatient();
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
    return { labs: labs.latest, conditions, meds, flags };
  }, [patient.id]);

  const addCondition = async () => {
    setError(null);
    try {
      await api(`/v1/patients/${patient.id}/conditions`, { method: 'POST', body: { name: condition.trim() } });
      setCondition('');
      void reload();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const byDoctor = new Map<string, Medication[]>();
  for (const m of data?.meds ?? []) {
    const key = m.prescriber?.name ?? 'Doctor not recorded';
    byDoctor.set(key, [...(byDoctor.get(key) ?? []), m]);
  }
  const pastFlags = (data?.flags ?? []).filter((f) => f.status !== 'no_longer_applies');

  return (
    <Screen refreshing={loading && Boolean(data)} onRefresh={reload}>
      <PatientSwitcher />
      <Title eyebrow="My record">
        {patient.full_name}, {patient.age}
      </Title>
      {!data ? <Loading /> : null}

      <Card>
        <Heading>ABHA health records</Heading>
        {patient.abha_address ? <Body>Linked: {patient.abha_address}</Body> : <Body muted>Bring in past prescriptions and test results from your ABHA account, with your consent.</Body>}
        <Button title={patient.abha_address ? 'Fetch records again' : 'Link ABHA'} variant="secondary" onPress={() => router.push('/abha')} />
      </Card>

      <Card>
        <Row>
          <View style={{ flex: 1 }}>
            <Heading>Test results</Heading>
          </View>
          <Button title="Add" variant="ghost" onPress={() => router.push('/lab')} />
        </Row>
        {data && !data.labs.length ? <Body muted>Type in values from your lab report, like creatinine or HbA1c. They help us check doses for your kidneys and liver.</Body> : null}
        {data?.labs.map((l) => (
          <ListItem
            key={l.id}
            title={`${l.label ?? l.kind}: ${l.value ?? l.value_text}${l.kind === 'child_pugh' ? '' : ` ${l.unit ?? ''}`}`}
            subtitle={`${formatDate(l.measured_on)} · ${l.source === 'computed' ? 'calculated' : l.source === 'abha' ? 'from ABHA' : 'typed by you'}`}
          />
        ))}
      </Card>

      <Card>
        <Heading>Conditions</Heading>
        {data?.conditions.map((c) => (
          <Row key={c.id}>
            <View style={{ flex: 1 }}>
              <Body>{c.name}</Body>
            </View>
            {c.source === 'abha' ? <Badge label="ABHA" /> : null}
          </Row>
        ))}
        <Field label="Add a condition" value={condition} onChangeText={setCondition} placeholder="For example Diabetes" />
        {error ? <Notice tone="error">{error}</Notice> : null}
        <Button title="Add condition" variant="secondary" onPress={addCondition} disabled={!condition.trim()} />
      </Card>

      <Card>
        <Heading>Prescriptions by doctor</Heading>
        {[...byDoctor.entries()].map(([doctor, meds], index) => (
          <View key={doctor} style={{ gap: 4 }}>
            {index > 0 ? <Divider /> : null}
            <Body bold>{doctor}</Body>
            {meds.map((m) => (
              <Body key={m.id} muted>
                {m.name}
                {m.prescribed_on ? `, ${formatDate(m.prescribed_on)}` : ''}
                {m.status !== 'active' ? ` (${m.status_reason ?? 'stopped'})` : ''}
              </Body>
            ))}
          </View>
        ))}
        {data && !data.meds.length ? <Body muted>No prescriptions yet.</Body> : null}
      </Card>

      {pastFlags.length ? (
        <Card>
          <Heading>Things checked with a doctor</Heading>
          {pastFlags.map((f) => (
            <ListItem key={f.id} title={f.title} subtitle={f.decision?.text ?? f.status_label} onPress={() => router.push(`/concern/${f.id}`)} right={f.is_open ? <Badge label="Open" severity={f.severity} /> : <Badge label="Answered" tone="ok" />} />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
