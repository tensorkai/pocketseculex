"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { browserClient } from "@/lib/supabase/client";
import { authMessage } from "@/lib/supabase/auth";

type Portal = "user" | "lgu";
type Mode = "login" | "register";

function Shield({ className = "" }: { className?: string }) {
  return <svg className={className} width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/></svg>;
}

function Eye({ visible }: { visible: boolean }) {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{visible && <path d="m3 3 18 18"/>}</svg>;
}

export default function PortalAuth({ portal, mode }: { portal: Portal; mode: Mode }) {
  const router = useRouter();
  const lgu = portal === "lgu";
  const register = mode === "register";
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const resetDialog = useRef<HTMLDialogElement>(null);
  const [resetStatus, setResetStatus] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const base = `/${portal}`;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const value = (key: string) => String(data.get(key) ?? "");
    const next: Record<string, string> = {};
    if (register && value("name").trim().length < 2) next.name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value("email").trim())) next.email = "Enter a valid email address.";
    if (register && !lgu && !/^\+?[\d\s()-]{7,22}$/.test(value("phone"))) next.phone = "Enter a valid mobile number, including your area or country code.";
    if (register && !lgu && !/^\d{7,15}$/.test(value("phone").replace(/\D/g, ""))) next.phone = "Your mobile number should contain 7–15 digits.";
    if (register && lgu) {
      if (value("organization").trim().length < 2) next.organization = "Enter your LGU or organization name.";
      if (value("jurisdiction").trim().length < 2) next.jurisdiction = "Enter your city or municipality.";
      if (!value("department")) next.department = "Select your department.";
    }
    if (!value("password")) next.password = "Enter your password.";
    else if (register && value("password").length < 12) next.password = "Use at least 12 characters.";
    if (register && value("confirm") !== value("password")) next.confirm = "Your passwords do not match.";
    setErrors(next);
    setFeedback("");
    const first = Object.keys(next)[0];
    if (first) {
      formRef.current?.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setBusy(true);
    try {
      const supabase = browserClient();
      if (register) {
        const { data: result, error } = await supabase.auth.signUp({
          email: value("email").trim(), password: value("password"),
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              account_type: portal, name: value("name").trim(),
              ...(lgu ? { organization: value("organization").trim(), jurisdiction: value("jurisdiction").trim(), department: value("department") } : { phone: value("phone").trim() }),
            },
          },
        });
        if (error) throw error;
        if (result.session) { router.replace("/account"); router.refresh(); return; }
        setFeedback("Check your inbox to confirm your email, then sign in. If you already have an account, sign in or reset your password.");
        formRef.current?.reset();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: value("email").trim(), password: value("password") });
        if (error) throw error;
        router.replace("/account"); router.refresh();
      }
    } catch (error) { setFeedback(authMessage(error)); }
    finally { setBusy(false); requestAnimationFrame(() => feedbackRef.current?.focus()); }
  }

  async function resendConfirmation() {
    const email = String(new FormData(formRef.current!).get("email") ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFeedback("Enter your email address above first."); return; }
    setBusy(true);
    try {
      const { error } = await browserClient().auth.resend({ type: "signup", email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
      if (error) throw error;
      setFeedback("If your account needs confirmation, a new link has been sent. Check your inbox and spam folder.");
    } catch (error) { setFeedback(authMessage(error)); }
    finally { setBusy(false); }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (resetBusy) return;
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    setResetBusy(true);
    try {
      const { error } = await browserClient().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password` });
      if (error) throw error;
      setResetStatus("If an account exists for this address, you’ll receive a password-reset link shortly.");
    } catch (error) { setResetStatus(authMessage(error)); }
    finally { setResetBusy(false); }
  }

  function field(name: string, label: string, options: { type?: string; placeholder?: string; autoComplete?: string; hint?: string } = {}) {
    const error = errors[name];
    const password = name === "password" || name === "confirm";
    const visible = name === "confirm" ? showConfirm : showPassword;
    const hintId = options.hint ? `${name}-hint` : "";
    return <div className={`auth-field ${name === "name" || name === "organization" || name === "email" || password ? "field-full" : ""}`}>
      <label htmlFor={name}>{label}</label>
      <div className={password ? "password-wrap" : ""}>
        <input id={name} name={name} type={password ? visible ? "text" : "password" : options.type ?? "text"} placeholder={options.placeholder} autoComplete={options.autoComplete} required maxLength={password ? 128 : 150} aria-invalid={!!error} aria-describedby={[error ? `${name}-error` : "", hintId].filter(Boolean).join(" ") || undefined} spellCheck={password ? false : undefined}/>
        {password && <button type="button" className="password-toggle" aria-label={`${visible ? "Hide" : "Show"} ${name === "confirm" ? "confirmation password" : "password"}`} aria-pressed={visible} onClick={() => name === "confirm" ? setShowConfirm(!showConfirm) : setShowPassword(!showPassword)}><Eye visible={visible}/></button>}
      </div>
      {options.hint && <small id={hintId}>{options.hint}</small>}
      {error && <p className="field-error" id={`${name}-error`}>{error}</p>}
    </div>;
  }

  return <div className={`auth-page ${lgu ? "auth-lgu" : "auth-user"}`}>
    <a href="#auth-main" className="skip-link">Skip to form</a>
    <header className="auth-header">
      <Link href="/" className="auth-brand"><Shield/><span>PocketSeculex</span></Link>
      <Link href="/" className="auth-back"><span aria-hidden="true">←</span> Back to the city</Link>
    </header>
    <main className="auth-layout" id="auth-main">
      <aside className="auth-story" aria-label={lgu ? "For local emergency responders" : "Your personal safety connection"}>
        <div className="story-image"/><div className="story-shade"/>
        <div className="story-top"><span className="story-index">{lgu ? "02" : "01"}</span><span>{lgu ? "FOR THE PEOPLE WHO RESPOND" : "FOR YOUR EVERYDAY JOURNEYS"}</span></div>
        <div className="story-copy"><h1>{lgu ? <>A clearer picture.<br/><em>A closer connection.</em></> : <>Your day, ahead.<br/><em>Your safety, with you.</em></>}</h1><p>{lgu ? "One place to understand a distress signal, locate the person behind it, and coordinate your team’s response." : "A familiar route. A new adventure. Keep a direct connection to your community’s responders, wherever the day takes you."}</p></div>
        <div className="story-bottom"><Shield/><div><strong>{lgu ? "The LGU response portal" : "The PocketSeculex user portal"}</strong><span>{lgu ? "Police · Rescue · Emergency dispatch" : "Your profile. Your device. Your peace of mind."}</span></div><span className="story-arrow" aria-hidden="true">↗</span></div>
      </aside>
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="portal-switch" aria-label="Choose your portal"><Link href={`/user/${register ? "create-account" : "login"}`} aria-current={!lgu ? "page" : undefined}>Personal account</Link><Link href={`/lgu/${register ? "create-account" : "login"}`} aria-current={lgu ? "page" : undefined}>LGU & responders</Link></div>
        <div className="auth-form-content">
          <span className="auth-overline">{lgu ? "LGU PORTAL" : "USER PORTAL"}</span>
          <h2 id="auth-title">{register ? lgu ? "Join your response team." : "Make yourself at home." : "Good to see you again."}</h2>
          <p className="auth-intro">{register ? lgu ? "Request an account for your local government or emergency response organization." : "Create an account to set up your safety profile and connect your PocketSeculex." : lgu ? "Sign in with your approved responder account." : "Sign in to your PocketSeculex account."}</p>
          {lgu && register && <div className="approval-note"><Shield/><p><strong>Access is verified, not automatic.</strong><br/>Your organization and role must be approved before you can access incident information.</p></div>}
          <form ref={formRef} onSubmit={submit} noValidate className={`auth-form ${register ? "register-form" : ""}`}>
            {Object.keys(errors).length > 0 && <p className="auth-error-summary field-full" role="alert">Please check the highlighted fields below.</p>}
            {register && field("name", "Full name", { autoComplete: "name", placeholder: "Alex Santos" })}
            {register && lgu && field("organization", "LGU / organization", { autoComplete: "organization", placeholder: "City of Manila" })}
            {register && lgu && <>
              {field("jurisdiction", "City / municipality", { placeholder: "Manila", autoComplete: "address-level2" })}
              <div className="auth-field"><label htmlFor="department">Department</label><select id="department" name="department" required defaultValue="" aria-invalid={!!errors.department} aria-describedby={errors.department ? "department-error" : undefined}><option value="" disabled>Select department</option><option value="police">Police</option><option value="rescue">Rescue / DRRMO</option><option value="dispatch">Emergency dispatch</option></select>{errors.department && <p className="field-error" id="department-error">{errors.department}</p>}</div>
            </>}
            {field("email", lgu ? "Work email address" : "Email address", { type: "email", autoComplete: "email", placeholder: lgu ? "alex@organization.gov.ph" : "alex@example.com" })}
            {register && !lgu && field("phone", "Mobile number", { type: "tel", autoComplete: "tel", placeholder: "+63 917 123 4567" })}
            {field("password", "Password", { autoComplete: register ? "new-password" : "current-password", placeholder: register ? "Create a password" : "Enter your password", hint: register ? "At least 12 characters. A memorable phrase works well." : undefined })}
            {register && field("confirm", "Confirm password", { autoComplete: "new-password", placeholder: "Enter your password again" })}
            {!register && <div className="login-options field-full"><span><Shield/> Your account, your access.</span><button type="button" onClick={() => { setResetStatus(""); resetDialog.current?.showModal(); }}>Forgot password?</button></div>}
            {feedback && <div ref={feedbackRef} className="auth-feedback field-full" role="status" tabIndex={-1}><p>{feedback}</p></div>}
            <button type="submit" disabled={busy} aria-busy={busy} className="auth-submit field-full">{busy ? "Please wait…" : register ? lgu ? "Create LGU account" : "Create account" : "Sign in"}<span aria-hidden="true">→</span></button>
            {!register && <button type="button" className="text-button field-full" disabled={busy} onClick={resendConfirmation}>Resend confirmation email</button>}
          </form>
          <p className="auth-alternative">{register ? "Already have an account?" : "New to PocketSeculex?"} <Link href={`${base}/${register ? "login" : "create-account"}`}>{register ? "Sign in" : lgu ? "Request access" : "Create an account"}</Link></p>
          <div className="auth-prototype"><span>YOUR ACCOUNT</span><p>{lgu ? "Confirm your email, then submit your organization details for review from your account. Incident access requires administrator approval." : "Your account and profile are securely stored. Emergency hardware services are separate from account registration."}</p></div>
        </div>
        <div className="auth-panel-footer"><span>PocketSeculex</span><span>{lgu ? "Stronger communities, together." : "A connection that matters."}</span></div>
      </section>
    </main>
    <dialog ref={resetDialog} className="reset-dialog" aria-labelledby="reset-title" onKeyDown={e => { if (e.key === "Escape") resetDialog.current?.close(); }} onClick={e => { if (e.target === resetDialog.current) resetDialog.current.close(); }}>
      <button type="button" className="reset-close" aria-label="Close password reset" onClick={() => resetDialog.current?.close()}>×</button><Shield/>
      <h2 id="reset-title">Let’s get you back in.</h2><p>Enter the email address associated with your {lgu ? "LGU" : "personal"} account.</p>
      <form onSubmit={resetPassword}><label htmlFor="reset-email">Email address</label><input id="reset-email" name="email" type="email" autoComplete="email" required placeholder="alex@example.com"/>{resetStatus && <p className="reset-status" role="status">{resetStatus}</p>}<button className="auth-submit" type="submit" disabled={resetBusy}>{resetBusy ? "Sending…" : "Send reset link"} <span aria-hidden="true">→</span></button></form>
      <small>Open the reset link in the same browser where you requested it.</small>
    </dialog>
  </div>;
}
