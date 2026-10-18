-- ============================================================================
-- OLDISH RESTAURANT & CAFÉ — SEED DATA (VERIFIED SOURCE OF TRUTH)
-- ============================================================================

-- Site Settings
INSERT INTO public.site_settings (key, value, status) VALUES
(
  'general',
  '{
    "brand_name_en": "Oldish",
    "brand_name_ar": "أولديش",
    "tagline_en": "Flavors you''ll never forget",
    "tagline_ar": "نكهات مش هتنساها",
    "subline_en": "Restaurant · Café · Garden - Downtown Cairo",
    "subline_ar": "مطعم · كافيه · حديقة - وسط البلد",
    "category_en": "Restaurant | Café | Garden",
    "category_ar": "مطعم | مقهى | حديقة",
    "facebook_followers": "~165K",
    "price_range": "EGP 200-400 per person",
    "phone": "+20 10 60119488",
    "whatsapp": "+20 10 60119488",
    "facebook_url": "https://www.facebook.com/oldisheg/",
    "instagram_url": "https://www.instagram.com/oldisheg/",
    "google_maps_url": "https://maps.google.com/?q=Oldish+Restaurant+Mohammed+Mahmoud+Cairo",
    "elmenus_url": "https://www.elmenus.com/cairo/restaurants/oldish-downtown",
    "show_prices": false,
    "demo_banner_enabled": true,
    "demo_banner_text_en": "Demo preview for the owner — content and images are illustrative",
    "demo_banner_text_ar": "نسخة تجريبية للعرض على صاحب المكان — المحتوى والصور توضيحية",
    "noindex": true,
    "site_domain": "localhost:5174",
    "primary_color": "#886E42",
    "charcoal_color": "#222222",
    "bg_color": "#FAF8F5",
    "font_family_en": "Poppins, sans-serif",
    "font_family_ar": "Cairo, sans-serif"
  }'::jsonb,
  'published'
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Menu Categories
INSERT INTO public.menu_categories (id, name_en, name_ar, sort_order, visible, status) VALUES
('breakfast', 'Breakfast & Eggs', 'الفطور وأطباق البيض', 0, true, 'published'),
('tagines', 'Egyptian Tagines & Mains', 'الطواجن المصرية والأطباق الرئيسية', 1, true, 'published'),
('grills', 'Grills & Oldish Chicken', 'المشاوي ودجاج أولديش', 2, true, 'published'),
('starters', 'Hot Starters', 'المقبلات الساخنة', 3, true, 'published'),
('soups-salads', 'Soups & Salads', 'الشوربات والسلطات', 4, true, 'published'),
('sandwiches', 'Sandwiches', 'السندوتشات', 5, true, 'published'),
('pizza-pasta', 'Pizza & Pasta', 'البيتزا والباستا', 6, true, 'published'),
('drinks', 'Drinks & Café', 'المشروبات والمقهى', 7, true, 'published'),
('desserts', 'Desserts', 'الحلويات', 8, true, 'published')
ON CONFLICT (id) DO NOTHING;

-- Rating Badges
INSERT INTO public.rating_badges (id, source, score, review_count, url, is_verified, sort_order, visible) VALUES
('rating-google', 'Google Maps', '4.3', 'About 7,000+ reviews', 'https://maps.google.com/?q=Oldish+Restaurant+Mohammed+Mahmoud+Cairo', true, 0, true),
('rating-tripadvisor', 'TripAdvisor', '4.0', '120 reviews', 'https://www.tripadvisor.com/Restaurant_Review-g294201-d8787754-Reviews-Oldish-Cairo_Cairo_Governorate.html', true, 1, true),
('rating-wanderlog', 'Wanderlog', '#4', 'Best Breakfast and Brunch in Cairo', 'https://wanderlog.com/view/cairo-best-breakfast-and-brunch', true, 2, true)
ON CONFLICT (id) DO NOTHING;

-- Branches
INSERT INTO public.branches (id, name_en, name_ar, status, address_en, address_ar, phone, hours_summary_en, hours_summary_ar, landmark_en, landmark_ar, map_embed_url, map_directions_url, is_primary, visible, note_en, note_ar) VALUES
(
  'downtown-main',
  'Main Branch — Downtown Cairo',
  'الفرع الرئيسي — وسط البلد، القاهرة',
  'confirmed',
  '20 Mohamed Mahmoud St, behind the Greek Campus (opposite the AUC library), Abdeen, Downtown Cairo',
  '20 شارع محمد محمود، خلف الجريك كامبس (أمام مكتبة الجامعة الأمريكية)، عابدين، وسط البلد، القاهرة',
  '+20 10 60119488',
  'Every day 8:00 AM – 12:00 AM (Midnight)',
  'يومياً من 8:00 صباحاً حتى 12:00 منتصف الليل',
  'Behind The Greek Campus, opposite AUC Downtown library. 5 minutes walk from Sadat Metro.',
  'خلف الجريك كامبس وأمام مكتبة الجامعة الأمريكية. 5 دقائق سيراً من محطة مترو السادات.',
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3453.6491754026367!2d31.238961775685827!3d30.046914574922655!2m3!1f0!2f0!3f0!3m2!1i1024!2f768!4f13.1!3m3!1m2!1s0x145840c11baefd71%3A0xe7a5d3f2c5e5b382!2sOldish!5e0!3m2!1sen!2seg!4v1710000000000!5m2!1sen!2seg',
  'https://maps.google.com/?q=Oldish+Restaurant+Mohammed+Mahmoud+Cairo',
  true,
  true,
  'Verified primary location featuring authentic brick courtyard and vintage house interior.',
  'الفرع الرئيسي المؤكد ويتميز بفناء الطوب الأحمر والصالون التراثي.'
),
(
  'zamalek-secondary',
  'Zamalek Branch',
  'فرع الزمالك',
  'unconfirmed',
  'Reported around 14 El Sheikh El Marsafy St, Zamalek, Cairo',
  'موقع مذكور بالأدلة: نحو 14 شارع الشيخ المرصفي، الزمالك، القاهرة',
  NULL,
  'Details to be confirmed with the owner',
  'التفاصيل رهن التأكيد مع صاحب المكان',
  'Reported location in Zamalek — pending client confirmation',
  'موقع مقيد بالأدلة في الزمالك — قيد تأكيد الإدارة',
  NULL,
  'https://maps.google.com/?q=El+Sheikh+El+Marsafy+Zamalek+Cairo',
  false,
  true,
  'Zamalek branch — details to be confirmed with the owner. No official phone or hours listed until confirmed.',
  'فرع الزمالك — التفاصيل رهن التأكيد مع صاحب المكان. لا توجد مواعيد أو هواتف معتمدة حتى يتم التأكيد.'
)
ON CONFLICT (id) DO NOTHING;
