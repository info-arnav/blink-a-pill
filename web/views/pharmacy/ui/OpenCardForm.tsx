'use client';

import { useActionState } from 'react';
import { Button, Field, Notice, Stack } from '@/shared/ui/primitives';
import { IDLE } from '@/shared/lib/action-state';
import { openCard } from '../api/open-card';

export function OpenCardForm() {
  const [state, action, pending] = useActionState(openCard, IDLE);
  return (
    <form action={action}>
      <Stack>
        <Field label="Card link or code" name="card" required placeholder="https://…/c/abc123…" />
        {state.status === 'error' ? <Notice tone="error">{state.message}</Notice> : null}
        <Button type="submit" disabled={pending} block>
          Open card
        </Button>
      </Stack>
    </form>
  );
}
