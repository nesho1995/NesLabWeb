# Profesionalizacion Operativa (sin DevOps formal)

Este documento deja un marco practico para operar NesLabWeb de forma profesional en ambiente de desarrollo/preproduccion, excluyendo CI/CD y pipeline empresarial formal.

## 1) Calidad y seguridad

### Auditoria de permisos por rol
- Endpoint: `GET /api/ops/security/roles-permissions` (requiere `USUARIO.READ`).
- Objetivo: validar que cada rol tenga solo permisos necesarios.
- Frecuencia sugerida: semanal y previo a cada release.

### Bitacora de acciones criticas
- Se registra automaticamente toda llamada `POST/PUT/PATCH/DELETE` a `/api/*`.
- Endpoint consulta: `GET /api/ops/critical-actions?take=200`.
- Archivo configurable: `Operations:CriticalLogPath` en `appsettings`.
- Campos: fecha UTC, empresa, usuario, metodo HTTP, ruta, status, duracion, IP y user-agent.

### Backups automaticos
- Script: `scripts/ops/backup-mysql.ps1`.
- Recomendado: programar en Task Scheduler (Windows) cada noche.
- Politica minima:
  - Backup full diario.
  - Retencion 14 dias local + copia externa semanal.
  - Prueba de restauracion quincenal.

### Cifrado y manejo de secretos
- Desarrollo: usar `dotnet user-secrets`.
- Produccion: usar variables de entorno o vault externo.
- Reglas:
  - Nunca commitear secretos reales en `appsettings`.
  - Rotar secretos JWT y DB cada 90 dias o ante incidente.
  - API falla en `Production` si detecta secreto JWT placeholder.

### Hardening de servidor
- HTTPS obligatorio.
- HSTS habilitado en `Production`.
- Headers seguros aplicados por middleware:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` restringida.
- Pendiente operativo: firewall, cuentas no-admin para servicios, minimo de puertos expuestos.

## 2) Confiabilidad operativa

### Monitoreo base
- Endpoint de salud: `GET /api/ops/health`.
- Resultado esperado: `status=ok` y `db=up`.
- Scripts de monitoreo/alerta: `scripts/ops/monitor-health.ps1` y `scripts/ops/monitor-backup.ps1`.
- Guia de configuracion: `docs/MONITOREO-ALERTAS.md`.
- Monitorear:
  - Disponibilidad del endpoint.
  - Tiempo de respuesta p95.
  - Error rate HTTP 5xx.
  - Cantidad de acciones criticas fallidas (status >= 400).

### Alertas minimas recomendadas
- Caida de salud por mas de 2 chequeos consecutivos.
- p95 de API > 2.5s por 10 minutos.
- 5xx > 3% en ventana de 5 minutos.
- Fallo en backup diario.

### Contingencia y recuperacion
- Ver detalle en `docs\PLAN-CONTINGENCIA-RECUPERACION.md`.

## 3) Fiscal/compliance

- Validacion legal final obligatoria con contador/fiscalista local.
- Checklist y acta de validacion: `docs\FISCAL-COMPLIANCE-CHECKLIST.md`.
- Alcance minimo a validar:
  - CAI y rangos vigentes.
  - Regularizaciones offline.
  - Reportes y trazabilidad de cambios/acciones.

## 4) Pruebas formales

- Matriz y flujo formal en `docs\PLAN-PRUEBAS-FORMALES.md`.
- Smoke release rapido: `scripts/ops/release-smoke.ps1`.
- E2E con Playwright: `docs/PRUEBAS-E2E.md`.
- Suite minima E2E requerida por release:
  - Orden.
  - Caja.
  - Resultados.
  - Offline-sync.

## 5) Soporte y operacion

- Manual de usuario: `docs\MANUAL-USO.md`.
- Manual tecnico: `docs\INSTALACION-TECNICA.md`.
- SLA propuesto: `docs\SLA-SOPORTE.md`.
- Flujo de tickets: `docs\PROCESO-TICKETS.md`.
