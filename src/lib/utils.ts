/**
 * Generates a cryptographically secure 6-digit OTP.
 */
export function generateSecureOTP(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const num = array[0] % 1_000_000;
  return num.toString().padStart(6, "0");
}
