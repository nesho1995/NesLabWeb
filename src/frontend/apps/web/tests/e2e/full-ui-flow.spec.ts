import { expect, test } from "@playwright/test";
import { loginAndGetSession } from "./auth.helper";

type SetupData = {
  patientId: number;
  patientName: string;
  examId: number;
  examCode: string;
  examName: string;
  paymentMethodId: number;
  paymentMethodName: string;
};

async function seedDataForFlow(baseURL: string, token: string): Promise<SetupData> {
  const suffix = Date.now().toString().slice(-6);
  const patientName = `E2E Paciente ${suffix}`;
  const examCode = `E2E-${suffix}`;
  const examName = `E2E Glucosa ${suffix}`;

  const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const patientRes = await fetch(`${baseURL}/api/patients`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({
      fullName: patientName,
      nationalId: `${suffix.padStart(6, "0")}12345678`,
      phone: "99998888"
    })
  });
  expect(patientRes.ok).toBeTruthy();
  const patient = (await patientRes.json()) as { id: number };

  const examRes = await fetch(`${baseURL}/api/lab-exams`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({
      code: examCode,
      name: examName,
      price: 220,
      resultFormat: "texto",
      parameters: []
    })
  });
  expect(examRes.ok).toBeTruthy();
  const exam = (await examRes.json()) as { id: number };

  const pmRes = await fetch(`${baseURL}/api/payment-methods/active`, { headers: auth });
  expect(pmRes.ok).toBeTruthy();
  const methods = (await pmRes.json()) as Array<{ id: number; name: string; code: string }>;
  const method = methods.find((m) => m.code === "EFECTIVO") ?? methods[0];
  expect(!!method).toBeTruthy();

  return {
    patientId: patient.id,
    patientName,
    examId: exam.id,
    examCode,
    examName,
    paymentMethodId: method.id,
    paymentMethodName: method.name
  };
}

test.describe("Flujo UI completo", () => {
  test("crear orden, abrir/cerrar caja, validar resultado y sincronizar offline", async ({ page, request, baseURL }) => {
    test.setTimeout(180_000);
    test.skip(!baseURL, "Missing baseURL.");

    const session = await loginAndGetSession(request);
    const setup = await seedDataForFlow(baseURL!, session.accessToken);

    await page.addInitScript((tokens) => {
      localStorage.setItem("neslab.accessToken", tokens.accessToken);
      localStorage.setItem("neslab.refreshToken", tokens.refreshToken);
    }, session);
    await page.goto("/");
    await expect(page.getByText(/panel|mostrador|ordenes/i).first()).toBeVisible();

    // 1) Abrir caja si esta cerrada.
    await page.goto("/caja/cierre");
    if (await page.getByRole("button", { name: /Abrir caja/i }).isVisible()) {
      await page.getByRole("button", { name: /Abrir caja/i }).click();
      await expect(page.getByText("Caja abierta")).toBeVisible();
    }

    // 2) Crear orden real por UI.
    await page.goto("/orders");
    await page.getByLabel("Busqueda").fill(setup.patientName);
    await page.getByRole("button", { name: setup.patientName }).first().click();
    await page.getByPlaceholder("Nombre o código").fill(setup.examCode);
    await page.locator("label.pro-cb", { hasText: setup.examName }).locator("input[type='checkbox']").check();
    const amountReceived = page
      .locator("label", { hasText: "Monto recibido (HNL)" })
      .locator("xpath=following::input[1]");
    if (await amountReceived.count()) {
      await amountReceived.fill("500");
    }
    await page.getByRole("button", { name: /Facturar orden/i }).click();
    await expect(page.getByText("Orden registrada")).toBeVisible();

    // 3) Validar resultado de la linea creada.
    await page.goto("/lab/resultados");
    await page.getByPlaceholder("Nº orden, comprobante, paciente, codigo, examen").fill(setup.examCode);
    const row = page.locator("tbody tr", { hasText: setup.examCode }).first();
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Editar" }).click();
    const textArea = row.locator("textarea.pro-input").first();
    await expect(textArea).toBeVisible();
    await textArea.fill("Resultado E2E OK");
    await row.getByRole("button", { name: "Validar" }).click();
    await expect(page.locator("tbody tr", { hasText: setup.examCode })).toHaveCount(0);

    // 4) Encolar pendiente offline y sincronizar desde UI.
    const tempId = `TMP-E2E-${Date.now()}`;
    await page.evaluate((payload) => {
      const key = "neslab.offline.orders.pending.v1";
      const current = JSON.parse(localStorage.getItem(key) ?? "[]");
      current.push(payload);
      localStorage.setItem(key, JSON.stringify(current));
      window.dispatchEvent(new Event("neslab-offline-outbox-updated"));
    }, {
      tempId,
      createdAtIso: new Date().toISOString(),
      patientName: setup.patientName,
      requestedCai: false,
      payload: {
        patientId: setup.patientId,
        discountPercent: 0,
        discountTypeLabel: "E2E",
        lines: [{ labExamId: setup.examId }],
        paymentMethod: setup.paymentMethodName,
        paymentMethodId: setup.paymentMethodId,
        amountReceived: 500,
        isFinalConsumer: true,
        clientLegalName: null,
        clientRtn: null,
        useSarInvoice: false
      },
      idempotencyKey: `idem-${Date.now()}`
    });

    await page.goto("/operacion/sincronizacion");
    await expect(page.getByText(tempId)).toBeVisible();
    await page.locator(".pro-page").getByRole("button", { name: /Sincronizar ahora/i }).first().click();
    await expect(page.getByText(/Pendientes de regularizar \(0\)|No hay pendientes\./i).first()).toBeVisible();
    await expect(page.getByText(tempId)).toBeVisible();

    // 5) Cerrar caja por UI.
    await page.goto("/caja/cierre");
    if (await page.getByRole("button", { name: /Registrar cierre y arqueo/i }).isVisible()) {
      await page.getByRole("button", { name: /Registrar cierre y arqueo/i }).click();
      await expect(page.getByText("Cierre registrado")).toBeVisible();
    }
  });
});
