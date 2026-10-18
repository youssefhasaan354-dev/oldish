import type { 
  SiteSettings, 
  SectionConfig, 
  MenuCategory, 
  MenuItem, 
  BranchInfo, 
  RatingBadge, 
  ImageSlot,
  MediaItem 
} from '../types';

export const SEED_SITE_SETTINGS: SiteSettings = {
  brand_name_en: 'Oldish',
  brand_name_ar: 'أولديش',
  tagline_en: "Flavors you'll never forget",
  tagline_ar: 'نكهات مش هتنساها',
  subline_en: 'Restaurant · Café · Garden - Downtown Cairo',
  subline_ar: 'مطعم · كافيه · حديقة - وسط البلد',
  category_en: 'Restaurant | Café | Garden',
  category_ar: 'مطعم | مقهى | حديقة',
  facebook_followers: '~165K',
  price_range: 'EGP 200-400 per person',
  phone: '+20 10 60119488',
  whatsapp: '+20 10 60119488',
  facebook_url: 'https://www.facebook.com/oldisheg/',
  instagram_url: 'https://www.instagram.com/oldisheg/',
  google_maps_url: 'https://maps.google.com/?q=Oldish+Restaurant+Mohammed+Mahmoud+Cairo',
  elmenus_url: 'https://www.elmenus.com/cairo/restaurants/oldish-downtown',
  show_prices: false, // Default false until owner confirms official price list
  demo_banner_enabled: true,
  demo_banner_text_en: 'Demo preview for the owner — content and images are illustrative',
  demo_banner_text_ar: 'نسخة تجريبية للعرض على صاحب المكان — المحتوى والصور توضيحية',
  noindex: true,
  site_domain: 'localhost:5174',
  primary_color: '#886E42',
  charcoal_color: '#222222',
  bg_color: '#FAF8F5',
  font_family_en: 'Poppins, sans-serif',
  font_family_ar: 'Cairo, sans-serif'
};

export const SEED_MEDIA: MediaItem[] = [
  {
    id: 'media-courtyard-hero',
    storage_path: 'images/oldish_courtyard_hero.jpg',
    public_url: '/images/oldish_courtyard_hero.jpg',
    width: 1920,
    height: 1080,
    alt_en: 'Illustrative courtyard of a vintage Cairo cafe with brick walls and plants',
    alt_ar: 'صورة توضيحية لفناء مقهى قاهري عتيق بجدران طوب ونباتات',
    caption_en: 'Illustrative representation of Oldish Downtown courtyard ambiance',
    caption_ar: 'صورة توضيحية تعبر عن روح الفناء الخارجي لأولديش بوسط البلد',
    tags: ['courtyard', 'hero', 'exterior'],
    is_ai: true,
    created_at: '2026-10-17T12:00:00Z'
  },
  {
    id: 'media-courtyard-evening',
    storage_path: 'images/oldish_courtyard_evening.jpg',
    public_url: '/images/oldish_courtyard_evening.jpg',
    width: 1920,
    height: 1080,
    alt_en: 'Illustrative evening view of an outdoor dining courtyard with string lights',
    alt_ar: 'صورة توضيحية مسائية لفناء خارجي مع أضواء زينة متدلية',
    caption_en: 'Illustrative dusk mood in the brick courtyard',
    caption_ar: 'صورة توضيحية لسحر المساء بين جدران الطوب الأحمر',
    tags: ['courtyard', 'evening', 'atmosphere'],
    is_ai: true,
    created_at: '2026-10-17T12:00:00Z'
  },
  {
    id: 'media-vintage-interior',
    storage_path: 'images/oldish_vintage_interior.jpg',
    public_url: '/images/oldish_vintage_interior.jpg',
    width: 1920,
    height: 1080,
    alt_en: 'Illustrative vintage Cairo cafe interior with framed pictures and brass lamps',
    alt_ar: 'صورة توضيحية لصالون قاهري عتيق مع إطارات صور ومصابيح نحاسية',
    caption_en: 'Illustrative vintage indoor salon atmosphere',
    caption_ar: 'صورة توضيحية للأجواء الكلاسيكية بالصالون الداخلي',
    tags: ['interior', 'salon', 'vintage'],
    is_ai: true,
    created_at: '2026-10-17T12:00:00Z'
  },
  {
    id: 'media-breakfast',
    storage_path: 'images/egyptian_breakfast_spread.jpg',
    public_url: '/images/egyptian_breakfast_spread.jpg',
    width: 1440,
    height: 1080,
    alt_en: 'Illustrative traditional Egyptian breakfast spread with ful, taameya and bread',
    alt_ar: 'صورة توضيحية لمائدة إفطار مصري تقليدي تضم فول وطعمية وخبز بلدي',
    caption_en: 'Illustrative morning breakfast spread',
    caption_ar: 'صورة توضيحية لمائدة الإفطار الصباحي',
    tags: ['food', 'breakfast'],
    is_ai: true,
    created_at: '2026-10-17T12:00:00Z'
  },
  {
    id: 'media-tagine',
    storage_path: 'images/oldish_egyptian_tagine.jpg',
    public_url: '/images/oldish_egyptian_tagine.jpg',
    width: 1440,
    height: 1080,
    alt_en: 'Illustrative Egyptian clay pot tagine steaming on a table',
    alt_ar: 'صورة توضيحية لطاجن فخار مصري ساخن على مائدة خشبية',
    caption_en: 'Illustrative Egyptian clay tagine presentation',
    caption_ar: 'صورة توضيحية لتقديم الطواجن الفخارية المصرية',
    tags: ['food', 'tagine'],
    is_ai: true,
    created_at: '2026-10-17T12:00:00Z'
  },
  {
    id: 'media-coffee-tea',
    storage_path: 'images/oldish_coffee_tea.jpg',
    public_url: '/images/oldish_coffee_tea.jpg',
    width: 1440,
    height: 1080,
    alt_en: 'Illustrative Turkish coffee pot pouring into cup with mint tea glass',
    alt_ar: 'صورة توضيحية لركوة قهوة تركية تسكب في فنجان مع كوب شاي بالنعناع',
    caption_en: 'Illustrative Turkish coffee and courtyard mint tea',
    caption_ar: 'صورة توضيحية للقهوة والشاي بالنعناع',
    tags: ['drinks', 'coffee', 'tea'],
    is_ai: true,
    created_at: '2026-10-17T12:00:00Z'
  },
  {
    id: 'media-juices',
    storage_path: 'images/oldish_fresh_juices.jpg',
    public_url: '/images/oldish_fresh_juices.jpg',
    width: 1440,
    height: 1080,
    alt_en: 'Illustrative fresh mango juice and chilled lemon-mint drink',
    alt_ar: 'صورة توضيحية لعصير مانجو طازج ومشروب ليمون بالنعناع مثلج',
    caption_en: 'Illustrative fresh fruit refreshers',
    caption_ar: 'صورة توضيحية للمشروبات الباردة والمنعشة',
    tags: ['drinks', 'juices'],
    is_ai: true,
    created_at: '2026-10-17T12:00:00Z'
  }
];

