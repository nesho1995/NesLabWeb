# Proceso de Tickets

## Flujo
1. Registro del ticket (usuario/soporte).
2. Triage (severidad, impacto, modulo).
3. Asignacion responsable.
4. Diagnostico y mitigacion.
5. Validacion con usuario.
6. Cierre y leccion aprendida.

## Campos minimos del ticket
- Fecha/hora.
- Solicitante.
- Modulo (ordenes, caja, resultados, offline, fiscal, etc.).
- Descripcion del problema.
- Evidencia (captura, mensaje, orden/factura afectada).
- Severidad S1-S4.
- Estado (abierto, en progreso, validacion, cerrado).

## Reglas operativas
- Todo cambio en produccion debe tener ticket.
- Todo incidente S1/S2 debe tener postmortem.
- Reapertura permitida dentro de 72h si persiste falla.

## Metricas recomendadas
- Tickets por severidad.
- MTTA (tiempo de primera atencion).
- MTTR (tiempo de resolucion).
- % tickets reabiertos.
