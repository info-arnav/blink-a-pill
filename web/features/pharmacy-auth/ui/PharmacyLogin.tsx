'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/shared/ui/action/Button';
import { Field, Fieldset } from '@/shared/ui/field/Field';
import { Callout } from '@/shared/ui/status/Callout';
import { Stack } from '@/shared/ui/layout/Page';
import { IDLE } from '@/shared/lib/action-state';
import { requestPharmacyCode, verifyPharmacyCode } from '../api/actions';

export function PharmacyLogin({ next }: { next?: string }) {
  const [sent, sendAction, sending] = useActionState(requestPharmacyCode, IDLE);
  const [verified, verifyAction, verifying] = useActionState(verifyPharmacyCode, IDLE);
  const [phone, setPhone] = useState('');
  const register = Boolean(verified.data?.register);
  const verifyError = verified.status === 'error' ? verified.message : undefined;

  if (sent.status !== 'ok') {
    return (
      <form action={sendAction}>
        <Stack gap={4}>
          <Field
            label="Shop mobile number"
            name="phone"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            error={sent.status === 'error' ? sent.message : undefined}
            hint="We send a six digit code on WhatsApp."
          />
          <Button type="submit" variant="primary" size="large" pending={sending} block>
            Send code
          </Button>
        </Stack>
      </form>
    );
  }

  return (
    <form action={verifyAction}>
      <Stack gap={4}>
        <input type="hidden" name="phone" value={phone} />
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <Field
          label="Six digit code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          required
          mono
          error={register ? undefined : verifyError}
        />
        {register ? (
          <Fieldset legend="Register your shop">
            <Field label="Shop name" name="name" required maxLength={120} autoComplete="organization" />
            <Field label="Drug licence number" name="licence_number" required minLength={4} maxLength={60} mono />
            <Field label="Address" name="address" maxLength={200} hint="Optional." autoComplete="street-address" />
          </Fieldset>
        ) : null}
        {register && verifyError ? <Callout tone="danger" title={verifyError} /> : null}
        <Button type="submit" variant="primary" size="large" pending={verifying} block>
          {register ? 'Register and continue' : 'Continue'}
        </Button>
      </Stack>
    </form>
  );
}