export const SEED_IMAGE_SLOTS: ImageSlot[] = [
  {
    slot_key: 'hero.slide.0',
    label_en: 'Hero Slide 1 (Courtyard Daytime)',
    label_ar: 'شريحة الواجهة 1 (الفناء نهاراً)',
    section: 'hero',
    media_id: 'media-courtyard-hero',
    media_url: '/images/oldish_courtyard_hero.jpg',
    object_position_x: 50,
    object_position_y: 50,
    object_fit: 'cover',
    zoom: 1,
    overlay_opacity: 0.65,
    sort_order: 0,
    visible: true
  },
  {
    slot_key: 'hero.slide.1',
    label_en: 'Hero Slide 2 (Courtyard Evening)',
    label_ar: 'شريحة الواجهة 2 (الفناء مساءً)',
    section: 'hero',
    media_id: 'media-courtyard-evening',
    media_url: '/images/oldish_courtyard_evening.jpg',
    object_position_x: 50,
    object_position_y: 50,
    object_fit: 'cover',
    zoom: 1,
    overlay_opacity: 0.65,
    sort_order: 1,
    visible: true
  },
  {
    slot_key: 'hero.slide.2',
    label_en: 'Hero Slide 3 (Morning Breakfast)',
    label_ar: 'شريحة الواجهة 3 (إفطار الصباح)',
    section: 'hero',
    media_id: 'media-breakfast',
    media_url: '/images/egyptian_breakfast_spread.jpg',
    object_position_x: 50,
    object_position_y: 50,
    object_fit: 'cover',
    zoom: 1,
    overlay_opacity: 0.65,
    sort_order: 2,
    visible: true
  },
  {
    slot_key: 'story.block.0',
    label_en: 'Story Block 1 (Passage & House)',
    label_ar: 'فقرة القصة 1 (المدخل والبيت العتيق)',
    section: 'story',
    media_id: 'media-vintage-interior',
    media_url: '/images/oldish_vintage_interior.jpg',
    object_position_x: 50,
    object_position_y: 50,
    object_fit: 'cover',
    zoom: 1,
    overlay_opacity: 0,
    sort_order: 0,
    visible: true
  },
  {
    slot_key: 'story.block.1',
    label_en: 'Story Block 2 (Courtyard Sanctuary)',
    label_ar: 'فقرة القصة 2 (واحة الفناء)',
    section: 'story',
    media_id: 'media-courtyard-hero',
    media_url: '/images/oldish_courtyard_hero.jpg',
    object_position_x: 50,
    object_position_y: 50,
    object_fit: 'cover',
    zoom: 1,
    overlay_opacity: 0,
    sort_order: 1,
    visible: true
  },
  {
    slot_key: 'story.block.2',
    label_en: 'Story Block 3 (Clay Tagines & Fare)',
    label_ar: 'فقرة القصة 3 (طواجن الفخار والمأكولات)',
    section: 'story',
    media_id: 'media-tagine',
    media_url: '/images/oldish_egyptian_tagine.jpg',
    object_position_x: 50,
    object_position_y: 50,
    object_fit: 'cover',
    zoom: 1,
    overlay_opacity: 0,
    sort_order: 2,
    visible: true
  },
  {
    slot_key: 'atmosphere.quote_banner',
    label_en: 'Atmosphere Quote Banner',
    label_ar: 'خلفية الاقتباس في الأجواء',
    section: 'atmosphere',
    media_id: 'media-courtyard-evening',
    media_url: '/images/oldish_courtyard_evening.jpg',
    object_position_x: 50,
    object_position_y: 50,
    object_fit: 'cover',
    zoom: 1,
    overlay_opacity: 0.75,
    sort_order: 0,
    visible: true
  }
];

