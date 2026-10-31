import { NextResponse, type NextRequest } from "next/server";
import { serverClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const supabase = await serverClient();
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  const destination = params.get("next") === "/auth/update-password" || type === "recovery"
    ? "/auth/update-password" : "/account";
  let ok = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && (type === "signup" || type === "email" || type === "recovery")) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    ok = !error;
  }
  const response = NextResponse.redirect(new URL(ok ? destination : "/auth/error", request.url));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
