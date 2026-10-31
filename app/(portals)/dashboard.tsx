import Link from "next/link";
import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";
import { AccountControls, IncidentActions, LiveUpdates, LguRequest, ProfileForm } from "./dashboard-controls";

export default async function Dashboard({ portal }: { portal: "user" | "lgu" }) {
  const supabase = await serverClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${portal}/login`);
  const { data: profile, error: profileError } = await supabase.from("profiles").select("id, account_type, full_name, phone").eq("id", user.id).single();
  if (profileError || !profile) return <main className="account-shell"><h1>Your profile could not be loaded</h1><p>You are signed in. Check the Supabase profile setup and try reloading.</p><AccountControls /></main>;
  if (profile.account_type !== portal) redirect(profile.account_type === "lgu" ? "/lgu/dashboard" : "/user/dashboard");
  const lgu = portal === "lgu";
  const { data: memberships, error: membershipError } = await supabase.from("lgu_memberships").select("organization_id, department, active").eq("user_id", user.id).eq("active", true);
  const approved = !membershipError && Boolean(memberships?.length);
  const { data: request, error: requestError } = lgu
    ? await supabase.from("lgu_access_requests").select("status, organization, jurisdiction, department").eq("user_id", user.id).maybeSingle()
    : { data: null, error: null };
  // RLS remains authoritative; the page gate also avoids loading incidents for pending LGU users.
  const incidentsQuery = supabase.from("incidents").select("id, owner_id, status, triggered_at, latitude, longitude, brief, brief_status").order("triggered_at", { ascending: false }).limit(50);
  const { data: incidents, error: incidentError } = !lgu || approved
    ? await (lgu ? incidentsQuery.in("organization_id", memberships!.map(m => m.organization_id)) : incidentsQuery.eq("owner_id", user.id))
    : { data: [], error: null };
  const { data: devices, error: deviceError } = !lgu
    ? await supabase.from("devices").select("id, serial_number, active").eq("owner_id", user.id)
    : { data: [], error: null };
  return <div className="account-shell">
    <header className="account-header"><Link href="/" className="auth-brand">PocketSeculex</Link><AccountControls /></header>
    <main>
      <span className="auth-overline">{lgu ? "LGU RESPONSE PORTAL" : "PERSONAL ACCOUNT"}</span>
      <h1>Welcome, {profile.full_name || "there"}.</h1><p>{user.email}</p>
      <LiveUpdates />
      <div className="account-grid">
        <section className="account-card"><h2>Your profile</h2><ProfileForm id={user.id} name={profile.full_name} phone={profile.phone ?? ""} /></section>
        <section className="account-card"><h2>{lgu ? "Organization access" : "Your devices"}</h2>
          {lgu ? <>
            {(membershipError || requestError) ? <p role="alert">Access details could not be loaded. Reload to try again.</p> : approved ? <><p>Your responder access is active.</p><ul>{memberships!.map(m => <li key={m.organization_id}>{m.department} · Organization {m.organization_id}</li>)}</ul></> : request ? <><p>Request status: <strong>{request.status}</strong></p><p>{request.organization} · {request.jurisdiction}</p><p>{request.status === "rejected" ? "Contact your administrator to review or correct your request." : "Incident access becomes available when an administrator activates your organization membership."}</p></> : <LguRequest id={user.id} defaults={{ organization: String(user.user_metadata.organization ?? ""), jurisdiction: String(user.user_metadata.jurisdiction ?? ""), department: String(user.user_metadata.department ?? "") }} />}
          </> : deviceError ? <p role="alert">Devices could not be loaded.</p> : devices?.length ? <ul>{devices.map(d => <li key={d.id}>{d.serial_number} · {d.active ? "Active" : "Inactive"}</li>)}</ul> : <p>No devices are assigned to you yet. Device provisioning is managed by your administrator.</p>}
        </section>
      </div>
      <section className="account-card"><h2>{lgu ? "Organization incidents" : "Your incidents"}</h2>
        <p>Latest 50 incidents. Hardware ingestion, AI generation, and routing are not connected by this website.</p>
        {incidentError ? <p role="alert">Incidents could not be loaded. Please reload.</p> : lgu && !approved ? <p>Incident information is unavailable until your organization access is active.</p> : !incidents?.length ? <p>No incidents to display.</p> : <div className="incident-list">{incidents.map(i => <article key={i.id} className="incident-card">
          <h3>{i.status} · {i.triggered_at}</h3><p>Initial location: {i.latitude}, {i.longitude}</p>
          <p>{i.brief_status === "ready" && i.brief ? i.brief : i.brief_status === "failed" ? "AI brief unavailable. Assess the incident directly." : "Awaiting incident brief."}</p>
          <IncidentActions id={i.id} ownerId={i.owner_id} responder={lgu && approved} status={i.status} />
        </article>)}</div>}
      </section>
    </main>
  </div>;
}
