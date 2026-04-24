/**
 * Base del API (sin / final). Deje vacio en desarrollo: el front llama a /api/... en el mismo origen
 * y Vite reenvia a la API (vite.config.ts). Asi se evita CORS y "Failed to fetch" por URL incorrecta.
 * Desarrollo con Vite: deje esto vacio; vite.config reenvia /api al API (VITE_DEV_API_TARGET, por defecto 5225).
 * Si prefiere URL absoluta, ponga VITE_API_BASE_URL (ej. http://localhost:5225).
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
