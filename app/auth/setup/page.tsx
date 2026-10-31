import Link from "next/link";

export default function Page() {
  return <main className="section-wrap"><h1>Account services need setup</h1><p>Sign-in and registration are temporarily unavailable because this website has no Supabase connection configured.</p><p>The project administrator must set the Supabase project URL and public key in the website environment, then restart or redeploy it.</p><Link href="/">Return home</Link></main>;
}
