# Manual de uso - NesLabWeb

Este manual esta pensado para recepcion, caja, laboratorio y administracion.

## 1. Acceso al sistema

1. Abrir la URL del sistema en navegador.
2. Ingresar usuario y contrasena.
3. Verificar permisos visibles en menu (segun rol).

## 2. Flujo operativo diario recomendado

1. Confirmar estado de red (conectado/sin internet).
2. Abrir caja (si aplica el rol).
3. Registrar ordenes y pagos.
4. Gestionar muestras y resultados.
5. Revisar bandeja de ordenes y estado fiscal.
6. Ejecutar cierre de caja.
7. Revisar estado financiero del dia.

## 3. Modulo de ordenes

### Crear nueva orden

1. Ir a `Nueva orden`.
2. Seleccionar paciente.
3. Agregar examenes.
4. Elegir metodo de pago.
5. Confirmar comprobante:
   - fiscal (CAI), o
   - interno/provisional (segun politica).
6. Guardar e imprimir/ver comprobante.

### Bandeja de ordenes

- Busqueda por comprobante, paciente o identidad/RTN.
- Filtro de estado fiscal:
  - `Todos`
  - `Regularizada`
  - `Pendiente`
- Columna `Estado fiscal` para control de regularizacion.

## 4. Modo sin internet (operativo)

Cuando no hay internet:

- El sistema muestra estado `Sin internet`.
- Las ordenes se encolan en outbox local (provisionales).
- El comprobante fiscal final CAI se regulariza al reconectar.
- No se detiene la atencion diaria.

Al reconectar:

1. Ir a `Sincronizacion offline`.
2. Clic en `Sincronizar ahora` (o esperar auto-sync).
3. Revisar bitacora de regularizaciones.
4. Exportar bitacora Excel si se requiere auditoria.

## 5. Caja (apertura/cierre)

### Apertura

- Abrir una sola caja activa por empresa.
- Campo `turno observacion` por defecto en `0`.

### Cierre

1. Registrar montos por metodo (efectivo/POS/transferencia/etc.).
2. Comparar `sistema` vs `ingresado`.
3. Revisar diferencias.
4. Guardar cierre.

## 6. Inventario de reactivos

- Registro de reactivos con:
  - codigo (auto si se deja vacio),
  - nombre,
  - unidad,
  - existencia actual,
  - minimo.
- Alertas de bajo stock (modo permisivo: no bloquea la operacion).
- Uso recomendado: revisar alertas antes de alta carga de ordenes.

## 7. Resultados

- Gestionar captura y validacion.
- Compartir comprobante/resultado por canales disponibles (segun politica del laboratorio).
- Confirmar identidad de paciente antes de entrega.

## 8. Estado financiero

- Consultar por rango de fechas.
- Revisar:
  - ingresos por metodo,
  - resumen diario de entradas/salidas,
  - indicadores de caja.
- Exportar Excel para gerencia/contabilidad.

## 9. Buenas practicas

- No compartir credenciales.
- Registrar observaciones de excepciones operativas.
- Evitar cambios de configuracion fiscal sin autorizacion.
- Hacer cierre de caja diario sin saltos.
- Revisar pendientes de sincronizacion al inicio y fin del dia.

## 10. Soporte y escalamiento interno

Ante incidentes:

1. Capturar pantalla y hora del error.
2. Indicar modulo y accion exacta.
3. Reportar a soporte tecnico con evidencia.
