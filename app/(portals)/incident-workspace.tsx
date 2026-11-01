"use client";

import { useState } from "react";
import { coordinates, statusLabel, type Branch, type Incident, type IncidentLocation } from "@/lib/incidents";
import IncidentMap from "./incident-map";
import { IncidentActions } from "./dashboard-controls";

function date(value: string) { return new Date(value).toLocaleString("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }

export default function IncidentWorkspace({ incidents, branches, locations, responder, error, mapDataError }: {
  incidents: Incident[]; branches: Branch[]; locations: IncidentLocation[]; responder: boolean; error: boolean; mapDataError: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("active");
  const filtered = incidents.filter(i => filter === "all" || (filter === "active" ? i.status !== "resolved" : i.status === filter));
  const selected = filtered.find(i => i.id === selectedId) ?? filtered[0] ?? null;
  const branch = branches.find(b => b.id === selected?.organization_id);
  const latest = locations.find(l => l.incident_id === selected?.id);
  const point = coordinates(latest?.latitude ?? selected?.latitude, latest?.longitude ?? selected?.longitude);
  const station = coordinates(branch?.latitude, branch?.longitude);
  const latitude = point?.[0], longitude = point?.[1];
  const stationLatitude = station?.[0], stationLongitude = station?.[1], stationName = branch?.name;
  const incidentPoint = latitude !== undefined && longitude !== undefined ? { latitude, longitude, label: "Recorded user location" } : null;
  const branchPoint = stationLatitude !== undefined && stationLongitude !== undefined ? { latitude: stationLatitude, longitude: stationLongitude, label: stationName ?? "Assigned branch" } : null;
  return <section className="response-workspace" id="response" aria-label={responder ? "Incident response workspace" : "Your safety map"}>
    <aside className="incident-queue">
      <div className="panel-heading"><div><span className="dash-eyebrow">{responder ? "RESPONSE QUEUE" : "YOUR ACTIVITY"}</span><h2>{responder ? "Incidents" : "Your incidents"}</h2></div><span className="queue-count">{filtered.length}</span></div>
      <label className="filter-label" htmlFor="incident-filter">Show incidents</label>
      <select id="incident-filter" value={filter} onChange={e => { setFilter(e.target.value); setSelectedId(null); }}>
        <option value="active">Active incidents</option><option value="received">Signal received</option><option value="dispatched">Team dispatched</option><option value="resolved">Resolved</option><option value="all">All incidents</option>
      </select>
      {error ? <p className="dash-empty" role="alert">Incidents could not be loaded. Use Refresh to try again.</p> : !filtered.length ? <div className="dash-empty"><span className="empty-shield" aria-hidden="true">✓</span><h3>{filter === "active" ? "No active incidents" : "No matching incidents"}</h3><p>{responder ? "Incoming incidents assigned to your branch will appear here." : "Your recorded emergency activity will appear here."}</p>{filter !== "all" && <button type="button" onClick={() => setFilter("all")}>View all activity</button>}</div> : <div className="queue-items">{filtered.map(i => <button type="button" key={i.id} className={`queue-item ${i.id === selected?.id ? "selected" : ""}`} aria-pressed={i.id === selected?.id} onClick={() => setSelectedId(i.id)}>
        <span className={`status-pill ${i.status}`}>{statusLabel(i.status)}</span><strong>Incident {i.id.slice(0, 8).toUpperCase()}</strong><time dateTime={i.triggered_at}>{date(i.triggered_at)} · PHT</time><span>{branches.find(b => b.id === i.organization_id)?.name ?? (i.organization_id ? "Assigned branch" : "Awaiting branch assignment")} <b aria-hidden="true">↗</b></span>
      </button>)}</div>}
      <p className="queue-note">Latest 50 incidents · Times in Philippine time</p>
    </aside>
    <div className="map-panel">
      <div className="panel-heading"><div><span className="dash-eyebrow">{responder ? "SHARED SITUATIONAL VIEW" : "CONNECTED TO YOUR RESPONSE TEAM"}</span><h2>{selected ? "Incident overview" : "Your safety map"}</h2></div>{selected && <span className={`status-pill ${selected.status}`}>{statusLabel(selected.status)}</span>}</div>
      <IncidentMap key={selected?.id ?? "empty"} incident={incidentPoint} branch={branchPoint}/>
      {mapDataError && <p className="dash-notice" role="status">Some branch or location details are unavailable. The map may show the initial incident location. Refresh to try again.</p>}
      {selected ? <div className="response-details">
        <ol className="response-progress" aria-label="Response progress">{["received", "dispatched", "resolved"].map((stage, index) => <li key={stage} className={selected.status === stage ? "current" : ""} aria-current={selected.status === stage ? "step" : undefined}><b>{index + 1}</b>{statusLabel(stage)}</li>)}</ol>
        <div className="response-detail-grid"><div><span className="dash-eyebrow">{selected.status === "received" ? "ASSIGNED BRANCH" : "RESPONDING BRANCH"}</span><h3>{branch?.name ?? (selected.organization_id ? "Branch details unavailable" : "Awaiting assignment")}</h3><p>{branch?.jurisdiction ?? "A branch will appear once this incident is assigned."}</p>{branch && !station && <p>Station location has not been provided.</p>}{branch?.contact_phone && <p>Branch contact: <a href={`tel:${branch.contact_phone.replace(/[^+\d]/g, "")}`}>{branch.contact_phone}</a></p>}</div>
          <div><span className="dash-eyebrow">{latest ? "LATEST RECORDED LOCATION" : "INITIAL INCIDENT LOCATION"}</span><h3>{point ? `${point[0].toFixed(5)}, ${point[1].toFixed(5)}` : "Awaiting location"}</h3><p>{date(latest?.recorded_at ?? selected.triggered_at)} · PHT</p><p>Recorded position; the user may have moved.</p></div></div>
        <div className="incident-brief"><h3>Incident brief</h3><p>{selected.brief_status === "ready" && selected.brief ? selected.brief : selected.brief_status === "failed" ? "Brief unavailable. Assess the incident directly." : "No brief available yet."}</p></div>
        <IncidentActions key={`${selected.id}:${selected.status}`} id={selected.id} ownerId={selected.owner_id} responder={responder} status={selected.status}/>
      </div> : <div className="map-idle"><h3>{responder ? "Ready for the next response." : "Your connection, in one place."}</h3><p>Select an incident to see its recorded location, assigned branch, and response progress.</p></div>}
    </div>
  </section>;
}
