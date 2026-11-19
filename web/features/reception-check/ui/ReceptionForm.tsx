'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useActionState } from 'react';
import { Button, Choice, Field, Notice, Stack } from '@/shared/ui/primitives';
import { IDLE } from '@/shared/lib/action-state';
import { submitReception } from '../api/actions';

export function ReceptionForm({ token, doctor }: { token: string; doctor: string }) {
  const [state, action, pending] = useActionState(submitReception.bind(null, token), IDLE);
  const router = useRouter();
  useEffect(() => {
    if (state.status === 'ok') router.refresh();
  }, [state.status, router]);
  if (state.status === 'ok') return <Notice tone="ok">{state.message}</Notice>;
  return (
    <form action={action}>
      <Stack>
        <Choice name="result" value="matches" title="Yes, this matches our records" text={`${doctor} will get one message to decide.`} required />
        <Choice name="result" value="does_not_match" title="No, this does not match" text="The patient will be asked to bring their prescription." />
        <Field label="Your name" name="staff_name" autoComplete="name" required maxLength={120} />
        <Field label="Note (optional)" name="note" maxLength={500} />
        {state.status === 'error' ? <Notice tone="error">{state.message}</Notice> : null}
        <Button type="submit" disabled={pending} block>
          {pending ? 'Sending…' : 'Send answer'}
        </Button>
      </Stack>
    </form>
  );
}
