# Plan de Pruebas Formales

## Objetivo
Garantizar estabilidad funcional antes de cada release.

## Suite minima E2E (obligatoria)

1. **Orden**
   - Login usuario con permiso de orden.
   - Crear paciente.
   - Crear orden con examenes y pago.
   - Ver comprobante.

2. **Caja**
   - Abrir caja con observacion.
   - Registrar orden con pagos.
   - Cerrar caja con arqueo por metodo.
   - Ver diferencia esperada/declarada.

3. **Resultados**
   - Cargar resultado.
   - Validar resultado.
   - Ver comprobante/listado.

4. **Offline-sync**
   - Simular offline.
   - Encolar orden provisional.
   - Reconectar y sincronizar.
   - Validar estado fiscal regularizado.

## Smoke tests por release

- Script rapido: `scripts/ops/release-smoke.ps1`.
- Checklist manual minimo:
  - [ ] Login.
  - [ ] Crear orden.
  - [ ] Cerrar caja.
  - [ ] Cargar/validar resultado.
  - [ ] Revisar estado sincronizacion.
  - [ ] Revisar health endpoint.

## Criterio de salida
- 0 bloqueantes en flujos criticos.
- 0 regresiones en fiscal/offline.
- Smoke completado en ambiente objetivo.
- Incidencias documentadas en tickets.
