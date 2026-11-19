import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { api } from '@/lib/api';
import { usePatient } from '@/lib/session';
import { useData } from '@/lib/use-data';
import type { Medication } from '@/lib/types';
import { PatientSwitcher } from '@/features/patient-switcher';
import { Badge, Body, Button, Card, Chips, Divider, ListItem, Loading, Notice, Screen, Title } from '@/ui/kit';
import { medicineSubtitle } from '@/lib/format';

export default function Cabinet() {
  const patient = usePatient();
  const [show, setShow] = useState<'current' | 'past'>('current');
  const { data, error, loading, reload } = useData(() => api<Medication[]>(`/v1/patients/${patient.id}/medications?all=1`), [patient.id]);

  const list = (data ?? []).filter((m) => (show === 'current' ? m.status === 'active' : m.status !== 'active'));

  return (
    <Screen refreshing={loading && Boolean(data)} onRefresh={reload}>
      <PatientSwitcher />
      <Title eyebrow="Medicine cabinet">Everything you take</Title>
      <Button title="Add from a photo" onPress={() => router.push('/add-photo')} />
      <Button title="Type a medicine" variant="secondary" onPress={() => router.push('/add-manual')} />
      <Chips
        value={show}
        onChange={setShow}
        options={[
          { value: 'current', label: 'Taking now' },
          { value: 'past', label: 'Stopped or finished' },
        ]}
      />
      {!data && !error ? <Loading /> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      {data && !list.length ? <Body muted>{show === 'current' ? 'No medicines yet.' : 'Nothing here yet.'}</Body> : null}
      {list.length ? (
        <Card>
          {list.map((m, index) => (
            <View key={m.id}>
              <ListItem
                title={m.name}
                subtitle={`${medicineSubtitle(m)}${m.prescriber ? `\nBy ${m.prescriber.name}` : ''}`}
                right={m.is_antibiotic ? <Badge label="Antibiotic" tone="brand" /> : m.source === 'abha' ? <Badge label="ABHA" /> : undefined}
                onPress={() => router.push(`/medicine/${m.id}`)}
              />
              {index < list.length - 1 ? <Divider /> : null}
            </View>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
