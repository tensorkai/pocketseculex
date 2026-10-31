import Link from "next/link";

export default function Page() {
  return <main className="section-wrap"><h1>This email link could not be verified.</h1><p>It may have expired, already been used, or been opened in a different browser. Return to sign in to request another confirmation or password-reset email.</p><Link href="/user/login">Personal sign in</Link><p><Link href="/lgu/login">LGU sign in</Link></p></main>;
}
