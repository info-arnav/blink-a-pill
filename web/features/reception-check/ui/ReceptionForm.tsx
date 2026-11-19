'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/action/Button';
import { Field, Fieldset, RadioCard } from '@/shared/ui/field/Field';
import { Callout } from '@/shared/ui/status/Callout';
import { Stack } from '@/shared/ui/layout/Page';
import { IDLE } from '@/shared/lib/action-state';
import { submitReception } from '../api/actions';

export function ReceptionForm({ token, doctor }: { token: string; doctor: string }) {
  const [state, action, pending] = useActionState(submitReception.bind(null, token), IDLE);
  const router = useRouter();

  useEffect(() => {
    if (state.status === 'ok') router.refresh();
  }, [state.status, router]);

  if (state.status === 'ok') return <Callout tone="success" title={state.message} />;

  return (
    <form action={action}>
      <Stack gap={6}>
        <Fieldset legend="Does this list match your records?">
          <RadioCard name="result" value="matches" title="Yes, it matches" detail={`${doctor} gets one message to decide.`} required />
          <RadioCard name="result" value="does_not_match" title="No, it does not match" detail="The patient is asked to bring the prescription to the next visit." />
        </Fieldset>
        <Field label="Your name" name="staff_name" autoComplete="name" required maxLength={120} />
        <Field label="Note for the record" name="note" maxLength={500} hint="Optional." />
        {state.status === 'error' ? <Callout tone="danger" title={state.message} /> : null}
        <Button type="submit" variant="primary" size="large" pending={pending} block>
          Send answer
        </Button>
      </Stack>
    </form>
  );
}
