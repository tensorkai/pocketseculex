import { Suspense } from "react";
import Dashboard from "../../dashboard";
export default function Page() { return <Suspense fallback={<p>Loading your account…</p>}><Dashboard portal="user" /></Suspense>; }
