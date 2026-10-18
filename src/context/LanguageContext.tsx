import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Language } from '../types';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isRTL: boolean;
  t: (key: string) => string;
}

const UI_TRANSLATIONS: Record<string, { en: string; ar: string }> = {
  // Navigation
  'nav.home': { en: 'Home', ar: 'الرئيسية' },
  'nav.menu': { en: 'Menu', ar: 'قائمة الطعام' },
  'nav.about': { en: 'Our Story', ar: 'قصتنا' },
  'nav.atmosphere': { en: 'Atmosphere', ar: 'الأجواء' },
  'nav.gallery': { en: 'Gallery', ar: 'معرض الصور' },
  'nav.reviews': { en: 'Reviews', ar: 'آراء الضيوف' },
  'nav.locations': { en: 'Locations & Contact', ar: 'الفروع والتواصل' },
  'nav.reserve': { en: 'Reserve a Table', ar: 'حجز طاولة' },
  'nav.quickContact': { en: 'Call Us', ar: 'اتصل بنا' },

  // Hero
  'hero.eyebrow': { en: 'A CAIRO RESTAURANT & CAFÉ', ar: 'مطعم ومقهى قاهري أصيل' },
  'hero.headline': { en: 'GOOD FOOD. TIMELESS ATMOSPHERE.', ar: 'طعام أصيل. أجواء لا يطويها الزمان.' },
  'hero.subtitle': { 
    en: 'Discover a welcoming gathering place for comforting food, relaxed moments, and the distinctive vintage character of Downtown Cairo.', 
    ar: 'اكتشف ملتقى دافئاً يجمع بين المذاق البيتي، واللحظات الهادئة، وسحر الطابع الكلاسيكي لقلب وسط البلد بالقاهرة.' 
  },
  'hero.ctaMenu': { en: 'Explore the Menu', ar: 'استكشف قائمة الطعام' },
  'hero.ctaReserve': { en: 'Find Your Table', ar: 'احجز طاولتك' },
  'hero.ctaDirections': { en: 'Get Directions', ar: 'الاتجاهات والخريطة' },
  'hero.badge': { en: 'Mohamed Mahmoud St • Behind Greek Campus', ar: 'شارع محمد محمود • خلف الجريك كامبس' },

  // Story & About
  'story.title': { en: 'Our Heritage & Philosophy', ar: 'تراثنا وفلسفتنا' },
  'story.lead': { 
    en: 'Oldish was born in the artistic crossroads of Downtown Cairo — a sanctuary of weathered brick, leafy courtyards, and warm Egyptian hospitality.', 
    ar: 'وُلد أولديش في الملتقى الفني والإنساني لوسط البلد بالقاهرة، ليكون ملاذاً من الطوب العتيق، والأفنية الخضراء، وكرم الضيافة المصري.' 
  },
  'story.disclaimer': { 
    en: 'Verified brand narrative. Details drawn directly from local cultural history, official public records, and verified premises.', 
    ar: 'سرد حقيقي موثق مستوحى من تاريخ وسط البلد والتفاصيل المعتمدة للمطعم.' 
  },

  // Menu Section
  'menu.title': { en: 'The Dining & Café Menu', ar: 'قائمة المأكولات والمشروبات' },
  'menu.subtitle': { 
    en: 'From slow-cooked morning ful and fragrant Egyptian tagines to comforting pastas and freshly ground Turkish coffee.', 
    ar: 'من فخارات الفول الصباحي والطواجن المصرية التراثية إلى الباستا الشهية والقهوة المعدة على الرمل.' 
  },
  'menu.filterAll': { en: 'All Items', ar: 'جميع الأطباق' },
  'menu.dietaryFilter': { en: 'Dietary Preferences', ar: 'الخيارات الغذائية' },
  'menu.searchPlaceholder': { en: 'Search dishes, ingredients, or drinks...', ar: 'ابحث عن طبق، مكون، أو مشروب...' },
  'menu.vegetarian': { en: 'Vegetarian', ar: 'نباتي' },
  'menu.vegan': { en: 'Vegan', ar: 'نباتي صرف' },
  'menu.glutenFree': { en: 'Gluten-Free Option', ar: 'خالٍ من الغلوتين' },
  'menu.chefChoice': { en: "Oldish Classic", ar: 'من أطباق أولديش المميزة' },
  'menu.draftNotice': { 
    en: 'Note on Pricing: Menu items reflect confirmed signature dishes. Prices are currently marked as provisional draft entries awaiting final seasonal confirmation by restaurant management.', 
    ar: 'ملاحظة حول الأسعار: الأطباق تمثل أشهر اختيارات المطعم المعتمدة. الأسعار المعروضة هي مسودة قيد الاعتماد الموسمي النهائي من إدارة المطعم.' 
  },
  'menu.pdfDownload': { en: 'Request Current Seasonal Menu PDF', ar: 'طلب نسخة PDF من المنيو الموسمي' },

  // Atmosphere
  'atmosphere.title': { en: 'Courtyard & Indoor Salon', ar: 'فناء خارجي وصالون كلاسيكي' },
  'atmosphere.subtitle': { 
    en: 'An unhurried retreat between historic walls and leafy corners in Bab El Louq.', 
    ar: 'ملاذ هادئ بين الجدران التاريخية والأركان الخضراء بحي باب اللوق العريق.' 
  },

  // Gallery
  'gallery.title': { en: 'Atmospheric Moments', ar: 'معرض الأجواء والذكريات' },
  'gallery.subtitle': { 
    en: 'A visual celebration of our courtyard, authentic culinary plates, and timeless spaces.', 
    ar: 'جولة بصرية في فنائنا المفتوح، وأطباقنا التراثية، وأروقتنا العريقة.' 
  },
  'gallery.catAll': { en: 'All', ar: 'الكل' },
  'gallery.catCourtyard': { en: 'Courtyard', ar: 'الفناء الخارجي' },
  'gallery.catInterior': { en: 'Interior Salon', ar: 'الصالون الداخلي' },
  'gallery.catFood': { en: 'Egyptian Food', ar: 'المأكولات' },
  'gallery.catDrinks': { en: 'Café & Drinks', ar: 'المقهى والمشروبات' },

  // Reviews
  'reviews.title': { en: 'Words from Our Guests', ar: 'انطباعات وشهادات ضيوفنا' },
  'reviews.subtitle': { 
    en: 'Genuine reflections from locals, students, and travelers who have spent unhurried afternoons with us.', 
    ar: 'تجارب حقيقية لزوارنا من أهل القاهرة والطلاب والمسافرين الذين استمتعوا بأوقاتهم في ضيافتنا.' 
  },
  'reviews.verifiedSource': { en: 'Verified Public Review', ar: 'تقييم عام معتمد' },

  // Reservations
  'res.title': { en: 'Reserve Your Table', ar: 'احجز طاولتك' },
  'res.subtitle': { 
    en: 'Join us for breakfast, lunch, or an atmospheric dinner in our courtyard or indoor vintage salon.', 
    ar: 'تفضل بزيارتنا لتناول الإفطار، الغداء، أو عشاء هادئ في فنائنا المكشوف أو صالوننا الكلاسيكي.' 
  },
  'res.disclaimer': { 
    en: 'Reservation Policy: Submitting this form sends a direct booking request to our host team. You will receive a telephone or SMS confirmation within 2 hours of operating hours. We do not practice automatic overbooking.', 
    ar: 'سياسة الحجز: إرسال هذا الطلب يحيله مباشرة إلى فريق الاستقبال لدينا. سيتم التواصل معك هاتفياً أو عبر الرسائل لتأكيد الحجز خلال ساعتين من ساعات العمل.' 
  },
  'res.branch': { en: 'Select Location', ar: 'اختر الفرع' },
  'res.guests': { en: 'Number of Guests', ar: 'عدد الضيوف' },
  'res.date': { en: 'Reservation Date', ar: 'تاريخ الحجز' },
  'res.time': { en: 'Preferred Time', ar: 'الوقت المفضل' },
  'res.name': { en: 'Full Name', ar: 'الاسم بالكامل' },
  'res.phone': { en: 'Mobile Phone (+20)', ar: 'رقم الهاتف المحمول' },
  'res.email': { en: 'Email Address (Optional)', ar: 'البريد الإلكتروني (اختياري)' },
  'res.seatingPref': { en: 'Seating Preference', ar: 'مكان الجلوس المفضل' },
  'res.seatCourtyard': { en: 'Outdoor Courtyard (Brick Garden)', ar: 'الفناء الخارجي (الحديقة المفتوحة)' },
  'res.seatIndoor': { en: 'Indoor Vintage Salon (Air-conditioned)', ar: 'الصالون الداخلي التراثي (مكيف)' },
  'res.seatNoPref': { en: 'No Preference / First Available', ar: 'لا يوجد تفضيل / أول طاولة متاحة' },
  'res.notes': { en: 'Special Requests or Occasions (Optional)', ar: 'طلبات خاصة أو مناسبات (اختياري)' },
  'res.submit': { en: 'Send Reservation Request', ar: 'إرسال طلب الحجز' },
  'res.submitting': { en: 'Transmitting Request...', ar: 'جارٍ إرسال الطلب...' },
  'res.successTitle': { en: 'Reservation Request Received', ar: 'تم استلام طلب الحجز بنجاح' },
  'res.successBody': { 
    en: 'Thank you! Your table request has been forwarded directly to Oldish dining staff. We will call you shortly to confirm your table details.', 
    ar: 'شكراً لك! تم تحويل طلبك مباشرة إلى فريق الاستقبال في أولديش، وسنتصل بك قريباً لتأكيد تفاصيل طاولتك.' 
  },
  'res.reset': { en: 'Book Another Table', ar: 'حجز طاولة أخرى' },

  // Location & Contact
  'loc.title': { en: 'Visit & Connect', ar: 'الفروع ومعلومات التواصل' },
  'loc.subtitle': { 
    en: 'Find us in Downtown Cairo behind the Greek Campus, or reach out to our team.', 
    ar: 'تفضل بزيارتنا في وسط البلد خلف الجريك كامبس، أو تواصل مع فريقنا مباشرة.' 
  },
  'loc.primaryBadge': { en: 'Primary Verified Location', ar: 'الفرع الرئيسي المعتمد' },
  'loc.unverifiedBadge': { en: 'Directory Record • Under Client Verification', ar: 'سجل الأدلة • قيد اعتماد المالك' },
  'loc.callNow': { en: 'Call Restaurant', ar: 'اتصال مباشر' },
  'loc.openMaps': { en: 'Open in Google Maps', ar: 'فتح في خرائط جوجل' },
  'loc.hours': { en: 'Opening Hours', ar: 'مواعيد العمل' },
  'loc.address': { en: 'Address', ar: 'العنوان' },
  'loc.landmark': { en: 'Directions & Landmark', ar: 'معالم الوصول' },
  'loc.contactFormTitle': { en: 'Send an Inquiry or Feedback', ar: 'أرسل استفساراً أو ملاحظة' },
  'loc.contactName': { en: 'Your Name', ar: 'اسمك' },
  'loc.contactPhone': { en: 'Phone Number', ar: 'رقم الهاتف' },
  'loc.contactSubject': { en: 'Subject', ar: 'الموضوع' },
  'loc.contactMessage': { en: 'Your Message', ar: 'رسالتك' },
  'loc.contactSend': { en: 'Send Message', ar: 'إرسال الرسالة' },
  'loc.contactSending': { en: 'Sending...', ar: 'جارٍ الإرسال...' },
  'loc.contactSuccess': { 
    en: 'Thank you for reaching out! Your message has been recorded and our team will get back to you promptly.', 
    ar: 'شكراً لتواصلك معنا! تم تسجيل رسالتك وسيقوم فريقنا بالرد عليك في أقرب وقت.' 
  },

  // Footer & Common
  'footer.about': { 
    en: 'A timeless Cairo restaurant and café. Serving comforting Egyptian breakfast, traditional clay tagines, and artisan drinks in a leafy red-brick courtyard.', 
    ar: 'مطعم ومقهى قاهري عريق. يقدم الإفطار المصري التراثي، وطواجن الفخار، والمشروبات الطازجة في فناء ساحر محاط بالطوب الأحمر.' 
  },
  'footer.quickLinks': { en: 'Quick Navigation', ar: 'روابط سريعة' },
  'footer.contactInfo': { en: 'Direct Contact', ar: 'التواصل المباشر' },
  'footer.rights': { en: 'All rights reserved.', ar: 'جميع الحقوق محفوظة.' },
  'common.close': { en: 'Close', ar: 'إغلاق' },
  'common.next': { en: 'Next', ar: 'التالي' },
  'common.prev': { en: 'Previous', ar: 'السابق' },
  'common.required': { en: 'Required', ar: 'مطلوب' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('oldish_language') as Language;
      return saved === 'ar' || saved === 'en' ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('oldish_language', lang);
    } catch {
      // ignore
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const isRTL = language === 'ar';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    if (isRTL) {
      document.body.classList.add('rtl-mode');
      document.body.classList.remove('ltr-mode');
    } else {
      document.body.classList.add('ltr-mode');
      document.body.classList.remove('rtl-mode');
    }
  }, [language, isRTL]);

  const t = (key: string): string => {
    const translation = UI_TRANSLATIONS[key];
    if (!translation) return key;
    return translation[language] || translation.en;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, isRTL, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
