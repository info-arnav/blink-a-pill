import { useState } from 'react';
import { Alert, Share, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { api, errorMessage } from '@/lib/api';
import { usePatient } from '@/lib/session';
import { useData } from '@/lib/use-data';
import type { Card as PatientCard } from '@/lib/types';
import { Button, Cell, ErrorText, Group, Loading, Screen, Txt } from '@/ui/kit';
import { useColors } from '@/ui/theme';

type Pharmacy = { id: string; name: string; licence_number: string; granted_at: string };
type CardView = { viewer: string; viewed_at: string };

const when = (value: string) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value));

export default function MyCard() {
  const patient = usePatient();
  const c = useColors();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, loading, reload } = useData(async () => {
    const base = `/v1/patients/${patient.id}/card`;
    const [card, pharmacies, views] = await Promise.all([api<PatientCard>(base), api<Pharmacy[]>(`${base}/pharmacies`), api<CardView[]>(`${base}/views`)]);
    return { card, pharmacies, views };
  }, [patient.id]);

  const regenerate = () =>
    Alert.alert('New QR code and PIN?', 'The old ones stop working. Pharmacies will need the new PIN.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Make New',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          setError(null);
          try {
            await api(`/v1/patients/${patient.id}/card/regenerate`, { method: 'POST' });
            await reload();
          } catch (err) {
            setError(errorMessage(err));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);

  const revoke = (pharmacy: Pharmacy) =>
    Alert.alert(`Remove ${pharmacy.name}?`, 'They will need your PIN again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await api(`/v1/patients/${patient.id}/card/pharmacies/${pharmacy.id}`, { method: 'DELETE' }).catch((err) => setError(errorMessage(err)));
          void reload();
        },
      },
    ]);

  if (!data) return <Screen>{loading ? <Loading /> : null}</Screen>;

  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <Group>
        <View style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16, gap: 4 }}>
          <Txt style="title2">{patient.full_name}</Txt>
          <Txt style="subhead" color={c.secondaryLabel}>
            {patient.age} · {patient.gender === 'female' ? 'Female' : patient.gender === 'male' ? 'Male' : 'Other'}
          </Txt>
          <View style={{ marginVertical: 16, padding: 12, backgroundColor: '#FFFFFF', borderRadius: 16 }} accessibilityLabel="Card QR code">
            <SvgXml xml={data.card.qr_svg} width={220} height={220} />
          </View>
          <Txt style="footnote" color={c.secondaryLabel}>
            PIN
          </Txt>
          <Txt style="largeTitle" selectable>
            {data.card.pin.replace(/(\d{3})(\d{3})/, '$1 $2')}
          </Txt>
        </View>
      </Group>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Button title="Share" symbol="square.and.arrow.up" kind="tinted" onPress={() => Share.share({ url: data.card.url, message: data.card.url })} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="New PIN" symbol="arrow.clockwise" kind="gray" onPress={regenerate} busy={busy} />
        </View>
      </View>
      {error ? <ErrorText>{error}</ErrorText> : null}

      <Group header="Pharmacies" footer={data.pharmacies.length ? undefined : 'A pharmacy needs your PIN the first time.'}>
        {data.pharmacies.map((p) => (
          <Cell key={p.id} title={p.name} subtitle={`Licence ${p.licence_number}`} trailing={<Button title="Remove" kind="plain" size="small" onPress={() => revoke(p)} />} />
        ))}
      </Group>

      {data.views.length ? (
        <Group header="Opened By">
          {data.views.slice(0, 6).map((v) => (
            <Cell key={v.viewed_at} title={v.viewer} value={when(v.viewed_at)} />
          ))}
        </Group>
      ) : null}
    </Screen>
  );
}
