import { Platform } from 'react-native';
import { getItem, removeItem, setItem } from './storage';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://blink-a-pill.unlocalhost.tech';

const TOKEN_KEY = 'bap.session';

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export async function loadToken() {
  token = await getItem(TOKEN_KEY);
  return token;
}

export async function saveToken(value: string | null) {
  token = value;
  if (value) await setItem(TOKEN_KEY, value);
  else await removeItem(TOKEN_KEY);
}

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

async function parse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (response.ok && payload && 'data' in payload) return payload.data as T;
  if (response.status === 401) onUnauthorized?.();
  throw new ApiError(
    payload?.error?.code ?? 'UNEXPECTED',
    payload?.error?.message ?? 'Something went wrong. Please try again.',
    response.status,
  );
}

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError('OFFLINE', 'No internet connection. Please try again.', 0);
  }
  return parse<T>(response);
}

export async function upload<T>(path: string, file: { uri: string; name: string; type: string }): Promise<T> {
  const form = new FormData();
  if (Platform.OS === 'web') {
    const blob = await (await fetch(file.uri)).blob();
    form.append('photo', new File([blob], file.name, { type: file.type }));
  } else {
    form.append('photo', file as unknown as Blob);
  }
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: token ? { authorization: `Bearer ${token}` } : {},
      body: form,
    });
  } catch {
    throw new ApiError('OFFLINE', 'No internet connection. Please try again.', 0);
  }
  return parse<T>(response);
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.';
}
