import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import type { MenuItem } from '../types';
import { 
  Search, 
  Utensils, 
  FileText, 
  Check, 
  Star, 
  X, 
  ArrowUpDown, 
  MapPin, 
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { searchMatches } from '../lib/searchUtils';
import { formatPrice, getItemPriceNumber } from '../lib/priceUtils';
import { ProductDetailsModal } from './ProductDetailsModal';

export const MenuSection: React.FC = () => {
  const { isRTL } = useLanguage();
  const { menuCategories, menuItems, siteSettings, branches, sections, isPreviewMode, isLoading } = useData();

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('all'); // 'all' | 'available'
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'alpha'>('default');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  // Pagination state (12 items per page / active category)
  const [visibleCount, setVisibleCount] = useState<number>(12);
  const filterKey = `${selectedCategory}|${selectedTag}|${searchQuery}|${selectedPriceRange}|${selectedAvailability}|${selectedBranch}|${sortBy}`;
  const [prevFilterKey, setPrevFilterKey] = useState<string>(filterKey);

  // Reset pagination count during render when filters/search/category change
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setVisibleCount(12);
  }

  // Modal detail view
  const [activeModalItem, setActiveModalItem] = useState<MenuItem | null>(null);
  const [pdfRequested, setPdfRequested] = useState<boolean>(false);

  // Eligible customer items (strictly published and active, no sample unless preview mode)
  const customerItems = useMemo(() => {
    return menuItems.filter(item => {
      if (!item.visible) return false;
      if (item.is_published === false) return false;
      if (item.is_sample && !isPreviewMode) return false;
      return true;
    });
  }, [menuItems, isPreviewMode]);

  // Categories containing at least one active product (hide empty categories from customer view)
  const activeCategoriesWithItems = useMemo(() => {
    const countsByCat: Record<string, number> = {};
    for (const item of customerItems) {
      countsByCat[item.category_id] = (countsByCat[item.category_id] || 0) + 1;
    }

    return menuCategories
      .filter(c => c.visible && (countsByCat[c.id] || 0) > 0)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(c => ({
        ...c,
        itemCount: countsByCat[c.id] || 0
      }));
  }, [menuCategories, customerItems]);

  const totalVisibleCount = customerItems.length;

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = customerItems.filter((item) => {
      // 1. Category Filter
      if (selectedCategory !== 'all' && item.category_id !== selectedCategory) {
        return false;
      }

      // 2. Search Query Filter (English & Arabic text normalization)
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

      // 3. Price Range Filter
      if (selectedPriceRange !== 'all') {
        const priceNum = getItemPriceNumber(item);
        if (selectedPriceRange === 'under-50' && priceNum >= 50) return false;
        if (selectedPriceRange === '50-100' && (priceNum < 50 || priceNum > 100)) return false;
        if (selectedPriceRange === '100-150' && (priceNum < 100 || priceNum > 150)) return false;
        if (selectedPriceRange === 'over-150' && priceNum <= 150) return false;
      }

      // 4. Availability Filter
      if (selectedAvailability === 'available') {
        if (item.is_unavailable || item.available === false) return false;
      }

      // 5. Branch Filter
      if (selectedBranch !== 'all') {
        if (item.branch_availability && item.branch_availability[selectedBranch] === false) {
          return false;
        }
      }

      // 6. Quick Tag / Dietary Filters
      if (selectedTag === 'signature') {
        const isSig = item.is_signature || item.tags?.some(t => {
          const tl = t.toLowerCase();
          return tl === 'signature' || tl === 'most ordered' || t.includes('مميز') || t.includes('الأكثر طلباً');
        });
        if (!isSig) return false;
      }
      if (selectedTag === 'vegetarian') {
        const isVeg = item.is_vegetarian || item.tags?.some(t => {
          const tl = t.toLowerCase();
          return tl === 'vegetarian' || t.includes('نباتي');
        });
        if (!isVeg) return false;
      }
      if (selectedTag === 'spicy') {
        const isSpicy = item.is_spicy || item.tags?.some(t => {
          const tl = t.toLowerCase();
          return tl === 'spicy' || t.includes('حار');
        });
        if (!isSpicy) return false;
      }

      return true;
    });

    // Sorting
    return result.sort((a, b) => {
      if (sortBy === 'price-asc') {
        return getItemPriceNumber(a) - getItemPriceNumber(b);
      }
      if (sortBy === 'price-desc') {
        return getItemPriceNumber(b) - getItemPriceNumber(a);
      }
      if (sortBy === 'alpha') {
        const nameA = isRTL ? a.name_ar : a.name_en;
        const nameB = isRTL ? b.name_ar : b.name_en;
        return nameA.localeCompare(nameB);
      }
      return a.sort_order - b.sort_order;
    });
  }, [customerItems, selectedCategory, selectedPriceRange, selectedAvailability, selectedBranch, selectedTag, sortBy, searchQuery, isRTL]);

  const hasActiveFilters = 
    selectedCategory !== 'all' || 
    selectedPriceRange !== 'all' || 
    selectedAvailability !== 'all' || 
    selectedBranch !== 'all' || 
    selectedTag !== 'all' || 
    searchQuery.trim() !== '' ||
    sortBy !== 'default';

  const resetAllFilters = () => {
    setSelectedCategory('all');
    setSelectedPriceRange('all');
    setSelectedAvailability('all');
    setSelectedBranch('all');
    setSelectedTag('all');
    setSearchQuery('');
    setSortBy('default');
    setVisibleCount(12);
  };

  const isSearching = searchQuery.trim() !== '';
  const displayedItems = isSearching ? filteredItems : filteredItems.slice(0, visibleCount);

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
            <span>{isRTL ? 'قائمة الطعام الموثقة' : 'Verified Menu'}</span>
          </div>
          <h2 id="menu-heading" className="section-title">
            {isRTL ? 'نكهات أصيلة لا تُنسى' : "Flavors You'll Never Forget"}
          </h2>
          <div className="gold-divider">
            <span className="gold-divider-diamond" />
          </div>
          <p className="section-lead">
            {isRTL 
              ? 'قائمة أصناف أولديش المعتمدة: الفطور، الشوربات، السلطات، المقبلات، السندوتشات، البيتزا والباستا، بأسعار واضحة ومكونات طازجة يومياً.' 
              : 'Verified Oldish menu: breakfast classics, soups, fresh salads, hot & cold appetizers, sandwiches, oven pizza, and pasta.'}
          </p>
        </div>

        {/* Menu Controls Container */}
        <div className="menu-controls">
          {/* Search Bar */}
          <div className="menu-search-box" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={18} className="menu-search-icon" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRTL ? 'ابحث في قائمة أولديش (فول، بيض، شوربة، بيتزا، باستا)...' : 'Search dishes (eggs, foul, soup, pizza, pasta)...'}
              className="menu-search-input"
              style={{ paddingInlineEnd: searchQuery ? '36px' : undefined }}
              aria-label={isRTL ? 'بحث في أصناف القائمة' : 'Search menu dishes'}
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

          {/* Category Tabs with Item Counts (hiding empty categories) */}
          <div className="category-pills" role="tablist" aria-label={isRTL ? 'تصنيفات قائمة الطعام' : 'Menu categories'}>
            <button
              type="button"
              className={`cat-pill ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
              role="tab"
              aria-selected={selectedCategory === 'all'}
            >
              {isRTL ? `جميع الأصناف (${totalVisibleCount})` : `All Dishes (${totalVisibleCount})`}
            </button>
            {activeCategoriesWithItems.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
                role="tab"
                aria-selected={selectedCategory === cat.id}
              >
                {isRTL ? `${cat.name_ar} (${cat.itemCount})` : `${cat.name_en} (${cat.itemCount})`}
              </button>
            ))}
          </div>

          {/* Secondary Controls Toolbar: Quick Tags, Advanced Filter Toggle, Sorting */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', width: '100%', maxWidth: '840px', margin: '0 auto' }}>
            {/* Quick Tag Pills */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label_en: 'All', label_ar: 'الكل' },
                { id: 'signature', label_en: '⭐ Most Ordered', label_ar: '⭐ الأكثر طلباً' },
                { id: 'vegetarian', label_en: '🌱 Vegetarian', label_ar: '🌱 نباتي' },
                { id: 'spicy', label_en: '🌶️ Spicy', label_ar: '🌶️ حار' },
              ].map(tf => (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => setSelectedTag(tf.id)}
                  style={{
                    fontSize: '0.75rem',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    border: selectedTag === tf.id ? '1px solid var(--color-gold, #886E42)' : '1px solid #D1D5DB',
                    background: selectedTag === tf.id ? 'var(--color-gold, #886E42)' : '#FFFFFF',
                    color: selectedTag === tf.id ? '#FFFFFF' : 'var(--color-charcoal, #222222)',
                    cursor: 'pointer',
                    fontWeight: selectedTag === tf.id ? 600 : 500,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isRTL ? tf.label_ar : tf.label_en}
                </button>
              ))}
            </div>

            {/* Advanced Filters & Sorting Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Sorting Select */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '4px', padding: '2px 8px' }}>
                <ArrowUpDown size={13} style={{ color: '#886E42' }} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  aria-label={isRTL ? 'ترتيب الأصناف' : 'Sort dishes'}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontSize: '0.75rem',
                    color: '#374151',
                    cursor: 'pointer',
                    outline: 'none',
                    padding: '4px 0'
                  }}
                >
                  <option value="default">{isRTL ? 'الترتيب الافتراضي' : 'Default Order'}</option>
                  <option value="price-asc">{isRTL ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
                  <option value="price-desc">{isRTL ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
                  <option value="alpha">{isRTL ? 'أبجدياً' : 'Alphabetical'}</option>
                </select>
              </div>

              {/* Advanced Filter Toggle */}
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: showAdvancedFilters ? 'var(--color-gold, #886E42)' : '#FFFFFF',
                  color: showAdvancedFilters ? '#FFFFFF' : '#374151',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px',
                  padding: '5px 10px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
                aria-expanded={showAdvancedFilters}
              >
                <SlidersHorizontal size={13} />
                <span>{isRTL ? 'تصفية إضافية' : 'Filters'}</span>
              </button>
            </div>
          </div>

          {/* Advanced Filter Panel (collapsible) */}
          {showAdvancedFilters && (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                padding: '16px',
                maxWidth: '840px',
                width: '100%',
                margin: '10px auto 0',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}
            >
              {/* Price Range Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4B5563', marginBottom: '6px' }}>
                  {isRTL ? 'نطاق السعر:' : 'Price Range:'}
                </label>
                <select
                  value={selectedPriceRange}
                  onChange={(e) => setSelectedPriceRange(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', fontSize: '0.8125rem', border: '1px solid #D1D5DB', borderRadius: '4px' }}
                >
                  <option value="all">{isRTL ? 'كل الأسعار' : 'All Prices'}</option>
                  <option value="under-50">{isRTL ? 'أقل من 50 ج.م' : 'Under 50 EGP'}</option>
                  <option value="50-100">{isRTL ? '50 – 100 ج.م' : '50 – 100 EGP'}</option>
                  <option value="100-150">{isRTL ? '100 – 150 ج.م' : '100 – 150 EGP'}</option>
                  <option value="over-150">{isRTL ? 'أكثر من 150 ج.م' : 'Over 150 EGP'}</option>
                </select>
              </div>

              {/* Availability Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4B5563', marginBottom: '6px' }}>
                  {isRTL ? 'حالة التوفر:' : 'Availability:'}
                </label>
                <select
                  value={selectedAvailability}
                  onChange={(e) => setSelectedAvailability(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', fontSize: '0.8125rem', border: '1px solid #D1D5DB', borderRadius: '4px' }}
                >
                  <option value="all">{isRTL ? 'جميع الحالات' : 'All Items'}</option>
                  <option value="available">{isRTL ? 'المتوفر الآن فقط' : 'Available Now Only'}</option>
                </select>
              </div>

              {/* Branch Availability Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4B5563', marginBottom: '6px' }}>
                  {isRTL ? 'الفرع:' : 'Branch:'}
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', fontSize: '0.8125rem', border: '1px solid #D1D5DB', borderRadius: '4px' }}
                >
                  <option value="all">{isRTL ? 'جميع الفروع (وسط البلد والزمالك)' : 'All Branches (Downtown & Zamalek)'}</option>
                  <option value="downtown-main">{isRTL ? 'فرع وسط البلد' : 'Downtown Cairo'}</option>
                  <option value="zamalek-secondary">{isRTL ? 'فرع الزمالك' : 'Zamalek'}</option>
                </select>
              </div>
            </div>
          )}

          {/* Result counter and reset button */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            maxWidth: '840px', 
            margin: '0 auto', 
            width: '100%',
            fontSize: '0.8125rem', 
            color: 'var(--color-text-muted)',
            paddingInline: '4px'
          }}>
            <span>
              {isRTL 
                ? `عرض ${displayedItems.length} من أصل ${filteredItems.length} صنف موثق`
                : `Showing ${displayedItems.length} of ${filteredItems.length} verified dishes`}
              {searchQuery && ` • ${isRTL ? 'نتائج البحث عن' : 'search for'} "${searchQuery}"`}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-gold, #886E42)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '0.8125rem',
                  padding: 0
                }}
              >
                {isRTL ? 'إعادة ضبط كل الفلاتر' : 'Reset all filters'}
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
            <p style={{ fontSize: '1.125rem', marginBottom: '12px' }}>
              {isRTL 
                ? 'لا توجد أطباق مطابقة لمعايير البحث المحددة.' 
                : 'No dishes match your selected filter criteria.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="btn btn-outline-gold btn-sm"
              >
                {isRTL ? 'إعادة ضبط الفلاتر وعرض القائمة' : 'Reset filters and view all dishes'}
              </button>
            )}
          </div>
        ) : (
          <div className="menu-grid">
            {displayedItems.map((item) => {
              const isUnavailable = item.is_unavailable || item.available === false;
              const formattedPrice = formatPrice(item, isRTL);
              const catObj = menuCategories.find(c => c.id === item.category_id);

              return (
                <article 
                  key={item.id} 
                  className="menu-card"
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    opacity: isUnavailable ? 0.75 : 1,
                    filter: isUnavailable ? 'grayscale(25%)' : undefined
                  }}
                  onClick={() => setActiveModalItem(item)}
                >
                  {/* Card Media with consistent aspect ratio & neutral fallback */}
                  <div className="menu-card-media" style={{ height: '190px', position: 'relative', overflow: 'hidden', background: '#F5EFE6' }}>
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={isRTL ? (item.image_alt_ar || item.name_ar) : (item.image_alt_en || item.name_en)}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div 
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-gold, #886E42)',
                          background: 'linear-gradient(135deg, #FAF6EE 0%, #EDE6D8 100%)'
                        }}
                      >
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(136, 110, 66, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                          <Utensils size={24} />
                        </div>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-charcoal, #222222)' }}>
                          {catObj ? (isRTL ? catObj.name_ar : catObj.name_en) : 'Oldish'}
                        </span>
                      </div>
                    )}

                    {/* Category pill on media */}
                    {catObj && (
                      <span 
                        className="badge" 
                        style={{
                          position: 'absolute',
                          top: '10px',
                          insetInlineStart: '10px',
                          background: 'rgba(22, 22, 22, 0.75)',
                          color: '#FAF8F5',
                          fontSize: '0.6875rem',
                          fontWeight: 500,
                          backdropFilter: 'blur(2px)'
                        }}
                      >
                        {isRTL ? catObj.name_ar : catObj.name_en}
                      </span>
                    )}

                    {/* Info Pill */}
                    <span
                      style={{
                        position: 'absolute',
                        top: '10px',
                        insetInlineEnd: '10px',
                        background: 'rgba(255, 255, 255, 0.85)',
                        color: 'var(--color-charcoal, #222222)',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                      title={isRTL ? 'عرض التفاصيل' : 'View details'}
                    >
                      <Info size={14} />
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="menu-card-body">
                    <div className="menu-card-header">
                      <div>
                        <h3 className="menu-dish-title">
                          {isRTL ? item.name_ar : item.name_en}
                        </h3>
                        <div style={{ fontSize: '0.8125rem', color: '#777', fontStyle: 'italic', marginTop: '2px' }}>
                          {isRTL ? item.name_en : item.name_ar}
                        </div>
                      </div>

                      {/* Clearly visible EGP Price */}
                      {siteSettings.show_prices && formattedPrice ? (
                        <span className="menu-dish-price" style={{ fontSize: '0.9375rem', fontWeight: 700 }}>
                          {formattedPrice}
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

                    {/* Verified Description */}
                    {(isRTL ? item.description_ar : item.description_en) ? (
                      <p className="menu-dish-desc">
                        {isRTL ? item.description_ar : item.description_en}
                      </p>
                    ) : (
                      <p className="menu-dish-desc" style={{ color: '#999', fontStyle: 'italic', fontSize: '0.8125rem' }}>
                        {isRTL ? 'طبق طازج يُعد يومياً بوصفة أولديش.' : 'Prepared fresh daily with Oldish recipe.'}
                      </p>
                    )}

                    {/* Badges Footer */}
                    <div className="menu-card-footer" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginTop: 'auto', paddingTop: '10px' }}>
                      {isUnavailable && (
                        <span className="badge" style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA', fontSize: '0.6875rem', fontWeight: 600 }}>
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

        {/* Show more button */}
        {!isSearching && visibleCount < filteredItems.length && (
          <div style={{ textAlign: 'center', marginTop: 'var(--space-8)' }} className="no-print">
            <button
              type="button"
              onClick={() => setVisibleCount(prev => prev + 12)}
              className="btn btn-outline-gold"
              style={{
                minWidth: '220px',
                padding: '12px 28px',
                fontSize: '0.9375rem',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(136, 110, 66, 0.15)',
                cursor: 'pointer'
              }}
            >
              {isRTL ? 'عرض المزيد' : 'Show more'}
            </button>
          </div>
        )}

        {/* Verified Pricing Disclosure Banner */}
        <div className="menu-disclaimer-banner" style={{ marginTop: 'var(--space-8)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <MapPin size={20} style={{ color: 'var(--color-gold, #886E42)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>{isRTL ? 'فروع أولديش وقائمة الأسعار:' : 'Oldish Branches & Menu Pricing:'}</strong>{' '}
              {isRTL 
                ? 'الأسعار المعروضة أعلاه موثقة بالجنيه المصري (EGP) بحسب القائمة الرسمية. فروعنا في خدمتكم بوسط البلد (20 شارع محمد محمود، تليفون: 01060119488) والزمالك (14 شارع طه حسين تقاطع المرعشلي، تليفون: 01000665331).' 
                : 'All listed prices are in Egyptian Pounds (EGP) based on verified in-house menu reference. Visit our Downtown branch (20 Mohamed Mahmoud St, Tel: 01060119488) or Zamalek branch (14 Taha Hussein St at Maraachli St, Tel: 01000665331).'}
            </div>
          </div>
        </div>

        {/* Quick Menu Link & PDF Request */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: 'var(--space-6)' }}>
          <Link to="/menu" className="btn btn-primary btn-sm">
            <span>{isRTL ? 'تصفح قائمة الطعام الكاملة المخصصة للطباعة' : 'Open Full Menu Page'}</span>
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

      {/* Product Details Modal */}
      <ProductDetailsModal
        item={activeModalItem}
        categories={menuCategories}
        branches={branches}
        onClose={() => setActiveModalItem(null)}
      />
    </section>
  );
};
