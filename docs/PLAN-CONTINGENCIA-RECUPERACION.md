# Plan de Contingencia y Recuperacion

## Objetivo
Mantener la operacion del laboratorio ante caidas parciales o totales y recuperar servicio con perdida minima de datos.

## Escenarios criticos
- Sin internet.
- API fuera de servicio.
- Base de datos no disponible.
- Corrupcion de datos detectada.
- Error fiscal en regularizaciones.

## Procedimiento resumido

1. Detectar incidente (monitoreo o reporte de usuario).
2. Clasificar severidad:
   - S1: operacion detenida total.
   - S2: funcionalidad critica degradada.
   - S3: impacto parcial no bloqueante.
3. Activar contencion:
   - Usar operacion offline permitida para ordenes provisionales.
   - Congelar cambios administrativos no criticos.
4. Recuperar componente afectado (API/DB/red).
5. Validar salud (`/api/ops/health`) y pruebas smoke.
6. Ejecutar regularizacion de pendientes offline.
7. Documentar incidente (causa, tiempo, accion, prevencion).

## RTO/RPO sugerido
- RTO objetivo: 60-120 minutos.
- RPO objetivo: <= 24h (con backup diario).

## Checklist post-incidente
- [ ] Salud API y DB en estado OK.
- [ ] Ordenes nuevas creando correctamente.
- [ ] Caja abre/cierra correctamente.
- [ ] Resultados se guardan y validan.
- [ ] Offline pending sincronizado.
- [ ] Bitacora de acciones criticas revisada.
- [ ] Ticket cerrado con causa raiz y accion preventiva.
