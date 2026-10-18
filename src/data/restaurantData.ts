import { 
  SEED_SITE_SETTINGS, 
  SEED_BRANCHES, 
  SEED_MENU_CATEGORIES, 
  SEED_MENU_ITEMS, 
  SEED_RATING_BADGES, 
  SEED_MEDIA, 
  SEED_SECTIONS 
} from './seedData';
import type { BranchInfo, MenuItem, RatingBadge, MediaItem } from '../types';

export const RESTAURANT_METADATA = {
  name: SEED_SITE_SETTINGS.brand_name_en,
  nameAr: SEED_SITE_SETTINGS.brand_name_ar,
  taglineEn: SEED_SITE_SETTINGS.tagline_en,
  taglineAr: SEED_SITE_SETTINGS.tagline_ar,
  sublineEn: SEED_SITE_SETTINGS.subline_en,
  sublineAr: SEED_SITE_SETTINGS.subline_ar,
  categoryEn: SEED_SITE_SETTINGS.category_en,
  categoryAr: SEED_SITE_SETTINGS.category_ar,
  facebookFollowers: SEED_SITE_SETTINGS.facebook_followers,
  priceRange: SEED_SITE_SETTINGS.price_range,
  primaryPhone: SEED_SITE_SETTINGS.phone,
  whatsapp: SEED_SITE_SETTINGS.whatsapp,
  social: {
    facebook: SEED_SITE_SETTINGS.facebook_url,
    instagram: SEED_SITE_SETTINGS.instagram_url,
  },
  googleMapsUrl: SEED_SITE_SETTINGS.google_maps_url,
  elmenusUrl: SEED_SITE_SETTINGS.elmenus_url,
  defaultHoursEn: 'Every day 8:00 AM – 12:00 AM (midnight)',
  defaultHoursAr: 'يومياً من 8:00 صباحاً حتى 12:00 منتصف الليل',
  hoursDisclaimerEn: 'Regular opening hours: 8:00 AM – 12:00 AM.',
  hoursDisclaimerAr: 'مواعيد العمل الرسمية: 8:00 صباحاً حتى 12:00 منتصف الليل.'
};

export const BRANCHES: BranchInfo[] = SEED_BRANCHES;
export const MENU_CATEGORIES = SEED_MENU_CATEGORIES;
export const MENU_ITEMS: MenuItem[] = SEED_MENU_ITEMS;
export const RATING_BADGES: RatingBadge[] = SEED_RATING_BADGES;
export const MEDIA_LIST: MediaItem[] = SEED_MEDIA;

export { 
  SEED_SITE_SETTINGS, 
  SEED_BRANCHES, 
  SEED_MENU_CATEGORIES, 
  SEED_MENU_ITEMS, 
  SEED_RATING_BADGES, 
  SEED_SECTIONS 
};
