'use server';

import { api } from '@/shared/api/server';
import { text, type ActionState } from '@/shared/lib/action-state';

export async function submitReception(token: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const result = await api<{ next: string }>(`/v1/links/reception/${encodeURIComponent(token)}`, {
    method: 'POST',
    body: { result: text(form, 'result'), staff_name: text(form, 'staff_name'), note: text(form, 'note') },
  });
  if (!result.ok) return { status: 'error', message: result.message };
  return {
    status: 'ok',
    message:
      result.data.next === 'sent_to_prescriber'
        ? 'Thank you. The doctor has been sent one short message to decide.'
        : 'Thank you. The patient has been told to bring their prescription to the next visit.',
  };
}
