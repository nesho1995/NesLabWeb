# NesLabWeb

Sistema web para laboratorio clinico (LIS) con foco en operacion diaria, cumplimiento fiscal, caja, inventario de reactivos y continuidad offline.

## Modulos principales

- Ordenes y comprobantes (CAI / interno segun politica fiscal)
- Bandeja de ordenes con estado fiscal (regularizada / pendiente)
- Caja: apertura/cierre y conciliacion por metodo de pago
- Resultados de laboratorio y entrega al paciente
- Inventario de reactivos (modo permisivo con alertas)
- Sincronizacion offline (outbox + regularizacion)
- Estado financiero y exportacion Excel

## Estructura base

- `src/backend/NesLab.Api`: API ASP.NET Core + hosting de frontend compilado (`wwwroot`)
- `src/backend/NesLab.Application`: casos de uso, interfaces y DTOs
- `src/backend/NesLab.Domain`: entidades de dominio
- `src/backend/NesLab.Infrastructure`: EF Core, servicios, seguridad, multitenancy
- `src/frontend/apps/web`: SPA React
- `docs`: manuales de uso, instalacion y despliegue

## Documentacion

- [Manual de uso](docs/MANUAL-USO.md)
- [Manual tecnico de instalacion](docs/INSTALACION-TECNICA.md)
- [Operacion sin internet](docs/OPERACION-SIN-INTERNET.md)
- [Profesionalizacion operativa](docs/PROFESIONALIZACION-OPERATIVA.md)
- [Plan de contingencia y recuperacion](docs/PLAN-CONTINGENCIA-RECUPERACION.md)
- [Checklist fiscal/compliance](docs/FISCAL-COMPLIANCE-CHECKLIST.md)
- [Acta de validacion fiscal](docs/ACTA-VALIDACION-FISCAL.md)
- [Plan de pruebas formales](docs/PLAN-PRUEBAS-FORMALES.md)
- [Pruebas E2E](docs/PRUEBAS-E2E.md)
- [Monitoreo y alertas](docs/MONITOREO-ALERTAS.md)
- [Operacion Linux en produccion](docs/PRODUCCION-LINUX-OPS.md)
- [Seguridad de produccion](docs/SEGURIDAD-PRODUCCION.md)
- [SLA de soporte](docs/SLA-SOPORTE.md)
- [Proceso de tickets](docs/PROCESO-TICKETS.md)

## Inicio rapido (desarrollo)

1. Configurar MySQL y cadena de conexion.
2. Configurar secretos de JWT en API.
3. Ejecutar API (`NesLab.Api`) y frontend (`apps/web`) para desarrollo.
4. Verificar login, ordenes, caja, inventario y sincronizacion offline.

> Para despliegue productivo en servidor, seguir el manual tecnico completo.
