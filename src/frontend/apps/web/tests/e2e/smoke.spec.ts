import { expect, test } from "@playwright/test";

test.describe("NesLab smoke", () => {
  test("carga login y responde health", async ({ page, request }) => {
    const health = await request.get("/api/ops/health");
    expect(health.ok()).toBeTruthy();

    await page.goto("/");
    await expect(page.getByLabel("Usuario", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Contrasena", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /ingresar|entrar|iniciar/i })).toBeVisible();
  });
});
