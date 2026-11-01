"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import { rescueTracking } from "@/lib/rescue-tracking";
import { useRescueLocation } from "./use-rescue-location";
import "leaflet/dist/leaflet.css";

type Point = { latitude: number; longitude: number; label: string };
export default function IncidentMap({ incident, branch, incidentId, status }: { incident: Point | null; branch: Point | null; incidentId: string | null; status: string }) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const bounds = useRef<() => void>(() => {});
  const layers = useRef<LayerGroup | null>(null);
  const following = useRef(true);
  const snapshot = useRescueLocation(incidentId, status);
  const team = snapshot?.location ?? null;
  const [proximity, setProximity] = useState({ near: false, now: 0 });
  const latitude = incident?.latitude, longitude = incident?.longitude, label = incident?.label;
  const stationLatitude = branch?.latitude, stationLongitude = branch?.longitude, stationLabel = branch?.label;
  useEffect(() => {
    const update = () => setProximity(previous => {
      const now = Date.now();
      const result = rescueTracking(latitude !== undefined && longitude !== undefined ? { latitude, longitude } : null, team, status, previous.near, now);
      return { near: result.near, now };
    });
    const first = setTimeout(update, 0);
    const timer = setInterval(update, 1000);
    return () => { clearTimeout(first); clearInterval(timer); };
  }, [latitude, longitude, team, status]);
  const tracking = rescueTracking(incident, team, status, proximity.near, proximity.now);
  const teamLatitude = tracking.distance !== null ? team?.latitude : undefined;
  const teamLongitude = tracking.distance !== null ? team?.longitude : undefined;
  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};
    async function mount() {
      const L = await import("leaflet");
      if (cancelled || !host.current) return;
      const view = L.map(host.current, { scrollWheelZoom: true, zoomControl: false, zoomAnimation: false, fadeAnimation: false });
      map.current = view;
      layers.current = L.layerGroup().addTo(view);
      view.on("dragstart zoomstart", () => { following.current = false; });
      const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(view);
      tiles.on("tileerror", () => { if (!cancelled) setError("Street tiles could not load. Open Response for recorded coordinates."); });
      view.setView([12.88, 121.77], 5);
      following.current = true;
      const observer = new ResizeObserver(() => view.invalidateSize());
      observer.observe(host.current);
      cleanup = () => { observer.disconnect(); view.remove(); map.current = null; layers.current = null; bounds.current = () => {}; };
      setReady(true);
    }
    mount().catch(() => { if (!cancelled) setError("The map could not load. Use the recorded coordinates below."); });
    return () => { cancelled = true; cleanup(); };
  }, []);
  useEffect(() => {
    let cancelled = false;
    async function update() {
      const L = await import("leaflet");
      const view = map.current, group = layers.current;
      if (cancelled || !ready || !view || !group) return;
      group.clearLayers();
      const points: [number, number][] = [];
      const userPoint = latitude !== undefined && longitude !== undefined ? { latitude, longitude, label: label ?? "User location" } : null;
      const branchPoint = stationLatitude !== undefined && stationLongitude !== undefined ? { latitude: stationLatitude, longitude: stationLongitude, label: stationLabel ?? "Assigned branch" } : null;
      const rescuePoint = teamLatitude !== undefined && teamLongitude !== undefined ? { latitude: teamLatitude, longitude: teamLongitude, label: "Rescue team" } : null;
      for (const [point, kind] of [[userPoint, "incident"], [branchPoint, "branch"], [rescuePoint, "rescue"]] as const) {
        if (!point) continue;
        const position: [number, number] = [point.latitude, point.longitude];
        if (!tracking.near || kind !== "branch") points.push(position);
        const label = document.createElement("span");
        label.textContent = point.label;
        L.marker(position, { title: point.label, alt: point.label,
          icon: L.divIcon({ className: `response-pin ${kind}`, html: kind === "incident" ? "<span>U</span>" : kind === "rescue" ? "<span>R</span>" : "<span>+</span>", iconSize: [36, 36], iconAnchor: [18, 18] }),
        }).addTo(group).bindPopup(label);
      }
      if (tracking.near && userPoint && rescuePoint) {
        L.circle([userPoint.latitude, userPoint.longitude], { radius: 50, color: "#28745a", weight: 1, fillOpacity: 0.08, interactive: false }).addTo(group);
        L.polyline([[rescuePoint.latitude, rescuePoint.longitude], [userPoint.latitude, userPoint.longitude]], { color: "#28745a", weight: 3, dashArray: "6 9", interactive: false }).addTo(group);
      }
      bounds.current = () => {
        if (points.length) view.fitBounds(L.latLngBounds(points), { paddingTopLeft: [45, 55], paddingBottomRight: [65, 190], maxZoom: tracking.near ? 17 : 15, animate: false });
        else view.setView([12.88, 121.77], 5);
        following.current = true;
      };
      if (following.current) bounds.current();
    }
    void update();
    return () => { cancelled = true; };
  }, [ready, latitude, longitude, label, stationLatitude, stationLongitude, stationLabel, teamLatitude, teamLongitude, tracking.near]);
  return <div className="response-map-wrap">
    <div className="response-map" ref={host} role="region" aria-label="Incident and assigned branch map" />
    <button type="button" className="map-fit" aria-label="Recenter map" title="Recenter map" disabled={!ready} onClick={() => bounds.current()}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg>
    </button>
    <details className="map-tools">
      <summary aria-label="Map tools" title="Map tools"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2" fill="white"/><circle cx="16" cy="12" r="2" fill="white"/><circle cx="10" cy="18" r="2" fill="white"/></svg></summary>
      <div className="map-tools-content">
        <div className="map-zoom-actions"><button type="button" disabled={!ready} onClick={() => map.current?.zoomIn()} aria-label="Zoom in">+</button><button type="button" disabled={!ready} onClick={() => map.current?.zoomOut()} aria-label="Zoom out">−</button></div>
        <p><span className="tool-user">U</span> Recorded user location</p><p><span className="tool-branch">+</span> Assigned branch</p>
        <p><span className="tool-rescue">R</span> Rescue team GPS</p>
        <small>Station is fixed. Dashed line shows straight-line separation, not a road route.</small>
      </div>
    </details>
    {status === "dispatched" && <section className={`rescue-tracking-card ${tracking.near ? "near" : ""}`} aria-label="Rescue tracking">
      <span className="dash-eyebrow">RESPONSE TRACKING</span>
      <h2 role="status">{snapshot?.failed ? "Tracking unavailable" : tracking.state === "stale" ? "Waiting for a fresh GPS signal" : tracking.near ? "Rescue team is nearby" : tracking.state === "en-route" ? "Rescue team en route" : "Waiting for team location"}</h2>
      {tracking.distance !== null && !snapshot?.failed && <strong>{tracking.distance < 1000 ? `${Math.round(tracking.distance / 10) * 10} m` : `${(tracking.distance / 1000).toFixed(1)} km`} away <small>· straight-line distance</small></strong>}
      <p>{tracking.near ? "Stay reachable. Proximity does not confirm arrival." : "Tracking updates automatically when team GPS is available."} Distance uses the recorded user location.</p>
    </section>}
    {error && <p className="map-error" role="status">{error}</p>}
    {!incident && !branch && <div className="map-empty">No recorded locations yet<span>Your incident and assigned branch will appear here.</span></div>}
  </div>;
}
