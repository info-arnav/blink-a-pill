'use client';

import { useActionState } from 'react';
import { Button, Notice, Row } from '@/shared/ui/primitives';
import { IDLE } from '@/shared/lib/action-state';
import { recordCheck } from '../api/actions';

export function FlagActions({ token, flagId }: { token: string; flagId: string }) {
  const [state, action, pending] = useActionState(recordCheck.bind(null, token, flagId), IDLE);
  if (state.status === 'ok') return <Notice tone="ok">{state.message}</Notice>;
  return (
    <form action={action}>
      <Row>
        <Button type="submit" name="action" value="told_patient" disabled={pending}>
          Told the patient
        </Button>
        <Button type="submit" name="action" value="message_doctor" variant="secondary" disabled={pending}>
          Message the doctor
        </Button>
      </Row>
      {state.status === 'error' ? <Notice tone="error">{state.message}</Notice> : null}
    </form>
  );
}
