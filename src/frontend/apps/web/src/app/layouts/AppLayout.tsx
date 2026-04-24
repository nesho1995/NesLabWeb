import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthProvider';
import { getCompanyBranding } from '../../features/sar-fiscal/sarFiscal.api';
import { API_BASE_URL } from '../../shared/api/config';
import { getRouteContext } from '../routeMeta';
import { AppNavIcon, appNavGroups, isNavItemVisible } from '../navigationConfig';
import { createOrder } from '../../features/orders/newOrder.api';
import {
  getPendingOrdersCount,
  getRegularizedOrders,
  subscribeOrderOutboxUpdated,
  syncPendingOrders,
} from '../../shared/offline/orderOutbox';

type Props = { children: ReactNode };

function BrandMark() {
  return (
    <svg className="pro-brand__mark" width="22" height="22" viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id="prolg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <rect x="2" y="4" width="14" height="20" rx="2" fill="url(#prolg)" opacity="0.95" />
      <rect x="16" y="8" width="12" height="12" rx="2" fill="#0ea5e9" opacity="0.9" />
      <path d="M8 24h6v2H6v-2h2z" fill="#e0f2fe" />
    </svg>
  );
}

function mediaUrl(url: string | null | undefined) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  return `${API_BASE_URL}${url}`;
}

