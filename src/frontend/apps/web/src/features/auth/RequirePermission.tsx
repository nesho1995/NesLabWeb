import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

type Props = {
  children: ReactNode;
} & (
  | { permission: string; anyOf?: never }
  | { anyOf: string[]; permission?: never }
);

export function RequirePermission(props: Props) {
  const { user, isReady, hasPermission, hasAnyPermission } = useAuth();
  const { children } = props;
  const anyOf = 'anyOf' in props && props.anyOf ? props.anyOf : null;
  const permission = 'permission' in props && props.permission ? props.permission : null;

  if (!isReady) {
    return (
      <div className="pro-card" style={{ maxWidth: 400 }}>
        <p className="pro-muted" style={{ margin: 0, marginBottom: 8 }}>
          Cargando permisos
        </p>
        <div className="pro-shimmer" style={{ height: 6 }} />
        <div className="pro-shimmer" style={{ height: 6, marginTop: 8, maxWidth: 240 }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const allowed = anyOf?.length
    ? hasAnyPermission(anyOf)
    : permission
      ? hasPermission(permission)
      : false;

  if (!allowed) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
}
