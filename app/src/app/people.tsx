import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { api, errorMessage } from '@/lib/api';
import { usePatient, useSession } from '@/lib/session';
import { useData } from '@/lib/use-data';
import type { Patient } from '@/lib/types';
import { Banner, Button, Cell, ErrorText, Group, Icon, Input, Screen } from '@/ui/kit';
import { useColors } from '@/ui/theme';

type Member = { id: string; name: string | null; phone: string; role: 'self' | 'caregiver'; relation: string | null };

export default function People() {
  const patient = usePatient();
  const { patients, choose, refresh, user } = useSession();
  const c = useColors();
  const [invite, setInvite] = useState<{ code: string } | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { data: members, reload } = useData(() => api<Member[]>(`/v1/patients/${patient.id}/members`), [patient.id]);

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

  const remove = (member: Member) =>
    Alert.alert(`Remove ${member.name ?? 'caregiver'}?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await api(`/v1/patients/${patient.id}/members/${member.id}`, { method: 'DELETE' }).catch((err) => setError(errorMessage(err)));
          void reload();
        },
      },
    ]);

  return (
    <Screen>
      <Group header="People">
        {patients.map((p) => (
          <Cell
            key={p.id}
            title={p.role === 'self' ? `${p.full_name} (me)` : p.full_name}
            subtitle={p.role === 'caregiver' ? (p.relation ?? 'Caring for') : undefined}
            trailing={p.id === patient.id ? <Icon name="checkmark" size={17} color={c.tint} fallback="✓" /> : undefined}
            onPress={() => void choose(p.id)}
          />
        ))}
        <Cell title="Add Person" tint onPress={() => router.push('/profile-new')} />
      </Group>

      <Group header={`Managing ${patient.full_name.split(' ')[0]}`}>
        {(members ?? []).map((m) => (
          <Cell
            key={m.id}
            title={`${m.name ?? 'Unnamed'}${m.id === user?.id ? ' (you)' : ''}`}
            subtitle={m.role === 'self' ? 'Patient' : (m.relation ?? 'Caregiver')}
            trailing={patient.role === 'self' && m.role === 'caregiver' ? <Button title="Remove" kind="plain" size="small" onPress={() => remove(m)} /> : undefined}
          />
        ))}
        <Cell
          title="Invite Family Member"
          tint
          onPress={async () => {
            setError(null);
            try {
              setInvite(await api(`/v1/patients/${patient.id}/invites`, { method: 'POST', body: {} }));
            } catch (err) {
              setError(errorMessage(err));
            }
          }}
        />
      </Group>
      {invite ? <Banner tone="tint" symbol="person.badge.plus" title={`Code: ${invite.code}`}>They enter it after signing in. Works for 48 hours.</Banner> : null}

      <Group header="Join With a Code">
        <Input label="Family code" value={code} onChangeText={(v) => setCode(v.toUpperCase())} autoCapitalize="characters" maxLength={6} />
      </Group>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button title="Join" kind="tinted" onPress={join} busy={busy} disabled={code.trim().length !== 6} />
    </Screen>
  );
}
