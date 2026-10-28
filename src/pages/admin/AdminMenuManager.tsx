import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import type { MenuItem, MenuCategory } from '../../types';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  MoveUp, 
  MoveDown, 
  Eye, 
  EyeOff, 
  X, 
  Download, 
  Upload, 
  Search, 
  AlertCircle,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  FileCode,
  ShieldCheck,
  MapPin
} from 'lucide-react';
import { importVerifiedMenu, exportMenuToJSON, importMenuFromJSON } from '../../data/menuImport';

export const AdminMenuManager: React.FC = () => {
  const { 
    menuCategories, 
    menuItems, 
    mediaList,
    branches,
    siteSettings,
    updateSettings,
    addMenuCategory, 
    updateMenuCategory, 
    deleteMenuCategory,
    addMenuItem, 
    updateMenuItem, 
    deleteMenuItem,
    reorderMenuItems 
  } = useData();

  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'needs_review' | 'missing_desc' | 'missing_photo' | 'unpublished'>('all');
  
  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [catForm, setCatForm] = useState({ name_en: '', name_ar: '', visible: true });

  // Dish Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState<Partial<MenuItem>>({
    name_en: '',
    name_ar: '',
    description_en: '',
    description_ar: '',
    category_id: menuCategories[0]?.id || 'breakfast',
    price: '',
    price_min: null,
    price_max: null,
    image_url: '',
    image_alt_en: '',
    image_alt_ar: '',
    media_id: '',
    tags: [],
    is_signature: false,
    is_unavailable: false,
    is_sample: false,
    is_published: true,
    verification_status: 'verified',
    branch_availability: { 'downtown-main': true, 'zamalek-secondary': true },
    available: true,
    visible: true,
  });
  const [tagInput, setTagInput] = useState('');

  // Data Quality Metrics
  const auditMetrics = useMemo(() => {
    const total = menuItems.length;
    const verified = menuItems.filter(i => i.verification_status === 'verified').length;
    const published = menuItems.filter(i => i.is_published !== false && i.visible).length;
    const missingDesc = menuItems.filter(i => !i.description_en?.trim() && !i.description_ar?.trim()).length;
    const missingPhoto = menuItems.filter(i => !i.image_url?.trim()).length;
    const emptyCategories = menuCategories.filter(c => !menuItems.some(i => i.category_id === c.id)).length;

    return { total, verified, published, missingDesc, missingPhoto, emptyCategories };
  }, [menuItems, menuCategories]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      if (activeCategoryId !== 'all' && item.category_id !== activeCategoryId) return false;
      
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesEn = item.name_en.toLowerCase().includes(q) || item.description_en.toLowerCase().includes(q);
        const matchesAr = item.name_ar.includes(q) || item.description_ar.includes(q);
        if (!matchesEn && !matchesAr) return false;
      }

      // Tag filter
      if (filterTag === 'signature' && !item.is_signature) return false;
      if (filterTag === 'sample' && !item.is_sample) return false;
      if (filterTag === 'unavailable' && item.available) return false;
      if (filterTag === 'hidden' && item.visible) return false;

      // Status audit filter
      if (statusFilter === 'verified' && item.verification_status !== 'verified') return false;
      if (statusFilter === 'needs_review' && item.verification_status === 'verified') return false;
      if (statusFilter === 'missing_desc' && (item.description_en?.trim() || item.description_ar?.trim())) return false;
      if (statusFilter === 'missing_photo' && item.image_url?.trim()) return false;
      if (statusFilter === 'unpublished' && (item.is_published !== false && item.visible)) return false;

      return true;
    }).sort((a, b) => a.sort_order - b.sort_order);
  }, [menuItems, activeCategoryId, searchQuery, filterTag, statusFilter]);

  // Category Handlers
  const handleOpenCatModal = (cat?: MenuCategory) => {
    if (cat) {
      setEditingCategory(cat);
      setCatForm({ name_en: cat.name_en, name_ar: cat.name_ar, visible: cat.visible });
    } else {
      setEditingCategory(null);
      setCatForm({ name_en: '', name_ar: '', visible: true });
    }
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name_en.trim() || !catForm.name_ar.trim()) return;

    if (editingCategory) {
      updateMenuCategory(editingCategory.id, catForm);
    } else {
      const newId = `cat_${Date.now()}`;
      addMenuCategory({
        id: newId,
        slug: catForm.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name_en: catForm.name_en.trim(),
        name_ar: catForm.name_ar.trim(),
        sort_order: menuCategories.length,
        visible: catForm.visible
      });
    }
    setIsCatModalOpen(false);
  };

  const handleDeleteCategory = (cat: MenuCategory) => {
    const itemsCount = menuItems.filter(i => i.category_id === cat.id).length;
    if (itemsCount > 0) {
      alert(`لا يمكن حذف قسم "${cat.name_ar}" لأنه يحتوي على ${itemsCount} صنف. يرجى نقل أو حذف الأصناف أولاً.`);
      return;
    }
    if (confirm(`هل أنت متأكد من حذف قسم "${cat.name_ar}"؟`)) {
      deleteMenuCategory(cat.id);
      if (activeCategoryId === cat.id) setActiveCategoryId('all');
    }
  };

  // Dish Handlers
  const handleOpenItemModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        ...item,
        price: item.price || '',
        price_min: item.price_min ?? null,
        price_max: item.price_max ?? null,
        branch_availability: item.branch_availability || { 'downtown-main': true, 'zamalek-secondary': true },
        is_published: item.is_published ?? true,
        verification_status: item.verification_status || 'verified'
      });
      setTagInput(item.tags?.join(', ') || '');
    } else {
      setEditingItem(null);
      setItemForm({
        name_en: '',
        name_ar: '',
        description_en: '',
        description_ar: '',
        category_id: activeCategoryId !== 'all' ? activeCategoryId : (menuCategories[0]?.id || 'breakfast'),
        price: '',
        price_min: null,
        price_max: null,
        image_url: '',
        image_alt_en: '',
        image_alt_ar: '',
        media_id: '',
        tags: [],
        is_signature: false,
        is_unavailable: false,
        is_sample: false,
        is_published: true,
        verification_status: 'verified',
        branch_availability: { 'downtown-main': true, 'zamalek-secondary': true },
        available: true,
        visible: true,
      });
      setTagInput('');
    }
    setIsItemModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name_en?.trim() || !itemForm.name_ar?.trim() || !itemForm.category_id) return;

    const parsedTags = tagInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const dataToSave: Partial<MenuItem> = {
      ...itemForm,
      name_en: itemForm.name_en.trim(),
      name_ar: itemForm.name_ar.trim(),
      description_en: itemForm.description_en?.trim() || '',
      description_ar: itemForm.description_ar?.trim() || '',
      price: itemForm.price?.trim() ? itemForm.price.trim() : null,
      price_min: itemForm.price_min != null ? Number(itemForm.price_min) : null,
      price_max: itemForm.price_max != null ? Number(itemForm.price_max) : null,
      tags: parsedTags,
      is_published: itemForm.is_published ?? true,
      verification_status: itemForm.verification_status || 'verified',
      branch_availability: itemForm.branch_availability || { 'downtown-main': true, 'zamalek-secondary': true }
    };

    if (editingItem) {
      updateMenuItem(editingItem.id, dataToSave);
    } else {
      const newItemId = `item_${Date.now()}`;
      addMenuItem({
        id: newItemId,
        slug: itemForm.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category_id: itemForm.category_id,
        name_en: dataToSave.name_en!,
        name_ar: dataToSave.name_ar!,
        description_en: dataToSave.description_en!,
        description_ar: dataToSave.description_ar!,
        price: dataToSave.price,
        price_min: dataToSave.price_min,
        price_max: dataToSave.price_max,
        image_url: dataToSave.image_url,
        image_alt_en: dataToSave.image_alt_en,
        image_alt_ar: dataToSave.image_alt_ar,
        media_id: dataToSave.media_id,
        tags: parsedTags,
        is_signature: !!dataToSave.is_signature,
        is_sample: !!dataToSave.is_sample,
        is_published: dataToSave.is_published ?? true,
        verification_status: dataToSave.verification_status || 'verified',
        branch_availability: dataToSave.branch_availability,
        available: dataToSave.available ?? true,
        visible: dataToSave.visible ?? true,
        sort_order: menuItems.length
      });
    }
    setIsItemModalOpen(false);
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredItems.length) return;

    const newItems = [...menuItems];
    const itemA = filteredItems[index];
    const itemB = filteredItems[targetIndex];

    const idxA = newItems.findIndex(i => i.id === itemA.id);
    const idxB = newItems.findIndex(i => i.id === itemB.id);

    if (idxA !== -1 && idxB !== -1) {
      const tempOrder = newItems[idxA].sort_order;
      newItems[idxA].sort_order = newItems[idxB].sort_order;
      newItems[idxB].sort_order = tempOrder;
      reorderMenuItems(newItems);
    }
  };

  // CSV Export & Import
  const handleExportCSV = () => {
    const headers = ['id', 'category_id', 'name_en', 'name_ar', 'description_en', 'description_ar', 'price', 'is_signature', 'is_sample', 'available', 'visible', 'is_published', 'verification_status', 'tags'];
    const rows = menuItems.map(i => [
      i.id,
      i.category_id,
      `"${(i.name_en || '').replace(/"/g, '""')}"`,
      `"${(i.name_ar || '').replace(/"/g, '""')}"`,
      `"${(i.description_en || '').replace(/"/g, '""')}"`,
      `"${(i.description_ar || '').replace(/"/g, '""')}"`,
      i.price || '',
      i.is_signature ? 'true' : 'false',
      i.is_sample ? 'true' : 'false',
      i.available ? 'true' : 'false',
      i.visible ? 'true' : 'false',
      i.is_published !== false ? 'true' : 'false',
      i.verification_status || 'verified',
      `"${(i.tags || []).join(';')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `oldish_menu_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      try {
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length < 2) return;

        let addedCount = 0;
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"(.*)"$/, '$1'));
          if (cols.length >= 4) {
            const newItem: MenuItem = {
              id: cols[0] || `item_${Date.now()}_${i}`,
              category_id: cols[1] || menuCategories[0]?.id || 'breakfast',
              name_en: cols[2] || '',
              name_ar: cols[3] || '',
              description_en: cols[4] || '',
              description_ar: cols[5] || '',
              price: cols[6] ? cols[6] : null,
              is_signature: cols[7] === 'true',
              is_sample: cols[8] === 'true',
              available: cols[9] !== 'false',
              visible: cols[10] !== 'false',
              is_published: cols[11] !== 'false',
              verification_status: (cols[12] as any) || 'verified',
              tags: cols[13] ? cols[13].split(';') : [],
              sort_order: menuItems.length + addedCount
            };
            addMenuItem(newItem);
            addedCount++;
          }
        }
        alert(`تم استيراد ${addedCount} صنف بنجاح.`);
      } catch {
        alert('حدث خطأ أثناء قراءة ملف CSV. يرجى التأكد من التنسيق.');
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  // JSON Export & Import
  const handleExportJSON = () => {
    const jsonStr = exportMenuToJSON(menuCategories, menuItems);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `oldish_menu_verified_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const res = importMenuFromJSON(text, menuCategories, menuItems);
      if (!res.success) {
        alert(`خطأ في استيراد ملف JSON: ${res.error}`);
        return;
      }

      if (res.items && res.items.length > 0) {
        // Re-seed items
        reorderMenuItems(res.items);
        alert(`تم استيراد ${res.stats?.importedItems ?? 0} صنف وتحديث ${res.stats?.updatedItems ?? 0} صنف بنجاح.`);
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  // Reset to verified reference menu
  const handleResetToVerified = () => {
    if (confirm('هل ترغب في إعادة مزامنة كافة الأقسام (23 قسم) والأصناف الموثقة (63 صنف) من المصدر المرجعي المعتمد؟ سيتم تحديث الأسعار والبيانات المرجعية مع الحفاظ على التخصيصات.')) {
      const res = importVerifiedMenu(menuCategories, menuItems);
      reorderMenuItems(res.items);
      alert(`اكتملت المزامنة بنجاح! تم التحقق من 23 قسماً وتحديث ${res.items.length} صنفاً.`);
    }
  };

  return (
    <div className="admin-page-container">
      {/* Top Header & Price Visibility Toggle */}
      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '1.375rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={22} style={{ color: '#886E42' }} />
              <span>إدارة قائمة طعام أولديش (Menu Manager)</span>
            </h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
              التحكم في الـ 23 قسماً المعتمدة، الأصناف الموثقة، الأسعار بالجنيه المصري (EGP)، وتحديد الفروع المتاح بها كل صنف.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-outline-gold btn-sm"
              onClick={handleResetToVerified}
              title="إعادة مزامنة الأصناف الموثقة (63 صنف)"
            >
              <RefreshCw size={14} />
              <span>مزامنة الأصناف الموثقة</span>
            </button>

            <button
              type="button"
              className="btn btn-outline-gold btn-sm"
              onClick={handleExportJSON}
              title="تصدير المنيو كملف JSON"
            >
              <FileCode size={14} />
              <span>تصدير JSON</span>
            </button>

            <label className="btn btn-outline-gold btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
              <FileCode size={14} />
              <span>استيراد JSON</span>
              <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
            </label>

            <button
              type="button"
              className="btn btn-outline-gold btn-sm"
              onClick={handleExportCSV}
              title="تصدير المنيو إلى ملف CSV"
            >
              <Download size={14} />
              <span>تصدير CSV</span>
            </button>

            <label className="btn btn-outline-gold btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
              <Upload size={14} />
              <span>استيراد CSV</span>
              <input type="file" accept=".csv" onChange={handleImportCSV} style={{ display: 'none' }} />
            </label>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => handleOpenItemModal()}
            >
              <Plus size={16} />
              <span>إضافة صنف جديد</span>
            </button>
          </div>
        </div>

        {/* Global Price Toggle Switch */}
        <div 
          style={{ 
            marginTop: '18px', 
            padding: '14px 18px', 
            borderRadius: '6px', 
            background: siteSettings.show_prices ? '#F0FFF4' : '#FFFDF5',
            border: siteSettings.show_prices ? '1px solid #C6F6D5' : '1px solid #FEEBC8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} style={{ color: siteSettings.show_prices ? '#38A169' : '#DD6B20', flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '0.9375rem', color: '#2D3748' }}>
                {siteSettings.show_prices ? 'عرض الأسعار مفعل في الموقع العام' : 'عرض الأسعار معطل حالياً'}
              </strong>
              <div style={{ fontSize: '0.8125rem', color: '#718096', marginTop: '2px' }}>
                الأسعار معتمدة وموثقة بالجنيه المصري (EGP) بحسب القائمة المرجعية داخل المكان.
              </div>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={siteSettings.show_prices}
              onChange={(e) => updateSettings({ show_prices: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>إظهار الأسعار للزوار</span>
          </label>
        </div>
      </div>

      {/* Data Quality & Audit Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div className="admin-card" style={{ padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>{auditMetrics.total}</div>
          <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>إجمالي الأصناف</div>
        </div>

        <div className="admin-card" style={{ padding: '14px', textAlign: 'center', borderRight: '3px solid #10B981' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10B981' }}>{auditMetrics.verified}</div>
          <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>أصناف موثقة رسمياً</div>
        </div>

        <div className="admin-card" style={{ padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3B82F6' }}>{auditMetrics.published}</div>
          <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>أصناف منشورة للجمهور</div>
        </div>

        <div className="admin-card" style={{ padding: '14px', textAlign: 'center', borderRight: '3px solid #F59E0B' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F59E0B' }}>{auditMetrics.emptyCategories}</div>
          <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>أقسام بانتظار إدخال الأصناف</div>
        </div>

        <div className="admin-card" style={{ padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6B7280' }}>{auditMetrics.missingPhoto}</div>
          <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>أصناف بدون صور فعلية</div>
        </div>
      </div>

      {/* Categories Bar (All 23 Categories Preserved in Admin) */}
      <div className="admin-card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-charcoal)' }}>
              أقسام قائمة الطعام (23 قسم معتمد)
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#888' }}>
              الأقسام التي لا تحتوي على أصناف منشورة تُحجب تلقائياً عن الموقع العام وتظهر هنا للإدارة.
            </span>
          </div>
          <button 
            type="button" 
            className="btn btn-outline-gold btn-sm"
            onClick={() => handleOpenCatModal()}
          >
            <Plus size={14} />
            <span>إضافة قسم جديد</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className={`admin-category-pill ${activeCategoryId === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategoryId('all')}
          >
            الكل ({menuItems.length})
          </button>

          {menuCategories.map((cat) => {
            const count = menuItems.filter(i => i.category_id === cat.id).length;
            const isActive = activeCategoryId === cat.id;
            const isEmpty = count === 0;

            return (
              <div key={cat.id} style={{ display: 'inline-flex', alignItems: 'center' }} className={`admin-category-pill-group ${isActive ? 'active' : ''}`}>
                <button
                  type="button"
                  className={`admin-category-pill ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveCategoryId(cat.id)}
                  style={{ 
                    borderTopRightRadius: '20px', 
                    borderBottomRightRadius: '20px', 
                    borderTopLeftRadius: 0, 
                    borderBottomLeftRadius: 0,
                    opacity: isEmpty ? 0.7 : 1
                  }}
                  title={isEmpty ? 'قسم فارغ (بانتظار إضافة أصناف موثقة)' : undefined}
                >
                  {cat.name_ar} ({count})
                </button>
                <button
                  type="button"
                  title="تعديل القسم"
                  onClick={() => handleOpenCatModal(cat)}
                  style={{
                    background: isActive ? 'var(--color-gold, #886E42)' : '#eee',
                    color: isActive ? '#fff' : '#666',
                    border: 'none',
                    padding: '6px 6px',
                    cursor: 'pointer'
                  }}
                >
                  <Edit3 size={13} />
                </button>
                <button
                  type="button"
                  title="حذف القسم"
                  onClick={() => handleDeleteCategory(cat)}
                  style={{
                    background: isActive ? 'var(--color-gold, #886E42)' : '#eee',
                    color: isActive ? '#fff' : '#999',
                    border: 'none',
                    padding: '6px 8px 6px 6px',
                    borderTopLeftRadius: '20px',
                    borderBottomLeftRadius: '20px',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-card" style={{ marginBottom: '20px', padding: '14px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {/* Search box */}
          <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
            <Search size={16} style={{ position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)', color: '#999' }} />
            <input
              type="text"
              placeholder="بحث في الأصناف والوصف..."
              className="form-input"
              style={{ paddingRight: '36px', height: '38px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status & Tag Filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="form-input"
              style={{ width: 'auto', height: '38px', fontSize: '0.8125rem' }}
            >
              <option value="all">كل حالات التوثيق</option>
              <option value="verified">موثق رسمياً</option>
              <option value="needs_review">بحاجة لمراجعة</option>
              <option value="missing_desc">بدون وصف</option>
              <option value="missing_photo">بدون صورة</option>
              <option value="unpublished">مسودة غير منشورة</option>
            </select>

            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="form-input"
              style={{ width: 'auto', height: '38px', fontSize: '0.8125rem' }}
            >
              <option value="all">كل العلامات</option>
              <option value="signature">الأصناف المميزة (Signature)</option>
              <option value="sample">أصناف توضيحية (Sample)</option>
              <option value="unavailable">غير متوفر اليوم</option>
              <option value="hidden">مخفي عن الزوار</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>ترتيب</th>
                <th style={{ width: '60px' }}>الصورة</th>
                <th>اسم الصنف</th>
                <th>القسم</th>
                <th>السعر (EGP)</th>
                <th>التوثيق</th>
                <th>التوفر</th>
                <th>النشر للجمهور</th>
                <th style={{ width: '120px', textAlign: 'center' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#888' }}>
                    لا توجد أصناف تطابق معايير البحث والفلترة.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => {
                  const cat = menuCategories.find(c => c.id === item.category_id);
                  const isVerified = item.verification_status === 'verified';
                  const isPublished = item.is_published !== false && item.visible;

                  return (
                    <tr key={item.id}>
                      {/* Sort Controls */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <button
                            type="button"
                            className="btn-icon-subtle"
                            disabled={index === 0}
                            onClick={() => handleMoveItem(index, 'up')}
                            title="تحريك لأعلى"
                          >
                            <MoveUp size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon-subtle"
                            disabled={index === filteredItems.length - 1}
                            onClick={() => handleMoveItem(index, 'down')}
                            title="تحريك لأسفل"
                          >
                            <MoveDown size={13} />
                          </button>
                        </div>
                      </td>

                      {/* Image Thumbnail */}
                      <td>
                        <div 
                          style={{ 
                            width: '44px', 
                            height: '44px', 
                            borderRadius: '4px', 
                            background: '#F0ECE1', 
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {item.image_url ? (
                            <img 
                              src={item.image_url} 
                              alt={item.name_ar} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            />
                          ) : (
                            <ImageIcon size={18} style={{ color: '#aaa' }} />
                          )}
                        </div>
                      </td>

                      {/* Name & Desc */}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-charcoal)' }}>
                          {item.name_ar}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: '#777', direction: 'ltr', textAlign: 'right' }}>
                          {item.name_en}
                        </div>
                        {item.description_ar ? (
                          <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '3px', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.description_ar}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.75rem', color: '#AAA', fontStyle: 'italic', marginTop: '2px' }}>
                            (الوصف غير متوفر)
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td>
                        <span className="badge badge-light">
                          {cat?.name_ar || item.category_id}
                        </span>
                      </td>

                      {/* Price */}
                      <td>
                        {item.price_min != null && item.price_max != null ? (
                          <span style={{ fontWeight: 600, color: 'var(--color-gold, #886E42)' }}>
                            {item.price_min} – {item.price_max} ج.م
                          </span>
                        ) : item.price ? (
                          <span style={{ fontWeight: 600, color: 'var(--color-gold, #886E42)' }}>
                            {item.price} ج.م
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#999', fontStyle: 'italic' }}>
                            غير محدد
                          </span>
                        )}
                      </td>

                      {/* Verification Status */}
                      <td>
                        {isVerified ? (
                          <span className="badge" style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', fontSize: '0.6875rem' }}>
                            <CheckCircle2 size={11} style={{ marginLeft: '3px' }} />
                            موثق
                          </span>
                        ) : (
                          <span className="badge" style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', fontSize: '0.6875rem' }}>
                            مراجعة
                          </span>
                        )}
                      </td>

                      {/* Availability */}
                      <td>
                        <button
                          type="button"
                          className={`status-pill ${item.available ? 'active' : 'inactive'}`}
                          onClick={() => updateMenuItem(item.id, { available: !item.available })}
                          title="اضغط لتغيير حالة التوفر"
                        >
                          {item.available ? 'متاح' : 'غير متوفر'}
                        </button>
                      </td>

                      {/* Published to Public Menu */}
                      <td>
                        <button
                          type="button"
                          className="btn-icon-subtle"
                          onClick={() => updateMenuItem(item.id, { is_published: !isPublished, visible: !isPublished })}
                          title={isPublished ? 'منشور للجمهور (اضغط للإخفاء)' : 'مخفي عن الجمهور (اضغط للنشر)'}
                        >
                          {isPublished ? <Eye size={17} style={{ color: '#10B981' }} /> : <EyeOff size={17} style={{ color: '#EF4444' }} />}
                        </button>
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn-icon-subtle"
                            title="تعديل الصنف"
                            onClick={() => handleOpenItemModal(item)}
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon-subtle text-danger"
                            title="حذف الصنف"
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف صنف "${item.name_ar}"؟`)) {
                                deleteMenuItem(item.id);
                              }
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Modal */}
      {isCatModalOpen && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal" style={{ maxWidth: '440px' }}>
            <div className="admin-modal-header">
              <h3>{editingCategory ? 'تعديل قسم' : 'إضافة قسم جديد'}</h3>
              <button type="button" className="btn-icon-subtle" onClick={() => setIsCatModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveCategory}>
              <div className="admin-modal-body">
                <div className="form-group">
                  <label className="form-label">الاسم بالعربية *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={catForm.name_ar}
                    onChange={(e) => setCatForm({ ...catForm, name_ar: e.target.value })}
                    placeholder="مثال: الفطور"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Name in English *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    dir="ltr"
                    value={catForm.name_en}
                    onChange={(e) => setCatForm({ ...catForm, name_en: e.target.value })}
                    placeholder="e.g. Breakfast"
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={catForm.visible}
                      onChange={(e) => setCatForm({ ...catForm, visible: e.target.checked })}
                    />
                    <span>نشط / مفعل</span>
                  </label>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsCatModalOpen(false)}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary">
                  حفظ القسم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dish Modal */}
      {isItemModalOpen && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal" style={{ maxWidth: '640px' }}>
            <div className="admin-modal-header">
              <h3>{editingItem ? 'تعديل صنف' : 'إضافة صنف جديد'}</h3>
              <button type="button" className="btn-icon-subtle" onClick={() => setIsItemModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveItem}>
              <div className="admin-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">الاسم بالعربية *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={itemForm.name_ar || ''}
                      onChange={(e) => setItemForm({ ...itemForm, name_ar: e.target.value })}
                      placeholder="مثال: ميكس جبن"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Name in English *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      dir="ltr"
                      value={itemForm.name_en || ''}
                      onChange={(e) => setItemForm({ ...itemForm, name_en: e.target.value })}
                      placeholder="e.g. Cheese Mix"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">القسم *</label>
                  <select
                    required
                    className="form-input"
                    value={itemForm.category_id || ''}
                    onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}
                  >
                    {menuCategories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name_ar} ({c.name_en})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">الوصف بالعربية</label>
                  <textarea
                    rows={2}
                    className="form-input"
                    value={itemForm.description_ar || ''}
                    onChange={(e) => setItemForm({ ...itemForm, description_ar: e.target.value })}
                    placeholder="وصف تفصيلي للطبق ومكوناته وطريقة تقديمه..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description (English)</label>
                  <textarea
                    rows={2}
                    className="form-input"
                    dir="ltr"
                    value={itemForm.description_en || ''}
                    onChange={(e) => setItemForm({ ...itemForm, description_en: e.target.value })}
                    placeholder="Detailed dish description in English..."
                  />
                </div>

                {/* Price and Price Range */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">
                      السعر (EGP)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={itemForm.price || ''}
                      onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                      placeholder="مثال: 99 أو 64 – 74"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      أدنى سعر (نطاق)
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      value={itemForm.price_min ?? ''}
                      onChange={(e) => setItemForm({ ...itemForm, price_min: e.target.value ? Number(e.target.value) : null })}
                      placeholder="مثال: 64"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      أعلى سعر (نطاق)
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      value={itemForm.price_max ?? ''}
                      onChange={(e) => setItemForm({ ...itemForm, price_max: e.target.value ? Number(e.target.value) : null })}
                      placeholder="مثال: 74"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="form-group">
                  <label className="form-label">العلامات (مفصولة بفاصلة)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="طاجن, لحوم, حار, نباتي"
                  />
                </div>

                {/* Image and Alt Text */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">صورة الصنف</label>
                    <input
                      type="text"
                      className="form-input"
                      dir="ltr"
                      placeholder="رابط الصورة أو مسارها..."
                      value={itemForm.image_url || ''}
                      onChange={(e) => setItemForm({ ...itemForm, image_url: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">اختيار من الوسائط</label>
                    <select
                      className="form-input"
                      value={itemForm.media_id || ''}
                      onChange={(e) => {
                        const mid = e.target.value;
                        const found = mediaList.find(m => m.id === mid);
                        setItemForm({
                          ...itemForm,
                          media_id: mid,
                          image_url: found ? found.public_url : itemForm.image_url
                        });
                      }}
                    >
                      <option value="">-- اختر من مكتبة الوسائط --</option>
                      {mediaList.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.alt_ar || m.alt_en}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Image Alt Texts */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">النص البديل للصورة (عربي)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="وصف صورة الطبق..."
                      value={itemForm.image_alt_ar || ''}
                      onChange={(e) => setItemForm({ ...itemForm, image_alt_ar: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Image Alt Text (English)</label>
                    <input
                      type="text"
                      className="form-input"
                      dir="ltr"
                      placeholder="Alt text for dish image..."
                      value={itemForm.image_alt_en || ''}
                      onChange={(e) => setItemForm({ ...itemForm, image_alt_en: e.target.value })}
                    />
                  </div>
                </div>

                {/* Branch Availability */}
                <div style={{ background: '#FAF8F5', padding: '12px', borderRadius: '6px', marginBottom: '14px' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <MapPin size={14} style={{ color: '#886E42' }} />
                    <span>توفر الصنف بالفروع (Branch Availability)</span>
                  </label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    {branches.map(b => (
                      <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8125rem' }}>
                        <input
                          type="checkbox"
                          checked={itemForm.branch_availability?.[b.id] ?? true}
                          onChange={(e) => {
                            setItemForm({
                              ...itemForm,
                              branch_availability: {
                                ...(itemForm.branch_availability || {}),
                                [b.id]: e.target.checked
                              }
                            });
                          }}
                        />
                        <span>{b.name_ar}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Toggles & Verification */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#F9F8F5', padding: '14px', borderRadius: '6px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">حالة التوثيق (Verification)</label>
                    <select
                      className="form-input"
                      value={itemForm.verification_status || 'verified'}
                      onChange={(e) => setItemForm({ ...itemForm, verification_status: e.target.value as any })}
                    >
                      <option value="verified">✅ موثق من القائمة المرجعية</option>
                      <option value="needs_review">⚠️ بحاجة لمراجعة أو تسعير</option>
                      <option value="unverified">❓ غير موثق / مسودة</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={itemForm.is_published ?? true}
                        onChange={(e) => setItemForm({ ...itemForm, is_published: e.target.checked, visible: e.target.checked })}
                      />
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>👁️ نشر على الموقع العام</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={itemForm.available ?? true}
                        onChange={(e) => setItemForm({ ...itemForm, available: e.target.checked })}
                      />
                      <span style={{ fontSize: '0.875rem' }}>✅ متاح للطلب اليوم</span>
                    </label>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={itemForm.is_signature || false}
                      onChange={(e) => setItemForm({ ...itemForm, is_signature: e.target.checked })}
                    />
                    <span style={{ fontSize: '0.875rem' }}>⭐ طبق مميز (Signature)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={itemForm.is_unavailable || false}
                      onChange={(e) => setItemForm({ ...itemForm, is_unavailable: e.target.checked })}
                    />
                    <span style={{ fontSize: '0.875rem' }}>🚫 غير متوفر مؤقتاً</span>
                  </label>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsItemModalOpen(false)}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary">
                  حفظ الصنف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
