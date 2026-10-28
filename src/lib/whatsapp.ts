/**
 * Converts any Egyptian phone format to the international digits-only format
 * that wa.me requires (e.g. "01060119488" -> "201060119488").
 */
export function toWhatsappNumber(raw: string | undefined | null): string {
  let digits = (raw || '').replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) digits = digits.slice(2); // 0020... -> 20...
  if (digits.startsWith('0')) digits = '20' + digits.slice(1); // 010... -> 2010...
  return digits;
}