export function AppLayout({ children }: Props) {
  const { user, logout, hasPermission, hasAnyPermission } = useAuth();
  const { pathname } = useLocation();
  const { kicker, label, subtitle } = getRouteContext(pathname);
  const [brandName, setBrandName] = useState('NesLab LIS');
  const [brandSub, setBrandSub] = useState('Laboratorio · Ventas · Resultados');
  const [brandLogoUrl, setBrandLogoUrl] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(() => globalThis.navigator?.onLine ?? true);
  const [pendingSyncCount, setPendingSyncCount] = useState(() => getPendingOrdersCount());
  const [syncing, setSyncing] = useState(false);
  const [lastSyncText, setLastSyncText] = useState<string | null>(null);
  const has = (p: string) => hasPermission(p);
  const hasAny = (a: string[]) => hasAnyPermission(a);

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const d = await getCompanyBranding();
        if (!ok) return;
        const b = d.branding;
        setBrandName(b?.laboratoryDisplayName?.trim() || d.companyName || 'NesLab LIS');
        setBrandSub('Laboratorio · Ventas · Resultados');
        setBrandLogoUrl(b?.laboratoryLogoUrl?.trim() || null);
      } catch {
        // Usuarios sin acceso fiscal: se mantienen valores por defecto.
      }
    })();
    return () => {
      ok = false;
    };
  }, []);

  useEffect(() => {
    const update = () => setPendingSyncCount(getPendingOrdersCount());
    update();
    return subscribeOrderOutboxUpdated(update);
  }, []);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    globalThis.addEventListener('online', onOnline);
    globalThis.addEventListener('offline', onOffline);
    return () => {
      globalThis.removeEventListener('online', onOnline);
      globalThis.removeEventListener('offline', onOffline);
    };
  }, []);

  const runSync = async () => {
    if (syncing || !isOnline) return;
    setSyncing(true);
    try {
      const r = await syncPendingOrders((payload, key) => createOrder(payload, key));
      const latest = getRegularizedOrders(1)[0];
      if (r.synced > 0) {
        setLastSyncText(
          `Sincronizadas ${r.synced} orden(es)${latest ? ` · ultima: ${latest.invoiceNumber}` : ''}`
        );
      } else if (r.failed > 0) {
        setLastSyncText('No se pudo sincronizar por ahora. Se reintentara al reconectar.');
      }
    } finally {
      setSyncing(false);
      setPendingSyncCount(getPendingOrdersCount());
    }
  };

  useEffect(() => {
    if (isOnline && pendingSyncCount > 0) {
      void runSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, pendingSyncCount]);

  return (
    <div className="pro-root">
      <aside className="pro-sidebar" aria-label="Navegacion del sistema">
        <Link to="/" className="pro-brand pro-brand--link" title="Volver a la pantalla principal">
          <div className="pro-brand__row">
            <span className="pro-brand__markwrap" aria-hidden>
              {brandLogoUrl ? <img src={mediaUrl(brandLogoUrl) ?? ''} alt="" className="pro-brand__logoimg" /> : <BrandMark />}
            </span>
            <div>
              <div className="pro-brand__title">{brandName}</div>
              <div className="pro-brand__sub">{brandSub}</div>
            </div>
          </div>
        </Link>
        <div className="pro-navwrap">
          <nav className="pro-nav" aria-label="Modulos">
            {appNavGroups.map((g) => {
              const visible = g.items.filter((x) => isNavItemVisible(x, has, hasAny));
              if (visible.length === 0) {
                return null;
              }
              return (
                <div key={g.id} className="pro-nav__section" aria-label={g.label}>
                  {g.id !== 'inicio' && <h3 className="pro-nav__h">{g.label}</h3>}
                  {visible.map((x) => (
                    <Link
                      key={x.to}
                      className={
                        (x.to === '/'
                          ? pathname === '/'
                          : pathname === x.to || pathname.startsWith(x.to + '/'))
                          ? 'pro-nlink is-active'
                          : 'pro-nlink'
                      }
                      to={x.to}
                    >
                      <AppNavIcon name={x.icon} />
                      <span className="pro-nlink__text">
                        <span className="pro-nlink__label">{x.label}</span>
                        {g.id !== 'inicio' && <span className="pro-nlink__hint">{x.hint}</span>}
                      </span>
                    </Link>
                  ))}
                </div>
              );
            })}
          </nav>
        </div>
        <div className="pro-user" aria-label="Cuenta">
          <div className="pro-user__name">{user?.fullName}</div>
          <div className="pro-user__meta">{(user?.roles ?? []).join(' · ') || 'Sin rol'}</div>
          <button className="pro-ghost" type="button" onClick={() => void logout()}>
            Cerrar sesion
          </button>
        </div>
      </aside>
      <div className="pro-main">
        <header className="pro-topbar" aria-label="Contexto de la pagina">
          <div className="pro-topbar__crumb">
            <p className="pro-topbar__kicker">{kicker}</p>
            <h1 className="pro-topbar__h">{label}</h1>
            {subtitle && <p className="pro-topbar__sub">{subtitle}</p>}
          </div>
          <div
            className={`pro-topbar__badge ${isOnline ? 'is-online' : 'is-offline'}`}
            title={isOnline ? 'Conexion activa con el servidor' : 'Sin internet. Operacion en modo degradado.'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <rect x="5" y="11" width="14" height="10" rx="1" />
              <path d="M7 11V8a5 5 0 0 1 10 0v3" />
            </svg>
            {isOnline ? 'Conectado' : 'Sin internet'}
          </div>
        </header>
        {!isOnline ? (
          <div className="pro-net-banner" role="status" aria-live="polite">
            Sin conexion a internet. Puede continuar en modo operativo limitado; sincronice al restablecer la red.
          </div>
        ) : null}
        {isOnline && pendingSyncCount > 0 ? (
          <div className="pro-net-banner is-sync" role="status" aria-live="polite">
            Hay {pendingSyncCount} orden(es) pendientes de regularizar.{' '}
            <button
              type="button"
              className="pro-ghost pro-ghost--noblock"
              style={{ height: 28, padding: '0 10px', marginLeft: 8 }}
              onClick={() => void runSync()}
              disabled={syncing}
            >
              {syncing ? 'Sincronizando...' : 'Sincronizar ahora'}
            </button>
          </div>
        ) : null}
        {lastSyncText ? (
          <div className="pro-net-banner is-ok" role="status" aria-live="polite">
            {lastSyncText}
          </div>
        ) : null}
        <section className="pro-content">{children}</section>
      </div>
    </div>
  );
}
