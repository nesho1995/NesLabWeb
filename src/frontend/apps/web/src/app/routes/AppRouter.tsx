import type { ReactElement } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { CrossModuleLinks } from '../../shared/components/CrossModuleLinks';
import { AuthProvider, useAuth } from '../../features/auth/AuthProvider';
import { LoginPage } from '../../features/auth/LoginPage';
import { RequirePermission } from '../../features/auth/RequirePermission';
import { LabExamsPage } from '../../features/lab-exams/LabExamsPage';
import { AdminExamCatalogPage } from '../../features/lab-exams/AdminExamCatalogPage';
import { NewOrderPage } from '../../features/orders/NewOrderPage';
import { OrdersListPage } from '../../features/orders/OrdersListPage';
import { OrderVoucherPage } from '../../features/orders/OrderVoucherPage';
import { PatientsPage } from '../../features/patients/PatientsPage';
import { SarFiscalPage } from '../../features/sar-fiscal/SarFiscalPage';
import { UsersPage } from '../../features/users/UsersPage';
import { CompanyCashPage } from '../../features/company-cash/CompanyCashPage';
import { CashClosePage } from '../../features/cash/CashClosePage';
import { PaymentMethodsPage } from '../../features/payment-methods/PaymentMethodsPage';
import { LabReportesPage } from '../../features/lab-reportes/LabReportesPage';
import { LabResultsPage } from '../../features/lab-results/LabResultsPage';
import { SamplesPage } from '../../features/samples/SamplesPage';
import { LabBrandingPage } from '../../features/lab-branding/LabBrandingPage';
import { InventoryPage } from '../../features/inventory/InventoryPage';
import { FinancePage } from '../../features/finance/FinancePage';
import { OfflineSyncPage } from '../../features/offline-sync/OfflineSyncPage';

function ForbiddenPage() {
  const { hasPermission, hasAnyPermission } = useAuth();
  return (
    <div className="pro-card" style={{ maxWidth: 560 }}>
      <h1 className="pro-hero__title" style={{ margin: 0, fontSize: 24 }}>
        Acceso denegado
      </h1>
      <p className="pro-muted" style={{ margin: '10px 0 0' }}>
        No cuentas con el permiso necesario para abrir este modulo.
      </p>
      <p style={{ margin: '12px 0 0' }}>
        <Link to="/" className="pro-content-link">
          Volver al inicio
        </Link>
      </p>
      <CrossModuleLinks
        heading="Otras secciones"
        marginTop={16}
        items={[
          { to: '/ordenes', label: 'Bandeja de ordenes', show: hasAnyPermission(['ORDEN.READ', 'ORDEN.CREATE']) },
          { to: '/orders', label: 'Nueva orden', show: hasPermission('ORDEN.CREATE') },
          { to: '/patients', label: 'Pacientes', show: hasPermission('PACIENTE.READ') },
          { to: '/caja/cierre', label: 'Cierre de caja', show: hasPermission('CAJA.CERRAR') },
          { to: '/finanzas/estado', label: 'Estado financiero', show: hasAnyPermission(['CAJA.CERRAR', 'RESULTADOS.VALIDAR', 'ORDEN.READ']) },
          { to: '/lab/reportes', label: 'Indicadores LIS', show: hasPermission('RESULTADOS.VALIDAR') },
          { to: '/admin/users', label: 'Usuarios', show: hasPermission('USUARIO.READ') },
          { to: '/admin/empresa-caja', label: 'Politica de caja', show: hasPermission('EMPRESA.CONFIG') },
          { to: '/admin/formas-pago', label: 'Formas de pago', show: hasPermission('EMPRESA.CONFIG') },
        ]}
      />
    </div>
  );
}

function RequireAuthenticated({ children }: { children: ReactElement }) {
  const { user, isReady } = useAuth();
  if (!isReady) {
    return (
      <div className="pro-loading" style={{ minHeight: 40, padding: 32 }}>
        <p className="pro-muted" style={{ margin: 0 }}>
          Cargando sesion
        </p>
        <div className="pro-shimmer" style={{ height: 8, marginTop: 10, maxWidth: 200 }} />
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

function ProShell() {
  return (
    <RequireAuthenticated>
      <Routes>
        <Route
          path="/orders/voucher/:orderId"
          element={
            <RequirePermission anyOf={['ORDEN.READ', 'ORDEN.CREATE']}>
              <OrderVoucherPage />
            </RequirePermission>
          }
        />
        <Route
          path="*"
          element={
            <AppLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/ordenes" replace />} />
                <Route
                  path="/patients"
                  element={
                    <RequirePermission permission="PACIENTE.READ">
                      <PatientsPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/lab-exams"
                  element={
                    <RequirePermission permission="EXAMEN.READ">
                      <LabExamsPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/ordenes"
                  element={
                    <RequirePermission anyOf={['ORDEN.READ', 'ORDEN.CREATE']}>
                      <OrdersListPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <RequirePermission permission="ORDEN.CREATE">
                      <NewOrderPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/sar"
                  element={
                    <RequirePermission permission="FISCAL.READ">
                      <SarFiscalPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <RequirePermission permission="USUARIO.READ">
                      <UsersPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/admin/catalogo-examenes"
                  element={
                    <RequirePermission permission="EMPRESA.CONFIG">
                      <AdminExamCatalogPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/admin/laboratorio"
                  element={
                    <RequirePermission permission="EMPRESA.CONFIG">
                      <LabBrandingPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/admin/empresa-caja"
                  element={
                    <RequirePermission permission="EMPRESA.CONFIG">
                      <CompanyCashPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/admin/inventario-reactivos"
                  element={
                    <RequirePermission permission="EMPRESA.CONFIG">
                      <InventoryPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/finanzas/estado"
                  element={
                    <RequirePermission anyOf={['CAJA.CERRAR', 'RESULTADOS.VALIDAR', 'ORDEN.READ']}>
                      <FinancePage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/operacion/sincronizacion"
                  element={
                    <RequirePermission anyOf={['CAJA.CERRAR', 'ORDEN.CREATE', 'ORDEN.READ']}>
                      <OfflineSyncPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/admin/formas-pago"
                  element={
                    <RequirePermission permission="EMPRESA.CONFIG">
                      <PaymentMethodsPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/lab/muestras"
                  element={
                    <RequirePermission permission="MUESTRA.GESTION">
                      <SamplesPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/lab/resultados"
                  element={
                    <RequirePermission permission="RESULTADOS.VALIDAR">
                      <LabResultsPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/caja/cierre"
                  element={
                    <RequirePermission permission="CAJA.CERRAR">
                      <CashClosePage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/lab/reportes"
                  element={
                    <RequirePermission permission="RESULTADOS.VALIDAR">
                      <LabReportesPage />
                    </RequirePermission>
                  }
                />
                <Route path="/forbidden" element={<ForbiddenPage />} />
                <Route path="*" element={<Navigate to="/ordenes" replace />} />
              </Routes>
            </AppLayout>
          }
        />
      </Routes>
    </RequireAuthenticated>
  );
}

export function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProShell />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
