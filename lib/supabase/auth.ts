export function authMessage(error: unknown): string {
  const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
  const message = error instanceof Error ? error.message : "";
  // Auth JS wraps HTTP 500 responses as retryable errors and drops their code.
  if (message === "Database error saving new user" || message === "Database error querying schema") return "The account service could not complete database setup. Ask the project administrator to check the database signup trigger and Supabase Auth logs, then try again.";
  if (error instanceof Error && error.name === "AuthRetryableFetchError") return "The account service is unreachable or temporarily unavailable. Check your connection; if it continues, ask the administrator to verify the Supabase project URL and status.";
  if (code === "supabase_not_configured") return "Account services are not configured. The project administrator needs to add the Supabase URL and public key, then restart or redeploy the website.";
  if (code === "unexpected_failure" || code === "database_error") return "The account service could not save your account. Ask the project administrator to check the database signup trigger and Supabase Auth logs, then try again.";
  if (code === "signup_disabled" || code === "email_provider_disabled") return "Email registration is currently disabled. Contact the project administrator to enable it.";
  if (code === "invalid_credentials") return "Email or password is incorrect. Check your details and try again.";
  if (code === "email_not_confirmed") return "Confirm your email before signing in. You can resend the confirmation below.";
  if (code === "user_already_exists") return "An account already exists for this email. Sign in or reset your password.";
  if (code === "weak_password") return "Choose a stronger password with at least 12 characters.";
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit") return "Too many attempts. Please wait a few minutes before trying again.";
  if (code === "email_address_invalid" || code === "email_address_not_authorized") return "This email address cannot receive account emails. Use a valid address or contact the project administrator.";
  if (code === "same_password") return "Choose a password different from your current password.";
  return "We couldn’t complete that request. Check your connection and try again. If it continues, contact the project administrator.";
}
