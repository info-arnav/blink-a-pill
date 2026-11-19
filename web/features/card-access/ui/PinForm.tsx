'use client';

import { useActionState } from 'react';
import { Button } from '@/shared/ui/action/Button';
import { Field } from '@/shared/ui/field/Field';
import { Stack } from '@/shared/ui/layout/Page';
import { IDLE } from '@/shared/lib/action-state';
import { unlockCard } from '../api/actions';

export function PinForm({ token, forPharmacy }: { token: string; forPharmacy: boolean }) {
  const [state, action, pending] = useActionState(unlockCard.bind(null, token), IDLE);
  return (
    <form action={action}>
      <Stack gap={4}>
        <Field
          label="Patient PIN"
          name="pin"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          required
          mono
          error={state.status === 'error' ? state.message : undefined}
          hint={forPharmacy ? 'Needed once. After that your shop can open this card without it.' : 'Six digits, shown under the QR code in the patient’s app.'}
        />
        <Button type="submit" variant="primary" size="large" pending={pending} block>
          Open card
        </Button>
      </Stack>
    </form>
  );
}
