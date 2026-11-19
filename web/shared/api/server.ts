import 'server-only';

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; code: string; message: string };

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

export async function api<T>(
  path: string,
  init: { method?: string; body?: unknown; token?: string; ip?: string } = {},
): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: init.method ?? 'GET',
      cache: 'no-store',
      headers: {
        'content-type': 'application/json',
        ...(init.token ? { authorization: `Bearer ${init.token}` } : {}),
        ...(init.ip ? { 'x-forwarded-for': init.ip } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    return { ok: false, status: 503, code: 'UNREACHABLE', message: 'The service is not reachable right now. Please try again.' };
  }
  const payload = await response.json().catch(() => null);
  if (response.ok && payload && 'data' in payload) return { ok: true, data: payload.data as T };
  return {
    ok: false,
    status: response.status,
    code: payload?.error?.code ?? 'UNEXPECTED',
    message: payload?.error?.message ?? 'Something went wrong. Please try again.',
  };
}
