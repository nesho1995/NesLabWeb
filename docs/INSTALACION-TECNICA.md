# Manual tecnico de instalacion y despliegue - NesLabWeb

Este documento deja el sistema listo para instalacion local, preproduccion y servidor productivo.

## 1. Requisitos

## 1.1 Software base

- .NET SDK 8.x
- Node.js 20.x o superior
- MySQL 8.x
- Git

## 1.2 Requisitos de servidor (sugerido)

- CPU: 4 vCPU o mas
- RAM: 8 GB o mas
- Disco: 80 GB SSD o mas
- SO: Windows Server 2019+ o Linux equivalente

## 2. Variables y configuracion

## 2.1 API (`src/backend/NesLab.Api`)

`appsettings.json` base:

- `ConnectionStrings:MySql`
- `Jwt:Secret`
- `Jwt:Issuer`
- `Jwt:Audience`

Recomendado:

- Guardar secretos en variables de entorno o secret manager.
- No versionar secretos reales.

## 2.2 Frontend (`src/frontend/apps/web`)

- Configurar URL de API segun entorno si aplica.
- Construir build de produccion antes de publicar.

## 3. Base de datos

1. Crear base `neslab` (o nombre definido por entorno).
2. Configurar usuario con permisos de lectura/escritura/esquema.
3. Ejecutar migraciones EF Core desde `NesLab.Api`.

Comando:

```bash
dotnet ef database update --project ../NesLab.Infrastructure --startup-project .
```

Si el proyecto aplica migracion automatica al iniciar, validar que el usuario de DB tenga permisos para `ALTER/CREATE`.

## 4. Ejecucion en desarrollo

## 4.1 Backend

Desde `src/backend/NesLab.Api`:

```bash
dotnet restore
dotnet build
dotnet run
```

## 4.2 Frontend

Desde `src/frontend/apps/web`:

```bash
npm install
npm run dev
```

## 5. Build de produccion

## 5.1 Frontend

Desde `src/frontend/apps/web`:

```bash
npm ci
npm run build
```

Publicar artefactos en `wwwroot` de la API (segun pipeline actual del equipo).

## 5.2 Backend

Desde `src/backend/NesLab.Api`:

```bash
dotnet publish -c Release -o ./publish
```

## 6. Despliegue a servidor (patron recomendado)

## 6.1 Opcion A: IIS + ASP.NET Core Hosting Bundle (Windows)

1. Instalar Hosting Bundle .NET 8.
2. Crear sitio en IIS apuntando a carpeta `publish`.
3. Configurar App Pool en `No Managed Code`.
4. Definir variables de entorno seguras (`ConnectionStrings__MySql`, `Jwt__Secret`, etc.).
5. Abrir puertos y configurar HTTPS con certificado.

## 6.2 Opcion B: Kestrel + reverse proxy (Nginx/Apache)

1. Ejecutar API como servicio.
2. Reverse proxy hacia puerto interno de Kestrel.
3. Forzar HTTPS en proxy.
4. Configurar reinicio automatico del servicio.

## 7. Checklist de salida a produccion

- [ ] Backup de base de datos previo al despliegue.
- [ ] Variables de entorno cargadas.
- [ ] Migraciones aplicadas correctamente.
- [ ] Login y permisos por rol validados.
- [ ] Flujo orden -> comprobante -> resultado probado.
- [ ] Caja apertura/cierre validada.
- [ ] Modo offline y sincronizacion validados.
- [ ] Estado financiero y exportacion Excel validados.
- [ ] Monitoreo basico habilitado (logs + espacio disco).

## 8. Verificacion post-despliegue

Pruebas minimas:

1. Crear orden fiscal (CAI) y confirmar comprobante.
2. Crear orden en modo offline/provisional y sincronizar.
3. Revisar `Estado fiscal` en bandeja.
4. Ejecutar cierre de caja con conciliacion por metodos.
5. Exportar bitacora de regularizaciones y estado financiero.

## 9. Operacion y mantenimiento

- Rotar claves JWT y credenciales DB bajo procedimiento.
- Programar backup diario de DB.
- Revisar logs de API por errores de sincronizacion.
- Actualizar dependencias en ventanas de mantenimiento.

## 10. Pipeline sugerido (CI/CD)

1. `dotnet restore/build/test`
2. `npm ci/build`
3. Empaquetado backend + frontend
4. Deploy por entorno (staging -> production)
5. Smoke tests automaticos

## 11. Notas sobre este repositorio

- Este repositorio (`NesLabWeb`) es independiente y contiene solo la capa web.
- No incluye los proyectos de escritorio historicos fuera de esta carpeta.
