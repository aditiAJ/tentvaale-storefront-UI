/**
 * A mobile number is ten digits, nothing else, starting 6 to 9 (an Indian mobile). The server keeps and compares it
 * that way; the forms below only keep a person from typing anything else.
 */

/** What is left of whatever was typed or pasted: digits only, at most ten (a pasted +91 or leading 0 is dropped). */
export function onlyDigits(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length > 10 && digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 10);
}

export function isMobile(value: string): boolean {
  return /^[6-9]\d{9}$/.test(value);
}

/** The sentence for a number that is not one, or null when it is fine. */
export function mobileError(value: string): string | null {
  if (!value) return "Enter your mobile number.";
  if (!/^\d+$/.test(value)) return "Use digits only.";
  if (value.length !== 10) return "A mobile number has 10 digits.";
  if (!isMobile(value)) return "A mobile number starts with 6, 7, 8 or 9.";
  return null;
}

/** Looks like an email: what the server's @Email check will accept, kept loose on purpose. */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
