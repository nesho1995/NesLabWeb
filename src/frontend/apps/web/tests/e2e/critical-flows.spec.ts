import { expect, test } from "@playwright/test";
import { loginAndGetToken } from "./auth.helper";

test.describe("Flujos criticos API", () => {
  test("orden/caja/resultados/offline endpoints disponibles con auth", async ({ request }) => {
    test.skip(!process.env.E2E_USERNAME || !process.env.E2E_PASSWORD, "Missing E2E credentials.");

    const token = await loginAndGetToken(request);
    const auth = { Authorization: `Bearer ${token}` };

    const me = await request.get("/api/auth/me", { headers: auth });
    expect(me.ok()).toBeTruthy();

    const orders = await request.get("/api/orders?page=1&pageSize=5", { headers: auth });
    expect(orders.ok()).toBeTruthy();

    const cashStatus = await request.get("/api/cash/status", { headers: auth });
    expect(cashStatus.ok()).toBeTruthy();

    const results = await request.get("/api/labresults?page=1&pageSize=5", { headers: auth });
    expect(results.ok()).toBeTruthy();

    const sync = await request.get("/api/offlinesync/regularizations?take=5", { headers: auth });
    expect(sync.ok()).toBeTruthy();
  });
});
