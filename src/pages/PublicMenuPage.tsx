import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { Search, ArrowLeft, ArrowRight, Globe, Phone, MapPin, ShoppingBag, Star, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNoIndex } from '../lib/seo';

export const PublicMenuPage: React.FC = () => {
  useNoIndex();
  const { isRTL, language, toggleLanguage } = useLanguage();
  const { menuCategories, menuItems, siteSettings } = useData();
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

  return (
    <div className="standalone-menu-view">
      {/* Compact Top Navigation Bar */}
      <header className="standalone-menu-header">
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBlock: '12px' }}>
          <Link to="/" className="back-home-link" aria-label="Back to main site">
            {isRTL ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
            <span>{isRTL ? 'الرئيسية' : 'Back Home'}</span>
          </Link>

          <div className="brand-wordmark-box" style={{ marginInline: 'auto' }}>
            <span className="brand-wordmark-en" style={{ fontSize: '1.25rem' }}>Oldish</span>
            <span className="brand-wordmark-ar" style={{ fontSize: '1.25rem' }}>أولديش</span>
          </div>

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
      </header>

      {/* Menu Sub-header */}
      <div className="container" style={{ paddingBlock: '20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.75rem', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-en-serif)', color: 'var(--color-charcoal)', marginBottom: '6px' }}>
          {isRTL ? 'قائمة المأكولات والمشروبات الرقمية' : 'Digital Menu — Oldish'}
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', maxWidth: '580px', marginInline: 'auto' }}>
          {isRTL 
            ? 'طواجن الفخار المصرية، الفطور الشرقي والغربي، دجاج أولديش المشوي، والقهوة التركية على الرمل.' 
            : 'Comforting Egyptian clay tagines, breakfast favorites, grilled specialties, and sand-brewed coffee.'}
        </p>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '14px' }}>
          <a href={`tel:${siteSettings.phone.replace(/\s+/g, '')}`} className="btn btn-primary btn-sm">
            <Phone size={14} />
            <span>{isRTL ? 'اتصال: ' + siteSettings.phone : 'Call: ' + siteSettings.phone}</span>
          </a>

          {siteSettings.elmenus_url && (
            <a href={siteSettings.elmenus_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline-gold btn-sm">
              <ShoppingBag size={14} />
              <span>{isRTL ? 'طلب دليفري (elmenus)' : 'Order on elmenus'}</span>
            </a>
          )}

          <a href={siteSettings.google_maps_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline-light btn-sm" style={{ color: 'var(--color-charcoal)', borderColor: '#CCC' }}>
            <MapPin size={14} />
            <span>{isRTL ? 'الموقع' : 'Location'}</span>
          </a>
        </div>
      </div>

      {/* Sticky Search & Category Navigation */}
      <div className="sticky-menu-nav">
        <div className="container">
          <div style={{ paddingBottom: '10px' }}>
            <div className="menu-search-box" style={{ maxWidth: '100%' }}>
              <Search size={16} className="menu-search-icon" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRTL ? 'ابحث في القائمة...' : 'Search menu items...'}
                className="menu-search-input"
                style={{ paddingBlock: '8px', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <div className="category-scroll-strip" role="tablist">
            <button
              type="button"
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
      <div className="container" style={{ paddingBlock: '24px', maxWidth: '820px' }}>
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 10px', color: '#888' }}>
            {isRTL ? 'لا توجد أطباق مطابقة للبحث.' : 'No dishes found matching your criteria.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredItems.map((item) => (
              <div 
                key={item.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '6px',
                  padding: '16px',
                  border: '1px solid rgba(0,0,0,0.08)',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start',
                  boxShadow: 'var(--shadow-subtle)'
                }}
              >
                {item.image_url && (
                  <div style={{ width: '80px', height: '80px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                    <img 
                      src={item.image_url} 
                      alt={isRTL ? item.name_ar : item.name_en} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </div>
                )}

                <div style={{ flexGrow: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--color-charcoal)', margin: 0 }}>
                        {isRTL ? item.name_ar : item.name_en}
                      </h3>
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

                  {item.is_signature && (
                    <div style={{ marginTop: '8px' }}>
                      <span className="badge badge-gold" style={{ fontSize: '0.6875rem', padding: '2px 8px' }}>
                        <Star size={10} fill="currentColor" />
                        <span>{isRTL ? 'أولديش مميز' : 'Oldish Signature'}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pricing notice */}
        <div className="menu-disclaimer-banner" style={{ marginTop: '24px' }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.8125rem' }}>
            {isRTL 
              ? 'الأسعار محددة بالقائمة الرسمية المعتمدة بالمطعم. متوسط التكلفة التقديرية للفرد: 200–400 ج.م.' 
              : 'Prices are presented on the venue’s official menu. Expected average: EGP 200–400 per person.'}
          </div>
        </div>
      </div>

      {/* Standalone Footer */}
      <footer style={{ background: '#1C1C1C', color: '#AAA', paddingBlock: '24px', textAlign: 'center', fontSize: '0.8125rem', marginTop: '40px' }}>
        <p>Oldish (Restaurant &amp; Café) — 20 Mohamed Mahmoud St, Downtown Cairo</p>
        <p style={{ marginTop: '4px' }}>Tel: {siteSettings.phone} • Every day 8:00 AM – 12:00 AM</p>
      </footer>
    </div>
  );
};
