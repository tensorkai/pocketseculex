import { Suspense } from "react";
import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";

async function Destination() {
  const supabase = await serverClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/user/login");
  const { data: profile, error } = await supabase.from("profiles").select("account_type").eq("id", user.id).single();
  if (error || !profile) return <main className="section-wrap"><h1>Account setup needs attention</h1><p>Your sign-in succeeded, but your profile could not be loaded. Check that the profile trigger and account_type column are installed in Supabase, then reload.</p><a href="/user/dashboard">Open account</a></main>;
  redirect(profile.account_type === "lgu" ? "/lgu/dashboard" : "/user/dashboard");
}

export default function Page() { return <Suspense fallback={<p>Opening your account…</p>}><Destination /></Suspense>; }
