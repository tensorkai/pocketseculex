import { expect, test, type BrowserContext } from "@playwright/test";

async function session(context: BrowserContext, suffix: string) {
  const id = `00000000-0000-0000-0000-${suffix.padStart(12, "0")}`;
  const expiry = Math.floor(Date.now() / 1000) + 3600;
  const token = [Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url"), Buffer.from(JSON.stringify({ sub: id, role: "authenticated", exp: expiry })).toString("base64url"), "test-signature"].join(".");
  const value = { access_token: token, refresh_token: "test-refresh", expires_at: expiry, expires_in: 3600, token_type: "bearer", user: { id, aud: "authenticated", app_metadata: {}, user_metadata: {} } };
  await context.addCookies([{ name: "sb-127-auth-token", value: `base64-${Buffer.from(JSON.stringify(value)).toString("base64url")}`, domain: "127.0.0.1", path: "/" }]);
  // No automated requests to the public tile service.
  await context.route("https://tile.openstreetmap.org/**", route => route.fulfill({ contentType: "image/png", body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64") }));
}
test.describe.configure({ mode: "serial" });
test.beforeEach(async ({ request }) => { await request.get("http://127.0.0.1:54321/__test/reset"); });

test("personal map shows the same branch and response status updated by LGU", async ({ browser }) => {
  const personal = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const lgu = await browser.newContext();
  await session(personal, "1"); await session(lgu, "2");
  const userPage = await personal.newPage(), responderPage = await lgu.newPage();
  await userPage.goto("http://127.0.0.1:3100/user/dashboard");
  await expect(userPage.getByRole("heading", { name: "Welcome back, Sam." })).toBeVisible();
  await expect(userPage.getByRole("heading", { name: "Central Rescue Station" })).toBeVisible();
  await expect(userPage.getByRole("heading", { name: "14.59950, 120.98420" })).toBeVisible();
  await expect(userPage.locator(".response-pin")).toHaveCount(2);
  await expect(userPage.getByRole("button", { name: "Mark dispatched" })).toHaveCount(0);
  await userPage.screenshot({ path: "/tmp/pocketseculex-personal-dashboard.png", fullPage: true });
  await responderPage.goto("http://127.0.0.1:3100/lgu/dashboard");
  await expect(responderPage.getByRole("heading", { name: "Central Rescue Station" })).toBeVisible();
  await responderPage.getByRole("button", { name: "Mark dispatched" }).click();
  await expect(responderPage.locator('.response-progress [aria-current="step"]')).toContainText("Team dispatched");
  await userPage.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(userPage.locator('.response-progress [aria-current="step"]')).toContainText("Team dispatched");
  await responderPage.screenshot({ path: "/tmp/pocketseculex-lgu-dashboard.png", fullPage: true });
  await responderPage.getByRole("button", { name: "Mark resolved" }).click();
  await expect(responderPage.getByRole("heading", { name: "No active incidents" })).toBeVisible();
  await responderPage.getByLabel("Show incidents").selectOption("resolved");
  await expect(responderPage.locator('.response-progress [aria-current="step"]')).toContainText("Resolved");
  await expect(responderPage.getByRole("button", { name: "Mark dispatched" })).toHaveCount(0);
  await personal.close(); await lgu.close();
});

test("mobile dashboard remains usable when map tiles fail", async ({ page, context }) => {
  await session(context, "1");
  await page.route("https://tile.openstreetmap.org/**", route => route.abort());
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/user/dashboard");
  await expect(page.getByText("Street tiles could not load.", { exact: false })).toBeVisible();
  await expect(page.getByRole("heading", { name: "14.59950, 120.98420" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByText("Edit contact details", { exact: true }).click();
  await expect(page.getByLabel("Full name", { exact: true })).toBeVisible();
});

test("pending responders cannot open incident maps", async ({ page, context }) => {
  await session(context, "3");
  await page.goto("/lgu/dashboard");
  await expect(page.getByRole("heading", { name: "Your response workspace is waiting" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Incident and assigned branch map" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Submit access request" })).toBeVisible();
});
