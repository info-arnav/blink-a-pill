import { useState } from 'react';
import { router } from 'expo-router';
import { api, errorMessage } from '@/lib/api';
import { usePatient, useSession } from '@/lib/session';
import { useData } from '@/lib/use-data';
import type { Patient } from '@/lib/types';
import { Body, Button, Card, Field, Heading, ListItem, Notice, Screen, Title } from '@/ui/kit';
import { useColors } from '@/ui/theme';
import { Text } from 'react-native';

type Member = { id: string; name: string | null; phone: string; role: 'self' | 'caregiver'; relation: string | null };

export default function People() {
  const patient = usePatient();
  const { patients, choose, refresh, user } = useSession();
  const c = useColors();
  const [invite, setInvite] = useState<{ code: string; expires_at: string } | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { data: members, reload } = useData(() => api<Member[]>(`/v1/patients/${patient.id}/members`), [patient.id]);

  const makeInvite = async () => {
    setError(null);
    try {
      setInvite(await api(`/v1/patients/${patient.id}/invites`, { method: 'POST', body: {} }));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const join = async () => {
    setBusy(true);
    setError(null);
    try {
      const joined = await api<Patient>('/v1/patients/invites/accept', { method: 'POST', body: { code: code.trim() } });
      await refresh();
      await choose(joined.id);
      setCode('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (member: Member) => {
    try {
      await api(`/v1/patients/${patient.id}/members/${member.id}`, { method: 'DELETE' });
      void reload();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Screen edges={['bottom']}>
      <Title eyebrow="Family and caregivers">People you manage</Title>
      <Card>
        {patients.map((p) => (
          <ListItem key={p.id} title={p.role === 'self' ? `${p.full_name} (me)` : p.full_name} subtitle={p.role === 'caregiver' ? `You are a caregiver${p.relation ? ` · ${p.relation}` : ''}` : 'Your own profile'} onPress={() => { void choose(p.id); router.back(); }} />
        ))}
        <Button title="Add someone I care for" variant="secondary" onPress={() => router.push('/profile-new')} />
      </Card>

      <Card>
        <Heading>Who can manage {patient.full_name.split(' ')[0]}’s medicines</Heading>
        {(members ?? []).map((m) => (
          <ListItem
            key={m.id}
            title={`${m.name ?? 'Unnamed'}${m.id === user?.id ? ' (you)' : ''}`}
            subtitle={m.role === 'self' ? 'Patient' : `Caregiver${m.relation ? ` · ${m.relation}` : ''}`}
            right={patient.role === 'self' && m.role === 'caregiver' ? <Button title="Remove" variant="ghost" onPress={() => remove(m)} /> : undefined}
          />
        ))}
        <Button title="Invite a family member" onPress={makeInvite} />
        {invite ? (
          <Notice tone="info">
            Ask them to install blink-a-pill and enter this code:{' '}
            <Text style={{ fontWeight: '800', letterSpacing: 4, color: c.ink }}>{invite.code}</Text>. It works for 48 hours.
          </Notice>
        ) : null}
      </Card>

      <Card>
        <Heading>Got a family code?</Heading>
        <Body muted>Enter the code a family member gave you to help manage their medicines.</Body>
        <Field label="Family code" value={code} onChangeText={(v) => setCode(v.toUpperCase())} autoCapitalize="characters" maxLength={6} />
        <Button title="Join" variant="secondary" onPress={join} busy={busy} disabled={code.trim().length !== 6} />
      </Card>
      {error ? <Notice tone="error">{error}</Notice> : null}
    </Screen>
  );
}
