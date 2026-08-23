# Bitácora de desarrollo de NESLAB

Este archivo conserva el contexto operativo del proyecto para evitar repetir análisis en futuras sesiones. Debe actualizarse después de cada cambio relevante.

## Estado actual

- Fecha de revisión: 2026-08-23
- Repositorio: `nesho1995/NesLabWeb`
- Rama remota principal: `master`
- Frontend: React 19 + TypeScript + Vite
- Backend: ASP.NET Core / .NET 9
- Base de datos: MySQL 8.4 LTS
- URL local: `http://localhost:5225`
- Base local: `neslab`
- Usuario inicial de aplicación: `admin`
- La contraseña temporal no se registra en esta bitácora; se muestra en la pantalla de acceso solo durante desarrollo.

## Trabajo realizado

1. Se identificó `NesLabWeb` como el repositorio activo del sistema web.
2. Se preparó un entorno local con Git, Node.js 24, .NET SDK 9 y MySQL 8.4.
3. Se creó la base `neslab` y el usuario local de base de datos `neslab`.
4. Se restauró y compiló el backend sin errores.
5. Se instalaron y compilaron las dependencias del frontend.
6. Se corrigió la migración `20260424063008_PendingModelSync`, que intentaba modificar `examen_parametros` antes de que la tabla existiera.
7. Se validaron las 13 migraciones, la página principal y el inicio de sesión del administrador.
8. Se creó un iniciador local y un acceso directo de escritorio.

## Mejoras aplicadas en la revisión

- Se alinearon requisitos y documentación con .NET 9 y MySQL 8.4 LTS.
- Se corrigió la configuración local a `127.0.0.1:3306` y autenticación compatible con MySQL 8.4.
- Se agregó `scripts/setup-windows.ps1` para preparar base, frontend y backend de forma repetible.
- Se reforzó `scripts/dev-local.ps1` con validación de requisitos, `npm ci` y errores explícitos.
- Se añadió un `.gitignore` raíz y se retirarán del control de versiones artefactos `bin`, `obj`, bundles y archivos cargados.
- Se actualizaron React Router, Vite y SheetJS; `npm audit` quedó en cero vulnerabilidades.
- Se actualizó Docker Compose con una comprobación de salud compatible con MySQL 8.4.

## Pendientes

- Revisar el resultado final y publicar el commit.

## Validación final de 2026-08-23

- `npm ci`: correcto.
- `npm run build`: correcto; el paquete principal bajó de aproximadamente 939 KB a 445 KB al cargar SheetJS bajo demanda.
- `npm audit`: 0 vulnerabilidades.
- `dotnet test`: 26 de 26 pruebas superadas.
- Auditoría NuGet: 0 paquetes vulnerables conocidos.
- Compilación de API Release: 0 advertencias y 0 errores.
- Instalación limpia: HTTP 200, inicio de sesión de desarrollo correcto y 13 migraciones aplicadas.
- `scripts/setup-windows.ps1`: ejecutado de principio a fin correctamente.
- Revisión posterior al PR: contraseñas con caracteres especiales se serializan de forma segura tanto en SQL como en la cadena de conexión.
- Se retiró por completo el asistente de conclusiones por IA: interfaz, API, servicio Python, configuración, auditoría, documentación y pruebas dedicadas. La captura y validación manual de resultados continúa disponible.
- Se agregó GitHub Actions para compilar frontend y backend, ejecutar pruebas y auditar dependencias automáticamente en cada PR y cambio a `master`.
- Se eliminó la contraseña MySQL de respaldo incrustada en el backend; ahora la cadena `ConnectionStrings:MySql` debe estar configurada explícitamente.
- La facturación de nuevas órdenes clasifica todos los exámenes como exentos: ISV en cero, importe gravado en cero e importe exento igual al subtotal después del descuento.
- La selección de exámenes se rediseñó como catálogo táctil con cuadros visuales, iconos clínicos, precio, estado seleccionado y total, adaptable a tablets y computadoras.

## Criterios antes de publicar

- Instalación nueva automatizada o claramente documentada.
- Migraciones aplicables sobre una base vacía.
- Compilación y pruebas de backend correctas.
- Compilación y pruebas relevantes de frontend correctas.
- Secretos de producción fuera del repositorio.
- Sin artefactos temporales ni credenciales personales en el commit.
- Instrucciones de recuperación y arranque verificadas.

## Próximo paso

Mantener las pruebas y revisar periódicamente accesibilidad, copias de seguridad y tiempos de respuesta en los módulos con más datos.

