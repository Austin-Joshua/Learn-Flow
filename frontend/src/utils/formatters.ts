/**
 * Authoritative date and number formatting helpers for Learnflow LMS.
 */

export function formatDate(
  dateInput: string | number | Date | null | undefined,
  fallback = '—'
): string {
  if (!dateInput) return fallback;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString();
}

export function formatTime(
  dateInput: string | number | Date | null | undefined,
  fallback = '—'
): string {
  if (!dateInput) return fallback;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return fallback;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatNumber(
  value: number | null | undefined,
  options?: Intl.NumberFormatOptions
): string {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return new Intl.NumberFormat('en-US', options).format(value);
}

