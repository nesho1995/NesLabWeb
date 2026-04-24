import type { ReactNode } from 'react';

export type AppNavItem = {
  to: string;
  label: string;
  hint: string;
  need?: string;
  anyOf?: string[];
  icon: NavIconId;
};

export type AppNavGroup = {
  id: string;
  label: string;
  intro?: string;
  items: AppNavItem[];
};

export type NavIconId =
  | 'home'
  | 'users'
  | 'catalog'
  | 'inbox'
  | 'pos'
  | 'tax'
  | 'sample'
  | 'results'
  | 'till'
  | 'kpi'
  | 'usergear'
  | 'building'
  | 'cardpay'
  | 'gear';

const s = { stroke: 'currentColor' as const, fill: 'none' as const, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export function AppNavIcon({ name }: { name: NavIconId }): ReactNode {
  return (
    <span className="pro-ico-wrap" aria-hidden>
      <svg className="pro-ico" width="20" height="20" viewBox="0 0 24 24" {...s}>
        {name === 'home' && (
          <>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <path d="M9 22V12h6v10" />
          </>
        )}
        {name === 'users' && (
          <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </>
        )}
        {name === 'catalog' && (
          <>
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </>
        )}
        {name === 'inbox' && (
          <>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 14h6" />
          </>
        )}
        {name === 'pos' && (
          <>
            <rect x="2" y="4" width="20" height="12" rx="2" />
            <path d="M7 9h.01M12 9h.01M17 9h.01" />
            <path d="M6 20h12" />
            <path d="M9 20v-3" />
            <path d="M6 2v2" />
          </>
        )}
        {name === 'tax' && (
          <>
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </>
        )}
        {name === 'sample' && (
          <>
            <path d="M4.5 3h15" />
            <path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3" />
            <path d="M6 14h12" />
          </>
        )}
        {name === 'results' && (
          <>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 12l2 2 4-4" />
          </>
        )}
        {name === 'till' && (
          <>
            <rect x="2" y="7" width="20" height="12" rx="1" />
            <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
            <line x1="2" y1="11" x2="22" y2="11" />
            <circle cx="7" cy="16" r="0.5" fill="currentColor" stroke="none" />
            <circle cx="17" cy="16" r="0.5" fill="currentColor" stroke="none" />
          </>
        )}
        {name === 'kpi' && (
          <>
            <line x1="2" y1="22" x2="2" y2="3" />
            <path d="M2 20h20" />
            <path d="M6 16l3-3 2 2 5-6 4 3" />
          </>
        )}
        {name === 'usergear' && (
          <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            <circle cx="20" cy="4" r="1.2" fill="currentColor" stroke="none" />
          </>
        )}
        {name === 'building' && (
          <>
            <path d="M3 21h18" />
            <path d="M5 21V7l7-3v17" />
            <path d="M19 21V11l-4-1.5" />
          </>
        )}
        {name === 'cardpay' && (
          <>
            <rect x="1" y="4" width="22" height="16" rx="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </>
        )}
        {name === 'gear' && (
          <>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1 1 0 0 1 0 1.4l-1 1a1 1 0 0 1-1.4 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-.2a1 1 0 0 0-.7-.9 1 1 0 0 0-1.1.2l-.1.1a1 1 0 0 1-1.4 0l-1-1a1 1 0 0 1 0-1.4l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a1 1 0 0 1-1-1v-1.5a1 1 0 0 1 1-1h.2a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1.1l-.1-.1a1 1 0 0 1 0-1.4l1-1a1 1 0 0 1 1.4 0l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a1 1 0 0 1 1-1h1.5a1 1 0 0 1 1 1v.2a1 1 0 0 0 .7.9 1 1 0 0 0 1.1-.2l.1-.1a1 1 0 0 1 1.4 0l1 1a1 1 0 0 1 0 1.4l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a1 1 0 0 1 1 1v1.5a1 1 0 0 1-1 1h-.2a1 1 0 0 0-.4.1" />
          </>
        )}
      </svg>
    </span>
  );
}

/**
 * Misma estructura para el menu y el panel. Textos en espanol sencillo.
 */
export const appNavGroups: AppNavGroup[] = [
  {
    id: 'recepcion',
    label: 'Mostrador y ventas',
    intro: 'Atencion al paciente, cobro y listado de ordenes.',
    items: [
      { to: '/patients', label: 'Pacientes', hint: 'Buscar, crear y editar fichas', need: 'PACIENTE.READ', icon: 'users' },
      { to: '/ordenes', label: 'Todas las ordenes', hint: 'Ver, cobrar y reimprimir', anyOf: ['ORDEN.READ', 'ORDEN.CREATE'], icon: 'inbox' },
      { to: '/orders', label: 'Nueva orden (cobrar)', hint: 'Facturacion y pago ahora', need: 'ORDEN.CREATE', icon: 'pos' },
    ],
  },
  {
    id: 'fiscal',
    label: 'SAR e impuestos',
    intro: 'Datos fiscales de la empresa hacia la administracion.',
    items: [
      { to: '/sar', label: 'Regimen, CAI e ISV', need: 'FISCAL.READ', icon: 'tax', hint: 'Cumplimiento y rangos' },
    ],
  },
  {
    id: 'laboratorio',
    label: 'Trabajo de laboratorio',
    intro: 'Muestras, resultados, caja y metas del laboratorio.',
    items: [
      { to: '/lab/muestras', label: 'Muestras y etiquetas', need: 'MUESTRA.GESTION', icon: 'sample', hint: 'Etiquetar y registrar tomas' },
      { to: '/lab/resultados', label: 'Cargar resultados', need: 'RESULTADOS.VALIDAR', icon: 'results', hint: 'Escribir y aprobar valores' },
      { to: '/caja/cierre', label: 'Caja', need: 'CAJA.CERRAR', icon: 'till', hint: 'Apertura, arqueo y cierre' },
      { to: '/lab/reportes', label: 'Indicadores (LIS)', need: 'RESULTADOS.VALIDAR', icon: 'kpi', hint: 'A vista de gestion' },
      { to: '/finanzas/estado', label: 'Estado financiero', anyOf: ['CAJA.CERRAR', 'RESULTADOS.VALIDAR', 'ORDEN.READ'], icon: 'kpi', hint: 'Ingresos, pagos y cuadre' },
      { to: '/operacion/sincronizacion', label: 'Sincronizacion offline', anyOf: ['CAJA.CERRAR', 'ORDEN.CREATE', 'ORDEN.READ'], icon: 'kpi', hint: 'Pendientes y regularizacion' },
    ],
  },
  {
    id: 'admin',
    label: 'Ajustes del negocio',
    intro: 'Quien entra y como se paga. Solo con permiso.',
    items: [
      { to: '/admin/users', label: 'Usuarios y roles', need: 'USUARIO.READ', icon: 'usergear', hint: 'Accesos y contrasena' },
      { to: '/admin/catalogo-examenes', label: 'Catalogo de examenes (config)', need: 'EMPRESA.CONFIG', icon: 'gear', hint: 'Importar, limpiar y configurar' },
      { to: '/admin/inventario-reactivos', label: 'Inventario de reactivos', need: 'EMPRESA.CONFIG', icon: 'gear', hint: 'Existencia, minimo y ajustes' },
      { to: '/admin/laboratorio', label: 'Laboratorio: identidad e impresion', need: 'EMPRESA.CONFIG', icon: 'building', hint: 'Logo, datos y perfil por defecto' },
      { to: '/admin/empresa-caja', label: 'Caja: politica y montos', need: 'EMPRESA.CONFIG', icon: 'building', hint: 'Reglas de la empresa' },
      { to: '/admin/formas-pago', label: 'Formas de pago', need: 'EMPRESA.CONFIG', icon: 'cardpay', hint: 'Efectivo, tarjeta, etc.' },
    ],
  },
];

export function isNavItemVisible(
  item: AppNavItem,
  has: (p: string) => boolean,
  hasAny: (a: string[]) => boolean
): boolean {
  if (item.to === '/') {
    return true;
  }
  if (item.anyOf?.length) {
    return hasAny(item.anyOf);
  }
  if (item.need) {
    return has(item.need);
  }
  return false;
}
