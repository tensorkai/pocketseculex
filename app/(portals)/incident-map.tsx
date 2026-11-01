"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

type Point = { latitude: number; longitude: number; label: string };
export default function IncidentMap({ incident, branch }: { incident: Point | null; branch: Point | null }) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const bounds = useRef<() => void>(() => {});
  const latitude = incident?.latitude, longitude = incident?.longitude, label = incident?.label;
  const stationLatitude = branch?.latitude, stationLongitude = branch?.longitude, stationLabel = branch?.label;
  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};
    async function mount() {
      const L = await import("leaflet");
      if (cancelled || !host.current) return;
      const view = L.map(host.current, { scrollWheelZoom: true, zoomControl: false, zoomAnimation: false, fadeAnimation: false });
      map.current = view;
      const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(view);
      tiles.on("tileerror", () => { if (!cancelled) setError("Street tiles could not load. Open Response for recorded coordinates."); });
      const points: [number, number][] = [];
      const userPoint = latitude !== undefined && longitude !== undefined ? { latitude, longitude, label: label ?? "User location" } : null;
      const branchPoint = stationLatitude !== undefined && stationLongitude !== undefined ? { latitude: stationLatitude, longitude: stationLongitude, label: stationLabel ?? "Assigned branch" } : null;
      for (const [point, kind] of [[userPoint, "incident"], [branchPoint, "branch"]] as const) {
        if (!point) continue;
        const position: [number, number] = [point.latitude, point.longitude];
        points.push(position);
        const label = document.createElement("span");
        label.textContent = point.label;
        L.marker(position, { title: point.label, alt: point.label,
          icon: L.divIcon({ className: `response-pin ${kind}`, html: kind === "incident" ? "<span>U</span>" : "<span>+</span>", iconSize: [36, 36], iconAnchor: [18, 18] }),
        }).addTo(view).bindPopup(label);
      }
      bounds.current = () => points.length ? view.fitBounds(L.latLngBounds(points), { paddingTopLeft: [45, 100], paddingBottomRight: [65, 50], maxZoom: 15, animate: false }) : view.setView([12.88, 121.77], 5);
      bounds.current();
      const observer = new ResizeObserver(() => view.invalidateSize());
      observer.observe(host.current);
      cleanup = () => { observer.disconnect(); view.remove(); map.current = null; bounds.current = () => {}; };
      setReady(true);
    }
    mount().catch(() => { if (!cancelled) setError("The map could not load. Use the recorded coordinates below."); });
    return () => { cancelled = true; cleanup(); };
  }, [latitude, longitude, label, stationLatitude, stationLongitude, stationLabel]);
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
        <small>Station location only; no vehicle tracking.</small>
      </div>
    </details>
    {error && <p className="map-error" role="status">{error}</p>}
    {!incident && !branch && <div className="map-empty">No recorded locations yet<span>Your incident and assigned branch will appear here.</span></div>}
  </div>;
}
