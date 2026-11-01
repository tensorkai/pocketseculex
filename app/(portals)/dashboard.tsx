import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { serverClient } from "@/lib/supabase/server";
import { AccountControls, LiveUpdates, LguRequest, ProfileForm } from "./dashboard-controls";
import IncidentWorkspace from "./incident-workspace";
import type { Branch, Incident, IncidentLocation } from "@/lib/incidents";
import "./dashboard.css";

export default async function Dashboard({ portal }: { portal: "user" | "lgu" }) {
  // Session validation and incident data must run for the incoming request.
  await connection();
  const supabase = await serverClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${portal}/login`);
  const { data: profile, error: profileError } = await supabase.from("profiles").select("id, account_type, full_name, phone").eq("id", user.id).single();
  if (profileError || !profile) return <main className="account-shell"><h1>Your profile could not be loaded</h1><p>You are signed in. Check the Supabase profile setup and try reloading.</p><AccountControls /></main>;
  if (profile.account_type !== portal) redirect(profile.account_type === "lgu" ? "/lgu/dashboard" : "/user/dashboard");
  const lgu = portal === "lgu";
  const [{ data: memberships, error: membershipError }, { data: request, error: requestError }, { data: devices, error: deviceError }] = await Promise.all([
    lgu ? supabase.from("lgu_memberships").select("organization_id, department, active").eq("user_id", user.id).eq("active", true) : Promise.resolve({ data: [], error: null }),
    lgu ? supabase.from("lgu_access_requests").select("status, organization, jurisdiction, department").eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    !lgu ? supabase.from("devices").select("id, serial_number, active").eq("owner_id", user.id) : Promise.resolve({ data: [], error: null }),
  ]);
  const approved = !membershipError && Boolean(memberships?.length);
  const query = supabase.from("incidents").select("id, owner_id, organization_id, status, triggered_at, latitude, longitude, brief, brief_status").order("triggered_at", { ascending: false }).limit(50);
  const { data, error: incidentError } = !lgu || approved
    ? await (lgu ? query.in("organization_id", memberships!.map(m => m.organization_id)) : query.eq("owner_id", user.id))
    : { data: [], error: null };
  const incidents: Incident[] = data ?? [];
  const branchIds = [...new Set([...incidents.flatMap(i => i.organization_id ? [i.organization_id] : []), ...(memberships ?? []).map(m => m.organization_id)])];
  const [{ data: branchData, error: branchError }, { data: locationData, error: locationError }] = await Promise.all([
    branchIds.length ? supabase.from("organizations").select("id, name, jurisdiction, latitude, longitude, contact_phone").in("id", branchIds) : Promise.resolve({ data: [], error: null }),
    incidents.length ? supabase.rpc("latest_incident_locations", { incident_ids: incidents.map(i => i.id) }) : Promise.resolve({ data: [], error: null }),
  ]);
  const branches: Branch[] = branchData ?? [];
  const locations: IncidentLocation[] = locationData ?? [];
  const active = incidents.filter(i => i.status !== "resolved").length;
  return <div className={`dashboard-page ${lgu ? "dashboard-lgu" : "dashboard-user"}`}>
    <a href="#dashboard-main" className="skip-link">Skip to dashboard</a>
    <header className="dashboard-header"><Link href="/" className="auth-brand">PocketSeculex</Link><nav aria-label="Dashboard navigation"><a href="#response">{lgu ? "Response workspace" : "Safety overview"}</a><a href="#account-details">My account</a></nav><AccountControls /></header>
    <main id="dashboard-main" className="dashboard-main">
      <div className="dashboard-intro"><div><span className="dash-eyebrow">{lgu ? "LGU RESPONSE PORTAL" : "YOUR PERSONAL SAFETY SPACE"}</span><h1>{lgu ? "A clearer view. A coordinated response." : `Welcome back, ${profile.full_name?.split(" ")[0] || "there"}.`}</h1><p>{lgu ? "Your branch’s incidents, locations, and response updates in one workspace." : "Stay close to your device, your activity, and the people responding."}</p></div><span className="portal-badge">{lgu ? approved ? "Responder access active" : "Organization review" : "Personal account"}</span></div>
      <LiveUpdates />
      <div className="dashboard-stats" aria-label="Account summary"><div><span>Active in latest 50</span><strong>{incidentError || (lgu && !approved) ? "—" : active}</strong><small>{lgu ? "Assigned to your branches" : "Your recent emergency activity"}</small></div><div><span>{lgu ? "Awaiting dispatch" : "Assigned devices"}</span><strong>{lgu ? incidentError || !approved ? "—" : incidents.filter(i => i.status === "received").length : deviceError ? "—" : devices?.length ?? 0}</strong><small>{lgu ? "Signals received, response pending" : "Managed by your administrator"}</small></div><div><span>{lgu ? "Connected branches" : "Response connection"}</span><strong className="stat-text">{lgu ? membershipError ? "Unavailable" : memberships?.length ?? 0 : incidents.some(i => i.status !== "resolved" && i.organization_id) ? "Branch assigned" : "On standby"}</strong><small>{lgu ? "Approved organization memberships" : "Linked through your incident"}</small></div></div>
      {lgu && !approved ? <section className="dashboard-card access-card" id="response"><span className="dash-eyebrow">LET’S CONNECT YOUR TEAM</span><h2>{request?.status === "rejected" ? "Your request needs attention" : "Your response workspace is waiting"}</h2><p>Incident access opens after your organization membership is approved.</p>{membershipError || requestError ? <p role="alert">Access details could not be loaded. Refresh to try again.</p> : request ? <><span className="status-pill">{request.status}</span><h3>{request.organization}</h3><p>{request.jurisdiction} · {request.department}</p><p>{request.status === "rejected" ? "Contact your administrator to review your request." : "Your administrator will verify your organization and activate your membership."}</p></> : <LguRequest id={user.id} defaults={{ organization: String(user.user_metadata.organization ?? ""), jurisdiction: String(user.user_metadata.jurisdiction ?? ""), department: String(user.user_metadata.department ?? "") }}/>}</section> : <IncidentWorkspace incidents={incidents} branches={branches} locations={locations} responder={lgu && approved} error={Boolean(incidentError)} mapDataError={Boolean(branchError || locationError)}/>}
      <div className="dashboard-bottom" id="account-details"><section className="dashboard-card"><span className="dash-eyebrow">YOUR DETAILS</span><h2>Keep your profile up to date</h2><p>{user.email}</p><details><summary>Edit contact details</summary><ProfileForm id={user.id} name={profile.full_name} phone={profile.phone ?? ""}/></details></section><section className="dashboard-card"><span className="dash-eyebrow">{lgu ? "YOUR RESPONSE NETWORK" : "YOUR EVERYDAY COMPANION"}</span><h2>{lgu ? "Connected branches" : "Your devices"}</h2>{lgu ? membershipError || branchError ? <p role="alert">Branch details are unavailable.</p> : approved ? <ul className="device-list">{branches.filter(b => memberships?.some(m => m.organization_id === b.id)).map(b => <li key={b.id}><strong>{b.name}</strong><span>{b.jurisdiction}</span></li>)}</ul> : <p>Your approved branches will appear here.</p> : deviceError ? <p role="alert">Devices could not be loaded.</p> : devices?.length ? <ul className="device-list">{devices.map(d => <li key={d.id}><strong>{d.serial_number}</strong><span>{d.active ? "Active" : "Inactive"}</span></li>)}</ul> : <p>No device assigned yet. Your administrator can connect your PocketSeculex to this account.</p>}</section></div>
      <p className="dashboard-footnote">Research prototype. Device telemetry and emergency routing require connected backend services. This dashboard does not send an emergency alert.</p>
    </main>
  </div>;
}
