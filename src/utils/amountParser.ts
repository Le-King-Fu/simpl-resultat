/**
 * Parse a French-formatted amount string to a number.
 * Handles formats like: 1.234,56 / 1234,56 / -1 234.56 / 1 234,56
 */
export function parseFrenchAmount(raw: string): number {
  if (!raw || typeof raw !== "string") return NaN;

  let cleaned = raw.trim();

  // Remove currency symbols and whitespace
  cleaned = cleaned.replace(/[€$£\s\u00A0]/g, "");

  // Detect if comma is decimal separator (French style)
  // Pattern: digits followed by comma followed by exactly 1-2 digits at end
  const frenchPattern = /,\d{1,2}$/;
  if (frenchPattern.test(cleaned)) {
    // French format: remove dots (thousand sep), replace comma with dot (decimal)
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    // English format or no decimal: remove commas (thousand sep)
    cleaned = cleaned.replace(/,/g, "");
  }

  const result = parseFloat(cleaned);
  return isNaN(result) ? NaN : result;
}
