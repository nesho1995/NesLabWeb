import { getAccessToken } from '../../features/auth/auth.storage';
import { API_BASE_URL } from './config';

export type JsonInit = RequestInit & { json?: unknown; idempotencyKey?: string };

export async function authJson<TResponse>(path: string, init: JsonInit = {}): Promise<TResponse> {
  const { json, idempotencyKey, ...rest } = init;
  const token = getAccessToken();
  const headers: HeadersInit = { ...(init.headers as HeadersInit) };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  if (idempotencyKey) {
    (headers as Record<string, string>)['Idempotency-Key'] = idempotencyKey;
  }
  if (json !== undefined) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  if (!res.ok) {
    const errText = await res.text();
    const statusHint =
      res.status === 401
        ? 'Sesion expirada o no valida. Vuelve a iniciar sesion.'
        : res.status === 403
          ? 'No tienes permiso para esta accion (revisa el token: cierra sesion y entra otra vez).'
          : `Error del servidor (${res.status}).`;
    let message = statusHint;
    try {
      const parsed = JSON.parse(errText) as { message?: string; error?: string; title?: string };
      if (errText && typeof parsed.message === 'string' && parsed.message) {
        message = `${parsed.message} (${res.status})`;
      } else if (errText && typeof parsed.error === 'string' && parsed.error) {
        message = `${parsed.error} (${res.status})`;
      } else if (errText && typeof parsed.title === 'string' && parsed.title) {
        message = `${parsed.title} (${res.status})`;
      }
    } catch {
      if (errText && errText.length < 400) {
        message = `${errText.trim() || statusHint} (${res.status})`;
      }
    }
    throw new Error(message);
  }
  if (res.status === 204) {
    return undefined as TResponse;
  }
  return (await res.json()) as TResponse;
}
