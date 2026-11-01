"use client";

import { useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase/client";
import type { RescueLocation } from "@/lib/rescue-tracking";

export function useRescueLocation(incidentId: string | null, status: string) {
  const [snapshot, setSnapshot] = useState<{ id: string; location: RescueLocation | null; failed: boolean } | null>(null);
  useEffect(() => {
    if (!incidentId || status !== "dispatched") return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function poll() {
      try {
        const { data, error } = await browserClient().from("responder_locations")
          .select("latitude, longitude, recorded_at, accuracy_m, incidents!inner(status)")
          .eq("incident_id", incidentId!).eq("incidents.status", "dispatched")
          .abortSignal(controller.signal).maybeSingle();
        if (!cancelled) setSnapshot({ id: incidentId!, location: error ? null : data, failed: Boolean(error) });
      } catch {
        if (!cancelled) setSnapshot({ id: incidentId!, location: null, failed: true });
      } finally {
        if (!cancelled) timer = setTimeout(poll, 5000);
      }
    }
    void poll();
    return () => { cancelled = true; clearTimeout(timer); controller.abort(); };
  }, [incidentId, status]);
  return status === "dispatched" && snapshot?.id === incidentId ? snapshot : null;
}
