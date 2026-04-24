/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL del API (sin barra final). Vacio = mismo origen; en dev use el proxy de Vite. */
  readonly VITE_API_BASE_URL?: string;
}
