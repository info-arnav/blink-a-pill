export type ActionState = { status: 'idle' | 'ok' | 'error'; message?: string; data?: Record<string, unknown> };

export const IDLE: ActionState = { status: 'idle' };

export function text(form: FormData, key: string): string | undefined {
  const value = form.get(key);
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}
