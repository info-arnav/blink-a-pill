'use server';

import { redirect } from 'next/navigation';
import { api } from '@/shared/api/server';
import { text, type ActionState } from '@/shared/lib/action-state';
import { endPharmacySession, startPharmacySession } from '@/shared/session';

export async function requestPharmacyCode(_prev: ActionState, form: FormData): Promise<ActionState> {
  const phone = text(form, 'phone');
  const result = await api('/v1/pharmacy/auth/otp', { method: 'POST', body: { phone } });
  if (!result.ok) return { status: 'error', message: result.message };
  return { status: 'ok', data: { phone: phone ?? '' } };
}

export async function verifyPharmacyCode(_prev: ActionState, form: FormData): Promise<ActionState> {
  const result = await api<{ token: string; pharmacy: { name: string; licence_number: string } }>('/v1/pharmacy/auth/verify', {
    method: 'POST',
    body: {
      phone: text(form, 'phone'),
      code: text(form, 'code'),
      name: text(form, 'name'),
      licence_number: text(form, 'licence_number'),
      address: text(form, 'address'),
    },
  });
  if (!result.ok) {
    return { status: 'error', message: result.message, data: { register: result.code === 'REGISTRATION_REQUIRED' } };
  }
  await startPharmacySession({ token: result.data.token, name: result.data.pharmacy.name, licence: result.data.pharmacy.licence_number });
  const next = text(form, 'next');
  redirect(next && /^\/pharmacy\/card\/[A-Za-z0-9_-]+$/.test(next) ? next : '/pharmacy');
}

export async function signOutPharmacy() {
  await endPharmacySession();
  redirect('/pharmacy');
}
