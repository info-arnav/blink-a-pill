'use client';

import { useActionState, useState } from 'react';
import { Button, Field, Notice, Stack } from '@/shared/ui/primitives';
import { IDLE } from '@/shared/lib/action-state';
import { requestPharmacyCode, verifyPharmacyCode } from '../api/actions';

export function PharmacyLogin({ next }: { next?: string }) {
  const [sent, sendAction, sending] = useActionState(requestPharmacyCode, IDLE);
  const [verified, verifyAction, verifying] = useActionState(verifyPharmacyCode, IDLE);
  const [phone, setPhone] = useState('');
  const register = Boolean(verified.data?.register);

  if (sent.status !== 'ok') {
    return (
      <form action={sendAction}>
        <Stack>
          <Field
            label="Shop mobile number"
            name="phone"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            hint="We send a 6 digit code on WhatsApp."
          />
          {sent.status === 'error' ? <Notice tone="error">{sent.message}</Notice> : null}
          <Button type="submit" disabled={sending} block>
            {sending ? 'Sending…' : 'Send code'}
          </Button>
        </Stack>
      </form>
    );
  }

  return (
    <form action={verifyAction}>
      <Stack>
        <input type="hidden" name="phone" value={phone} />
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <Field label="6 digit code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required />
        {register ? (
          <>
            <Notice tone="info">First time here. Register your shop once.</Notice>
            <Field label="Shop name" name="name" required maxLength={120} />
            <Field label="Drug licence number" name="licence_number" required minLength={4} maxLength={60} />
            <Field label="Address (optional)" name="address" maxLength={200} />
          </>
        ) : null}
        {verified.status === 'error' && !register ? <Notice tone="error">{verified.message}</Notice> : null}
        <Button type="submit" disabled={verifying} block>
          {verifying ? 'Checking…' : register ? 'Register and continue' : 'Continue'}
        </Button>
      </Stack>
    </form>
  );
}
