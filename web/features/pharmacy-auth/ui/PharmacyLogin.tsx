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
  const [form, setForm] = useState({ phone: '', code: '', name: '', licence_number: '', address: '' });
  const register = Boolean(verified.data?.register);
  const verifyError = verified.status === 'error' ? verified.message : undefined;
  const bind = (key: keyof typeof form) => ({
    name: key,
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  if (sent.status !== 'ok') {
    return (
      <form action={sendAction}>
        <Stack gap={4}>
          <Field
            label="Shop mobile number"
            inputMode="tel"
            autoComplete="tel"
            required
            error={sent.status === 'error' ? sent.message : undefined}
            hint="We send a six digit code on WhatsApp."
            {...bind('phone')}
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
        <input type="hidden" name="phone" value={form.phone} />
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <Field
          label="Six digit code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          required
          mono
          error={register ? undefined : verifyError}
          {...bind('code')}
        />
        {register ? (
          <Fieldset legend="New shop" description="Asked once.">
            <Field label="Shop name" required maxLength={120} autoComplete="organization" {...bind('name')} />
            <Field label="Drug licence number" required minLength={4} maxLength={60} mono {...bind('licence_number')} />
            <Field label="Address (optional)" maxLength={200} autoComplete="street-address" {...bind('address')} />
          </Fieldset>
        ) : null}
        {register && verifyError ? <Callout tone="danger" title={verifyError} /> : null}
        <Button type="submit" variant="primary" size="large" pending={verifying} block>
          {register ? 'Register shop' : 'Continue'}
        </Button>
      </Stack>
    </form>
  );
}
