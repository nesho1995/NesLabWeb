import { test, expect } from "@playwright/test";
import { loginAndGetToken } from "./auth.helper";

test("ai conclusion suggestion endpoint returns draft and accepts feedback", async ({ request }) => {
  const token = await loginAndGetToken(request);
  const linesResp = await request.get("/api/lab-results/lines?status=todos&page=1&pageSize=1", {
    headers: { Authorization: `Bearer ${token}` }
  });
  expect(linesResp.ok()).toBeTruthy();
  const linesPayload = (await linesResp.json()) as {
    items: Array<{
      lineId: number;
      orderId: number;
      examCode: string;
      examName: string;
      resultFormat: string;
      patientName: string;
      resultNotes: string | null;
      resultFieldDefinitions: Array<{ name: string; unit: string | null; referenceText: string | null }>;
      resultParameterValues: Record<string, string>;
    }>;
  };
  test.skip(linesPayload.items.length === 0, "No hay líneas de resultados para probar sugerencia IA.");

  const line = linesPayload.items[0];
  const suggestResp = await request.post(`/api/lab-results/lines/${line.lineId}/suggest-conclusion`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      lineId: line.lineId,
      orderId: line.orderId,
      examCode: line.examCode,
      examName: line.examName,
      resultFormat: line.resultFormat,
      patientName: line.patientName,
      patientSex: null,
      patientAgeYears: null,
      existingNotes: line.resultNotes,
      parameters: line.resultFieldDefinitions.map((d) => ({
        name: d.name,
        value: line.resultParameterValues[d.name] ?? null,
        unit: d.unit,
        referenceText: d.referenceText
      })),
      locale: "es-HN"
    }
  });
  expect(suggestResp.ok()).toBeTruthy();
  const suggestion = (await suggestResp.json()) as {
    draftConclusion: string;
    confidenceLevel: string;
    disclaimer: string;
    references: unknown[];
  };
  expect(suggestion.draftConclusion.length).toBeGreaterThan(10);
  expect(suggestion.confidenceLevel.length).toBeGreaterThan(0);
  expect(suggestion.disclaimer.length).toBeGreaterThan(10);

  const feedbackResp = await request.post(`/api/lab-results/lines/${line.lineId}/suggest-conclusion/feedback`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      orderId: line.orderId,
      examCode: line.examCode,
      examName: line.examName,
      accepted: true,
      confidenceLevel: suggestion.confidenceLevel,
      disclaimer: suggestion.disclaimer,
      referencesCount: suggestion.references.length
    }
  });
  expect(feedbackResp.status()).toBe(202);
});
