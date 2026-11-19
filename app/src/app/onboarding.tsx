import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, errorMessage } from '@/lib/api';
import { useSession } from '@/lib/session';
import type { Patient } from '@/lib/types';
import { ProfileForm } from '@/features/profile-form';
import { Button, Cell, ErrorText, Group, Input, Screen, Tile, Txt } from '@/ui/kit';
import { useColors } from '@/ui/theme';

export default function Onboarding() {
  const { refresh, choose, signOut } = useSession();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'self' | 'other' | 'code' | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const done = async (patient: Patient) => {
    await choose(patient.id);
    await refresh();
  };

  const accept = async () => {
    setBusy(true);
    setError(null);
    try {
      await done(await api<Patient>('/v1/patients/invites/accept', { method: 'POST', body: { code: code.trim() } }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + 24, backgroundColor: c.background }}>
      <Screen>
        <Txt style="largeTitle">{mode === 'self' ? 'About you' : mode === 'other' ? 'About them' : mode === 'code' ? 'Family code' : 'Who is this for?'}</Txt>
        {!mode ? (
          <Group>
            <Cell title="Me" leading={<Tile symbol="person.fill" color={c.tint} />} chevron onPress={() => setMode('self')} />
            <Cell title="Someone I care for" leading={<Tile symbol="figure.2" color={c.orange} />} chevron onPress={() => setMode('other')} />
            <Cell title="I have a family code" leading={<Tile symbol="number" color={c.blue} />} chevron onPress={() => setMode('code')} />
          </Group>
        ) : null}
        {mode === 'self' ? <ProfileForm forSelf onDone={done} /> : null}
        {mode === 'other' ? <ProfileForm forSelf={false} onDone={done} /> : null}
        {mode === 'code' ? (
          <View style={{ gap: 20 }}>
            <Group>
              <Input label="Code" value={code} onChangeText={(v) => setCode(v.toUpperCase())} autoCapitalize="characters" maxLength={6} autoFocus />
            </Group>
            {error ? <ErrorText>{error}</ErrorText> : null}
            <Button title="Join" onPress={accept} busy={busy} disabled={code.trim().length !== 6} />
          </View>
        ) : null}
        {mode ? <Button title="Back" kind="plain" size="medium" onPress={() => setMode(null)} /> : <Button title="Sign Out" kind="plain" size="medium" onPress={signOut} />}
      </Screen>
    </View>
  );
}
