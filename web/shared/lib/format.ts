const IST = 'Asia/Kolkata';

export function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = value.length === 10 ? new Date(`${value}T00:00:00+05:30`) : new Date(value);
  return new Intl.DateTimeFormat('en-IN', { timeZone: IST, day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function genderLabel(gender: string): string {
  return { female: 'Female', male: 'Male', other: 'Other' }[gender] ?? gender;
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  return `+${phone.slice(0, 2)} ••••• ${phone.slice(-5)}`;
}
