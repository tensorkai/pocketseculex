import { test, expect } from "@playwright/test";
import { distanceMeters, rescueTracking, type RescueLocation } from "../lib/rescue-tracking";

const now = Date.parse("2026-11-01T12:00:00Z");
const user = { latitude: 0, longitude: 0 };
const fix = (meters: number): RescueLocation => ({ latitude: meters / 6371000 * 180 / Math.PI, longitude: 0, accuracy_m: 10, recorded_at: new Date(now).toISOString() });

test("geodesic distance handles coincident points and the date line", () => {
  expect(distanceMeters(user, user)).toBe(0);
  expect(distanceMeters({ latitude: 0, longitude: 179.999 }, { latitude: 0, longitude: -179.999 })).toBeCloseTo(222.39, 1);
});

test("nearby mode uses hysteresis and never implies arrival", () => {
  expect(rescueTracking(user, fix(499), "dispatched", false, now).near).toBe(true);
  expect(rescueTracking(user, fix(550), "dispatched", false, now).near).toBe(false);
  expect(rescueTracking(user, fix(550), "dispatched", true, now).near).toBe(true);
  expect(rescueTracking(user, fix(651), "dispatched", true, now).near).toBe(false);
  expect(rescueTracking(user, fix(0), "dispatched", true, now).state).toBe("near");
});

test("missing, stale, invalid and inaccurate fixes cannot activate tracking", () => {
  for (const team of [null, { ...fix(1), latitude: NaN }, { ...fix(1), latitude: 91 }, { ...fix(1), accuracy_m: 101 }, { ...fix(1), accuracy_m: -1 }, { ...fix(1), recorded_at: "invalid" }, { ...fix(1), recorded_at: new Date(now - 60001).toISOString() }, { ...fix(1), recorded_at: new Date(now + 6000).toISOString() }]) {
    const result = rescueTracking(user, team, "dispatched", true, now);
    expect(result.near).toBe(false);
    expect(result.distance).toBeNull();
  }
  expect(rescueTracking(null, fix(1), "dispatched", true, now).state).toBe("waiting");
  for (const status of ["received", "resolved"]) expect(rescueTracking(user, fix(1), status, true, now).state).toBe("inactive");
});
