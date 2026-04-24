import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { login as loginApi, logout as logoutApi, me, refresh as refreshApi } from './auth.api';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './auth.storage';
import type { AuthResponse, CurrentUserResponse } from './auth.types';

function toCurrentUser(r: AuthResponse): CurrentUserResponse {
  return {
    userId: r.userId,
    username: r.username,
    fullName: r.fullName,
    roles: r.roles,
    permissions: r.permissions,
  };
}

type LoginInput = { username: string; password: string };

type AuthContextValue = {
  user: CurrentUserResponse | null;
  isReady: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUserResponse | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        const accessToken = getAccessToken();
        const refreshToken = getRefreshToken();

        if (!accessToken || !refreshToken) {
          setIsReady(true);
          return;
        }

        try {
          // El refresh re-emite un JWT con permisos al dia (la BD). Solo usar /me con un token
          // viejo dejaba al usuario con permisos viejos y el API (policies) rechazaba 403.
          const refreshed = await refreshApi(refreshToken);
          setTokens(refreshed.accessToken, refreshed.refreshToken);
          setUser(toCurrentUser(refreshed));
        } catch {
          try {
            const current = await me(accessToken);
            setUser(current);
          } catch {
            clearTokens();
            setUser(null);
          }
        }
      } catch {
        clearTokens();
        setUser(null);
      } finally {
        setIsReady(true);
      }
    }

    void bootstrap();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      login: async ({ username, password }) => {
        const result = await loginApi({ username, password });
        setTokens(result.accessToken, result.refreshToken);
        setUser(toCurrentUser(result));
      },
      logout: async () => {
        const accessToken = getAccessToken();
        const refreshToken = getRefreshToken();
        if (accessToken && refreshToken) {
          await logoutApi(accessToken, refreshToken);
        }
        clearTokens();
        setUser(null);
      },
      hasPermission: (permission: string) => !!user?.permissions.includes(permission),
      hasAnyPermission: (permissions: string[]) =>
        permissions.some((p) => !!user?.permissions.includes(p)),
    }),
    [isReady, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
