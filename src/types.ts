export type Language = 'en' | 'ar';
export type UserRole = 'owner' | 'editor' | 'viewer';

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  last_sign_in_at?: string;
}

export interface MediaItem {
  id: string;
  storage_path: string;
  public_url: string;
  width?: number;
  height?: number;
  bytes?: number;
  alt_en: string;
  alt_ar: string;
  caption_en?: string;
  caption_ar?: string;
  tags: string[];
  is_ai: boolean;
  created_at: string;
}

export interface ImageSlot {
  slot_key: string; // e.g. 'branding.logo', 'hero.slide.0', 'story.block.0'
  label_en: string;
  label_ar: string;
  section: string; // 'branding' | 'hero' | 'story' | 'atmosphere' | 'gallery' | 'menu' | 'social' | 'seo'
  where_appears_en?: string;
  where_appears_ar?: string;
  recommended_size?: string;
  recommended_aspect_ratio?: string;
  default_url?: string;
  media_id?: string;
  media_url?: string;
  thumbnail_url?: string;
  object_position_x: number; // 0-100 %
  object_position_y: number; // 0-100 %
  object_fit: 'cover' | 'contain' | 'fill';
  zoom: number; // 1 to 3
  overlay_opacity: number; // 0 to 1
  aspect_ratio?: string; // e.g. '16/9', '4/3', '1/1'
  alt_en?: string;
  alt_ar?: string;
  caption_en?: string;
  caption_ar?: string;
  sort_order: number;
  visible: boolean;
  can_delete?: boolean;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  price?: string | null; // Nullable - only shown if owner confirms
  media_id?: string;
  image_url?: string;
  tags?: string[];
  is_signature?: boolean;
  is_unavailable?: boolean; // Unavailable today toggle (greyed out with badge)
  is_sample?: boolean; // For dishes not yet confirmed by owner
  available: boolean;
  sort_order: number;
  visible: boolean;
}

export interface MenuCategory {
  id: string;
  name_en: string;
  name_ar: string;
  sort_order: number;
  visible: boolean;
}

export interface BranchWeeklyHours {
  monday: { open: string; close: string; closed: boolean };
  tuesday: { open: string; close: string; closed: boolean };
  wednesday: { open: string; close: string; closed: boolean };
  thursday: { open: string; close: string; closed: boolean };
  friday: { open: string; close: string; closed: boolean };
  saturday: { open: string; close: string; closed: boolean };
  sunday: { open: string; close: string; closed: boolean };
}

export interface BranchInfo {
  id: string;
  name_en: string;
  name_ar: string;
  status: 'confirmed' | 'unconfirmed';
  address_en: string;
  address_ar: string;
  phone?: string;
  hours_summary_en: string;
  hours_summary_ar: string;
  weekly_hours?: BranchWeeklyHours;
  landmark_en: string;
  landmark_ar: string;
  map_embed_url?: string;
  map_directions_url?: string;
  is_primary: boolean;
  visible: boolean;
  note_en?: string;
  note_ar?: string;
}

export interface RatingBadge {
  id: string;
  source: 'Google Maps' | 'TripAdvisor' | string;
  score: string; // e.g. "4.3", "4.0"
  review_count: string; // e.g. "7,000+ reviews", "120 reviews"
  url: string; // Must be verified URL
  is_verified: boolean;
  unverified_owner_flag?: boolean; // unverified - confirm with owner
  sort_order: number;
  visible: boolean;
}

export interface SiteSettings {
  brand_name_en: string; // "Oldish"
  brand_name_ar: string; // "أولديش"
  tagline_en: string; // "Flavors you'll never forget"
  tagline_ar: string; // "نكهات مش هتنساها"
  subline_en: string; // "Restaurant · Café · Garden - Downtown Cairo"
  subline_ar: string; // "مطعم · كافيه · حديقة - وسط البلد"
  category_en: string; // "Restaurant | Café | Garden"
  category_ar: string; // "مطعم | مقهى | حديقة"
  facebook_followers: string; // "~165K"
  price_range: string; // "EGP 200-400 per person"
  phone: string; // "+20 10 60119488"
  whatsapp: string; // "+20 10 60119488"
  facebook_url: string;
  instagram_url: string;
  google_maps_url: string;
  elmenus_url?: string;
  show_prices: boolean; // default: false until owner confirms
  noindex: boolean; // default: true for sales demo
  site_domain: string;
  primary_color: string; // #886E42
  charcoal_color: string; // #222222
  bg_color: string; // #FAF8F5
  font_family_en: string;
  font_family_ar: string;
  // Demo Banner (Sales Presentation)
  demo_banner_enabled?: boolean;
  demo_banner_text_en?: string;
  demo_banner_text_ar?: string;
  // Announcements
  announcement_enabled?: boolean;
  announcement_text_en?: string;
  announcement_text_ar?: string;
  announcement_link?: string;
  announcement_start_date?: string;
  announcement_end_date?: string;
  // Branding Images
  logo_url?: string;
  logo_dark_url?: string;
  favicon_url?: string;
  social_image_url?: string;
  qr_logo_url?: string;
  // Social
  instagram_strip_enabled?: boolean;
  // Local Analytics
  analytics_clicks?: {
    calls: number;
    directions: number;
    menu_views: number;
    whatsapp_clicks: number;
    reservation_requests: number;
  };
}

export interface SectionConfig {
  key: string;
  nav_label_en: string;
  nav_label_ar: string;
  sort_order: number;
  visible: boolean;
  content: Record<string, any>;
}

export interface Inquiry {
  id: string;
  type: 'reservation_request' | 'event_request' | 'contact_inquiry';
  name: string;
  phone: string;
  email?: string;
  date?: string;
  time?: string;
  guests?: string;
  message?: string;
  status: 'new' | 'handled' | 'archived';
  created_at: string;
  branch?: string;
  honeypot?: string; // if filled, reject as spam
}

export interface ContentVersion {
  id: string;
  created_at: string;
  created_by: string;
  label: string;
  snapshot: {
    site_settings: SiteSettings;
    sections: SectionConfig[];
    menu_categories: MenuCategory[];
    menu_items: MenuItem[];
    branches: BranchInfo[];
    rating_badges: RatingBadge[];
    image_slots: ImageSlot[];
  };
}

export interface ActivityLog {
  id: string;
  user_email: string;
  action: string;
  entity: string;
  details?: string;
  created_at: string;
}
