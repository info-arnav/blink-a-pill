import { useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import type { Medication } from '@/lib/types';
import { Body, Button, Card, Heading, Notice } from '@/ui/kit';

export function CoursePrompt({ patientId, medication, onDone }: { patientId: string; medication: Medication; onDone: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stoppedEarly, setStoppedEarly] = useState(false);

  const answer = async (outcome: 'finished' | 'stopped_early' | 'continuing') => {
    setBusy(outcome);
    setError(null);
    try {
      await api(`/v1/patients/${patientId}/medications/${medication.id}/course`, { method: 'POST', body: { outcome } });
      if (outcome === 'stopped_early') setStoppedEarly(true);
      else onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  if (stoppedEarly) {
    return (
      <Card tone="brand">
        <Heading>Thank you for telling us</Heading>
        <Body>Stopping an antibiotic early can let the infection come back and helps germs become resistant. Please tell your doctor that you stopped, especially if you still feel unwell.</Body>
        <Button title="OK" onPress={onDone} />
      </Card>
    );
  }

  return (
    <Card tone="brand">
      <Heading>Your antibiotic course should be over</Heading>
      <Body>
        {medication.name} was for {medication.duration_days} days. Did you finish it?
      </Body>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Button title="Yes, I finished it" onPress={() => answer('finished')} busy={busy === 'finished'} />
      <Button title="I stopped early" variant="secondary" onPress={() => answer('stopped_early')} busy={busy === 'stopped_early'} />
      <Button title="My doctor told me to continue" variant="ghost" onPress={() => answer('continuing')} busy={busy === 'continuing'} />
    </Card>
  );
}
