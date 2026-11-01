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
      L.control.zoom({ position: "topright" }).addTo(view);
      map.current = view;
      const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(view);
      tiles.on("tileerror", () => { if (!cancelled) setError("Street tiles could not load. Recorded coordinates remain available below."); });
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
      const observer = new ResizeObserver(() => { view.invalidateSize(); bounds.current(); });
      observer.observe(host.current);
      cleanup = () => { observer.disconnect(); view.remove(); map.current = null; bounds.current = () => {}; };
      setReady(true);
    }
    mount().catch(() => { if (!cancelled) setError("The map could not load. Use the recorded coordinates below."); });
    return () => { cancelled = true; cleanup(); };
  }, [latitude, longitude, label, stationLatitude, stationLongitude, stationLabel]);
  return <div className="response-map-wrap">
    <div className="response-map" ref={host} role="region" aria-label="Incident and assigned branch map" />
    <button type="button" className="map-fit" disabled={!ready} onClick={() => bounds.current()}>Recenter map</button>
    {error && <p className="map-error" role="status">{error}</p>}
    {!incident && !branch && <div className="map-empty">No recorded locations yet<span>Your incident and assigned branch will appear here.</span></div>}
    <div className="map-legend"><span><i className="legend-user"/>User location</span><span><i className="legend-branch"/>Assigned branch</span><small>Station location · no vehicle tracking or route estimate</small></div>
  </div>;
}
