import { useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import type { Patient } from '@/lib/types';
import { Body, Button, Card, Chips, Field, Notice } from '@/ui/kit';

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
    <Card>
      <Field label={forSelf ? 'Your full name' : 'Their full name'} value={name} onChangeText={setName} textContentType="name" />
      <Field label="Age" value={age} onChangeText={setAge} keyboardType="number-pad" maxLength={3} />
      <Body bold>Gender</Body>
      <Chips
        value={gender}
        onChange={setGender}
        options={[
          { value: 'female', label: 'Female' },
          { value: 'male', label: 'Male' },
          { value: 'other', label: 'Other' },
        ]}
      />
      {!forSelf ? (
        <>
          <Field label="Relation to you" value={relation} onChangeText={setRelation} placeholder="Father, mother, grandparent" />
          <Field label="Their mobile number (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" hint="Doctor answers are sent to this number. Leave empty to use yours." />
        </>
      ) : null}
      <Field label="ABHA address (optional)" value={abha} onChangeText={setAbha} autoCapitalize="none" placeholder="name@abdm" hint="You can link ABHA records later from My record." />
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Button title="Save" onPress={save} busy={busy} disabled={!valid} />
    </Card>
  );
}
