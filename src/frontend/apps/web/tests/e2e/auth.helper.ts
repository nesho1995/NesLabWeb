import { APIRequestContext, expect } from "@playwright/test";

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
};

export async function loginAndGetSession(request: APIRequestContext): Promise<AuthSession> {
  const username = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;
  if (!username || !password) {
    throw new Error("Set E2E_USERNAME and E2E_PASSWORD to run protected flow tests.");
  }

  const login = await request.post("/api/auth/login", {
    data: { username, password }
  });
  expect(login.ok()).toBeTruthy();
  const payload = (await login.json()) as { accessToken?: string; refreshToken?: string };
  if (!payload.accessToken || !payload.refreshToken) {
    throw new Error("Login succeeded but token pair was missing.");
  }

  return {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken
  };
}

export async function loginAndGetToken(request: APIRequestContext): Promise<string> {
  const session = await loginAndGetSession(request);
  return session.accessToken;
}
