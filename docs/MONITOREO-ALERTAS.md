# Monitoreo y Alertas Operativas

## Scripts disponibles
- `scripts/ops/monitor-health.ps1`
- `scripts/ops/monitor-backup.ps1`
- `scripts/ops/send-alert-webhook.ps1`
- `scripts/ops/linux/monitor-health.sh`
- `scripts/ops/linux/monitor-backup.sh`
- `scripts/ops/linux/backup-mysql.sh`
- `scripts/ops/linux/release-smoke.sh`
- `scripts/ops/linux/send-alert-webhook.sh`

## 1) Monitoreo de salud API
```powershell
.\scripts\ops\monitor-health.ps1 -ApiBaseUrl "http://localhost:5225" -LatencyWarnMs 2500
```

Con webhook:
```powershell
.\scripts\ops\monitor-health.ps1 `
  -ApiBaseUrl "http://localhost:5225" `
  -WebhookUrl "https://tu-webhook"
```

## 2) Monitoreo de backups
```powershell
.\scripts\ops\monitor-backup.ps1 -BackupDir ".\backups" -MaxAgeHours 26
```

Con webhook:
```powershell
.\scripts\ops\monitor-backup.ps1 `
  -BackupDir ".\backups" `
  -WebhookUrl "https://tu-webhook"
```

## 3) Programacion recomendada (Task Scheduler)
- Health: cada 5 minutos.
- Backup check: cada 30 minutos.
- Backup full (`backup-mysql.ps1`): diario (noche).

## 3.1 Programacion recomendada Linux (cron)
- Health: `*/5 * * * *`
- Backup check: `*/30 * * * *`
- Backup full: `0 2 * * *`
- Smoke diario: `20 2 * * *`

Ver guia completa: `docs/PRODUCCION-LINUX-OPS.md`

## 4) Severidad sugerida
- **critical**: health caido, DB down, backup inexistente/desactualizado.
- **warning**: latencia alta sostenida.
- **info**: recuperacion de servicio o validaciones manuales.
