import { API_BASE_URL } from '../../shared/api/config';
import { getJson, postJson } from '../../shared/api/http';
import type { AuthResponse, CurrentUserResponse, LoginRequest } from './auth.types';

export function login(payload: LoginRequest): Promise<AuthResponse> {
  return postJson<AuthResponse, LoginRequest>('/api/auth/login', payload);
}

export function refresh(refreshToken: string): Promise<AuthResponse> {
  return postJson<AuthResponse, { refreshToken: string }>('/api/auth/refresh', { refreshToken });
}

export function me(accessToken: string): Promise<CurrentUserResponse> {
  return getJson<CurrentUserResponse>('/api/auth/me', accessToken);
}

export async function logout(accessToken: string, refreshToken: string): Promise<void> {
  await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ refreshToken }),
  });
}
