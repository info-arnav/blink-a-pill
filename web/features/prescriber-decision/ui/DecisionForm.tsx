'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { Button, Choice, Field, Notice, Stack } from '@/shared/ui/primitives';
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
  const router = useRouter();
  useEffect(() => {
    if (state.status === 'ok') router.refresh();
  }, [state.status, router]);
  const [decision, setDecision] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  if (state.status === 'ok') {
    return (
      <Notice tone="ok">
        <strong>Recorded with your name and registration number.</strong>
        <br />
        The patient will see: “{state.message}”
      </Notice>
    );
  }

  return (
    <form action={action} className={styles.form}>
      {needsRegistration ? (
        <fieldset className={styles.group}>
          <legend className={styles.legend}>Your details (asked once, then remembered)</legend>
          <Stack>
            <Field label="Your name" name="name" defaultValue={doctorName ?? ''} required maxLength={120} />
            <Field label="Medical registration number" name="registration_number" required pattern="[A-Za-z0-9/\-]{3,30}" hint="As issued by your State Medical Council or the NMC" />
            <Field label="Council" name="registration_council" placeholder="Delhi Medical Council" maxLength={80} />
          </Stack>
        </fieldset>
      ) : null}

      <fieldset className={styles.group} onChange={(e) => setDecision((e.target as unknown as HTMLInputElement).value)}>
        <legend className={styles.legend}>Is this combination intended?</legend>
        <Stack>
          <Choice name="decision" value="intended" title="Intended" text="The patient is told to continue as prescribed." required />
          <Choice name="decision" value="not_intended" title="Not intended" text="You choose what the patient is told next." />
        </Stack>
      </fieldset>

      {decision === 'not_intended' ? (
        <fieldset className={styles.group} onChange={(e) => {
          const target = e.target as unknown as HTMLInputElement;
          if (target.name === 'patient_message') setMessage(target.value);
        }}>
          <legend className={styles.legend}>What should the patient be told?</legend>
          <Stack>
            <Choice name="patient_message" value="hold_until_contact" title="Do not take one medicine until you hear from us" required />
            <Choice name="patient_message" value="review_next_visit" title="Keep everything as it is, review at the next visit" />
            {message === 'hold_until_contact' ? (
              <label className={styles.select}>
                <span>Which medicine should they hold?</span>
                <select name="hold_medication_id" required defaultValue="">
                  <option value="" disabled>
                    Choose a medicine
                  </option>
                  {medications.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </Stack>
        </fieldset>
      ) : null}

      <Field label="Note for the record (optional)" name="note" maxLength={1000} />
      {state.status === 'error' ? <Notice tone="error">{state.message}</Notice> : null}
      <Button type="submit" disabled={pending} block>
        {pending ? 'Recording…' : 'Record my decision'}
      </Button>
      <p className={styles.small}>blink-a-pill never changes a prescription. Your answer is shown to the patient in your name and kept in the audit trail.</p>
    </form>
  );
}
