import { expect, test } from "@playwright/test";

test("device preview stays clear of copy and controls on phone, tablet and desktop", async ({ page }) => {
  await page.goto("/");
  await page.addStyleTag({ content: "nextjs-portal { display: none; }" });
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const viewer = page.locator(".product-viewer");
    await viewer.scrollIntoViewIfNeeded();
    await expect(page.getByText("Preparing the 3D view…", { exact: true })).toBeHidden({ timeout: 20000 });
    const canvas = (await page.locator(".model-canvas").boundingBox())!;
    const controls = (await page.locator(".viewer-controls").boundingBox())!;
    const copy = (await page.locator(".hero-content").boundingBox())!;
    expect(canvas.y + canvas.height).toBeLessThanOrEqual(controls.y);
    expect(canvas.x >= copy.x + copy.width || canvas.y >= copy.y + copy.height).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole("button", { name: "Reset device view" })).toBeVisible();
    await page.screenshot({ path: `/tmp/pocketseculex-viewer-${width}.png` });
  }
});
