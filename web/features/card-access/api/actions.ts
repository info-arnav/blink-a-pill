'use server';

import { redirect } from 'next/navigation';
import { api } from '@/shared/api/server';
import { text, type ActionState } from '@/shared/lib/action-state';
import { cardAccess, endCardAccess, grantCardAccess, pharmacySession } from '@/shared/session';

export async function unlockCard(token: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const pin = text(form, 'pin') ?? '';
  const pharmacy = await pharmacySession();
  if (pharmacy) {
    const result = await api(`/v1/pharmacy/cards/${encodeURIComponent(token)}/unlock`, { method: 'POST', token: pharmacy.token, body: { pin } });
    if (!result.ok) return { status: 'error', message: result.message };
    redirect(`/pharmacy/card/${token}`);
  }
  const result = await api(`/v1/cards/${encodeURIComponent(token)}/view`, { method: 'POST', body: { pin } });
  if (!result.ok) return { status: 'error', message: result.message };
  await grantCardAccess(token, pin);
  redirect(`/c/${token}`);
}

export async function verifyList(token: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const pin = await cardAccess(token);
  if (!pin) return { status: 'error', message: 'Your access to this card has timed out. Enter the PIN again.' };
  const result = await api<{ verified: string[]; label: string }>(`/v1/cards/${encodeURIComponent(token)}/verify`, {
    method: 'POST',
    body: {
      pin,
      name: text(form, 'name'),
      registration_number: text(form, 'registration_number'),
      registration_council: text(form, 'registration_council'),
      medication_ids: form.getAll('medication_ids').filter((v): v is string => typeof v === 'string'),
    },
  });
  if (!result.ok) return { status: 'error', message: result.message };
  return { status: 'ok', message: `${result.data.label}: ${result.data.verified.join(', ')}` };
}

export async function closeCard() {
  await endCardAccess();
  redirect('/');
}
