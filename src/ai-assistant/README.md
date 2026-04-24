# NesLab AI Assistant (Python)

Servicio local en Python para sugerir borradores de conclusión clínica en resultados de laboratorio.

## Ejecutar en desarrollo

```bash
cd src/ai-assistant
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export AI_SERVICE_TOKEN=dev-local-ai-token
uvicorn app:app --host 127.0.0.1 --port 8091
```

## Endpoint principal

- `POST /suggest-conclusion`
- Header requerido: `X-Service-Token`
- Respuesta: borrador, interpretación, limitaciones, confianza y referencias.

## Alcance clínico

- Genera un borrador editable (no valida automáticamente).
- Incluye referencias de PubMed + guías globales (WHO/CDC/PAHO) útiles para contexto Honduras.
- Siempre devuelve disclaimer para revisión por laboratorista.
