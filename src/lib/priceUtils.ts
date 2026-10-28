import type { MenuItem } from '../types';

/**
 * Consistently formats product price in integer EGP or verified price ranges.
 * In Arabic: '99 ج.م' or '64 – 74 ج.م'
 * In English: '99 EGP' or '64 – 74 EGP'
 */
export function formatPrice(item: MenuItem, isRTL: boolean): string {
  if (item.price_min != null && item.price_max != null) {
    return isRTL 
      ? `${item.price_min} – ${item.price_max} ج.م` 
      : `${item.price_min} – ${item.price_max} EGP`;
  }
  if (item.price_num != null) {
    return isRTL 
      ? `${item.price_num} ج.م` 
      : `${item.price_num} EGP`;
  }
  if (item.price) {
    // If string already contains formatted currency, normalize it
    const cleanNumber = item.price.replace(/[^\d–\-.\s]/g, '').trim();
    if (cleanNumber) {
      return isRTL ? `${cleanNumber} ج.م` : `${cleanNumber} EGP`;
    }
    return item.price;
  }
  return '';
}

/**
 * Extracts a comparable numeric value for sorting and filtering
 */
export function getItemPriceNumber(item: MenuItem): number {
  if (item.price_num != null) return item.price_num;
  if (item.price_min != null) return item.price_min;
  if (item.price) {
    const match = item.price.match(/\d+/);
    if (match) return parseInt(match[0], 10);
  }
  return 0;
}

