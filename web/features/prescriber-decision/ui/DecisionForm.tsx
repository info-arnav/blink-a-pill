'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/action/Button';
import { Field, Fieldset, RadioCard, Select } from '@/shared/ui/field/Field';
import { Callout } from '@/shared/ui/status/Callout';
import { Stack } from '@/shared/ui/layout/Page';
import { IDLE } from '@/shared/lib/action-state';
import { submitDecision } from '../api/actions';
import styles from './decision.module.css';

type Med = { id: string; name: string };

export function DecisionForm({
  token,
  doctorName,
  needsRegistration,
  medications,
}: {
  token: string;
  doctorName: string | null;
  needsRegistration: boolean;
  medications: Med[];
}) {
  const [state, action, pending] = useActionState(submitDecision.bind(null, token), IDLE);
  const [decision, setDecision] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (state.status === 'ok') router.refresh();
  }, [state.status, router]);

  if (state.status === 'ok') {
    return <Callout tone="success" title="Recorded with your name and registration number.">The patient will see: “{state.message}”</Callout>;
  }

  return (
    <form
      action={action}
      onChange={(event) => {
        const target = event.target as unknown as HTMLInputElement;
        if (target.name === 'decision') setDecision(target.value);
        if (target.name === 'patient_message') setMessage(target.value);
      }}>
      <Stack gap={6}>
        {needsRegistration ? (
          <Fieldset legend="Your details" description="Asked once.">
            <Field label="Name" name="name" defaultValue={doctorName ?? ''} required maxLength={120} autoComplete="name" />
            <div className={styles.pair}>
              <Field label="Registration number" name="registration_number" required pattern="[A-Za-z0-9/\-]{3,30}" mono />
              <Field label="Council" name="registration_council" placeholder="Delhi Medical Council" maxLength={80} />
            </div>
          </Fieldset>
        ) : null}

        <Fieldset legend="Is this combination intended?">
          <RadioCard name="decision" value="intended" title="Intended" detail="The patient is told to continue as prescribed." required />
          <RadioCard name="decision" value="not_intended" title="Not intended" detail="You choose what the patient is told next." />
        </Fieldset>

        {decision === 'not_intended' ? (
          <Fieldset legend="What should the patient be told?">
            <RadioCard name="patient_message" value="hold_until_contact" title="Do not take one medicine until you hear from us" required />
            <RadioCard name="patient_message" value="review_next_visit" title="Keep everything as it is, review at the next visit" />
            {message === 'hold_until_contact' ? (
              <Select label="Medicine to hold" name="hold_medication_id" required defaultValue="">
                <option value="" disabled>
                  Choose a medicine
                </option>
                {medications.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            ) : null}
          </Fieldset>
        ) : null}

        <Field label="Note for the record" name="note" maxLength={1000} hint="Optional. Not sent to the patient." />
        {state.status === 'error' ? <Callout tone="danger" title={state.message} /> : null}
        <Button type="submit" variant="primary" size="large" pending={pending} block>
          Record decision
        </Button>
      </Stack>
    </form>
  );
}
