'use client';

import { useActionState } from 'react';
import { Button } from '@/shared/ui/action/Button';
import { Field } from '@/shared/ui/field/Field';
import { Stack } from '@/shared/ui/layout/Page';
import { IDLE } from '@/shared/lib/action-state';
import { openCard } from '../api/open-card';

export function OpenCardForm() {
  const [state, action, pending] = useActionState(openCard, IDLE);
  return (
    <form action={action}>
      <Stack gap={3}>
        <Field label="Card link or code" name="card" required autoComplete="off" placeholder="https://…/c/…" error={state.status === 'error' ? state.message : undefined} />
        <div>
          <Button type="submit" pending={pending}>
            Open card
          </Button>
        </div>
      </Stack>
    </form>
  );
}