export const SEED_MENU_CATEGORIES: MenuCategory[] = [
  { id: 'breakfast', name_en: 'Breakfast & Eggs', name_ar: 'الفطور وأطباق البيض', sort_order: 0, visible: true },
  { id: 'tagines', name_en: 'Egyptian Tagines & Mains', name_ar: 'الطواجن المصرية والأطباق الرئيسية', sort_order: 1, visible: true },
  { id: 'grills', name_en: 'Grills & Oldish Chicken', name_ar: 'المشاوي ودجاج أولديش', sort_order: 2, visible: true },
  { id: 'starters', name_en: 'Hot Starters', name_ar: 'المقبلات الساخنة', sort_order: 3, visible: true },
  { id: 'soups-salads', name_en: 'Soups & Salads', name_ar: 'الشوربات والسلطات', sort_order: 4, visible: true },
  { id: 'sandwiches', name_en: 'Sandwiches', name_ar: 'السندوتشات', sort_order: 5, visible: true },
  { id: 'pizza-pasta', name_en: 'Pizza & Pasta', name_ar: 'البيتزا والباستا', sort_order: 6, visible: true },
  { id: 'drinks', name_en: 'Drinks & Café', name_ar: 'المشروبات والمقهى', sort_order: 7, visible: true },
  { id: 'desserts', name_en: 'Desserts', name_ar: 'الحلويات', sort_order: 8, visible: true },
];

