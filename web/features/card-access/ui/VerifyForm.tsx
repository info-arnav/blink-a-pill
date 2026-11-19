'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useActionState } from 'react';
import { Button, Field, Notice, Stack } from '@/shared/ui/primitives';
import { IDLE } from '@/shared/lib/action-state';
import { verifyList } from '../api/actions';
import styles from './verify.module.css';

export function VerifyForm({ token, medications }: { token: string; medications: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(verifyList.bind(null, token), IDLE);
  const router = useRouter();
  useEffect(() => {
    if (state.status === 'ok') router.refresh();
  }, [state.status, router]);
  if (state.status === 'ok') return <Notice tone="ok">{state.message}</Notice>;
  return (
    <form action={action}>
      <Stack>
        <fieldset className={styles.group}>
          <legend className={styles.legend}>Medicines you have reviewed with the patient</legend>
          {medications.map((m) => (
            <label key={m.id} className={styles.check}>
              <input type="checkbox" name="medication_ids" value={m.id} defaultChecked />
              {m.name}
            </label>
          ))}
        </fieldset>
        <Field label="Your name" name="name" required maxLength={120} />
        <Field label="Medical registration number" name="registration_number" required pattern="[A-Za-z0-9/\-]{3,30}" />
        <Field label="Council (optional)" name="registration_council" maxLength={80} />
        {state.status === 'error' ? <Notice tone="error">{state.message}</Notice> : null}
        <Button type="submit" variant="secondary" disabled={pending} block>
          {pending ? 'Saving…' : 'Mark these as verified by me'}
        </Button>
      </Stack>
    </form>
  );
}
