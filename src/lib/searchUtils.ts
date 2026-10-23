/**
 * Search Utilities with Arabic normalization
 * Handles diacritics removal, alef hamza normalization, and teh marbuta / heh flexibility.
 */

export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // remove tashkeel (fatha, damma, kasra, sukun, shadda, etc.)
    .replace(/[إأآء]/g, 'ا') // unify all alef variants to simple alef
    .replace(/ة/g, 'ه')      // normalize teh marbuta to heh
    .replace(/ى/g, 'ي')      // normalize alef maksura to yeh
    .trim();
}

export function searchMatches(
  query: string, 
  nameEn: string, 
  nameAr: string, 
  descEn?: string, 
  descAr?: string
): boolean {
  if (!query || !query.trim()) return true;
  const qRaw = query.trim().toLowerCase();
  const qNormAr = normalizeArabic(qRaw);

  const enMatch = (nameEn || '').toLowerCase().includes(qRaw) || 
                  (descEn || '').toLowerCase().includes(qRaw);

  const arMatch = normalizeArabic(nameAr || '').includes(qNormAr) || 
                  normalizeArabic(descAr || '').includes(qNormAr);

  return enMatch || arMatch;
}