export const SEED_MENU_ITEMS: MenuItem[] = [
  // Breakfast (SOURCE OF TRUTH)
  {
    id: 'item-ful',
    category_id: 'breakfast',
    name_en: 'Oldish Ful',
    name_ar: 'فول أولديش',
    description_en: "Signature slow-simmered ful medames prepared with Oldish's special seasoning, served warm with Oldish's own fresh bread.",
    description_ar: "فول مدمس مطهو على مهل بخلطة أولديش الخاصة، يقدم ساخناً مع عيش أولديش المميز.",
    price: null,
    is_signature: true,
    is_sample: false,
    available: true,
    sort_order: 0,
    visible: true
  },
  {
    id: 'item-eggs-style',
    category_id: 'breakfast',
    name_en: 'Eggs Any Style',
    name_ar: 'بيض حسب اختيارك',
    description_en: "Fresh farm eggs prepared to your preference: omelette, fried, boiled, or scrambled, served with Oldish's own bread.",
    description_ar: "بيض طازج يُعد حسب رغبتك: أومليت، عيون، مسلوق، أو مخفوق، يقدم مع عيش أولديش المميز.",
    price: null,
    is_signature: true,
    is_sample: false,
    available: true,
    sort_order: 1,
    visible: true
  },
  {
    id: 'item-white-cheese',
    category_id: 'breakfast',
    name_en: 'White Cheese with Tomato & Mint',
    name_ar: 'جبنة بيضاء بالطماطم والنعناع وزيت الزيتون',
    description_en: "Egyptian white cheese blended with diced ripe tomatoes, fresh mint leaves, and pure extra virgin olive oil, served with Oldish bread.",
    description_ar: "جبنة بيضاء بلدية ممزوجة بقطع الطماطم الطازجة، أوراق النعناع، وزيت الزيتون البكر، تقدم مع عيش أولديش.",
    price: null,
    is_signature: true,
    is_sample: false,
    available: true,
    sort_order: 2,
    visible: true
  },
  {
    id: 'item-cheese-plate',
    category_id: 'breakfast',
    name_en: 'Oldish Cheese Plate',
    name_ar: 'طبق أجبان مشكل',
    description_en: "Assorted selection of Feta, Roumy, Cheddar, and Roquefort cheeses, served with fresh bread and olives.",
    description_ar: "تشكيلة منتقاة من أجبان الفيتا، الرومي المصري، الشيدر، والريكفورد، تقدم مع الخبز والزيتون.",
    price: null,
    is_signature: true,
    is_sample: false,
    available: true,
    sort_order: 3,
    visible: true
  },

  // Tagines & Mains (SOURCE OF TRUTH)
  {
    id: 'item-okra-tagine',
    category_id: 'tagines',
    name_en: 'Okra with Meat Tagine',
    name_ar: 'طاجن بامية باللحمة',
    description_en: "Traditional Egyptian clay pot tagine of tender okra simmered in a spiced tomato-garlic sauce with succulent braised meat chunks, served bubbling with Oldish bread.",
    description_ar: "طاجن فخار مصري أصيل من البامية الطازجة المطهوة بصلصة الطماطم الغنية بالثوم مع قطع اللحم الطرية، يقدم ساخناً مع عيش أولديش.",
    price: null,
    media_id: 'media-tagine',
    image_url: '/images/oldish_egyptian_tagine.jpg',
    is_signature: true,
    is_sample: false,
    available: true,
    sort_order: 0,
    visible: true
  },
  {
    id: 'item-moussaka-tagine',
    category_id: 'tagines',
    name_en: 'Moussaka with Minced-Meat Tagine',
    name_ar: 'طاجن مسقعة باللحمة المفرومة',
    description_en: "Oven-baked Egyptian clay tagine of roasted eggplant layers, peppers, and savory spiced minced meat in a rich tomato reduction, served with Oldish's own bread.",
    description_ar: "طاجن مسقعة في الفخار مع طبقات الباذنجان الرومي والفلفل واللحمة المفرومة المتبلة بصلصة الطماطم المسبكة، يقدم مع عيش أولديش.",
    price: null,
    is_signature: true,
    is_sample: false,
    available: true,
    sort_order: 1,
    visible: true
  },
  {
    id: 'item-kebab-halla',
    category_id: 'tagines',
    name_en: 'Kebab Halla Tagine',
    name_ar: 'طاجن كباب حلة',
    description_en: "Slow-braised beef cubes with caramelized onions, cracked pepper, and rich pan gravy, served steaming in a traditional clay vessel.",
    description_ar: "مكعبات لحم بقري مطهوة ببطء مع البصل المكرمل والفلفل الأسود والبهارات في صوص غني ساخن.",
    price: null,
    is_signature: true,
    is_sample: false,
    available: true,
    sort_order: 2,
    visible: true
  },
  {
    id: 'item-freekeh-chicken',
    category_id: 'tagines',
    name_en: 'Oldish Freekeh with Chicken Tagine',
    name_ar: 'طاجن فريك أولديش بالدجاج',
    description_en: "Aromatic green cracked freekeh wheat baked in an earthenware tagine with seasoned chicken pieces and savory stock.",
    description_ar: "فريك بلدي أخضر معطر مطهو في طاجن فخاري مع قطع الدجاج المتبلة والمرق الشهي.",
    price: null,
    is_signature: true,
    is_sample: false,
    available: true,
    sort_order: 3,
    visible: true
  },

  // Grills & Oldish Chicken (SOURCE OF TRUTH)
  {
    id: 'item-oldish-chicken',
    category_id: 'grills',
    name_en: 'Oldish Chicken Plate',
    name_ar: 'طبق دجاج أولديش المشوي',
    description_en: "Marinated grilled chicken breasts charred to perfection, served with your choice of sauce: Creamy Mushroom, Tangy Lemon, or Mustard sauce.",
    description_ar: "صدور دجاج متبلة ومشوية بعناية، تقدم مع اختيارك من الصوص: صوص المشروم بالكريمة، صوص الليمون، أو صوص المستردة.",
    price: null,
    is_signature: true,
    is_sample: false,
    available: true,
    sort_order: 0,
    visible: true
  },
  {
    id: 'item-grill-sample',
    category_id: 'grills',
    name_en: 'Mixed Grill Selection (Sample item)',
    name_ar: 'مشويات مشكلة (صنف تجريبي)',
    description_en: "Sample menu item representing grilled meat specialties. Final descriptions and selections subject to venue owner verification.",
    description_ar: "صنف تجريبي يمثل أطباق المشويات المتنوعة. التفاصيل رهن تأكيد إدارة المطعم.",
    price: null,
    is_signature: false,
    is_sample: true,
    available: true,
    sort_order: 1,
    visible: true
  },

  // Hot Starters (Sample items from category)
  {
    id: 'item-starter-sample-1',
    category_id: 'starters',
    name_en: 'Hot Appetizers Platter (Sample item)',
    name_ar: 'مقبلات ساخنة مشكلة (صنف تجريبي)',
    description_en: "Sample menu entry for hot starters including sambousek, rolls, and bites. Details to be confirmed with the owner.",
    description_ar: "عنصر تجريبي للمقبلات الساخنة كالمعجنات واللفائف. قيد اعتماد قائمة المالك.",
    price: null,
    is_sample: true,
    available: true,
    sort_order: 0,
    visible: true
  },

  // Soups & Salads (Sample items from category)
  {
    id: 'item-soup-sample',
    category_id: 'soups-salads',
    name_en: 'Daily Soup of the House (Sample item)',
    name_ar: 'شوربة اليوم الخاصة (صنف تجريبي)',
    description_en: "Freshly prepared house soup. Official varieties (lentil, orzo, mushroom) to be confirmed from venue menu.",
    description_ar: "شوربة طازجة يومية من قائمة المطعم. الأصناف المعتمدة رهن مراجعة القائمة الرسمية.",
    price: null,
    is_sample: true,
    available: true,
    sort_order: 0,
    visible: true
  },
  {
    id: 'item-salad-sample',
    category_id: 'soups-salads',
    name_en: 'Fresh Garden Salad (Sample item)',
    name_ar: 'سلطة خضراء طازجة (صنف تجريبي)',
    description_en: "Seasonal garden greens with olive oil dressing. Final recipe subject to owner confirmation.",
    description_ar: "خضروات موسمية طازجة متبلة بزيت الزيتون. تخضع لمطابقة القائمة المطبوعة.",
    price: null,
    is_sample: true,
    available: true,
    sort_order: 1,
    visible: true
  },

  // Sandwiches (SOURCE OF TRUTH includes club sandwich)
  {
    id: 'item-club-sandwich',
    category_id: 'sandwiches',
    name_en: 'Oldish Club Sandwich',
    name_ar: 'كلوب ساندوتش أولديش',
    description_en: "Classic layered toasted club sandwich with chicken, beef bacon, eggs, cheese, lettuce, and tomatoes, served with crisp fries.",
    description_ar: "كلوب ساندوتش كلاسيكي محمص مع الدجاج والجبن والبيض والخس والطماطم، يقدم مع البطاطس المقلية.",
    price: null,
    is_signature: true,
    is_sample: false,
    available: true,
    sort_order: 0,
    visible: true
  },

  // Pizza & Pasta (Generic items as specified)
  {
    id: 'item-pizza-sample',
    category_id: 'pizza-pasta',
    name_en: 'Crust Oven Pizza (Sample item)',
    name_ar: 'بيتزا مقرمشة في الفرن (صنف تجريبي)',
    description_en: "Crisp crust pizza with tomato sauce and mozzarella. Specific pizza variations to be supplied by the owner.",
    description_ar: "بيتزا مقرمشة مع صلصة الطماطم وجبنة الموزاريلا. الأصناف المحددة رهن اعتماد المالك.",
    price: null,
    is_sample: true,
    available: true,
    sort_order: 0,
    visible: true
  },
  {
    id: 'item-pasta-sample',
    category_id: 'pizza-pasta',
    name_en: 'House Pasta Selection (Sample item)',
    name_ar: 'مكرونة بصلصات مختارة (صنف تجريبي)',
    description_en: "Pasta with choice of Italian and house sauces. Specific pasta recipes to be supplied by venue management.",
    description_ar: "أطباق مكرونة متنوعة. الوصف النهائي يخضع للقائمة الرسمية للمكان.",
    price: null,
    is_sample: true,
    available: true,
    sort_order: 1,
    visible: true
  },

  // Drinks (SOURCE OF TRUTH)
  {
    id: 'item-drink-coffee',
    category_id: 'drinks',
    name_en: 'Traditional Sand-Brewed Turkish Coffee',
    name_ar: 'قهوة تركي على الرمل',
    description_en: "Slow-brewed over glowing sand coals with rich foam and cardamom aroma.",
    description_ar: "قهوة مطهوة على مهل فوق رمال ساخنة للحصول على وش متماسك ورائحة تفوح بالأصالة.",
    price: null,
    media_id: 'media-coffee-tea',
    image_url: '/images/oldish_coffee_tea.jpg',
    is_signature: true,
    is_sample: false,
    available: true,
    sort_order: 0,
    visible: true
  },
  {
    id: 'item-drink-tea',
    category_id: 'drinks',
    name_en: 'Egyptian Mint Tea Glass',
    name_ar: 'شاي مصري بالنعناع الأخضر',
    description_en: "Fresh black tea brewed in clear glass with fragrant spearmint sprigs.",
    description_ar: "شاي أسود كلاسيكي في كوب زجاجي شفاف مع أغصان النعناع الطازج.",
    price: null,
    is_signature: true,
    is_sample: false,
    available: true,
    sort_order: 1,
    visible: true
  },
  {
    id: 'item-drink-juices',
    category_id: 'drinks',
    name_en: 'Fresh Seasonal Juices & Coolers',
    name_ar: 'عصائر طبيعية ومثلجات موسمية',
    description_en: "Hand-pressed mango, strawberry, and chilled lemon-mint iced refreshers.",
    description_ar: "عصائر مانجو طازجة وليمون بالنعناع مثلج لانتعاش فوري.",
    price: null,
    media_id: 'media-juices',
    image_url: '/images/oldish_fresh_juices.jpg',
    is_signature: true,
    is_sample: false,
    available: true,
    sort_order: 2,
    visible: true
  },

  // Desserts
  {
    id: 'item-dessert-sample',
    category_id: 'desserts',
    name_en: 'Eastern & Western Sweets (Sample item)',
    name_ar: 'حلويات شرقية وغربية (صنف تجريبي)',
    description_en: "Selection of house desserts. Exact varieties (Om Ali, cakes) to be confirmed from venue menu.",
    description_ar: "تشكيلة من الحلويات المتوفرة بالمكان. الأصناف رهن التأكيد من القائمة الرسمية.",
    price: null,
    is_sample: true,
    available: true,
    sort_order: 0,
    visible: true
  }
];

