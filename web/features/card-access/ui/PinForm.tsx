'use client';

import { useActionState } from 'react';
import { Button, Field, Notice, Stack } from '@/shared/ui/primitives';
import { IDLE } from '@/shared/lib/action-state';
import { unlockCard } from '../api/actions';

export function PinForm({ token, forPharmacy }: { token: string; forPharmacy: boolean }) {
  const [state, action, pending] = useActionState(unlockCard.bind(null, token), IDLE);
  return (
    <form action={action}>
      <Stack>
        <Field
          label="Patient PIN"
          name="pin"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          required
          hint={forPharmacy ? 'Needed once. After that this shop can open the card without it.' : 'The 6 digit PIN shown on the patient’s card in the app.'}
        />
        {state.status === 'error' ? <Notice tone="error">{state.message}</Notice> : null}
        <Button type="submit" disabled={pending} block>
          {pending ? 'Checking…' : 'Open card'}
        </Button>
      </Stack>
    </form>
  );
}
