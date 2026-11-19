import { useState } from 'react';
import { Alert, Share, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { api, errorMessage } from '@/lib/api';
import { usePatient } from '@/lib/session';
import { useData } from '@/lib/use-data';
import type { Card as PatientCard } from '@/lib/types';
import { PatientSwitcher } from '@/features/patient-switcher';
import { Body, Button, Card, Heading, ListItem, Loading, Notice, Screen, Title } from '@/ui/kit';
import { useColors } from '@/ui/theme';

type Pharmacy = { id: string; name: string; licence_number: string; granted_at: string };
type View_ = { viewer: string; viewed_at: string };

function when(value: string) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default function MyCard() {
  const patient = usePatient();
  const c = useColors();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, loading, reload } = useData(async () => {
    const base = `/v1/patients/${patient.id}/card`;
    const [card, pharmacies, views] = await Promise.all([api<PatientCard>(base), api<Pharmacy[]>(`${base}/pharmacies`), api<View_[]>(`${base}/views`)]);
    return { card, pharmacies, views };
  }, [patient.id]);

  const regenerate = () =>
    Alert.alert('Make a new QR code and PIN?', 'The old QR code and PIN will stop working, and pharmacies will need the new PIN again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Make new',
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

  const revoke = async (pharmacy: Pharmacy) => {
    try {
      await api(`/v1/patients/${patient.id}/card/pharmacies/${pharmacy.id}`, { method: 'DELETE' });
      void reload();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Screen refreshing={loading && Boolean(data)} onRefresh={reload}>
      <PatientSwitcher />
      <Title eyebrow="My card">Show this to your doctor or pharmacist</Title>
      {!data ? <Loading /> : null}
      {data ? (
        <Card style={{ alignItems: 'center' }}>
          <Text style={{ color: c.ink, fontSize: 24, fontWeight: '800' }}>{patient.full_name}</Text>
          <Text style={{ color: c.inkSoft, fontSize: 17 }}>
            {patient.age} years · {patient.gender === 'female' ? 'Female' : patient.gender === 'male' ? 'Male' : 'Other'}
          </Text>
          <View style={{ backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16 }} accessibilityLabel="QR code for your card">
            <SvgXml xml={data.card.qr_svg} width={230} height={230} />
          </View>
          <Text style={{ color: c.inkFaint, fontSize: 14, fontWeight: '700', letterSpacing: 0.8 }}>PIN</Text>
          <Text style={{ color: c.ink, fontSize: 40, fontWeight: '800', letterSpacing: 8 }} accessibilityLabel={`PIN ${data.card.pin.split('').join(' ')}`}>
            {data.card.pin}
          </Text>
          <Body small muted>
            Only share the PIN with the person in front of you.
          </Body>
        </Card>
      ) : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      {data ? (
        <>
          <Button title="Share card link" variant="secondary" onPress={() => Share.share({ message: `My blink-a-pill medicine card: ${data.card.url} (I will tell you the PIN)` })} />
          <Button title="Make a new QR and PIN" variant="ghost" onPress={regenerate} busy={busy} />
          <Card>
            <Heading>Pharmacies that can open your card</Heading>
            {data.pharmacies.length ? (
              data.pharmacies.map((p) => (
                <ListItem key={p.id} title={p.name} subtitle={`Licence ${p.licence_number} · since ${when(p.granted_at)}`} right={<Button title="Remove" variant="ghost" onPress={() => revoke(p)} />} />
              ))
            ) : (
              <Body muted>None yet. A pharmacy needs your PIN the first time.</Body>
            )}
          </Card>
          <Card>
            <Heading>Who opened your card</Heading>
            {data.views.length ? data.views.slice(0, 8).map((v) => <ListItem key={v.viewed_at} title={v.viewer} subtitle={when(v.viewed_at)} />) : <Body muted>Nobody yet.</Body>}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
