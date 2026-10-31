export function authMessage(error: unknown): string {
  const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
  if (code === "invalid_credentials") return "Email or password is incorrect. Check your details and try again.";
  if (code === "email_not_confirmed") return "Confirm your email before signing in. You can resend the confirmation below.";
  if (code === "user_already_exists") return "An account already exists for this email. Sign in or reset your password.";
  if (code === "weak_password") return "Choose a stronger password with at least 12 characters.";
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit") return "Too many attempts. Please wait a few minutes before trying again.";
  if (code === "email_address_invalid" || code === "email_address_not_authorized") return "This email address cannot receive account emails. Use a valid address or contact the project administrator.";
  if (code === "same_password") return "Choose a password different from your current password.";
  return "We couldn’t complete that request. Check your connection and try again. If it continues, contact the project administrator.";
}
