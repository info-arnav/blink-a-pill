'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/action/Button';
import { Field, Fieldset } from '@/shared/ui/field/Field';
import { Callout } from '@/shared/ui/status/Callout';
import { Stack } from '@/shared/ui/layout/Page';
import { IDLE } from '@/shared/lib/action-state';
import { verifyList } from '../api/actions';
import styles from './verify.module.css';

export function VerifyForm({ token, medications }: { token: string; medications: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(verifyList.bind(null, token), IDLE);
  const router = useRouter();

  useEffect(() => {
    if (state.status === 'ok') router.refresh();
  }, [state.status, router]);

  if (state.status === 'ok') return <Callout tone="success" title="List verified">{state.message}</Callout>;

  return (
    <form action={action}>
      <Stack gap={6}>
        <Fieldset legend="Medicines you reviewed with the patient">
          {medications.map((m) => (
            <label key={m.id} className={styles.check}>
              <input type="checkbox" name="medication_ids" value={m.id} defaultChecked />
              {m.name}
            </label>
          ))}
        </Fieldset>
        <div className={styles.pair}>
          <Field label="Name" name="name" required maxLength={120} autoComplete="name" />
          <Field label="Registration number" name="registration_number" required pattern="[A-Za-z0-9/\-]{3,30}" mono />
        </div>
        <Field label="Council" name="registration_council" maxLength={80} hint="Optional." />
        {state.status === 'error' ? <Callout tone="danger" title={state.message} /> : null}
        <Button type="submit" pending={pending}>
          Mark as verified by me
        </Button>
      </Stack>
    </form>
  );
}
