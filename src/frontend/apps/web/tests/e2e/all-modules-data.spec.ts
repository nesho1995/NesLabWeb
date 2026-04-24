import { expect, test } from "@playwright/test";
import { loginAndGetSession } from "./auth.helper";

type AuthHeaders = Record<string, string>;

function authHeaders(token: string): AuthHeaders {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };
}

test.describe("Validacion completa de modulos (datos)", () => {
  test("crud, formatos y validaciones con datos inventados", async ({ request, baseURL }) => {
    test.setTimeout(240_000);
    test.skip(!baseURL, "Missing baseURL.");

    const session = await loginAndGetSession(request);
    const headers = authHeaders(session.accessToken);
    const suffix = Date.now().toString().slice(-7);

    let patientId = 0;
    let examId = 0;
    let orderId = 0;
    let sampleId = 0;
    let reagentId = 0;
    let paymentMethodId = 0;
    let createdUserId = 0;

    await test.step("Ops + dashboard + finance", async () => {
      const health = await request.get("/api/ops/health");
      expect(health.ok()).toBeTruthy();

      const roleAudit = await request.get("/api/ops/security/roles-permissions", { headers });
      expect(roleAudit.ok()).toBeTruthy();

      const critical = await request.get("/api/ops/critical-actions?take=50", { headers });
      expect(critical.ok()).toBeTruthy();

      const dashboard = await request.get("/api/lab-dashboard", { headers });
      expect(dashboard.ok()).toBeTruthy();

      const today = new Date().toISOString().slice(0, 10);
      const finance = await request.get(`/api/lab-dashboard/finance?fromDate=${today}&toDate=${today}`, { headers });
      expect(finance.ok()).toBeTruthy();
    });

    await test.step("Pacientes: create/list/update + validacion", async () => {
      const invalid = await request.post("/api/patients", {
        headers,
        data: { fullName: "", nationalId: null, phone: null }
      });
      expect(invalid.status()).toBeGreaterThanOrEqual(400);

      const create = await request.post("/api/patients", {
        headers,
        data: {
          fullName: `Paciente E2E ${suffix}`,
          nationalId: `${suffix}1234567`,
          phone: "99990000"
        }
      });
      expect(create.ok()).toBeTruthy();
      const created = (await create.json()) as { id: number; fullName: string };
      patientId = created.id;
      expect(created.fullName).toContain(`E2E ${suffix}`);

      const list = await request.get(`/api/patients?search=${encodeURIComponent(`E2E ${suffix}`)}&page=1&pageSize=10`, {
        headers
      });
      expect(list.ok()).toBeTruthy();
      const listBody = (await list.json()) as { items: Array<{ id: number }> };
      expect(listBody.items.some((x) => x.id === patientId)).toBeTruthy();

      const update = await request.put(`/api/patients/${patientId}`, {
        headers,
        data: {
          fullName: `Paciente E2E ${suffix} Editado`,
          nationalId: `${suffix}1234567`,
          phone: "98887777",
          isActive: true
        }
      });
      expect(update.ok()).toBeTruthy();
    });

    await test.step("Examenes: create/list/update + panel params", async () => {
      const create = await request.post("/api/lab-exams", {
        headers,
        data: {
          code: `E2E-${suffix}`,
          name: `Examen E2E ${suffix}`,
          price: 199.5,
          resultFormat: "panel",
          parameters: [
            { name: "Glucosa", sortOrder: 1, unit: "mg/dL", referenceText: "70-110", isActive: true },
            { name: "Colesterol", sortOrder: 2, unit: "mg/dL", referenceText: "0-200", isActive: true }
          ]
        }
      });
      expect(create.ok()).toBeTruthy();
      const created = (await create.json()) as { id: number; resultFormat: string };
      examId = created.id;
      expect(created.resultFormat).toBe("panel");

      const list = await request.get(`/api/lab-exams?search=${encodeURIComponent(`E2E-${suffix}`)}&page=1&pageSize=10`, {
        headers
      });
      expect(list.ok()).toBeTruthy();

      const detail = await request.get(`/api/lab-exams/${examId}`, { headers });
      expect(detail.ok()).toBeTruthy();
      const exam = (await detail.json()) as { parameters: Array<{ name: string }> };
      expect(exam.parameters.length).toBeGreaterThanOrEqual(2);

      const invalidPanel = await request.put(`/api/lab-exams/${examId}`, {
        headers,
        data: {
          code: `E2E-${suffix}`,
          name: `Examen E2E ${suffix} Panel Invalido`,
          price: 210,
          isActive: true,
          resultFormat: "panel",
          parameters: []
        }
      });
      expect(invalidPanel.status()).toBeGreaterThanOrEqual(400);

      const update = await request.put(`/api/lab-exams/${examId}`, {
        headers,
        data: {
          code: `E2E-${suffix}`,
          name: `Examen E2E ${suffix} Texto`,
          price: 210,
          isActive: true,
          resultFormat: "texto",
          parameters: []
        }
      });
      expect(update.ok()).toBeTruthy();
    });

    await test.step("Formas de pago: list/create/update", async () => {
      const list = await request.get("/api/payment-methods", { headers });
      expect(list.ok()).toBeTruthy();

      const create = await request.post("/api/payment-methods", {
        headers,
        data: {
          code: `E2E${suffix}`,
          name: `Metodo E2E ${suffix}`,
          inPhysicalDrawer: false,
          requiresAmountReceived: false,
          sortOrder: 95,
          isActive: true
        }
      });
      expect(create.ok()).toBeTruthy();
      const created = (await create.json()) as { id: number };
      paymentMethodId = created.id;

      const update = await request.put(`/api/payment-methods/${paymentMethodId}`, {
        headers,
        data: {
          code: `E2E${suffix}`,
          name: `Metodo E2E ${suffix} Edit`,
          inPhysicalDrawer: true,
          requiresAmountReceived: false,
          sortOrder: 96,
          isActive: true
        }
      });
      expect(update.ok()).toBeTruthy();
    });

    await test.step("Inventario reactivos: create/update/adjust/overview", async () => {
      const create = await request.post("/api/inventory/reagents", {
        headers,
        data: {
          code: "",
          name: `Reactivo E2E ${suffix}`,
          unit: "mL",
          currentStock: 5,
          minimumStock: 3,
          isActive: true
        }
      });
      expect(create.ok()).toBeTruthy();
      const created = (await create.json()) as { id: number; code: string };
      reagentId = created.id;
      expect(created.code.length).toBeGreaterThan(0);

      const update = await request.put(`/api/inventory/reagents/${reagentId}`, {
        headers,
        data: {
          code: created.code,
          name: `Reactivo E2E ${suffix} Edit`,
          unit: "mL",
          currentStock: 4,
          minimumStock: 4,
          isActive: true
        }
      });
      expect(update.ok()).toBeTruthy();

      const adjust = await request.post(`/api/inventory/reagents/${reagentId}/adjust`, {
        headers,
        data: { quantityDelta: -1, notes: "Consumo de prueba E2E" }
      });
      expect(adjust.ok()).toBeTruthy();

      const overview = await request.get("/api/inventory/reagents/overview", { headers });
      expect(overview.ok()).toBeTruthy();
    });

    await test.step("Caja empresa + fiscal empresa", async () => {
      const cashGet = await request.get("/api/company/cash-settings", { headers });
      expect(cashGet.ok()).toBeTruthy();
      const cash = await cashGet.json();

      const cashPut = await request.put("/api/company/cash-settings", {
        headers,
        data: {
          cashShiftsPerDay: cash.cashShiftsPerDay ?? 1,
          cashPettyCashEnabled: cash.cashPettyCashEnabled ?? true,
          cashPettyCashDefault: cash.cashPettyCashDefault ?? 0
        }
      });
      expect(cashPut.ok()).toBeTruthy();

      const fiscalGet = await request.get("/api/fiscal/company", { headers });
      expect(fiscalGet.ok()).toBeTruthy();
      const fiscal = await fiscalGet.json();

      const fiscalPut = await request.put("/api/fiscal/company/sar", {
        headers,
        data: {
          useCai: fiscal.useCai,
          invoicePrefix: fiscal.invoicePrefix ?? "INT",
          invoiceStart: fiscal.rangeStart,
          invoiceEnd: fiscal.rangeEnd,
          cai: fiscal.cai ?? "",
          rangeLabel: fiscal.rangeLabel ?? "",
          caiDueDate: fiscal.caiDueDate,
          resetCorrelativeToRangeStart: false,
          allowNonSarDocument: fiscal.allowNonSarDocument,
          internalDocPrefix: fiscal.internalDocPrefix ?? "REC"
        }
      });
      expect(fiscalPut.ok()).toBeTruthy();
    });

    await test.step("Usuarios y roles: list/create/update/password", async () => {
      const rolesRes = await request.get("/api/roles", { headers });
      expect(rolesRes.ok()).toBeTruthy();
      const roles = (await rolesRes.json()) as Array<{ id: number }>;
      expect(roles.length).toBeGreaterThan(0);
      const roleId = roles[0].id;

      const userCreate = await request.post("/api/users", {
        headers,
        data: {
          username: `e2e_user_${suffix}`,
          fullName: `Usuario E2E ${suffix}`,
          password: "E2e12345!",
          roleIds: [roleId]
        }
      });
      expect(userCreate.ok()).toBeTruthy();
      const user = (await userCreate.json()) as { id: number };
      createdUserId = user.id;

      const userUpdate = await request.put(`/api/users/${createdUserId}`, {
        headers,
        data: {
          fullName: `Usuario E2E ${suffix} Edit`,
          isActive: true,
          roleIds: [roleId]
        }
      });
      expect(userUpdate.ok()).toBeTruthy();

      const pwd = await request.put(`/api/users/${createdUserId}/password`, {
        headers,
        data: { newPassword: "E2e12345!X" }
      });
      expect(pwd.status()).toBe(204);
    });

    await test.step("Ordenes, muestras, resultados y offline sync", async () => {
      const createOrder = async (useSarInvoice: boolean, idemTag: string) =>
        request.post("/api/orders", {
          headers: { ...headers, "Idempotency-Key": `${idemTag}-${suffix}` },
          data: {
            patientId,
            discountPercent: 0,
            discountTypeLabel: "E2E",
            lines: [{ labExamId: examId }],
            paymentMethod: "Efectivo",
            paymentMethodId: paymentMethodId || null,
            amountReceived: 500,
            isFinalConsumer: true,
            clientLegalName: null,
            clientRtn: null,
            useSarInvoice
          }
        });

      const orderBad = await request.post("/api/orders", {
        headers: { ...headers, "Idempotency-Key": `bad-${suffix}` },
        data: {
          patientId,
          discountPercent: 0,
          discountTypeLabel: "E2E",
          lines: [],
          paymentMethod: "Efectivo",
          paymentMethodId: paymentMethodId || null,
          amountReceived: null,
          isFinalConsumer: true,
          clientLegalName: null,
          clientRtn: null,
          useSarInvoice: false
        }
      });
      expect(orderBad.status()).toBeGreaterThanOrEqual(400);

      const fiscalCfg = await request.get("/api/fiscal/company", { headers });
      expect(fiscalCfg.ok()).toBeTruthy();
      const fiscal = (await fiscalCfg.json()) as { useCai: boolean; allowNonSarDocument: boolean };

      if (!fiscal.useCai) {
        const sarNotAvailable = await createOrder(true, "sar-no-cai");
        expect(sarNotAvailable.status()).toBeGreaterThanOrEqual(400);
      } else if (!fiscal.allowNonSarDocument) {
        const internalNotAllowed = await createOrder(false, "internal-not-allowed");
        expect(internalNotAllowed.status()).toBeGreaterThanOrEqual(400);
      } else {
        const internalDoc = await createOrder(false, "internal-ok");
        expect(internalDoc.ok()).toBeTruthy();
        const internalOrder = (await internalDoc.json()) as { caiMode: boolean };
        expect(internalOrder.caiMode).toBeFalsy();

        const sarDoc = await createOrder(true, "sar-ok");
        expect(sarDoc.ok()).toBeTruthy();
        const sarOrder = (await sarDoc.json()) as { caiMode: boolean };
        expect(sarOrder.caiMode).toBeTruthy();
      }

      const defaultUseSar = fiscal.useCai && !fiscal.allowNonSarDocument;
      const orderOk = await createOrder(defaultUseSar, "ok");
      expect(orderOk.ok()).toBeTruthy();
      const order = (await orderOk.json()) as { orderId: number; invoiceNumber: string; caiMode: boolean };
      orderId = order.orderId;

      const ordersList = await request.get(`/api/orders?search=${encodeURIComponent(order.invoiceNumber)}&page=1&pageSize=20`, {
        headers
      });
      expect(ordersList.ok()).toBeTruthy();

      const voucher = await request.get(`/api/orders/${orderId}/voucher`, { headers });
      expect(voucher.ok()).toBeTruthy();

      const sampleCreate = await request.post("/api/samples", {
        headers,
        data: { orderId, notes: "Toma E2E" }
      });
      expect(sampleCreate.ok()).toBeTruthy();
      const sample = (await sampleCreate.json()) as { id: number; code: string };
      sampleId = sample.id;
      expect(sample.code.length).toBeGreaterThan(0);

      const samplePatch = await request.patch(`/api/samples/${sampleId}`, {
        headers,
        data: { notes: "Toma E2E actualizada", markCollected: true }
      });
      expect(samplePatch.ok()).toBeTruthy();

      const sampleList = await request.get(`/api/samples?search=${encodeURIComponent(order.invoiceNumber)}&page=1&pageSize=20`, {
        headers
      });
      expect(sampleList.ok()).toBeTruthy();

      const lines = await request.get(`/api/lab-results/lines?search=${encodeURIComponent(order.invoiceNumber)}&status=pendientes&page=1&pageSize=20`, {
        headers
      });
      expect(lines.ok()).toBeTruthy();
      const linesBody = (await lines.json()) as { items: Array<{ lineId: number }> };
      expect(linesBody.items.length).toBeGreaterThan(0);
      const lineId = linesBody.items[0].lineId;

      const linePatchMissingText = await request.patch(`/api/lab-results/lines/${lineId}`, {
        headers,
        data: { resultNotes: "   ", resultParameterValues: null, markValidated: true }
      });
      expect(linePatchMissingText.status()).toBeGreaterThanOrEqual(400);

      const linePatch = await request.patch(`/api/lab-results/lines/${lineId}`, {
        headers,
        data: { resultNotes: "Resultado API E2E", resultParameterValues: null, markValidated: true }
      });
      expect(linePatch.ok()).toBeTruthy();

      const regCreate = await request.post("/api/offline-sync/regularizations", {
        headers,
        data: {
          tempId: `TMP-E2E-${suffix}`,
          orderId,
          invoiceNumber: order.invoiceNumber,
          caiMode: order.caiMode,
          requestedCai: false,
          patientName: `Paciente E2E ${suffix}`,
          source: "e2e-modules"
        }
      });
      expect(regCreate.ok()).toBeTruthy();

      const regList = await request.get("/api/offline-sync/regularizations?take=20", { headers });
      expect(regList.ok()).toBeTruthy();

      const cashSession = await request.get("/api/cash/session", { headers });
      expect(cashSession.ok()).toBeTruthy();
    });
  });
});
