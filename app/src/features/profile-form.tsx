import { useState } from 'react';
import { View } from 'react-native';
import { api, errorMessage } from '@/lib/api';
import type { Patient } from '@/lib/types';
import { Button, ErrorText, Group, Input, Pills } from '@/ui/kit';

const GENDERS = [
  { value: 'female' as const, label: 'Female' },
  { value: 'male' as const, label: 'Male' },
  { value: 'other' as const, label: 'Other' },
];

export function ProfileForm({ forSelf, onDone }: { forSelf: boolean; onDone: (patient: Patient) => void }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'female' | 'male' | 'other' | null>(null);
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('');
  const [abha, setAbha] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const patient = await api<Patient>('/v1/patients', {
        method: 'POST',
        body: {
          for_self: forSelf,
          full_name: name.trim(),
          age: Number(age),
          gender,
          phone: forSelf ? undefined : phone || undefined,
          relation: forSelf ? undefined : relation.trim() || undefined,
          abha_address: abha.trim() || undefined,
        },
      });
      onDone(patient);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const valid = name.trim().length > 0 && Number(age) > 0 && Number(age) < 121 && gender;

  return (
    <View style={{ gap: 20 }}>
      <Group>
        <Input label="Full name" value={name} onChangeText={setName} textContentType="name" autoComplete={forSelf ? 'name' : 'off'} />
        <Input label="Age" value={age} onChangeText={setAge} keyboardType="number-pad" maxLength={3} />
        {!forSelf ? <Input label="Relation" value={relation} onChangeText={setRelation} placeholder="Father" /> : null}
        {!forSelf ? <Input label="Their mobile (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" /> : null}
        <Input label="ABHA address (optional)" value={abha} onChangeText={setAbha} autoCapitalize="none" autoCorrect={false} placeholder="name@abdm" />
      </Group>
      <Pills value={gender} onChange={setGender} options={GENDERS} />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button title="Continue" onPress={save} busy={busy} disabled={!valid} />
    </View>
  );
}
