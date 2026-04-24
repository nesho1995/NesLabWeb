# Asistente IA para conclusiones de laboratorio

## Objetivo

Apoyar al laboratorista con un borrador de conclusión clínica y referencias médicas, manteniendo validación humana obligatoria antes de liberar resultados.

## Flujo funcional

1. En `Cargar resultados`, el usuario pulsa `Sugerir IA`.
2. La API (`NesLab.Api`) envía contexto de la línea al servicio Python local.
3. El servicio responde con:
   - borrador de conclusión,
   - interpretación,
   - sugerencia de seguimiento,
   - limitaciones,
   - nivel de confianza,
   - referencias (PubMed + guías globales aplicables a Honduras).
4. El laboratorista decide `Insertar en notas` o `Descartar`.
5. Se registra auditoría de uso IA en `logs/ai-suggestions*.log`.

## Seguridad y gobernanza clínica

- Nunca auto-valida resultados.
- Siempre incluye disclaimer de revisión profesional.
- No reemplaza diagnóstico médico.
- Protegido por token interno `X-Service-Token` entre API y servicio Python.
- La API sanitiza longitud de campos para reducir riesgo de inyección de prompt.

## Configuración en API (.NET)

En `appsettings.Development.json` o variables de entorno:

```json
"AiAssistant": {
  "BaseUrl": "http://127.0.0.1:8091",
  "TimeoutSeconds": 8,
  "ServiceToken": "dev-local-ai-token"
}
```

## Levantar servicio Python (Linux)

```bash
cd /opt/neslab/NesLabWeb/src/ai-assistant
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export AI_SERVICE_TOKEN="dev-local-ai-token"
uvicorn app:app --host 127.0.0.1 --port 8091
```

## Ejemplo systemd

`/etc/systemd/system/neslab-ai.service`

```ini
[Unit]
Description=NesLab AI Assistant
After=network.target

[Service]
WorkingDirectory=/opt/neslab/NesLabWeb/src/ai-assistant
Environment=AI_SERVICE_TOKEN=dev-local-ai-token
ExecStart=/opt/neslab/NesLabWeb/src/ai-assistant/.venv/bin/uvicorn app:app --host 127.0.0.1 --port 8091
Restart=always
User=neslab

[Install]
WantedBy=multi-user.target
```

Activación:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now neslab-ai
sudo systemctl status neslab-ai
```
