'use client';

import { useActionState } from 'react';
import { Button } from '@/shared/ui/action/Button';
import { Callout } from '@/shared/ui/status/Callout';
import { Inline } from '@/shared/ui/layout/Page';
import { IDLE } from '@/shared/lib/action-state';
import { recordCheck } from '../api/actions';

export function FlagActions({ token, flagId, answered = false }: { token: string; flagId: string; answered?: boolean }) {
  const [state, action, pending] = useActionState(recordCheck.bind(null, token, flagId), IDLE);
  if (state.status === 'ok') return <Callout tone="success" title={state.message} />;
  return (
    <form action={action}>
      <Inline>
        <Button type="submit" name="action" value="told_patient" variant="primary" pending={pending}>
          Told the patient
        </Button>
        {answered ? null : (
          <Button type="submit" name="action" value="message_doctor" pending={pending}>
            Message the doctor
          </Button>
        )}
      </Inline>
      {state.status === 'error' ? <Callout tone="danger" title={state.message} /> : null}
    </form>
  );
}
