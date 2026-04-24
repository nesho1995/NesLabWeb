from __future__ import annotations

import datetime as dt
import os
import re
from typing import Any

import requests
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field


class ConclusionParameterInput(BaseModel):
    name: str
    value: str | None = None
    unit: str | None = None
    referenceText: str | None = None


class SuggestConclusionRequest(BaseModel):
    lineId: int
    orderId: int
    examCode: str
    examName: str
    resultFormat: str
    patientName: str | None = None
    patientSex: str | None = None
    patientAgeYears: int | None = None
    existingNotes: str | None = None
    parameters: list[ConclusionParameterInput] = Field(default_factory=list)
    locale: str = "es-HN"


class ConclusionReference(BaseModel):
    title: str
    url: str
    source: str
    publishedAtUtc: dt.datetime | None = None


class SuggestConclusionResponse(BaseModel):
    draftConclusion: str
    interpretation: str
    suggestedFollowUp: str
    limitations: str
    disclaimer: str
    confidenceLevel: str
    references: list[ConclusionReference]


SERVICE_TOKEN = os.getenv("AI_SERVICE_TOKEN", "dev-local-ai-token").strip()
PUBMED_TOOL = "neslab_ai_assistant"
PUBMED_EMAIL = os.getenv("PUBMED_EMAIL", "support@neslab.local").strip()

GUIDELINE_REFERENCES = [
    ConclusionReference(
        title="WHO Model List of Essential In Vitro Diagnostics",
        url="https://www.who.int/publications/i/item/9789240086769",
        source="WHO",
        publishedAtUtc=None,
    ),
    ConclusionReference(
        title="CDC Laboratory Quality Management System",
        url="https://www.cdc.gov/labquality/qms-toolkit.html",
        source="CDC",
        publishedAtUtc=None,
    ),
    ConclusionReference(
        title="PAHO: Quality in Clinical Laboratory Services",
        url="https://www.paho.org/en/topics/laboratories",
        source="PAHO",
        publishedAtUtc=None,
    ),
]

app = FastAPI(title="NesLab AI Assistant", version="1.0.0")


def _extract_range(reference_text: str | None) -> tuple[float, float] | None:
    if not reference_text:
        return None
    parsed = re.search(r"(-?\d+(?:[.,]\d+)?)\s*[-–]\s*(-?\d+(?:[.,]\d+)?)", reference_text)
    if not parsed:
        return None
    left = float(parsed.group(1).replace(",", "."))
    right = float(parsed.group(2).replace(",", "."))
    return (left, right)


def _safe_float(value: str | None) -> float | None:
    if value is None:
        return None
    cleaned = value.strip().replace(",", ".")
    if not cleaned:
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


def _parameter_interpretation(parameters: list[ConclusionParameterInput]) -> tuple[str, str]:
    findings: list[str] = []
    altered_count = 0
    measured_count = 0

    for parameter in parameters:
        numeric_value = _safe_float(parameter.value)
        normal_range = _extract_range(parameter.referenceText)
        if numeric_value is None or normal_range is None:
            continue
        measured_count += 1
        lower, upper = normal_range
        if numeric_value < lower:
            altered_count += 1
            findings.append(f"{parameter.name}: bajo ({numeric_value:g} {parameter.unit or ''})".strip())
        elif numeric_value > upper:
            altered_count += 1
            findings.append(f"{parameter.name}: alto ({numeric_value:g} {parameter.unit or ''})".strip())
        else:
            findings.append(f"{parameter.name}: dentro de rango")

    if measured_count == 0:
        return (
            "No fue posible evaluar desviaciones numéricas contra rangos de referencia en esta muestra.",
            "Interpretación limitada por ausencia de datos numéricos comparables con rangos de referencia.",
        )

    if altered_count == 0:
        return (
            "Los parámetros cuantificables reportados se mantienen en rangos de referencia.",
            "Perfil analítico sin alteraciones relevantes en los valores disponibles.",
        )

    return (
        "Se identifican alteraciones en parámetros cuantificables: " + "; ".join(findings[:4]) + ".",
        "Correlacionar con clínica, antecedentes y evolución del paciente para definir conducta.",
    )


