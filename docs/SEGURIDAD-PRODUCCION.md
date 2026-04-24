# Seguridad de Produccion (Checklist Ejecutable)

Este checklist deja NesLabWeb listo para un entorno productivo Linux con enfoque en:

- exposicion minima de puertos,
- mitigacion de SQL injection,
- manejo seguro de secretos,
- hardening de API y base de datos.

## 1) SQL injection: estado y validacion

Estado actual del proyecto:

- La API usa EF Core en operaciones normales (queries parametrizadas).
- El uso de SQL crudo detectado usa placeholders parametrizados (`FromSqlRaw(... {0} ...)`) y no concatena input del usuario.
- No se debe introducir SQL con string interpolation para datos externos.

Regla operativa obligatoria:

- Prohibido usar patrones como `"... " + input` o `$"SELECT ... {input}"` en SQL.
- Si se usa SQL crudo: solo `FromSqlRaw`/`ExecuteSqlRaw` con parametros o `FromSqlInterpolated`.

Comando de verificacion rapida antes de release:

```bash
rg "FromSqlRaw\\(|ExecuteSqlRaw\\(|SqlQueryRaw\\(|\\$\"SELECT|\\$\"UPDATE|\\$\"INSERT|\\$\"DELETE" src/backend
```

## 2) Puertos: que abrir y que cerrar

Puertos recomendados en produccion:

- Abrir publico:
  - `80/tcp` (solo redireccion a HTTPS)
  - `443/tcp` (trafico web/API)
- Restringir por IP administradora:
  - `22/tcp` (SSH)
- No exponer publicamente:
  - `3306/tcp` (MySQL)
  - puertos internos Kestrel (`5000/5001/5225` o equivalentes)

## 3) Firewall Linux (UFW)

Ejemplo base:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing

sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow from <TU_IP_ADMIN>/32 to any port 22 proto tcp

sudo ufw enable
sudo ufw status verbose
```

## 4) Reverse proxy (Nginx) y Kestrel interno

Practica recomendada:

- Nginx publica `80/443`.
- API en Kestrel solo en localhost (ej. `127.0.0.1:5225`).
- TLS termina en Nginx (certificado valido).

Bloque minimo Nginx:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com;

    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5225;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 5) Secretos (JWT, DB, webhooks)

No guardar secretos reales en repositorio ni en `appsettings.json` productivo.

Usar variables de entorno o secret manager:

- `ConnectionStrings__MySql`
- `Jwt__Secret`
- `Jwt__Issuer`
- `Jwt__Audience`
- `Operations__CriticalLogPath`
- `Operations__AuthLoginAuditPath`
- `WEBHOOK_URL` (si aplica)

Regla de despliegue:

- Rotar `Jwt__Secret` antes de go-live.
- Rotar password de DB al menos cada 90 dias.
- Permisos de archivos secretos: `chmod 600`.

## 6) Base de datos segura

- Usuario de aplicacion sin privilegios de administrador.
- Deshabilitar acceso remoto a MySQL salvo necesidad controlada.
- Backups cifrados y verificados (restore test mensual).

## 7) Controles de app ya incluidos

- Rate limiting global y especifico de login.
- HSTS en produccion.
- HTTPS redirection.
- Headers de seguridad basicos.
- Auditoria de acciones criticas.
- Auditoria detallada de intentos de login.

## 8) Verificacion final previa a go-live

- [ ] `Jwt__Secret` ya no contiene placeholders de desarrollo.
- [ ] API accesible solo por Nginx (no puerto Kestrel publico).
- [ ] `3306` no expuesto a internet.
- [ ] UFW activo con politica deny by default.
- [ ] Certificado TLS valido y renovacion automatica.
- [ ] CORS configurado solo con dominio(s) productivos.
- [ ] Backups funcionando y monitoreados.
- [ ] Pruebas smoke/E2E en verde.

