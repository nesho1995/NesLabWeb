import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

function LogoIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id="lgin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <rect x="2" y="4" width="14" height="20" rx="2" fill="url(#lgin)" />
      <rect x="16" y="8" width="12" height="12" rx="2" fill="#0ea5e9" opacity="0.9" />
    </svg>
  );
}

export function LoginPage() {
  const { user, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ username: username.trim(), password });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const isNetwork =
        msg === 'Failed to fetch' || msg.includes('NetworkError') || msg.includes('Load failed');
      setError(
        isNetwork
          ? 'No se pudo conectar con el servidor. Arranque la API (NesLab.Api, por lo general puerto 5225) y recargue. Con Vite, use el mismo origen: no defina VITE_API_BASE_URL y el proxy reenviara /api a la API.'
          : msg,
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="login-pro">
      <div className="login-pro__head">
        <div className="login-pro__logo" aria-hidden>
          <LogoIcon />
        </div>
        <h1>NesLab LIS</h1>
        <p className="login-pro__tag">Acceso seguro al panel: pacientes, examenes, ordenes y flujo fiscal.</p>
      </div>
      <form className="login-card" onSubmit={onSubmit} autoComplete="on">
        <label>
          Usuario
          <input
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="p. ej. admin"
            required
          />
        </label>
        <label>
          Contrasena
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </label>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Ingresando…' : 'Ingresar al panel'}
        </button>
      </form>
      {error && <p className="error-text" style={{ textAlign: 'center' }}>{error}</p>}
      {import.meta.env.DEV && (
        <p className="login-pro__foot" style={{ fontSize: 12, marginTop: 8, opacity: 0.9 }}>
          Desarrollo: usuario <code>admin</code> y contrasena <code>Admin123!</code> (tras un arranque con base vacia o sin
          usuario admin).
        </p>
      )}
      <p className="login-pro__foot">NesLab LIS &middot; Si no tienes credenciales, pide al administrador de tu lab.</p>
    </main>
  );
}