def _confidence_level(request: SuggestConclusionRequest, reference_count: int) -> str:
    has_values = any((p.value or "").strip() for p in request.parameters)
    if has_values and reference_count >= 2:
        return "media"
    if has_values:
        return "baja"
    return "baja"


def _pubmed_references(exam_name: str, exam_code: str, max_items: int = 3) -> list[ConclusionReference]:
    term = f"{exam_name} clinical interpretation laboratory"
    if exam_code.strip():
        term = f"{term} {exam_code.strip()}"
    search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    summary_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"

    try:
        search = requests.get(
            search_url,
            params={
                "db": "pubmed",
                "retmode": "json",
                "retmax": max_items,
                "sort": "pub+date",
                "term": term,
                "tool": PUBMED_TOOL,
                "email": PUBMED_EMAIL,
            },
            timeout=5,
        )
        search.raise_for_status()
        ids = search.json().get("esearchresult", {}).get("idlist", [])
        if not ids:
            return []
        summary = requests.get(
            summary_url,
            params={
                "db": "pubmed",
                "retmode": "json",
                "id": ",".join(ids),
                "tool": PUBMED_TOOL,
                "email": PUBMED_EMAIL,
            },
            timeout=5,
        )
        summary.raise_for_status()
        payload: dict[str, Any] = summary.json()
        rows: list[ConclusionReference] = []
        for pmid in ids:
            item = payload.get("result", {}).get(pmid, {})
            title = str(item.get("title", "")).strip()
            pubdate_raw = str(item.get("pubdate", "")).strip()
            published_at = None
            if pubdate_raw:
                year_match = re.search(r"(\d{4})", pubdate_raw)
                if year_match:
                    published_at = dt.datetime(int(year_match.group(1)), 1, 1, tzinfo=dt.timezone.utc)
            if title:
                rows.append(
                    ConclusionReference(
                        title=title,
                        url=f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                        source="PubMed",
                        publishedAtUtc=published_at,
                    )
                )
        return rows
    except Exception:
        return []


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/suggest-conclusion", response_model=SuggestConclusionResponse)
def suggest_conclusion(
    request: SuggestConclusionRequest,
    x_service_token: str | None = Header(default=None, alias="X-Service-Token"),
) -> SuggestConclusionResponse:
    if SERVICE_TOKEN and x_service_token != SERVICE_TOKEN:
        raise HTTPException(status_code=401, detail="Token de servicio inválido.")

    findings, interpretation = _parameter_interpretation(request.parameters)
    pubmed_refs = _pubmed_references(request.exam_name, request.exam_code, max_items=3)
    references = (pubmed_refs + GUIDELINE_REFERENCES)[:5]
    confidence = _confidence_level(request, len(references))

    draft = (
        f"Hallazgos: {findings} "
        f"Interpretación preliminar: {interpretation} "
        "Sugerencia: confirmar correlación clínica y repetir/expandir panel si hay discordancia clínico-analítica."
    )
    limitations = (
        "Sugerencia basada en los datos disponibles en el LIS; no sustituye juicio profesional, "
        "ni integra exploración física, historia clínica completa o diagnóstico definitivo."
    )
    disclaimer = (
        "Borrador de apoyo para laboratorista. Debe ser revisado, editado y aprobado por personal autorizado "
        "antes de validación final del resultado."
    )

    return SuggestConclusionResponse(
        draftConclusion=draft,
        interpretation=interpretation,
        suggestedFollowUp=(
            "Correlacionar con guías internacionales vigentes (WHO/CDC/PAHO/PubMed) "
            "y protocolos locales aplicables en Honduras."
        ),
        limitations=limitations,
        disclaimer=disclaimer,
        confidenceLevel=confidence,
        references=references,
    )
