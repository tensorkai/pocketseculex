"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase/client";
import { hasSupabaseConfig } from "@/lib/supabase/config";

export default function AccountLink() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    if (!hasSupabaseConfig()) return;
    const supabase = browserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => subscription.unsubscribe();
  }, []);
  return <Link className="user-portal-link" href={signedIn ? "/account" : "/user/login"}>{signedIn ? "My account" : "Sign in"}</Link>;
}