export const SEED_BRANCHES: BranchInfo[] = [
  {
    id: 'downtown-main',
    name_en: 'Main Branch — Downtown Cairo',
    name_ar: 'الفرع الرئيسي — وسط البلد، القاهرة',
    status: 'confirmed',
    address_en: '20 Mohamed Mahmoud St, behind the Greek Campus (opposite the AUC library), Abdeen, Downtown Cairo',
    address_ar: '20 شارع محمد محمود، خلف الجريك كامبس (أمام مكتبة الجامعة الأمريكية)، عابدين، وسط البلد، القاهرة',
    phone: '+20 10 60119488',
    hours_summary_en: 'Every day 8:00 AM – 12:00 AM (Midnight)',
    hours_summary_ar: 'يومياً من 8:00 صباحاً حتى 12:00 منتصف الليل',
    weekly_hours: {
      monday: { open: '08:00', close: '00:00', closed: false },
      tuesday: { open: '08:00', close: '00:00', closed: false },
      wednesday: { open: '08:00', close: '00:00', closed: false },
      thursday: { open: '08:00', close: '00:00', closed: false },
      friday: { open: '08:00', close: '00:00', closed: false },
      saturday: { open: '08:00', close: '00:00', closed: false },
      sunday: { open: '08:00', close: '00:00', closed: false }
    },
    landmark_en: 'Behind The Greek Campus, opposite AUC Downtown library. 5 minutes walk from Sadat Metro (Tahrir Square).',
    landmark_ar: 'خلف الجريك كامبس وأمام مكتبة الجامعة الأمريكية. 5 دقائق سيراً من محطة مترو السادات (ميدان التحرير).',
    map_embed_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3453.6491754026367!2d31.238961775685827!3d30.046914574922655!2m3!1f0!2f0!3f0!3m2!1i1024!2f768!4f13.1!3m3!1m2!1s0x145840c11baefd71%3A0xe7a5d3f2c5e5b382!2sOldish!5e0!3m2!1sen!2seg!4v1710000000000!5m2!1sen!2seg',
    map_directions_url: 'https://maps.google.com/?q=Oldish+Restaurant+Mohammed+Mahmoud+Cairo',
    is_primary: true,
    visible: true,
    note_en: 'Verified primary location featuring authentic brick courtyard and vintage house interior.',
    note_ar: 'الفرع الرئيسي المؤكد ويتميز بفناء الطوب الأحمر والصالون التراثي.'
  },
  {
    id: 'zamalek-secondary',
    name_en: 'Zamalek Branch',
    name_ar: 'فرع الزمالك',
    status: 'unconfirmed',
    address_en: 'Reported around 14 El Sheikh El Marsafy St, Zamalek, Cairo',
    address_ar: 'موقع مذكور بالأدلة: نحو 14 شارع الشيخ المرصفي، الزمالك، القاهرة',
    hours_summary_en: 'Details to be confirmed with the owner',
    hours_summary_ar: 'التفاصيل رهن التأكيد مع صاحب المكان',
    landmark_en: 'Reported location in Zamalek — pending client confirmation',
    landmark_ar: 'موقع مقيد بالأدلة في الزمالك — قيد تأكيد الإدارة',
    map_directions_url: 'https://maps.google.com/?q=El+Sheikh+El+Marsafy+Zamalek+Cairo',
    is_primary: false,
    visible: true,
    note_en: 'Zamalek branch — details to be confirmed with the owner. No official phone or hours listed until confirmed.',
    note_ar: 'فرع الزمالك — التفاصيل رهن التأكيد مع صاحب المكان. لا توجد مواعيد أو هواتف معتمدة حتى يتم التأكيد.'
  }
];

