import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { api } from '@/lib/api';
import { usePatient } from '@/lib/session';
import { useData } from '@/lib/use-data';
import { medicineSubtitle } from '@/lib/format';
import type { Medication } from '@/lib/types';
import { Button, Cell, Empty, ErrorText, Group, Loading, Pills, Screen, Txt } from '@/ui/kit';
import { useColors } from '@/ui/theme';

export default function Cabinet() {
  const patient = usePatient();
  const c = useColors();
  const [show, setShow] = useState<'current' | 'past'>('current');
  const { data, error, loading, refreshing, reload, refresh } = useData(() => api<Medication[]>(`/v1/patients/${patient.id}/medications?all=1`), [patient.id]);

  const list = (data ?? []).filter((m) => (show === 'current' ? m.status === 'active' : m.status !== 'active'));

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Button title="Scan" symbol="camera.fill" onPress={() => router.push('/add-photo')} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Type" symbol="keyboard" kind="gray" onPress={() => router.push('/add-manual')} />
        </View>
      </View>
      <Pills
        value={show}
        onChange={setShow}
        options={[
          { value: 'current', label: 'Taking Now' },
          { value: 'past', label: 'Past' },
        ]}
      />
      {!data && !error ? <Loading /> : null}
      {error ? <ErrorText>{error}</ErrorText> : null}
      {data && !list.length ? <Empty symbol="pills" title={show === 'current' ? 'No medicines yet' : 'Nothing here'} /> : null}
      {list.length ? (
        <Group>
          {list.map((m) => (
            <Cell
              key={m.id}
              title={m.name}
              subtitle={medicineSubtitle(m)}
              trailing={m.is_antibiotic ? <Txt style="caption" color={c.tint}>Antibiotic</Txt> : undefined}
              chevron
              onPress={() => router.push(`/medicine/${m.id}`)}
            />
          ))}
        </Group>
      ) : null}
    </Screen>
  );
}
