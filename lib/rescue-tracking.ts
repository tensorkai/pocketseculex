import { coordinates } from "./incidents";

export type RescueLocation = {
  latitude: number; longitude: number; recorded_at: string; accuracy_m: number;
};
type Position = { latitude: number; longitude: number };

export function distanceMeters(a: Position, b: Position) {
  const rad = Math.PI / 180;
  const h = Math.sin((b.latitude - a.latitude) * rad / 2) ** 2
    + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad)
    * Math.sin((b.longitude - a.longitude) * rad / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}

// Separate entry/exit thresholds prevent GPS noise from toggling the camera.
// Proximity is to the recorded user position; it never confirms arrival.
export function rescueTracking(user: Position | null, team: RescueLocation | null, status: string, wasNear: boolean, now: number) {
  if (status !== "dispatched") return { state: "inactive", near: false, distance: null } as const;
  if (!team || !user || !coordinates(user.latitude, user.longitude)
    || !coordinates(team.latitude, team.longitude)) return { state: "waiting", near: false, distance: null } as const;
  const age = now - Date.parse(team.recorded_at);
  if (!Number.isFinite(age) || age < -5000 || age > 60000
    || !Number.isFinite(team.accuracy_m) || team.accuracy_m < 0 || team.accuracy_m > 100) {
    return { state: "stale", near: false, distance: null } as const;
  }
  const distance = distanceMeters(user, team);
  const near = distance <= (wasNear ? 650 : 500);
  return { state: near ? "near" : "en-route", near, distance } as const;
}