export const SEED_RATING_BADGES: RatingBadge[] = [
  {
    id: 'rating-google',
    source: 'Google Maps',
    score: '4.3',
    review_count: 'About 7,000+ reviews',
    url: 'https://maps.google.com/?q=Oldish+Restaurant+Mohammed+Mahmoud+Cairo',
    is_verified: true,
    sort_order: 0,
    visible: true
  },
  {
    id: 'rating-tripadvisor',
    source: 'TripAdvisor',
    score: '4.0',
    review_count: '120 reviews',
    url: 'https://www.tripadvisor.com/Restaurant_Review-g294201-d8787754-Reviews-Oldish-Cairo_Cairo_Governorate.html',
    is_verified: true,
    sort_order: 1,
    visible: true
  }
];

export const SEED_SECTIONS: SectionConfig[] = [
  {
    key: 'hero',
    nav_label_en: 'Home',
    nav_label_ar: 'الرئيسية',
    sort_order: 0,
    visible: true,
    content: {
      tagline_en: "Flavors you'll never forget",
      tagline_ar: 'نكهات مش هتنساها',
      subline_en: 'Restaurant · Café · Garden - Downtown Cairo',
      subline_ar: 'مطعم · كافيه · حديقة - وسط البلد',
      badge_en: 'Mohamed Mahmoud St • Behind Greek Campus',
      badge_ar: 'شارع محمد محمود • خلف الجريك كامبس',
      description_en: 'Nostalgic mid-century old Downtown house style with a brick-lined courtyard and comforting Egyptian food.',
      description_ar: 'طراز بيت قاهري عتيق من منتصف القرن الماضي مع فناء هادئ محاط بالطوب الأحمر وأشهى الأطباق المصرية.'
    }
  },
  {
    key: 'story',
    nav_label_en: 'The Venue',
    nav_label_ar: 'عن المكان',
    sort_order: 1,
    visible: true,
    content: {
      title_en: 'An Old Downtown House Sanctuary',
      title_ar: 'ملاذ في بيت قاهري عتيق بقلب وسط البلد',
      lead_en: 'Behind a rustic wooden gate lies a hidden passage leading into a peaceful courtyard adorned with balconies, lush greenery, and the nostalgic warmth of historic Cairo.',
      lead_ar: 'وراء بوابة خشبية يمتد ممر صغير يقودك إلى فناء هادئ تحيط به الشرفات ونباتات الزينة ودفء القاهرة الكلاسيكية.',
      block1_title_en: 'The Entrance & Vintage Hall',
      block1_title_ar: 'المدخل والأروقة التراثية',
      block1_text_en: 'Entering Oldish feels like discovering a tucked-away treasure. The walls are creatively decorated with torn vintage newspaper and magazine scraps, a display featuring an antique radio, a classic jacket, and a tarboush, alongside windows reminiscent of old Downtown residences and a glass-enclosed drinks bar.',
      block1_text_ar: 'الدخول إلى أولديش يشبه العثور على كنز مختبئ؛ فالمدخل مزدان بقصاصات الصحف والمجلات القديمة، وفترينة زجاجية تعرض راديو قديماً وطربوشاً وبدلة كلاسيكية، إلى جانب نوافذ تحاكي بيوت وسط البلد العريقة وبار مشروبات خلف الزجاج.',
      block2_title_en: 'The Courtyard & Garden',
      block2_title_ar: 'الفناء والحديقة المفتوحة',
      block2_text_en: 'The central brick-lined courtyard is filled with flower pots, leafy trees, and comfortable outdoor tables. It is a favored sanctuary in Downtown Cairo for taking photos, having breakfast, working, studying, or meeting friends away from street bustle.',
      block2_text_ar: 'الفناء المحاط بجدران الطوب الأحمر يمتلئ بأواني الزهور والأشجار المورقة والطاولات المريحة، مما يجعله الوجهة المفضلة لالتقاط الصور، وتناول الفطور، والدراسة أو العمل، ولقاء الأصدقاء بعيداً عن صخب الشارع.',
      block3_title_en: 'Comforting Egyptian & Western Dishes',
      block3_title_ar: 'أطباق مصرية وعالمية مريحة',
      block3_text_en: "From slow-cooked Egyptian clay tagines—like okra with meat, moussaka with minced meat, and kebab halla—to our signature marinated Oldish chicken, club sandwiches, and traditional sand-brewed coffee, all served with Oldish's own fresh bread.",
      block3_text_ar: 'من طواجن الفخار المصرية الأصيلة كالبامية باللحمة والمسقعة باللحمة المفرومة وكباب الحلة، إلى دجاج أولديش المشوي المتبل، والكلوب ساندوتش، والقهوة المعدة على الرمل، وجميعها تقدم مع عيش أولديش المميز.'
    }
  },
  {
    key: 'atmosphere',
    nav_label_en: 'Atmosphere',
    nav_label_ar: 'الأجواء',
    sort_order: 2,
    visible: true,
    content: {
      card1_title_en: 'Brick-Lined Courtyard & Garden',
      card1_title_ar: 'فناء وحديقة بالطوب الأحمر',
      card1_desc_en: 'Outdoor garden seating with trees, balconies, and hanging flower pots.',
      card1_desc_ar: 'جلسات خارجية في الهواء الطلق بين الأشجار والشرفات وأواني الزهور.',
      card2_title_en: 'Nostalgic Vintage Interior',
      card2_title_ar: 'صالون بتراث منتصف القرن',
      card2_desc_en: 'Torn newspaper collage walls, vintage radio and tarboush display, and historic Cairo windows.',
      card2_desc_ar: 'جدران بقصاصات الجرائد القديمة، فترينة الراديو والطربوش العتيق، ونوافذ بيوت وسط البلد.',
      card3_title_en: 'Work, Study & Photo-Friendly',
      card3_title_ar: 'مناسب للدراسة والعمل والصور',
      card3_desc_en: 'Free Wi-Fi, comfortable tables, power access, and picturesque corners.',
      card3_desc_ar: 'واي فاي متاح، طاولات مريحة، وأركان مميزة للتصوير والاجتماعات الهادئة.',
      card4_title_en: 'Amenities & Convenience',
      card4_title_ar: 'خدمات وتسهيلات مريحة',
      card4_desc_en: 'Indoor and outdoor seating, credit cards accepted (Visa/Mastercard), takeaway, delivery, and street parking.',
      card4_desc_ar: 'جلسات داخلية وخارجية، قبول بطاقات الدفع فيزا وماستركارد، طلبات خارجية وتوصيل، ومواقف سيارات بالشارع.'
    }
  },
  {
    key: 'menu',
    nav_label_en: 'Menu',
    nav_label_ar: 'قائمة الطعام',
    sort_order: 3,
    visible: true,
    content: {
      note_en: "Prices shown on the venue's official menu. Expected range: EGP 200–400 per person.",
      note_ar: 'الأسعار موضحة في القائمة الرسمية داخل المكان. متوسط التكلفة التقديرية: 200–400 ج.م للفرد.'
    }
  },
  {
    key: 'gallery',
    nav_label_en: 'Gallery',
    nav_label_ar: 'الصور',
    sort_order: 4,
    visible: true,
    content: {
      caption_en: 'A visual glimpse into our Downtown courtyard and signature dishes.',
      caption_ar: 'جولة بصرية في فناء وسط البلد وأشهى الأطباق التراثية.'
    }
  },
  {
    key: 'reviews',
    nav_label_en: 'Ratings',
    nav_label_ar: 'التقييمات',
    sort_order: 5,
    visible: true,
    content: {
      note_en: 'Verified public scores from diners on Google Maps, TripAdvisor, and Wanderlog.',
      note_ar: 'تقييمات عامة موثقة لرواد المكان عبر خرائط جوجل وتريب أدفايزور وواندرلوج.'
    }
  },
  {
    key: 'reservations',
    nav_label_en: 'Reserve (Demo)',
    nav_label_ar: 'طلب حجز (تجريبي)',
    sort_order: 6,
    visible: true,
    content: {
      notice_en: 'Oldish operates primarily on a walk-in basis and does not take advance reservations. For table inquiries, please call us directly or send a message on Facebook / Instagram.',
      notice_ar: 'يستقبل أولديش رواده عادةً بنظام أسبقية الحضور دون حجز مسبق. للاستفسار عن الطاولات، يرجى الاتصال المباشر أو مراسلتنا عبر فيسبوك / إنستغرام.'
    }
  },
  {
    key: 'locations',
    nav_label_en: 'Locations & Contact',
    nav_label_ar: 'الفروع والتواصل',
    sort_order: 7,
    visible: true,
    content: {
      main_address_en: '20 Mohamed Mahmoud St, behind the Greek Campus (opposite AUC library), Abdeen, Downtown Cairo',
      main_address_ar: '20 شارع محمد محمود، خلف الجريك كامبس (أمام مكتبة الجامعة الأمريكية)، عابدين، وسط البلد، القاهرة',
      phone: '+20 10 60119488',
      hours_en: 'Every day 8:00 AM – 12:00 AM (midnight)',
      hours_ar: 'يومياً من 8:00 صباحاً حتى 12:00 منتصف الليل'
    }
  }
];
