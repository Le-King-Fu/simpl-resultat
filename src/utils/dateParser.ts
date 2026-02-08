/**
 * Parse a date string with a given format and return ISO YYYY-MM-DD.
 * Supported formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD-MM-YYYY, DD.MM.YYYY
 */
export function parseDate(raw: string, format: string): string {
  if (!raw || typeof raw !== "string") return "";

  const cleaned = raw.trim();
  let day: string, month: string, year: string;

  // Extract parts based on separator
  const parts = cleaned.split(/[/\-\.]/);
  if (parts.length !== 3) return "";

  switch (format) {
    case "DD/MM/YYYY":
    case "DD-MM-YYYY":
    case "DD.MM.YYYY":
      [day, month, year] = parts;
      break;
    case "MM/DD/YYYY":
    case "MM-DD-YYYY":
      [month, day, year] = parts;
      break;
    case "YYYY-MM-DD":
    case "YYYY/MM/DD":
      [year, month, day] = parts;
      break;
    default:
      // Default to DD/MM/YYYY (French)
      [day, month, year] = parts;
      break;
  }

  // Validate
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);

  if (isNaN(y) || isNaN(m) || isNaN(d)) return "";
  if (m < 1 || m > 12 || d < 1 || d > 31) return "";

  // Handle 2-digit years
  const fullYear = y < 100 ? (y > 50 ? 1900 + y : 2000 + y) : y;

  return `${fullYear.toString().padStart(4, "0")}-${m.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
}
