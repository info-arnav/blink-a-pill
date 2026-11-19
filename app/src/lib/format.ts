import type { Medication } from './types';

export function medicineSubtitle(m: Medication) {
  const parts = [`${m.dose_amount} ${m.dose_unit}`, m.frequency_label];
  if (m.times.length) parts.push(m.times.join(', '));
  if (m.days_left != null) parts.push(`${m.days_left} days left`);
  return parts.join(' · ');
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '';
  const date = value.length === 10 ? new Date(`${value}T00:00:00+05:30`) : new Date(value);
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export const MEAL_LABEL: Record<string, string> = { before: 'before food', after: 'after food', with: 'with food', any: 'any time' };
