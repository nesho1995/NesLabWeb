# Pruebas E2E (Playwright)

## Ubicacion
- Config: `src/frontend/apps/web/playwright.config.ts`
- Tests: `src/frontend/apps/web/tests/e2e`

## Instalacion
```powershell
cd src\frontend\apps\web
npm install
npx playwright install
```

## Ejecucion
```powershell
# baseline smoke
npm run e2e -- --grep "smoke"

# flujo UI completo
npx playwright test --grep "Flujo UI completo"

# suite completa
npm run e2e
```

## Variables para flujos protegidos
```powershell
$env:E2E_BASE_URL = "http://localhost:5225"
$env:E2E_USERNAME = "admin"
$env:E2E_PASSWORD = "tu_password"
```

## Cobertura actual
- Health + carga login (`smoke.spec.ts`).
- Disponibilidad de endpoints criticos con autenticacion:
  - Ordenes
  - Caja
  - Resultados
  - Offline-sync
- Flujo UI completo (`full-ui-flow.spec.ts`):
  - Abrir caja
  - Crear orden real desde UI
  - Validar resultado desde UI
  - Encolar pendiente offline y sincronizar desde UI
  - Cerrar caja

> Recomendacion: mantener estas pruebas como gate previo a cada release.
