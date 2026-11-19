'use server';

import { api } from '@/shared/api/server';
import { text, type ActionState } from '@/shared/lib/action-state';
import { pharmacySession } from '@/shared/session';

type Check = { recorded: boolean; at: string; sent: { ok: boolean; doctor?: string; reason?: string } | null };

export async function recordCheck(token: string, flagId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const session = await pharmacySession();
  if (!session) return { status: 'error', message: 'Please sign in again.' };
  const action = text(form, 'action');
  const result = await api<Check>(`/v1/pharmacy/cards/${encodeURIComponent(token)}/checks`, {
    method: 'POST',
    token: session.token,
    body: { flag_id: flagId, action },
  });
  if (!result.ok) return { status: 'error', message: result.message };
  const sent = result.data.sent;
  const message =
    action === 'told_patient'
      ? `Recorded: ${session.name} told the patient.`
      : sent?.ok
        ? `Recorded. ${sent.doctor} has been sent a message to decide.`
        : 'Recorded. No doctor phone number is on file, so ask the patient to contact their doctor.';
  return { status: 'ok', message };
}

export type Candidate = { id: number; name: string; composition: string };

export async function searchMedicine(q: string): Promise<Candidate[]> {
  const session = await pharmacySession();
  if (!session || q.trim().length < 2) return [];
  const result = await api<Candidate[]>(`/v1/pharmacy/drugs/search?q=${encodeURIComponent(q.trim())}`, { token: session.token });
  return result.ok ? result.data.map((d) => ({ id: d.id, name: d.name, composition: d.composition })) : [];
}

export type MedicineCheck = {
  medicine: { name: string; composition: string };
  overlaps: { severity: number; title: string; detail: string }[];
  note: string;
};

export async function checkMedicine(token: string, productId: number): Promise<MedicineCheck | { error: string }> {
  const session = await pharmacySession();
  if (!session) return { error: 'Please sign in again.' };
  const result = await api<MedicineCheck>(`/v1/pharmacy/cards/${encodeURIComponent(token)}/medicine`, {
    method: 'POST',
    token: session.token,
    body: { product_id: productId },
  });
  return result.ok ? result.data : { error: result.message };
}
