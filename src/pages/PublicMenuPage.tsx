import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { 
  Search, 
  ArrowLeft, 
  ArrowRight, 
  Globe, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  Star, 
  AlertCircle, 
  Printer, 
  MessageCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNoIndex } from '../lib/seo';
import { EditableImageSlot } from '../components/EditableImageSlot';

export const PublicMenuPage: React.FC = () => {
  useNoIndex();
  const { isRTL, language, toggleLanguage } = useLanguage();
  const { menuCategories, menuItems, siteSettings, trackClick } = useData();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const visibleCategories = menuCategories.filter(c => c.visible).sort((a, b) => a.sort_order - b.sort_order);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (!item.visible) return false;
      if (selectedCategory !== 'all' && item.category_id !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchEn = item.name_en.toLowerCase().includes(q) || item.description_en.toLowerCase().includes(q);
        const matchAr = item.name_ar.toLowerCase().includes(q) || item.description_ar.toLowerCase().includes(q);
        if (!matchEn && !matchAr) return false;
      }
      return true;
    }).sort((a, b) => a.sort_order - b.sort_order);
  }, [menuItems, selectedCategory, searchQuery]);

  const handlePrint = () => {
    window.print();
  };

  const cleanWhatsapp = siteSettings.whatsapp.replace(/[^0-9]/g, '');
  const hasWhatsapp = Boolean(siteSettings.whatsapp && siteSettings.whatsapp.trim());
  const whatsappMessage = encodeURIComponent(
    isRTL 
      ? 'مرحباً، أود الاستفسار عن أصناف منيو مطعم وكافيه أولديش.' 
      : 'Hello! I would like to inquire about Oldish menu items.'
  );

  return (
    <main className="standalone-menu-view">
      {/* Top Header Bar (Screen only) */}
      <header className="standalone-menu-header no-print">
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBlock: '12px' }}>
          <Link to="/" className="back-home-link" aria-label="Back to main site">
            {isRTL ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
            <span>{isRTL ? 'الرئيسية' : 'Back Home'}</span>
          </Link>

          <div className="brand-wordmark-box" style={{ marginInline: 'auto' }}>
            <span className="brand-wordmark-en" style={{ fontSize: '1.25rem' }}>Oldish</span>
            <span className="brand-wordmark-ar" style={{ fontSize: '1.25rem' }}>أولديش</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handlePrint}
              className="btn btn-outline-light btn-sm"
              title={isRTL ? 'طباعة القائمة أو حفظها كـ PDF' : 'Print menu or save as PDF'}
              style={{ padding: '6px 12px' }}
            >
              <Printer size={15} />
              <span className="desktop-only">{isRTL ? 'طباعة المنيو' : 'Print'}</span>
            </button>

            <button
              type="button"
              onClick={toggleLanguage}
              className="lang-switch-btn"
              style={{ padding: '6px 12px' }}
            >
              <Globe size={14} />
              <span>{language === 'en' ? 'العربية' : 'EN'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Header Banner Slot (menu.page_header) */}
      <div className="no-print" style={{ position: 'relative', width: '100%', height: '220px', overflow: 'hidden' }}>
        <EditableImageSlot
          slotKey="menu.page_header"
          fallbackUrl="/images/egyptian_breakfast_spread.webp"
          loading="eager"
          fetchPriority="high"
          style={{ width: '100%', height: '100%' }}
        />
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '24px',
            color: '#FFFFFF'
          }}
        >
          <div className="container" style={{ textAlign: 'center' }}>
            <span className="badge badge-gold" style={{ fontSize: '0.75rem', marginBottom: '6px' }}>
              {isRTL ? siteSettings.subline_ar : siteSettings.subline_en}
            </span>
            <h1 style={{ fontSize: '1.75rem', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-en-serif)', color: '#FFFFFF', margin: 0, fontWeight: 700 }}>
              {isRTL ? 'قائمة الطعام والمشروبات الكاملة' : 'Full Food & Beverage Menu'}
            </h1>
          </div>
        </div>
      </div>

      {/* Print-Only Header Branding */}
      <div className="print-only" style={{ display: 'none', textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #886E42', paddingBottom: '12px' }}>
        <h1 style={{ fontSize: '24pt', margin: 0, fontFamily: 'serif', color: '#111' }}>Oldish — أولديش</h1>
        <p style={{ margin: '4px 0', fontSize: '10pt', color: '#555' }}>
          20 شارع محمد محمود، خلف الجريك كامبس، وسط البلد، القاهرة • هاتف: {siteSettings.phone}
        </p>
        <p style={{ margin: 0, fontSize: '9pt', color: '#777' }}>
          مواعيد العمل: يومياً من 8:00 صباحاً حتى 12:00 منتصف الليل
        </p>
      </div>

      {/* Quick Action Buttons (Screen only) */}
      <div className="container no-print" style={{ paddingBlock: '16px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <a 
            href={`tel:${siteSettings.phone.replace(/\s+/g, '')}`} 
            onClick={() => trackClick('calls')}
            className="btn btn-primary btn-sm"
          >
            <Phone size={14} />
            <span>{isRTL ? 'اتصال: ' + siteSettings.phone : 'Call: ' + siteSettings.phone}</span>
          </a>

          {hasWhatsapp && (
            <a 
              href={`https://wa.me/${cleanWhatsapp}?text=${whatsappMessage}`} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => trackClick('whatsapp_clicks')}
              className="btn btn-outline-gold btn-sm"
              style={{ borderColor: '#25D366', color: '#25D366' }}
            >
              <MessageCircle size={14} />
              <span>{isRTL ? 'محادثة واتساب' : 'WhatsApp'}</span>
            </a>
          )}

          {siteSettings.elmenus_url && (
            <a 
              href={siteSettings.elmenus_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-outline-gold btn-sm"
            >
              <ShoppingBag size={14} />
              <span>{isRTL ? 'طلب دليفري (elmenus)' : 'Order on elmenus'}</span>
            </a>
          )}

          {siteSettings.google_maps_url && (
            <a 
              href={siteSettings.google_maps_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              onClick={() => trackClick('directions')}
              className="btn btn-outline-light btn-sm" 
              style={{ color: 'var(--color-charcoal)', borderColor: '#CCC' }}
            >
              <MapPin size={14} />
              <span>{isRTL ? 'الموقع والتقييمات' : 'Location & Reviews'}</span>
            </a>
          )}
        </div>
      </div>

      {/* Sticky Search & Category Navigation (Screen only) */}
      <div className="sticky-menu-nav no-print">
        <div className="container">
          <div style={{ paddingBottom: '10px' }}>
            <div className="menu-search-box" style={{ maxWidth: '100%' }}>
              <Search size={16} className="menu-search-icon" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRTL ? 'ابحث في أصناف القائمة...' : 'Search menu items...'}
                className="menu-search-input"
                style={{ paddingBlock: '8px', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <div className="category-scroll-strip" role="tablist" aria-label={isRTL ? 'أقسام قائمة الطعام' : 'Menu categories'}>
            <button
              type="button"
              role="tab"
              aria-selected={selectedCategory === 'all'}
              className={`cat-pill ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
              style={{ fontSize: '0.8125rem', padding: '6px 14px' }}
            >
              {isRTL ? 'الكل' : 'All'}
            </button>
            {visibleCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat.id}
                className={`cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
                style={{ fontSize: '0.8125rem', padding: '6px 14px' }}
              >
                {isRTL ? cat.name_ar : cat.name_en}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Items List */}
      <h2 className="sr-only">{isRTL ? 'أصناف قائمة الطعام' : 'Menu Items List'}</h2>
      <div className="container menu-print-container" style={{ paddingBlock: '24px', maxWidth: '820px' }}>
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 10px', color: '#888' }}>
            {isRTL ? 'لا توجد أطباق مطابقة للبحث.' : 'No dishes found matching your criteria.'}
          </div>
        ) : (
          <div className="menu-items-grid" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredItems.map((item) => (
              <div 
                key={item.id}
                className="menu-item-card"
                style={{
                  background: '#FFFFFF',
                  borderRadius: '6px',
                  padding: '16px',
                  border: item.is_signature ? '1.5px solid var(--color-gold)' : '1px solid rgba(0,0,0,0.08)',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start',
                  boxShadow: item.is_signature ? '0 4px 12px rgba(136, 110, 66, 0.12)' : 'var(--shadow-subtle)',
                  pageBreakInside: 'avoid'
                }}
              >
                {/* Optional Photo per item */}
                {item.image_url && (
                  <div className="item-photo-wrap" style={{ width: '84px', height: '84px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                    <img 
                      src={item.image_url} 
                      alt={isRTL ? item.name_ar : item.name_en} 
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </div>
                )}

                <div style={{ flexGrow: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--color-charcoal)', margin: 0 }}>
                          {isRTL ? item.name_ar : item.name_en}
                        </h3>
                        {item.is_signature && (
                          <span className="badge badge-gold" style={{ fontSize: '0.625rem', padding: '2px 6px' }}>
                            <Star size={9} fill="currentColor" />
                            <span>{isRTL ? 'مميز' : 'Signature'}</span>
                          </span>
                        )}
                      </div>

                      {item.is_sample && (
                        <span style={{ fontSize: '0.6875rem', color: '#9E4738', fontWeight: 600 }}>
                          {isRTL ? '(صنف تجريبي)' : '(Sample item)'}
                        </span>
                      )}
                    </div>

                    {siteSettings.show_prices && item.price ? (
                      <span className="menu-dish-price" style={{ fontSize: '0.8125rem' }}>
                        {item.price}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {isRTL ? 'بالقائمة الرسمية' : 'On venue menu'}
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '6px', lineHeight: '1.5' }}>
                    {isRTL ? item.description_ar : item.description_en}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pricing notice */}
        <div className="menu-disclaimer-banner no-print" style={{ marginTop: '24px' }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.8125rem' }}>
            {isRTL 
              ? 'الأسعار محددة بالقائمة الرسمية المعتمدة بالمطعم. متوسط التكلفة التقديرية للفرد: 200–400 ج.م.' 
              : 'Prices are presented on the venue’s official menu. Expected average: EGP 200–400 per person.'}
          </div>
        </div>
      </div>

      {/* Standalone Footer */}
      <footer className="no-print" style={{ background: '#1C1C1C', color: '#AAA', paddingBlock: '24px', textAlign: 'center', fontSize: '0.8125rem', marginTop: '40px' }}>
        <p>Oldish (Restaurant &amp; Café) — 20 Mohamed Mahmoud St, Downtown Cairo</p>
        <p style={{ marginTop: '4px' }}>Tel: {siteSettings.phone} • Every day 8:00 AM – 12:00 AM</p>
      </footer>
    </main>
  );
};
