import { API_BASE_URL } from './config';

export async function postJson<TResponse, TBody>(path: string, body: TBody): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    let message = 'No se pudo completar la solicitud.';
    if (response.status === 404) {
      message =
        'Ruta de API no encontrada (404). Inicie NesLab.Api (puerto 5225). Si abre con Vite (5173), use el proxy de /api en vite.config o defina VITE_API_BASE_URL hacia el API.';
    } else if (response.status === 502 || response.status === 503) {
      message =
        'El servidor de desarrollo no pudo alcanzar el API (502/503). Arranque NesLab.Api en el puerto configurado (p. ej. 5225) o revise VITE_DEV_API_TARGET y el proxy en vite.config.ts.';
    }
    try {
      const parsed = JSON.parse(errText) as { message?: string };
      if (typeof parsed.message === 'string' && parsed.message.trim().length > 0) {
        message = parsed.message;
      }
    } catch {
      if (errText && errText.length < 500) {
        message = errText.trim() || message;
      }
    }
    throw new Error(message);
  }

  return (await response.json()) as TResponse;
}

export async function getJson<TResponse>(path: string, token?: string): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    let message = 'No se pudo completar la solicitud.';
    if (response.status === 404) {
      message =
        'Ruta de API no encontrada (404). Inicie NesLab.Api. Con Vite, el proxy reenvia /api o use VITE_API_BASE_URL.';
    } else if (response.status === 502 || response.status === 503) {
      message =
        'No se pudo conectar con el API. Verifique que NesLab.Api este en marcha (dotnet run) y el proxy de Vite apunte al puerto correcto.';
    } else {
      try {
        const parsed = JSON.parse(errText) as { message?: string };
        if (typeof parsed.message === 'string' && parsed.message.trim()) {
          message = parsed.message;
        }
      } catch {
        /* ignore */
      }
    }
    throw new Error(message);
  }

  return (await response.json()) as TResponse;
}
