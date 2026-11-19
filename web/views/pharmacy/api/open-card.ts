'use server';

import { redirect } from 'next/navigation';
import { text, type ActionState } from '@/shared/lib/action-state';

export async function openCard(_prev: ActionState, form: FormData): Promise<ActionState> {
  const raw = text(form, 'card') ?? '';
  const token = raw.split('/').filter(Boolean).pop() ?? '';
  if (!/^[A-Za-z0-9_-]{10,64}$/.test(token)) return { status: 'error', message: 'Paste the card link or the code after /c/.' };
  redirect(`/pharmacy/card/${token}`);
}
