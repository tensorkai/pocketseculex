import { expect, test } from "@playwright/test";

// Only the Supabase network boundary is mocked. Tests exercise the actual forms
// without creating real accounts, sending emails, or storing real credentials.
test.beforeEach(async ({ page }) => {
  await page.route("**/auth/v1/**", route => route.fulfill({ status: 400, json: { code: "unexpected_request", message: "Unexpected auth call" } }));
});

test("personal signup sends account category and displays confirmation", async ({ page }) => {
  let payload: Record<string, unknown> = {};
  await page.route("**/auth/v1/signup**", route => {
    payload = route.request().postDataJSON();
    return route.fulfill({ json: { id: "00000000-0000-0000-0000-000000000001", email: "personal@example.com", identities: [] } });
  });
  await page.goto("/user/create-account");
  await page.getByLabel("Full name").fill("Personal Test");
  await page.getByRole("textbox", { name: "Email address", exact: true }).fill("personal@example.com");
  await page.getByLabel("Mobile number").fill("+639171234567");
  await page.getByLabel("Password", { exact: true }).fill("Sample password 123!");
  await page.getByLabel("Confirm password", { exact: true }).fill("Sample password 123!");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Check your inbox");
  expect(payload.data).toEqual({ account_type: "user", name: "Personal Test", phone: "+639171234567" });
});

test("LGU signup retains review details without granting membership", async ({ page }) => {
  let payload: Record<string, unknown> = {};
  await page.route("**/auth/v1/signup**", route => {
    payload = route.request().postDataJSON();
    return route.fulfill({ json: { id: "00000000-0000-0000-0000-000000000002", email: "responder@example.com", identities: [] } });
  });
  await page.goto("/lgu/create-account");
  await page.getByLabel("Full name").fill("Responder Test");
  await page.getByLabel("LGU / organization").fill("Example LGU");
  await page.getByLabel("City / municipality").fill("Manila");
  await page.getByLabel("Department").selectOption("rescue");
  await page.getByLabel("Work email address").fill("responder@example.com");
  await page.getByLabel("Password", { exact: true }).fill("Sample password 123!");
  await page.getByLabel("Confirm password", { exact: true }).fill("Sample password 123!");
  await page.getByRole("button", { name: "Create LGU account" }).click();
  await expect(page.getByRole("status")).toContainText("Check your inbox");
  expect(payload.data).toEqual({ account_type: "lgu", name: "Responder Test", organization: "Example LGU", jurisdiction: "Manila", department: "rescue" });
});

test("sign-in reports invalid credentials and allows retry", async ({ page }) => {
  await page.route("**/auth/v1/token**", route => route.fulfill({ status: 400, headers: { "x-supabase-api-version": "2024-01-01", "access-control-expose-headers": "x-supabase-api-version" }, json: { code: "invalid_credentials", error_code: "invalid_credentials", message: "Invalid login credentials" } }));
  await page.goto("/user/login");
  await page.getByRole("textbox", { name: "Email address", exact: true }).fill("personal@example.com");
  await page.getByLabel("Password", { exact: true }).fill("Incorrect password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Email or password is incorrect");
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeEnabled();
});

test("sign-in exchanges credentials and navigates to the account resolver", async ({ page }) => {
  const id = "00000000-0000-0000-0000-000000000001";
  const token = [Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url"), Buffer.from(JSON.stringify({ sub: id, role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url"), "test-signature"].join(".");
  await page.route("**/auth/v1/token**", route => route.fulfill({ json: { access_token: token, refresh_token: "test-refresh-token", expires_in: 3600, token_type: "bearer", user: { id, email: "personal@example.com", aud: "authenticated", user_metadata: {}, app_metadata: {} } } }));
  // Auth-server identity verification is tested separately, not bypassed here.
  await page.route("**/account**", route => route.fulfill({ contentType: "text/html", body: "Account destination" }));
  await page.goto("/user/login");
  await page.getByRole("textbox", { name: "Email address", exact: true }).fill("personal@example.com");
  await page.getByLabel("Password", { exact: true }).fill("Sample password 123!");
  const destination = page.waitForRequest(request => new URL(request.url()).pathname === "/account");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await destination;
  expect((await page.context().cookies()).some(cookie => cookie.name.includes("auth-token"))).toBe(true);
});

test("password recovery sends a callback destination and shows neutral confirmation", async ({ page }) => {
  await page.route("**/auth/v1/recover**", route => route.fulfill({ json: {} }));
  await page.goto("/user/login");
  await page.getByRole("button", { name: "Forgot password?" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Email address").fill("personal@example.com");
  const sent = page.waitForRequest(request => request.url().includes("/auth/v1/recover"));
  await dialog.getByRole("button", { name: "Send reset link" }).click();
  const request = await sent;
  expect(new URL(request.url()).searchParams.get("redirect_to")).toBe("http://127.0.0.1:3100/auth/callback?next=/auth/update-password");
  await expect(dialog.getByRole("status")).toContainText("If an account exists");
});

test("protected portals redirect anonymous visitors", async ({ page }) => {
  await page.goto("/lgu/dashboard");
  await expect(page).toHaveURL(/\/lgu\/login$/);
  await page.goto("/user/dashboard");
  await expect(page).toHaveURL(/\/user\/login$/);
});

test("invalid email callback cannot redirect to an external destination", async ({ page }) => {
  await page.goto("/auth/callback?next=https://example.com");
  await expect(page).toHaveURL(/\/auth\/error$/);
});
