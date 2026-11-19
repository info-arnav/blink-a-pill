import { useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import { useSession } from '@/lib/session';
import type { Patient } from '@/lib/types';
import { ProfileForm } from '@/features/profile-form';
import { Body, Button, Card, Chips, Field, Notice, Screen, Title } from '@/ui/kit';

export default function Onboarding() {
  const { refresh, choose, user, signOut } = useSession();
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
      const patient = await api<Patient>('/v1/patients/invites/accept', { method: 'POST', body: { code: code.trim() } });
      await done(patient);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Title eyebrow={user?.name ? `Hello, ${user.name.split(' ')[0]}` : 'Welcome'}>Who is this for?</Title>
      <Body muted>A caregiver can look after the medicines of a parent or grandparent from their own phone.</Body>
      <Chips
        value={mode}
        onChange={setMode}
        options={[
          { value: 'self', label: 'Me' },
          { value: 'other', label: 'Someone I care for' },
          { value: 'code', label: 'I have a family code' },
        ]}
      />
      {mode === 'self' ? <ProfileForm forSelf onDone={done} /> : null}
      {mode === 'other' ? <ProfileForm forSelf={false} onDone={done} /> : null}
      {mode === 'code' ? (
        <Card>
          <Field label="6 character family code" value={code} onChangeText={(v) => setCode(v.toUpperCase())} autoCapitalize="characters" maxLength={6} hint="The patient makes this code in For me, then Family and caregivers." />
          {error ? <Notice tone="error">{error}</Notice> : null}
          <Button title="Join" onPress={accept} busy={busy} disabled={code.trim().length !== 6} />
        </Card>
      ) : null}
      <Button title="Sign out" variant="ghost" onPress={signOut} />
    </Screen>
  );
}
