import { useState } from 'react';
import { View } from 'react-native';
import { api, errorMessage } from '@/lib/api';
import type { Medication } from '@/lib/types';
import { Button, ErrorText, Group, Txt } from '@/ui/kit';
import { useColors } from '@/ui/theme';

export function CoursePrompt({ patientId, medication, onDone }: { patientId: string; medication: Medication; onDone: () => void }) {
  const c = useColors();
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

  return (
    <Group header="Antibiotic Course">
      <View style={{ padding: 16, gap: 12 }}>
        {stoppedEarly ? (
          <>
            <Txt>Please tell your doctor you stopped early, especially if you still feel unwell.</Txt>
            <Button title="OK" kind="tinted" size="medium" onPress={onDone} />
          </>
        ) : (
          <>
            <Txt>
              Did you finish <Txt weight="600">{medication.name}</Txt>?
            </Txt>
            <Txt style="footnote" color={c.secondaryLabel}>
              It was for {medication.duration_days} days.
            </Txt>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Button title="Stopped Early" kind="gray" size="medium" onPress={() => answer('stopped_early')} busy={busy === 'stopped_early'} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Finished" kind="tinted" size="medium" onPress={() => answer('finished')} busy={busy === 'finished'} />
              </View>
            </View>
            <Button title="Doctor said to continue" kind="plain" size="small" onPress={() => answer('continuing')} busy={busy === 'continuing'} />
          </>
        )}
        {error ? <ErrorText>{error}</ErrorText> : null}
      </View>
    </Group>
  );
}
