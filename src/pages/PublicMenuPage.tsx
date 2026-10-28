import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import type { MenuItem } from '../types';
import { 
  Search, 
  ArrowLeft, 
  ArrowRight, 
  Globe, 
  Phone, 
  ShoppingBag, 
  Star, 
  AlertCircle, 
  Printer, 
  MessageCircle,
  X,
  ArrowUpDown,
  SlidersHorizontal,
  Utensils
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNoIndex } from '../lib/seo';
import { EditableImageSlot } from '../components/EditableImageSlot';
import { searchMatches } from '../lib/searchUtils';
import { formatPrice, getItemPriceNumber } from '../lib/priceUtils';
import { ProductDetailsModal } from '../components/ProductDetailsModal';
import { FloatingQuickButtons } from '../components/FloatingQuickButtons';
import { toWhatsappNumber } from '../lib/whatsapp';

export const PublicMenuPage: React.FC = () => {
  useNoIndex();
  const { isRTL, language, toggleLanguage } = useLanguage();
  const { menuCategories, menuItems, siteSettings, branches, trackClick, isPreviewMode, isLoading } = useData();

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'alpha'>('default');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(12);
  const filterKey = `${selectedCategory}|${selectedTag}|${searchQuery}|${selectedPriceRange}|${selectedAvailability}|${selectedBranch}|${sortBy}`;
  const [prevFilterKey, setPrevFilterKey] = useState<string>(filterKey);

  // Reset pagination count during render when filters/search/category change
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setVisibleCount(12);
  }

  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  // Detail Modal State
  const [activeModalItem, setActiveModalItem] = useState<MenuItem | null>(null);

  // Print event handlers to guarantee all items are printed
  useEffect(() => {
    const handleBeforePrint = () => setIsPrinting(true);
    const handleAfterPrint = () => setIsPrinting(false);
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  // Customer published items
  const customerItems = useMemo(() => {
    return menuItems.filter(item => {
      if (!item.visible) return false;
      if (item.is_published === false) return false;
      if (item.is_sample && !isPreviewMode) return false;
      return true;
    });
  }, [menuItems, isPreviewMode]);

  // Categories with at least one active product
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

  const filteredItems = useMemo(() => {
    let result = customerItems.filter((item) => {
      // 1. Category Filter
      if (selectedCategory !== 'all' && item.category_id !== selectedCategory) {
        return false;
      }

      // 2. Search Query Filter
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

      // 6. Quick Tag Filter
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

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
    }, 50);
  };

  const isSearching = searchQuery.trim() !== '';
  const displayedItems = (isSearching || isPrinting) ? filteredItems : filteredItems.slice(0, visibleCount);
  const printOnlyItems = (!isSearching && !isPrinting) ? filteredItems.slice(visibleCount) : [];
  const itemsToRender = [
    ...displayedItems.map(item => ({ item, isPrintOnly: false })),
    ...printOnlyItems.map(item => ({ item, isPrintOnly: true }))
  ];

  const cleanWhatsapp = toWhatsappNumber(siteSettings.whatsapp);
  const hasWhatsapp = Boolean(cleanWhatsapp);
  const whatsappMessage = encodeURIComponent(
    isRTL 
      ? 'مرحباً، أود الاستفسار عن أصناف منيو مطعم وكافيه أولديش.' 
      : 'Hello! I would like to inquire about Oldish menu items.'
  );

  const downtownBranch = branches.find(b => b.id === 'downtown-main') || branches[0];
  const zamalekBranch = branches.find(b => b.id === 'zamalek-secondary') || branches[1];
  const dtPhone = downtownBranch?.phone || '01060119488';
  const zmPhone = zamalekBranch?.phone || '01000665331';
  const cleanDtPhone = dtPhone.replace(/\s+/g, '');
  const cleanZmPhone = zmPhone.replace(/\s+/g, '');

  return (
    <main id="main-content" className="standalone-menu-view">
      <a href="#main-content" className="skip-to-content">
        {isRTL ? 'تخطي إلى المحتوى الرئيسي' : 'Skip to main content'}
      </a>

      {/* Top Header Bar (Screen only) */}
      <header className="standalone-menu-header no-print">
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBlock: '12px' }}>
          <Link to="/" className="back-home-link" aria-label={isRTL ? 'العودة للرئيسية' : 'Back to main site'}>
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
              {isRTL ? 'مطعم · مقهى · حديقة' : 'Restaurant · Café · Garden'}
            </span>
            <h1 style={{ fontSize: '1.75rem', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-en-serif)', color: '#FFFFFF', margin: 0, fontWeight: 700 }}>
              {isRTL ? 'قائمة الطعام المعتمدة' : 'Official Restaurant Menu'}
            </h1>
          </div>
        </div>
      </div>

      {/* Print-Only Header Branding */}
      <div className="print-only" style={{ display: 'none', textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #886E42', paddingBottom: '12px' }}>
        <h1 style={{ fontSize: '24pt', margin: 0, fontFamily: 'serif', color: '#111' }}>Oldish — أولديش</h1>
        <p style={{ margin: '4px 0', fontSize: '10pt', color: '#555' }}>
          {isRTL 
            ? `وسط البلد: 20 شارع محمد محمود، خلف الجريك كامبس (${dtPhone}) • الزمالك: 14 شارع طه حسين تقاطع المرعشلي (${zmPhone})`
            : `Downtown: 20 Mohamed Mahmoud St (${dtPhone}) • Zamalek: 14 Taha Hussein St (${zmPhone})`}
        </p>
        <p style={{ margin: 0, fontSize: '9pt', color: '#777' }}>
          الأسعار بالجنيه المصري (EGP) شاملة ومحدثة بحسب القائمة المرجعية
        </p>
      </div>

      {/* Quick Action Buttons (Screen only) */}
      <div className="container no-print" style={{ paddingBlock: '16px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <a 
            href={`tel:${cleanDtPhone}`} 
            onClick={() => trackClick('calls')}
            className="btn btn-primary btn-sm"
          >
            <Phone size={14} />
            <span>{isRTL ? `وسط البلد: ${dtPhone}` : `Downtown: ${dtPhone}`}</span>
          </a>

          <a 
            href={`tel:${cleanZmPhone}`} 
            onClick={() => trackClick('calls')}
            className="btn btn-primary btn-sm"
            style={{ background: '#222222', borderColor: '#222222' }}
          >
            <Phone size={14} />
            <span>{isRTL ? `الزمالك: ${zmPhone}` : `Zamalek: ${zmPhone}`}</span>
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
              <span>{isRTL ? 'واتساب' : 'WhatsApp'}</span>
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
        </div>
      </div>

      {/* Sticky Search & Category Navigation (Screen only) */}
      <div className="sticky-menu-nav no-print">
        <div className="container">
          <div style={{ paddingBottom: '10px' }}>
            <div className="menu-search-box" style={{ maxWidth: '100%', position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={16} className="menu-search-icon" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRTL ? 'ابحث في قائمة أولديش (فول، بيض، شوربة، بيتزا، باستا)...' : 'Search dishes (eggs, foul, soup, pizza, pasta)...'}
                className="menu-search-input"
                style={{ 
                  paddingBlock: '9px', 
                  paddingInlineEnd: searchQuery ? '36px' : '12px', 
                  fontSize: '0.875rem',
                  width: '100%'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label={isRTL ? 'مسح البحث' : 'Clear search'}
                  style={{
                    position: 'absolute',
                    insetInlineEnd: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: '#888',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Category Scroll Strip (Only Categories with Items) */}
          <div className="category-scroll-strip" role="tablist" aria-label={isRTL ? 'أقسام قائمة الطعام' : 'Menu categories'}>
            <button
              type="button"
              role="tab"
              aria-selected={selectedCategory === 'all'}
              className={`cat-pill ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
              style={{ fontSize: '0.8125rem', padding: '6px 14px' }}
            >
              {isRTL ? `الكل (${totalVisibleCount})` : `All (${totalVisibleCount})`}
            </button>
            {activeCategoriesWithItems.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat.id}
                className={`cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
                style={{ fontSize: '0.8125rem', padding: '6px 14px' }}
              >
                {isRTL ? `${cat.name_ar} (${cat.itemCount})` : `${cat.name_en} (${cat.itemCount})`}
              </button>
            ))}
          </div>

          {/* Toolbar: Tag Filters, Sorting & Advanced Filter Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
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
                    padding: '4px 10px',
                    borderRadius: '16px',
                    border: selectedTag === tf.id ? '1px solid var(--color-gold, #886E42)' : '1px solid #D1D5DB',
                    background: selectedTag === tf.id ? 'var(--color-gold, #886E42)' : '#FFFFFF',
                    color: selectedTag === tf.id ? '#FFFFFF' : 'var(--color-charcoal, #222222)',
                    cursor: 'pointer',
                    fontWeight: selectedTag === tf.id ? 600 : 400,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {isRTL ? tf.label_ar : tf.label_en}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Sorting Select */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '4px', padding: '2px 6px' }}>
                <ArrowUpDown size={12} style={{ color: '#886E42' }} />
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
                    outline: 'none'
                  }}
                >
                  <option value="default">{isRTL ? 'الترتيب الافتراضي' : 'Default Order'}</option>
                  <option value="price-asc">{isRTL ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
                  <option value="price-desc">{isRTL ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
                  <option value="alpha">{isRTL ? 'أبجدياً' : 'Alphabetical'}</option>
                </select>
              </div>

              {/* Advanced Filter Toggle Button */}
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
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                <SlidersHorizontal size={12} />
                <span>{isRTL ? 'تصفية' : 'Filters'}</span>
              </button>
            </div>
          </div>

          {/* Collapsible Advanced Filters */}
          {showAdvancedFilters && (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                padding: '12px',
                marginTop: '10px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.06)'
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4B5563', marginBottom: '4px' }}>
                  {isRTL ? 'نطاق السعر:' : 'Price Range:'}
                </label>
                <select
                  value={selectedPriceRange}
                  onChange={(e) => setSelectedPriceRange(e.target.value)}
                  style={{ width: '100%', padding: '4px 6px', fontSize: '0.75rem', border: '1px solid #D1D5DB', borderRadius: '4px' }}
                >
                  <option value="all">{isRTL ? 'كل الأسعار' : 'All Prices'}</option>
                  <option value="under-50">{isRTL ? 'أقل من 50 ج.م' : 'Under 50 EGP'}</option>
                  <option value="50-100">{isRTL ? '50 – 100 ج.م' : '50 – 100 EGP'}</option>
                  <option value="100-150">{isRTL ? '100 – 150 ج.م' : '100 – 150 EGP'}</option>
                  <option value="over-150">{isRTL ? 'أكثر من 150 ج.م' : 'Over 150 EGP'}</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4B5563', marginBottom: '4px' }}>
                  {isRTL ? 'التوفر:' : 'Availability:'}
                </label>
                <select
                  value={selectedAvailability}
                  onChange={(e) => setSelectedAvailability(e.target.value)}
                  style={{ width: '100%', padding: '4px 6px', fontSize: '0.75rem', border: '1px solid #D1D5DB', borderRadius: '4px' }}
                >
                  <option value="all">{isRTL ? 'الكل' : 'All Items'}</option>
                  <option value="available">{isRTL ? 'المتوفر الآن فقط' : 'Available Now'}</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4B5563', marginBottom: '4px' }}>
                  {isRTL ? 'الفرع:' : 'Branch:'}
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  style={{ width: '100%', padding: '4px 6px', fontSize: '0.75rem', border: '1px solid #D1D5DB', borderRadius: '4px' }}
                >
                  <option value="all">{isRTL ? 'جميع الفروع (وسط البلد والزمالك)' : 'All Branches (Downtown & Zamalek)'}</option>
                  <option value="downtown-main">{isRTL ? 'فرع وسط البلد' : 'Downtown Cairo'}</option>
                  <option value="zamalek-secondary">{isRTL ? 'فرع الزمالك' : 'Zamalek'}</option>
                </select>
              </div>
            </div>
          )}

          {/* Search Result Status & Counter */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginTop: '8px', 
            fontSize: '0.75rem', 
            color: 'var(--color-text-muted)' 
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
                  fontSize: '0.75rem',
                  padding: 0
                }}
              >
                {isRTL ? 'إعادة ضبط التصفية' : 'Reset filters'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Items List */}
      <h2 className="sr-only">{isRTL ? 'أصناف قائمة الطعام' : 'Menu Items List'}</h2>
      <div className="container menu-print-container" style={{ paddingBlock: '24px', maxWidth: '840px' }}>
        {isLoading && menuItems.length === 0 ? (
          <div className="menu-items-grid" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="menu-item-card" style={{ background: '#FFFFFF', borderRadius: '6px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div className="skeleton-shimmer" style={{ width: '84px', height: '84px', borderRadius: '4px', flexShrink: 0 }} />
                <div style={{ flexGrow: 1 }}>
                  <div className="skeleton-shimmer" style={{ height: '20px', width: '50%', marginBottom: '10px' }} />
                  <div className="skeleton-shimmer" style={{ height: '14px', width: '85%', marginBottom: '6px' }} />
                  <div className="skeleton-shimmer" style={{ height: '14px', width: '30%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 10px', color: '#888' }}>
            <p style={{ fontSize: '1.0625rem', marginBottom: '10px' }}>
              {isRTL ? 'لا توجد أطباق مطابقة للبحث أو التصفية.' : 'No dishes found matching your criteria.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="btn btn-outline-gold btn-sm"
              >
                {isRTL ? 'إعادة ضبط الفلاتر' : 'Reset filters'}
              </button>
            )}
          </div>
        ) : (
          <div className="menu-items-grid" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {itemsToRender.map(({ item, isPrintOnly }) => {
              const isUnavailable = item.is_unavailable || item.available === false;
              const formattedPrice = formatPrice(item, isRTL);
              const catObj = menuCategories.find(c => c.id === item.category_id);

              return (
                <div 
                  key={item.id}
                  className={`menu-item-card ${isPrintOnly ? 'menu-item-print-only' : ''}`}
                  onClick={() => setActiveModalItem(item)}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '6px',
                    padding: '16px',
                    border: item.is_signature ? '1.5px solid var(--color-gold, #886E42)' : '1px solid rgba(0,0,0,0.08)',
                    display: isPrintOnly ? undefined : 'flex',
                    gap: '16px',
                    alignItems: 'flex-start',
                    boxShadow: item.is_signature ? '0 4px 12px rgba(136, 110, 66, 0.12)' : 'var(--shadow-subtle)',
                    opacity: isUnavailable ? 0.7 : 1,
                    filter: isUnavailable ? 'grayscale(30%)' : 'none',
                    pageBreakInside: 'avoid',
                    cursor: 'pointer'
                  }}
                >
                  {/* Photo or Neutral Placeholder */}
                  <div className="item-photo-wrap" style={{ width: '84px', height: '84px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, position: 'relative', background: '#F5EFE6' }}>
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={isRTL ? (item.image_alt_ar || item.name_ar) : (item.image_alt_en || item.name_en)} 
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #FAF6EE 0%, #EDE6D8 100%)', color: '#886E42' }}>
                        <Utensils size={28} />
                      </div>
                    )}
                  </div>

                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--color-charcoal, #222222)', margin: 0 }}>
                            {isRTL ? item.name_ar : item.name_en}
                          </h3>
                          {catObj && (
                            <span className="badge" style={{ background: '#F3F4F6', color: '#4B5563', fontSize: '0.625rem' }}>
                              {isRTL ? catObj.name_ar : catObj.name_en}
                            </span>
                          )}
                          {isUnavailable && (
                            <span className="badge" style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA', fontSize: '0.625rem', fontWeight: 600 }}>
                              {isRTL ? 'غير متوفر اليوم' : 'Unavailable today'}
                            </span>
                          )}
                          {item.is_signature && (
                            <span className="badge badge-gold" style={{ fontSize: '0.625rem', padding: '2px 6px' }}>
                              <Star size={9} fill="currentColor" />
                              <span>{isRTL ? 'مميز' : 'Signature'}</span>
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#777', fontStyle: 'italic', marginTop: '2px' }}>
                          {isRTL ? item.name_en : item.name_ar}
                        </div>
                      </div>

                      {/* Price Display */}
                      {siteSettings.show_prices && formattedPrice ? (
                        <span className="menu-dish-price" style={{ fontSize: '0.875rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {formattedPrice}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {isRTL ? 'بالقائمة الرسمية' : 'On venue menu'}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {(isRTL ? item.description_ar : item.description_en) ? (
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary, #555)', marginTop: '6px', lineHeight: '1.5', marginBottom: 0 }}>
                        {isRTL ? item.description_ar : item.description_en}
                      </p>
                    ) : (
                      <p style={{ fontSize: '0.8125rem', color: '#999', fontStyle: 'italic', marginTop: '4px', marginBottom: 0 }}>
                        {isRTL ? 'طبق طازج يُعد يومياً بوصفة أولديش.' : 'Prepared fresh daily with Oldish recipe.'}
                      </p>
                    )}

                    {/* Quick Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                        {item.tags.map((t, idx) => {
                          const tagLower = t.toLowerCase().trim();
                          if (tagLower === 'vegetarian' || tagLower === 'نباتي') {
                            return (
                              <span key={idx} className="badge" style={{ background: '#E6F4EA', color: '#137333', border: '1px solid #CEEAD6', fontSize: '0.625rem' }}>
                                🌱 {isRTL ? 'نباتي' : 'Vegetarian'}
                              </span>
                            );
                          }
                          if (tagLower === 'spicy' || tagLower === 'حار') {
                            return (
                              <span key={idx} className="badge" style={{ background: '#FCE8E6', color: '#C5221F', border: '1px solid #FAD2CF', fontSize: '0.625rem' }}>
                                🌶️ {isRTL ? 'حار' : 'Spicy'}
                              </span>
                            );
                          }
                          return (
                            <span key={idx} className="badge badge-gold" style={{ fontSize: '0.625rem' }}>
                              {t}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Show more button */}
        {!isSearching && visibleCount < filteredItems.length && (
          <div style={{ textAlign: 'center', marginTop: '24px' }} className="no-print">
            <button
              type="button"
              onClick={() => setVisibleCount(prev => prev + 12)}
              className="btn btn-outline-gold"
              style={{
                minWidth: '200px',
                padding: '10px 24px',
                fontSize: '0.875rem',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(136, 110, 66, 0.12)',
                cursor: 'pointer'
              }}
            >
              {isRTL ? 'عرض المزيد' : 'Show more'}
            </button>
          </div>
        )}

        {/* Pricing notice */}
        <div className="menu-disclaimer-banner no-print" style={{ marginTop: '24px' }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.8125rem' }}>
            {isRTL 
              ? 'الأسعار محددة بالجنيه المصري (EGP) بحسب القائمة الرسمية المعتمدة لفرعي أولديش بوسط البلد والزمالك.' 
              : 'All prices are in Egyptian Pounds (EGP) according to verified in-house menu reference for Oldish Downtown and Zamalek branches.'}
          </div>
        </div>
      </div>

      {/* Standalone Footer with Both Branches Info */}
      <footer className="no-print" style={{ background: '#1C1C1C', color: '#AAA', paddingBlock: '28px', textAlign: 'center', fontSize: '0.8125rem', marginTop: '40px' }}>
        <div className="container" style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', color: '#C5A880', fontWeight: 700 }}>
            Oldish • أولديش
          </div>
          <div>
            <strong>{isRTL ? 'فرع وسط البلد:' : 'Downtown Branch:'}</strong> {isRTL ? '20 شارع محمد محمود، خلف الجريك كامبس، عابدين' : '20 Mohamed Mahmoud St, behind Greek Campus, Abdeen'} • {isRTL ? 'هاتف:' : 'Tel:'} <a href={`tel:${cleanDtPhone}`} style={{ color: '#E0DDD7' }}>{dtPhone}</a>
          </div>
          <div>
            <strong>{isRTL ? 'فرع الزمالك:' : 'Zamalek Branch:'}</strong> {isRTL ? '14 شارع طه حسين تقاطع المرعشلي بجوار كنيسة العذراء مريم' : '14 Taha Hussein St at Maraachli St, next to Virgin Mary Church'} • {isRTL ? 'هاتف:' : 'Tel:'} <a href={`tel:${cleanZmPhone}`} style={{ color: '#E0DDD7' }}>{zmPhone}</a>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#777', marginTop: '6px' }}>
            {isRTL ? 'المطبخ المصري التراثي • يومياً من 8:00 صباحاً حتى 12:00 منتصف الليل' : 'Authentic Egyptian Cuisine • Every day 8:00 AM – 12:00 AM'}
          </div>
        </div>
      </footer>

      {/* Product Details Modal */}
      <ProductDetailsModal
        item={activeModalItem}
        categories={menuCategories}
        branches={branches}
        onClose={() => setActiveModalItem(null)}
      />
      <FloatingQuickButtons />
    </main>
  );
};
