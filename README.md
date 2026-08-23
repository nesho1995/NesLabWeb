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
- [Bitacora de desarrollo](docs/BITACORA-DESARROLLO.md)

## Inicio rapido (desarrollo)

Requisitos: .NET SDK 9, Node.js 20 o superior, MySQL 8.4 LTS y Git.

En Windows, desde PowerShell en la raiz del repositorio:

```powershell
.\scripts\setup-windows.ps1
.\scripts\dev-local.ps1
```

El primer comando crea la base local y compila todo. El segundo abre web y API en `http://localhost:5225`; al iniciar, EF Core aplica las migraciones pendientes y crea los datos iniciales.

Las credenciales temporales para una base nueva se muestran únicamente en la pantalla de acceso del entorno de desarrollo. Cámbielas antes de usar datos reales. Para opciones de MySQL, variables de entorno y producción, consulte el manual técnico.

> Para despliegue productivo en servidor, seguir el manual tecnico completo.

