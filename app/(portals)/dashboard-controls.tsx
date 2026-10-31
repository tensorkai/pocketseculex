"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/client";

export function AccountControls() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return <div><button type="button" className="text-button" disabled={busy} onClick={async () => {
    setBusy(true);
    try {
      const { error } = await browserClient().auth.signOut({ scope: "local" });
      if (error) throw error;
      router.replace("/"); router.refresh();
    } catch { setMessage("Sign out failed. Please try again."); setBusy(false); }
  }}>{busy ? "Signing out…" : "Sign out"}</button><p role="status">{message}</p></div>;
}

export function LiveUpdates() {
  const router = useRouter();
  const [status, setStatus] = useState("Connecting to updates…");
  useEffect(() => {
    const supabase = browserClient();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => { clearTimeout(timer); timer = setTimeout(() => router.refresh(), 500); };
    const channel = supabase.channel("account-incidents")
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, refresh)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "location_updates" }, refresh)
      .subscribe(state => {
        setStatus(state === "SUBSCRIBED" ? "Live incident updates connected" : "Live updates disconnected; use Refresh to check for changes.");
        if (state === "SUBSCRIBED") refresh();
      });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === "SIGNED_OUT") { router.replace("/user/login"); router.refresh(); }
    });
    // Membership changes are not published: periodically revalidate server-side access.
    const poll = setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => { clearTimeout(timer); clearInterval(poll); window.removeEventListener("focus", refresh); subscription.unsubscribe(); void supabase.removeChannel(channel); };
  }, [router]);
  return <p><span role="status">{status}</span> <button type="button" className="text-button" onClick={() => router.refresh()}>Refresh</button></p>;
}

export function ProfileForm({ id, name, phone }: { id: string; name: string; phone: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const fullName = String(values.get("name") ?? "").trim();
    const phone = String(values.get("phone") ?? "").trim();
    if (fullName.length < 2 || (phone && !/^\+?[\d\s()-]{7,30}$/.test(phone))) { setMessage("Enter a full name and a valid phone number, or leave phone blank."); return; }
    setBusy(true);
    try {
      const { data, error } = await browserClient().from("profiles").update({ full_name: fullName, phone: phone || null }).eq("id", id).select("id").single();
      if (error || !data) throw error;
      setMessage("Profile saved."); router.refresh();
    } catch { setMessage("Your profile could not be saved. Please try again."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="account-form"><label htmlFor="account-name">Full name</label><input id="account-name" name="name" defaultValue={name} required minLength={2} maxLength={150} autoComplete="name"/><label htmlFor="account-phone">Mobile number</label><input id="account-phone" name="phone" type="tel" defaultValue={phone} maxLength={30} autoComplete="tel"/><button className="auth-submit" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button><p role="status">{message}</p></form>;
}

export function LguRequest({ id, defaults }: { id: string; defaults: { organization: string; jurisdiction: string; department: string } }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return <form className="account-form" onSubmit={async event => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const organization = String(values.get("organization") ?? "").trim();
    const jurisdiction = String(values.get("jurisdiction") ?? "").trim();
    const department = String(values.get("department") ?? "");
    if (organization.length < 2 || jurisdiction.length < 2 || !["police", "rescue", "dispatch"].includes(department)) { setMessage("Complete all organization details."); return; }
    setBusy(true);
    try {
      const { error } = await browserClient().from("lgu_access_requests").insert({ user_id: id, organization, jurisdiction, department });
      if (error && error.code !== "23505") throw error;
      router.refresh(); setMessage("Request submitted for administrator review.");
    } catch { setMessage("Your request could not be submitted. Your account is still active; try again."); }
    finally { setBusy(false); }
  }}><p>Confirm your organization details to submit your access request.</p>
    <label htmlFor="request-org">Organization</label><input id="request-org" name="organization" defaultValue={defaults.organization} required minLength={2} maxLength={150}/>
    <label htmlFor="request-city">City / municipality</label><input id="request-city" name="jurisdiction" defaultValue={defaults.jurisdiction} required minLength={2} maxLength={150}/>
    <label htmlFor="request-department">Department</label><select id="request-department" name="department" defaultValue={defaults.department} required><option value="">Select department</option><option value="police">Police</option><option value="rescue">Rescue / DRRMO</option><option value="dispatch">Emergency dispatch</option></select>
    <button className="auth-submit" disabled={busy}>{busy ? "Submitting…" : "Submit access request"}</button><p role="status">{message}</p>
  </form>;
}

export function IncidentActions({ id, ownerId, responder, status }: { id: string; ownerId: string; responder: boolean; status: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function update(next: string) {
    setBusy(true);
    try {
      const { data, error } = await browserClient().from("incidents").update({ status: next }).eq("id", id).eq("status", status).select("id").single();
      if (error || !data) throw error;
      setMessage("Incident updated."); router.refresh();
    } catch { setMessage("Update failed or incident changed. Refresh and check your access."); }
    finally { setBusy(false); }
  }
  return <div><button type="button" className="text-button" disabled={busy} onClick={async () => {
    setBusy(true);
    try {
      const supabase = browserClient();
      const { data, error } = await supabase.from("location_updates").select("latitude, longitude, recorded_at").eq("incident_id", id).order("recorded_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      let details = data ? `Latest location: ${data.latitude}, ${data.longitude} at ${data.recorded_at}.` : "No location updates are available.";
      if (responder && status !== "resolved") {
        const { data: profile, error } = await supabase.from("profiles").select("full_name, phone").eq("id", ownerId).maybeSingle();
        if (error) throw error;
        if (profile) details += ` Contact: ${profile.full_name}, ${profile.phone || "no phone provided"}.`;
      }
      setMessage(details);
    } catch { setMessage("Details could not be loaded. Refresh and check your access."); }
    finally { setBusy(false); }
  }}>Load latest details</button>
    {responder && status === "received" && <button type="button" className="text-button" disabled={busy} onClick={() => update("dispatched")}>Mark dispatched</button>}
    {responder && status !== "resolved" && <button type="button" className="text-button" disabled={busy} onClick={() => update("resolved")}>Mark resolved</button>}
    <p role="status">{message}</p></div>;
}
