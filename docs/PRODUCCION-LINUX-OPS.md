# Produccion Linux - Operacion lista

Este documento deja monitoreo, backups, alertas y smoke para servidor Linux.

## 1) Preparar scripts

```bash
cd /opt/neslab/NesLabWeb
chmod +x scripts/ops/linux/*.sh
cp scripts/ops/linux/ops.env.example scripts/ops/linux/ops.env
```

Editar `scripts/ops/linux/ops.env` con tus datos reales (DB y webhook).

## 2) Pruebas manuales rapidas

```bash
set -a
source scripts/ops/linux/ops.env
set +a

scripts/ops/linux/monitor-health.sh
scripts/ops/linux/monitor-backup.sh
scripts/ops/linux/backup-mysql.sh
scripts/ops/linux/release-smoke.sh
```

## 3) Cron recomendado

Abrir crontab:

```bash
crontab -e
```

Agregar:

```cron
# NesLab health cada 5 min
*/5 * * * * . /opt/neslab/NesLabWeb/scripts/ops/linux/ops.env && /opt/neslab/NesLabWeb/scripts/ops/linux/monitor-health.sh >> /var/log/neslab-monitor.log 2>&1

# Backup diario 2:00 AM
0 2 * * * . /opt/neslab/NesLabWeb/scripts/ops/linux/ops.env && /opt/neslab/NesLabWeb/scripts/ops/linux/backup-mysql.sh >> /var/log/neslab-backup.log 2>&1

# Verificar frescura de backup cada 30 min
*/30 * * * * . /opt/neslab/NesLabWeb/scripts/ops/linux/ops.env && /opt/neslab/NesLabWeb/scripts/ops/linux/monitor-backup.sh >> /var/log/neslab-monitor.log 2>&1

# Smoke rapido diario 2:20 AM
20 2 * * * . /opt/neslab/NesLabWeb/scripts/ops/linux/ops.env && /opt/neslab/NesLabWeb/scripts/ops/linux/release-smoke.sh >> /var/log/neslab-smoke.log 2>&1
```

## 4) Seguridad minima recomendada

- Ejecutar API con usuario no-root.
- Permisos restringidos a `ops.env` (`chmod 600`).
- Solo puertos necesarios abiertos (80/443; DB cerrada externa).
- Rotacion de secreto JWT y password DB.

## 5) Alertas por webhook

Si `WEBHOOK_URL` esta configurada, cualquier fallo critico envia alerta automatica.

## 6) Validacion post-subida

- Health `ok` durante 24h.
- Backup generado y detectado correctamente.
- Sin alertas falsas repetitivas.
- Smoke diario en verde.
