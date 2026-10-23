import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { Search, Utensils, AlertCircle, FileText, Check, Star, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { searchMatches } from '../lib/searchUtils';

export const MenuSection: React.FC = () => {
  const { isRTL } = useLanguage();
  const { menuCategories, menuItems, siteSettings, sections, isPreviewMode, isLoading } = useData();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pdfRequested, setPdfRequested] = useState<boolean>(false);

  const visibleCategories = menuCategories.filter(c => c.visible).sort((a, b) => a.sort_order - b.sort_order);

  const totalVisibleCount = useMemo(() => {
    return menuItems.filter(i => i.visible && (!i.is_sample || isPreviewMode)).length;
  }, [menuItems, isPreviewMode]);

  // Filtered menu items with Arabic text normalization & quick tags
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (!item.visible) return false;
      if (item.is_sample && !isPreviewMode) return false;
      if (selectedCategory !== 'all' && item.category_id !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const matches = searchMatches(
          searchQuery,
          item.name_en,
          item.name_ar,
          item.description_en,
          item.description_ar
        );
        if (!matches) return false;
      }
      if (selectedTag === 'signature') {
        const isSig = item.is_signature || item.tags?.some(t => {
          const tl = t.toLowerCase();
          return tl === 'signature' || tl === 'most ordered' || t.includes('مميز') || t.includes('الأكثر طلباً');
        });
        if (!isSig) return false;
      }
      if (selectedTag === 'vegetarian') {
        const isVeg = item.tags?.some(t => {
          const tl = t.toLowerCase();
          return tl === 'vegetarian' || t.includes('نباتي');
        });
        if (!isVeg) return false;
      }
      if (selectedTag === 'spicy') {
        const isSpicy = item.tags?.some(t => {
          const tl = t.toLowerCase();
          return tl === 'spicy' || t.includes('حار');
        });
        if (!isSpicy) return false;
      }
      return true;
    }).sort((a, b) => a.sort_order - b.sort_order);
  }, [menuItems, selectedCategory, selectedTag, searchQuery, isPreviewMode]);

  const menuSec = sections.find(s => s.key === 'menu');
  if (menuSec && !menuSec.visible) {
    return null;
  }

  return (
    <section id="menu" className="section section-neutral" aria-labelledby="menu-heading">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-eyebrow">
            <Utensils size={14} />
            <span>{isRTL ? 'قائمة الطعام' : 'The Menu'}</span>
          </div>
          <h2 id="menu-heading" className="section-title">
            {isRTL ? 'نكهات أصيلة لا تُنسى' : "Flavors You'll Never Forget"}
          </h2>
          <div className="gold-divider">
            <span className="gold-divider-diamond" />
          </div>
          <p className="section-lead">
            {isRTL 
              ? 'مزيج من المطبخ المصري التراثي ولمسات متوسطية: طواجن الفخار، الفطور الشرقي والغربي، دجاج أولديش المشوي، والقهوة التركي على الرمل.' 
              : 'Egyptian comfort food with Mediterranean touches: slow-cooked clay tagines, Eastern & Western breakfast, Oldish chicken, and sand-brewed coffee.'}
          </p>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="menu-controls">
          {/* Search Bar */}
          <div className="menu-search-box" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={18} className="menu-search-icon" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRTL ? 'ابحث عن صنف أو مكون (طاجن، دجاج، قهوة، إفطار)...' : 'Search dishes or ingredients (tagine, chicken, coffee)...'}
              className="menu-search-input"
              style={{ paddingInlineEnd: searchQuery ? '36px' : undefined }}
              aria-label="Search menu dishes"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label={isRTL ? 'مسح البحث' : 'Clear search'}
                style={{
                  position: 'absolute',
                  insetInlineEnd: '10px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="category-pills" role="tablist" aria-label="Menu category filters">
            <button
              type="button"
              className={`cat-pill ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
              role="tab"
              aria-selected={selectedCategory === 'all'}
            >
              {isRTL ? 'جميع الأصناف' : 'All Dishes'}
            </button>
            {visibleCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
                role="tab"
                aria-selected={selectedCategory === cat.id}
              >
                {isRTL ? cat.name_ar : cat.name_en}
              </button>
            ))}
          </div>

          {/* Quick Tag Filters */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label_en: 'All Tags', label_ar: 'كل الأطباق' },
              { id: 'signature', label_en: '⭐ Most Ordered', label_ar: '⭐ الأكثر طلباً' },
              { id: 'vegetarian', label_en: '🌱 Vegetarian', label_ar: '🌱 نباتي' },
              { id: 'spicy', label_en: '🌶️ Spicy', label_ar: '🌶️ حار' },
            ].map(tf => (
              <button
                key={tf.id}
                type="button"
                onClick={() => setSelectedTag(tf.id)}
                style={{
                  fontSize: '0.8125rem',
                  padding: '5px 14px',
                  borderRadius: '20px',
                  border: selectedTag === tf.id ? '1.5px solid var(--color-gold)' : '1px solid #D1D5DB',
                  background: selectedTag === tf.id ? 'var(--color-gold)' : '#FFFFFF',
                  color: selectedTag === tf.id ? '#FFFFFF' : 'var(--color-charcoal)',
                  cursor: 'pointer',
                  fontWeight: selectedTag === tf.id ? 600 : 500,
                  transition: 'all 0.15s ease'
                }}
              >
                {isRTL ? tf.label_ar : tf.label_en}
              </button>
            ))}
          </div>

          {/* Result counter and reset button */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            maxWidth: '680px', 
            margin: '0 auto', 
            width: '100%',
            fontSize: '0.8125rem', 
            color: 'var(--color-text-muted)',
            paddingInline: '4px'
          }}>
            <span>
              {isRTL 
                ? `عرض ${filteredItems.length} من أصل ${totalVisibleCount} صنف`
                : `Showing ${filteredItems.length} of ${totalVisibleCount} dishes`}
              {searchQuery && ` • ${isRTL ? 'نتائج البحث عن' : 'search for'} "${searchQuery}"`}
            </span>
            {(searchQuery || selectedCategory !== 'all' || selectedTag !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedTag('all');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-gold)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '0.8125rem',
                  padding: 0
                }}
              >
                {isRTL ? 'إعادة ضبط الفلاتر' : 'Reset filters'}
              </button>
            )}
          </div>
        </div>

        {/* Menu Items Grid */}
        {isLoading && menuItems.length === 0 ? (
          <div className="menu-grid">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="menu-card" style={{ pointerEvents: 'none' }}>
                <div className="menu-card-media skeleton-shimmer" style={{ minHeight: '180px' }} />
                <div className="menu-card-body" style={{ padding: '16px' }}>
                  <div className="skeleton-shimmer" style={{ height: '22px', width: '60%', marginBottom: '10px' }} />
                  <div className="skeleton-shimmer" style={{ height: '14px', width: '90%', marginBottom: '8px' }} />
                  <div className="skeleton-shimmer" style={{ height: '14px', width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
            <p style={{ fontSize: '1.125rem' }}>
              {isRTL 
                ? 'لا توجد أطباق مطابقة للبحث المحدد.' 
                : 'No dishes match your selected filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="menu-grid">
            {filteredItems.map((item) => {
              const isUnavailable = item.is_unavailable || item.available === false;
              return (
                <article 
                  key={item.id} 
                  className="menu-card"
                  style={isUnavailable ? { opacity: 0.7, filter: 'grayscale(30%)' } : undefined}
                >
                  {/* Media if present */}
                  {item.image_url && (
                    <div className="menu-card-media">
                      <img 
                        src={item.image_url} 
                        alt={isRTL ? item.name_ar : item.name_en}
                        loading="lazy" 
                      />
                      <span 
                        className="badge" 
                        style={{
                          position: 'absolute',
                          bottom: '8px',
                          insetInlineStart: '8px',
                          background: 'rgba(0, 0, 0, 0.7)',
                          color: '#E0DDD7',
                          fontSize: '0.6875rem'
                        }}
                      >
                        {isRTL ? 'صورة توضيحية' : 'Illustrative image'}
                      </span>
                    </div>
                  )}

                  <div className="menu-card-body">
                    <div className="menu-card-header">
                      <div>
                        <h3 className="menu-dish-title">
                          {isRTL ? item.name_ar : item.name_en}
                        </h3>
                      </div>

                      {/* Price display: Only shown if show_prices is active and price exists */}
                      {siteSettings.show_prices && item.price ? (
                        <span className="menu-dish-price">
                          {item.price}
                        </span>
                      ) : (
                        <span 
                          className="badge" 
                          style={{ 
                            background: 'rgba(0,0,0,0.04)', 
                            color: 'var(--color-text-muted)',
                            fontSize: '0.75rem' 
                          }}
                        >
                          {isRTL ? 'بالقائمة الرسمية' : 'On venue menu'}
                        </span>
                      )}
                    </div>

                    <p className="menu-dish-desc">
                      {isRTL ? item.description_ar : item.description_en}
                    </p>

                    <div className="menu-card-footer" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                      {isUnavailable && (
                        <span className="badge" style={{ background: '#F3F4F6', color: '#6B7280', border: '1px solid #D1D5DB', fontSize: '0.6875rem', fontWeight: 600 }}>
                          {isRTL ? 'غير متوفر اليوم' : 'Unavailable today'}
                        </span>
                      )}
                      {item.is_signature && (
                        <span className="badge badge-gold" style={{ fontSize: '0.6875rem' }}>
                          <Star size={11} fill="currentColor" />
                          <span>{isRTL ? 'من أشهر أطباق أولديش' : 'Oldish Signature'}</span>
                        </span>
                      )}
                      {item.tags?.map((t, idx) => {
                        const tagLower = t.toLowerCase().trim();
                        if (tagLower === 'vegetarian' || tagLower === 'نباتي') {
                          return (
                            <span key={idx} className="badge" style={{ background: '#E6F4EA', color: '#137333', border: '1px solid #CEEAD6', fontSize: '0.6875rem' }}>
                              🌱 {isRTL ? 'نباتي' : 'Vegetarian'}
                            </span>
                          );
                        }
                        if (tagLower === 'spicy' || tagLower === 'حار') {
                          return (
                            <span key={idx} className="badge" style={{ background: '#FCE8E6', color: '#C5221F', border: '1px solid #FAD2CF', fontSize: '0.6875rem' }}>
                              🌶️ {isRTL ? 'حار' : 'Spicy'}
                            </span>
                          );
                        }
                        if (tagLower === 'signature' || tagLower === 'الأكثر طلباً' || tagLower === 'مميز') {
                          return (
                            <span key={idx} className="badge badge-gold" style={{ fontSize: '0.6875rem' }}>
                              ⭐ {isRTL ? 'الأكثر طلباً' : 'Most Ordered'}
                            </span>
                          );
                        }
                        return (
                          <span key={idx} className="badge badge-gold" style={{ fontSize: '0.6875rem' }}>
                            {t}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Verified Pricing & Transparency Notice Banner */}
        <div className="menu-disclaimer-banner">
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>{isRTL ? 'تنويه قائمة الأسعار:' : 'Official Menu Disclosure:'}</strong>{' '}
            {isRTL 
              ? 'الأسعار محددة بالقائمة الرسمية المعتمدة داخل المكان، ومتوسط التكلفة التقديرية للفرد نحو 200–400 ج.م بحسب الأصناف المختارة. جميع الأطباق الرئيسية وطواجن الفخار تقدم مع عيش أولديش المميز.' 
              : 'Prices are presented on the venue’s official in-house menu (typical average EGP 200–400 per person). All signature tagines and mains are served with Oldish’s own freshly baked bread.'}
          </div>
        </div>

        {/* Quick Menu Link & PDF Request */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: 'var(--space-8)' }}>
          <Link to="/menu" className="btn btn-primary btn-sm">
            <span>{isRTL ? 'فتح صفحة المنيو السريع (/menu)' : 'Open Standalone Menu (/menu)'}</span>
          </Link>

          {pdfRequested ? (
            <div 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px', 
                background: '#EAF5EA', 
                color: '#2B6E28', 
                padding: '8px 16px', 
                borderRadius: '4px',
                fontSize: '0.875rem',
                fontWeight: 600
              }}
            >
              <Check size={16} />
              <span>
                {isRTL 
                  ? 'تم تسجيل طلبك للحصول على نسخة المنيو المحدثة.' 
                  : 'Your request for the updated venue menu has been noted.'}
              </span>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-outline-gold btn-sm"
              onClick={() => setPdfRequested(true)}
            >
              <FileText size={15} />
              <span>{isRTL ? 'طلب ملف قائمة الطعام' : 'Request Official Menu Copy'}</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
