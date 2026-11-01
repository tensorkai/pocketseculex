export type Branch = {
  id: string; name: string; jurisdiction: string;
  latitude: number | null; longitude: number | null; contact_phone: string | null;
};
export type Incident = {
  id: string; owner_id: string; organization_id: string | null;
  status: string; triggered_at: string; latitude: number | null; longitude: number | null;
  brief: string | null; brief_status: string;
};
export type IncidentLocation = { incident_id: string; latitude: number; longitude: number; recorded_at: string };
export function coordinates(latitude: number | null | undefined, longitude: number | null | undefined): [number, number] | null {
  return typeof latitude === "number" && typeof longitude === "number" && Number.isFinite(latitude) && Number.isFinite(longitude)
    && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? [latitude, longitude] : null;
}
export const statusLabel = (status: string) => ({ received: "Signal received", dispatched: "Team dispatched", resolved: "Resolved" })[status] ?? status;
