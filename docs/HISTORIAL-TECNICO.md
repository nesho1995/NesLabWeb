# Historial Tecnico del Sistema NesLabWeb

Documento vivo para mantener contexto tecnico del sistema, decisiones clave y estado actual.

---

## 1. Resumen del sistema

NesLabWeb es un sistema web LIS (Laboratory Information System) con enfoque en:

- operacion diaria de laboratorio,
- cumplimiento fiscal (CAI / documento interno),
- caja y conciliacion por metodos de pago,
- inventario de reactivos,
- continuidad operativa offline (outbox + regularizacion),
- trazabilidad operativa y seguridad.

Stack principal:

- Backend: ASP.NET Core + EF Core + MySQL
- Frontend: React + TypeScript + Vite
- E2E: Playwright

---

## 2. Arquitectura funcional (alto nivel)

### Backend

- `NesLab.Api`: controladores HTTP, middleware, auth, rate limiting, seguridad de headers.
- `NesLab.Application`: DTOs, interfaces, reglas de negocio transversales.
- `NesLab.Domain`: entidades de dominio.
- `NesLab.Infrastructure`: servicios de negocio, persistencia EF Core, migraciones.

### Frontend

- `src/frontend/apps/web/src/features/*`: modulos por dominio (ordenes, resultados, caja, inventario, etc.).
- Routing y navegacion modular.
- Integracion API autenticada por bearer token.

---

## 3. Modulos implementados (estado actual)

- Autenticacion y sesion (JWT + refresh token).
- Usuarios y roles (consulta/gestion principal).
- Pacientes (CRUD).
- Catalogo de examenes (texto/panel, parametros).
- Ordenes y comprobantes.
- Caja (apertura/cierre, arqueo y conciliacion).
- Resultados de laboratorio (validacion de lineas).
- Inventario de reactivos (modo permisivo con alertas).
- Sincronizacion offline y regularizaciones.
- Dashboard y reportes financieros.
- Configuracion fiscal y marca fiscal.

---

## 4. Decisiones tecnicas clave

### 4.1 Fiscal (CAI vs interno)

- Se aplica `OrderFiscalRules` para decidir si la orden usa correlativo SAR (CAI) o documento interno.
- Reglas validadas por configuracion de empresa:
  - `useCai`
  - `allowNonSarDocument`
  - `useSarInvoice` en request de orden.

### 4.2 Zona horaria

- Operacion de negocio centrada en Honduras.
- En frontend de ordenes se muestra fecha/hora con `America/Tegucigalpa`.
- Filtros por fecha en ordenes (`fromDate` / `toDate`) se convierten en backend a UTC usando zona Honduras para evitar desfases.

### 4.3 Offline

- Outbox local para pendientes.
- Regularizacion al reconectar.
- Estado fiscal visible (pendiente / regularizada).

---

## 5. Seguridad y hardening aplicados

- Rate limiting global + policy para login.
- Auditoria detallada de intentos de login (exito/fallo, motivo, ip, user-agent).
- Auditoria de acciones criticas (middleware).
- HSTS en produccion.
- Security headers base.
- Sesion unica por usuario (revoca refresh tokens activos al nuevo login).
- Apertura de caja protegida con transaccion serializable (evita doble apertura concurrente).

Referencia operacional:

- `docs/SEGURIDAD-PRODUCCION.md`
- `docs/PRODUCCION-LINUX-OPS.md`

---

## 6. Pruebas y cobertura funcional actual

### E2E (Playwright)

- `smoke.spec.ts`
- `critical-flows.spec.ts`
- `full-ui-flow.spec.ts`
- `all-modules-data.spec.ts`

Cobertura destacada:

- flujo UI completo (orden + resultados + offline sync + caja),
- validaciones API por modulo con datos inventados,
- combinaciones fiscales CAI/no-CAI segun politica de empresa,
- validacion de examen panel y parametros.

### Regla nueva de resultados

- No se permite marcar validado un resultado sin contenido (texto/parametros).

---

## 7. Bitacora de cambios recientes (tecnica)

> Nota: esta seccion resume hitos relevantes. Actualizar al cierre de cada bloque de trabajo.

1) Seguridad operativa:
- Auditoria de login detallada.
- Endpoint de consulta operativa para intentos de login.

2) Validacion de resultados:
- Bloqueo de validacion sin contenido.
- E2E extendido para escenarios fiscales y panel.

3) Ordenes (fecha/hora):
- Visualizacion en hora local Honduras.
- Filtros por rango de fecha en backend y frontend.

---

## 8. Riesgos conocidos / consideraciones

- En desarrollo, builds pueden fallar por DLL bloqueadas si `NesLab.Api` ya esta ejecutandose.
  - Solucion: detener proceso API, luego `dotnet clean` + `dotnet build`.
- Artefactos `bin/obj`, reportes Playwright y logs no deben mezclarse con commits funcionales.
- Para produccion, secretos deben ir por variables de entorno/secret manager (no en archivos versionados).

---

## 9. Pendientes recomendados (tecnicos)

- Ampliar pruebas de regresion para impresiones/voucher en perfiles de impresion.
- Fortalecer limpieza automatica de artefactos locales (script de mantenimiento dev).
- Mantener checklist fiscal firmado por contador/fiscalista local.
- Revisar chunking frontend para reducir warning de bundle grande.

---

## 10. Guia de actualizacion de este archivo

Al terminar un bloque de trabajo, agregar:

1. Objetivo funcional.
2. Archivos tocados.
3. Riesgos/impacto.
4. Pruebas ejecutadas y resultado.
5. Estado final (subido/no subido).

Formato sugerido:

```md
### YYYY-MM-DD - Titulo corto
- Objetivo:
- Cambios:
- Pruebas:
- Resultado:
```

