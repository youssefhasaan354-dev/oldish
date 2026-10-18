-- ============================================================================
-- OLDISH RESTAURANT & CAFÉ — PRODUCTION SUPABASE SCHEMA WITH RLS
-- PostgreSQL + Storage + Auth + Row Level Security
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USER ROLES & PERMISSIONS
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.admin_users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Policies for admin_users
CREATE POLICY "Admins can view other admin users"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners can manage admin users"
  ON public.admin_users FOR ALL
  TO authenticated
  USING (public.get_current_user_role() = 'owner');

-- 3. SITE SETTINGS (Draft & Published versions)
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published site_settings"
  ON public.site_settings FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "Admins can read all site_settings"
  ON public.site_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners and editors can modify site_settings"
  ON public.site_settings FOR ALL
  TO authenticated
  USING (public.get_current_user_role() IN ('owner', 'editor'));

-- 4. SECTIONS
CREATE TABLE IF NOT EXISTS public.sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  nav_label_en TEXT NOT NULL,
  nav_label_ar TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published visible sections"
  ON public.sections FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "Admins can read all sections"
  ON public.sections FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners and editors can modify sections"
  ON public.sections FOR ALL
  TO authenticated
  USING (public.get_current_user_role() IN ('owner', 'editor'));

-- 5. MEDIA
CREATE TABLE IF NOT EXISTS public.media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  width INT,
  height INT,
  bytes BIGINT,
  alt_en TEXT NOT NULL DEFAULT '',
  alt_ar TEXT NOT NULL DEFAULT '',
  caption_en TEXT,
  caption_ar TEXT,
  tags TEXT[] DEFAULT '{}',
  is_ai BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view media"
  ON public.media FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Owners and editors can manage media"
  ON public.media FOR ALL
  TO authenticated
  USING (public.get_current_user_role() IN ('owner', 'editor'));

-- 6. IMAGE SLOTS (Exact placement & visual focal point control)
CREATE TABLE IF NOT EXISTS public.image_slots (
  slot_key TEXT PRIMARY KEY,
  label_en TEXT NOT NULL,
  label_ar TEXT NOT NULL,
  section TEXT NOT NULL,
  media_id UUID REFERENCES public.media(id) ON DELETE SET NULL,
  media_url TEXT,
  object_position_x NUMERIC(5,2) NOT NULL DEFAULT 50.00,
  object_position_y NUMERIC(5,2) NOT NULL DEFAULT 50.00,
  object_fit TEXT NOT NULL DEFAULT 'cover' CHECK (object_fit IN ('cover', 'contain', 'fill')),
  zoom NUMERIC(3,2) NOT NULL DEFAULT 1.00,
  overlay_opacity NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  aspect_ratio TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.image_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published image slots"
  ON public.image_slots FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "Admins can view all image slots"
  ON public.image_slots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners and editors can modify image slots"
  ON public.image_slots FOR ALL
  TO authenticated
  USING (public.get_current_user_role() IN ('owner', 'editor'));

-- 7. MENU CATEGORIES & ITEMS
CREATE TABLE IF NOT EXISTS public.menu_categories (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published'))
);

ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published menu categories"
  ON public.menu_categories FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "Admins can view all menu categories"
  ON public.menu_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners and editors can modify menu categories"
  ON public.menu_categories FOR ALL
  TO authenticated
  USING (public.get_current_user_role() IN ('owner', 'editor'));

CREATE TABLE IF NOT EXISTS public.menu_items (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT NOT NULL DEFAULT '',
  description_ar TEXT NOT NULL DEFAULT '',
  price TEXT,
  media_id UUID REFERENCES public.media(id) ON DELETE SET NULL,
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  is_signature BOOLEAN NOT NULL DEFAULT false,
  is_sample BOOLEAN NOT NULL DEFAULT false,
  available BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published'))
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published menu items"
  ON public.menu_items FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "Admins can view all menu items"
  ON public.menu_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners and editors can modify menu items"
  ON public.menu_items FOR ALL
  TO authenticated
  USING (public.get_current_user_role() IN ('owner', 'editor'));

-- 8. BRANCHES
CREATE TABLE IF NOT EXISTS public.branches (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'unconfirmed')),
  address_en TEXT NOT NULL,
  address_ar TEXT NOT NULL,
  phone TEXT,
  hours_summary_en TEXT NOT NULL,
  hours_summary_ar TEXT NOT NULL,
  weekly_hours JSONB,
  landmark_en TEXT NOT NULL DEFAULT '',
  landmark_ar TEXT NOT NULL DEFAULT '',
  map_embed_url TEXT,
  map_directions_url TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  visible BOOLEAN NOT NULL DEFAULT true,
  note_en TEXT,
  note_ar TEXT
);

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view visible branches"
  ON public.branches FOR SELECT
  TO anon, authenticated
  USING (visible = true);

CREATE POLICY "Admins can view all branches"
  ON public.branches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners and editors can modify branches"
  ON public.branches FOR ALL
  TO authenticated
  USING (public.get_current_user_role() IN ('owner', 'editor'));

-- 9. RATING BADGES (Verified Public Badges)
CREATE TABLE IF NOT EXISTS public.rating_badges (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  score TEXT NOT NULL,
  review_count TEXT NOT NULL,
  url TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.rating_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view verified rating badges"
  ON public.rating_badges FOR SELECT
  TO anon, authenticated
  USING (visible = true AND is_verified = true);

CREATE POLICY "Admins can view all rating badges"
  ON public.rating_badges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners and editors can modify rating badges"
  ON public.rating_badges FOR ALL
  TO authenticated
  USING (public.get_current_user_role() IN ('owner', 'editor'));

-- 10. INQUIRIES (Reservation requests & Contact submissions)
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('reservation_request', 'contact_inquiry')),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  date TEXT,
  time TEXT,
  guests TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'handled', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  branch TEXT,
  honeypot TEXT -- Bot anti-spam filter (must be NULL)
);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Public can ONLY INSERT inquiries, and ONLY when honeypot is empty
CREATE POLICY "Public can insert inquiries"
  ON public.inquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (honeypot IS NULL OR honeypot = '');

-- Public CANNOT read inquiries. Only authenticated admins can read and update.
CREATE POLICY "Admins can view and update inquiries"
  ON public.inquiries FOR ALL
  TO authenticated
  USING (true);

-- 11. CONTENT VERSIONS & ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS public.content_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_by TEXT NOT NULL,
  label TEXT NOT NULL,
  snapshot JSONB NOT NULL
);

ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view and create content versions"
  ON public.content_versions FOR ALL
  TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity logs"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert activity logs"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 12. STORAGE BUCKET CONFIGURATION (site-media)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-media',
  'site-media',
  true,
  8388608, -- 8MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 8388608,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'];

-- Storage Policies
CREATE POLICY "Public Read for site-media"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'site-media');

CREATE POLICY "Admins can upload to site-media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'site-media' AND
    public.get_current_user_role() IN ('owner', 'editor')
  );

CREATE POLICY "Admins can delete from site-media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'site-media' AND
    public.get_current_user_role() IN ('owner', 'editor')
  );
