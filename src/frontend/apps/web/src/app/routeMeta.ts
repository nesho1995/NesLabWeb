type Ctx = { kicker: string; label: string; subtitle?: string };

const titles: Record<string, Ctx> = {
  '/': { kicker: 'Bienvenida', label: 'Pantalla principal', subtitle: 'Aqui ve de un vistazo lo que puede hacer, y el menu a la izquierda lo lleva a cada tarea.' },
  '/patients': { kicker: 'Pacientes', label: 'Personas atendidas', subtitle: 'Busqueda, alta y datos de contacto.' },
  '/lab-exams': { kicker: 'Catalogo', label: 'Examenes y precios', subtitle: 'Lo que el laboratorio ofrece y cobra.' },
  '/orders': { kicker: 'Cobro', label: 'Nueva orden con facturacion', subtitle: 'Elija examenes, paciente y forma de pago.' },
  '/ordenes': { kicker: 'Listado', label: 'Todas las ordenes', subtitle: 'Cobros, estados e impresiones.' },
  '/sar': { kicker: 'Impuestos (SAR)', label: 'Regimen fiscal y CAI', subtitle: 'Cumplimiento hacia la administracion.' },
  '/admin/users': { kicker: 'Seguridad', label: 'Usuarios y permisos', subtitle: 'Quien puede entrar a que pantalla.' },
  '/admin/empresa-caja': { kicker: 'La empresa', label: 'Caja: reglas y montos', subtitle: 'Caja chica y politica de apertura/cierre.' },
  '/admin/formas-pago': { kicker: 'La empresa', label: 'Formas de pago', subtitle: 'Efectivo, tarjeta, transferencia, etc.' },
  '/admin/inventario-reactivos': { kicker: 'La empresa', label: 'Inventario de reactivos', subtitle: 'Existencia, minimos y ajustes de stock.' },
  '/lab/muestras': { kicker: 'Laboratorio', label: 'Muestras y etiquetas', subtitle: 'Quien dona y bajo que codigo de barra.' },
  '/lab/resultados': { kicker: 'Laboratorio', label: 'Cargar resultados', subtitle: 'Escriba valores y deje de validar.' },
  '/caja/cierre': { kicker: 'Caja', label: 'Apertura y cierre de caja', subtitle: 'Cuente el efectivo y cierre con diferencia cero o justificada.' },
  '/lab/reportes': { kicker: 'Gestion', label: 'Indicadores del LIS', subtitle: 'A vista: ordenes, tiempos y carga de trabajo.' },
  '/finanzas/estado': { kicker: 'Gestion', label: 'Estado financiero', subtitle: 'Ingresos, pagos y cuadre de caja por rango.' },
  '/operacion/sincronizacion': { kicker: 'Operacion', label: 'Sincronizacion offline', subtitle: 'Pendientes provisionales y regularizacion fiscal.' },
};

export function getRouteContext(pathname: string): Ctx {
  if (titles[pathname]) {
    return titles[pathname]!;
  }
  if (pathname.startsWith('/orders/voucher/')) {
    return { kicker: 'Comprobante', label: 'Voucher de la orden', subtitle: 'Puede imprimir o enviar a impresion.' };
  }
  return { kicker: 'NesLab', label: 'Panel', subtitle: 'Use el menu a la izquierda para el siguiente paso.' };
}
