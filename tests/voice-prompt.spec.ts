import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // The 3D viewer has its own tests; avoid software WebGL competing with audio.
    const getContext = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { value: function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      return type.includes("webgl") ? null : Reflect.apply(getContext, this, [type, ...args]);
    } });
    // Supply real audio tracks without depending on host microphone drivers.
    // MediaRecorder, blobs, playback URLs and track cleanup remain native.
    navigator.mediaDevices.getUserMedia = async () => {
      const audio = new AudioContext();
      const source = audio.createOscillator();
      const destination = audio.createMediaStreamDestination();
      source.connect(destination);
      source.start();
      await audio.resume();
      const stream = destination.stream;
      Object.defineProperty(window, "testMicrophone", { value: stream, configurable: true });
      return stream;
    };
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Open voice prompt" }).click();
});

test("records, releases the microphone, previews and discards audio", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const dialog = page.getByRole("dialog", { name: "Your voice prompt" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Microphone is off", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Start recording" }).click();
  await expect(dialog.getByText("Recording — microphone is on", { exact: true })).toBeVisible();
  await expect(dialog.locator(".voice-timer")).not.toContainText("0:00", { timeout: 10000 });
  await dialog.getByRole("button", { name: "Stop recording" }).click();
  await expect(dialog.getByText("Recording ready to preview", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => Reflect.get(window, "testMicrophone").getTracks().every((track: MediaStreamTrack) => track.readyState === "ended"))).toBe(true);
  await expect(dialog.locator("audio")).toHaveAttribute("src", /^blob:/);
  const download = page.waitForEvent("download");
  await dialog.getByRole("link", { name: "Download recording" }).click();
  expect((await download).suggestedFilename()).toBe("voice-prompt.webm");
  await page.screenshot({ path: "/tmp/pocketseculex-voice-mobile.png" });
  await dialog.getByRole("button", { name: "Discard recording" }).click();
  await expect(dialog.locator("audio")).toHaveCount(0);
  await dialog.getByRole("button", { name: "Close voice prompt" }).click();
  await expect(page.getByRole("button", { name: "Open voice prompt" })).toBeFocused();
});

test("closing during recording releases capture and discards the clip", async ({ page }) => {
  await page.getByRole("button", { name: "Start recording" }).click();
  await expect(page.getByText("Recording — microphone is on", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Your voice prompt" })).toHaveCount(0);
  expect(await page.evaluate(() => Reflect.get(window, "testMicrophone").getTracks().every((track: MediaStreamTrack) => track.readyState === "ended"))).toBe(true);
  await page.getByRole("button", { name: "Open voice prompt" }).click();
  await expect(page.getByText("Microphone is off", { exact: true })).toBeVisible();
});

test("permission denial is actionable and recording can be retried", async ({ page }) => {
  await page.evaluate(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("Denied", "NotAllowedError"));
  });
  await page.getByRole("button", { name: "Start recording" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("Microphone access was denied");
  await expect(page.getByRole("button", { name: "Start recording" })).toBeEnabled();
});

test("late microphone permission after closing cannot leave capture running", async ({ page }) => {
  await page.evaluate(() => {
    const original = navigator.mediaDevices.getUserMedia;
    navigator.mediaDevices.getUserMedia = constraints => new Promise(resolve => {
      Object.defineProperty(window, "grantMicrophone", { value: async () => resolve(await original(constraints)) });
    });
  });
  await page.getByRole("button", { name: "Start recording" }).click();
  await expect(page.getByText("Waiting for microphone permission…", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close voice prompt" }).click();
  await page.evaluate(() => Reflect.get(window, "grantMicrophone")());
  await expect.poll(() => page.evaluate(() => Reflect.get(window, "testMicrophone").getTracks().every((track: MediaStreamTrack) => track.readyState === "ended"))).toBe(true);
});

test("recording stops automatically at the 30-second limit", async ({ page }) => {
  await page.clock.install();
  await page.getByRole("button", { name: "Start recording" }).click();
  await expect(page.getByText("Recording — microphone is on", { exact: true })).toBeVisible();
  await page.clock.fastForward(30000);
  await expect(page.getByText("Recording ready to preview", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => Reflect.get(window, "testMicrophone").getTracks().every((track: MediaStreamTrack) => track.readyState === "ended"))).toBe(true);
});

test("unsupported browsers explain why recording cannot start", async ({ page }) => {
  await page.evaluate(() => Object.defineProperty(window, "MediaRecorder", { value: undefined, configurable: true }));
  await page.getByRole("button", { name: "Start recording" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("Microphone recording is unavailable here");
});
