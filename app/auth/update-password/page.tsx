"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { browserClient } from "@/lib/supabase/client";
import { authMessage } from "@/lib/supabase/auth";
import "../../(portals)/portals.css";

export default function Page() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const password = String(values.get("password") ?? "");
    if (password.length < 12 || password !== values.get("confirm")) { setMessage("Use at least 12 characters and make sure both passwords match."); return; }
    setBusy(true);
    try {
      const supabase = browserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setMessage("Your reset session has expired. Request a new link from the sign-in page."); return; }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true); setMessage("Your password has been updated.");
    } catch (error) { setMessage(authMessage(error)); }
    finally { setBusy(false); }
  }
  return <main className="account-shell"><Link href="/">PocketSeculex</Link><section className="account-card"><h1>Choose a new password</h1>{!done && <form className="account-form" onSubmit={submit}><label htmlFor="new-password">New password</label><input id="new-password" name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128}/><label htmlFor="confirm-password">Confirm password</label><input id="confirm-password" name="confirm" type="password" autoComplete="new-password" required minLength={12} maxLength={128}/><button className="auth-submit" disabled={busy}>{busy ? "Saving…" : "Update password"}</button></form>}<p role="status">{message}</p><Link href={done ? "/account" : "/user/login"}>{done ? "Continue to your account" : "Back to sign in"}</Link></section></main>;
}
