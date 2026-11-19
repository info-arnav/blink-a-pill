'use server';

import { api } from '@/shared/api/server';
import { text, type ActionState } from '@/shared/lib/action-state';

export async function submitDecision(token: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const decision = text(form, 'decision');
  const body = {
    decision,
    patient_message: decision === 'not_intended' ? text(form, 'patient_message') : undefined,
    hold_medication_id: text(form, 'patient_message') === 'hold_until_contact' ? text(form, 'hold_medication_id') : undefined,
    note: text(form, 'note'),
    name: text(form, 'name'),
    registration_number: text(form, 'registration_number'),
    registration_council: text(form, 'registration_council'),
  };
  const result = await api<{ status: string; patient_message: string }>(`/v1/links/prescriber/${encodeURIComponent(token)}`, {
    method: 'POST',
    body,
  });
  if (!result.ok) return { status: 'error', message: result.message };
  return { status: 'ok', message: result.data.patient_message };
}
