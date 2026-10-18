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
  Star, 
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';

export const AdminMenuManager: React.FC = () => {
  const { 
    menuCategories, 
    menuItems, 
    mediaList,
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
    category_id: menuCategories[0]?.id || '',
    price: '',
    image_url: '',
    media_id: '',
    tags: [],
    is_signature: false,
    is_sample: false,
    available: true,
    visible: true,
  });
  const [tagInput, setTagInput] = useState('');

  // Filtered items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      if (activeCategoryId !== 'all' && item.category_id !== activeCategoryId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesEn = item.name_en.toLowerCase().includes(q) || item.description_en.toLowerCase().includes(q);
        const matchesAr = item.name_ar.includes(q) || item.description_ar.includes(q);
        if (!matchesEn && !matchesAr) return false;
      }
      if (filterTag === 'signature' && !item.is_signature) return false;
      if (filterTag === 'sample' && !item.is_sample) return false;
      if (filterTag === 'unavailable' && item.available) return false;
      if (filterTag === 'hidden' && item.visible) return false;
      return true;
    }).sort((a, b) => a.sort_order - b.sort_order);
  }, [menuItems, activeCategoryId, searchQuery, filterTag]);

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
        price: item.price || ''
      });
      setTagInput(item.tags?.join(', ') || '');
    } else {
      setEditingItem(null);
      setItemForm({
        name_en: '',
        name_ar: '',
        description_en: '',
        description_ar: '',
        category_id: activeCategoryId !== 'all' ? activeCategoryId : (menuCategories[0]?.id || ''),
        price: '',
        image_url: '',
        media_id: '',
        tags: [],
        is_signature: false,
        is_sample: false,
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

    const dataToSave = {
      ...itemForm,
      name_en: itemForm.name_en.trim(),
      name_ar: itemForm.name_ar.trim(),
      description_en: itemForm.description_en?.trim() || '',
      description_ar: itemForm.description_ar?.trim() || '',
      price: itemForm.price?.trim() ? itemForm.price.trim() : null,
      tags: parsedTags,
    };

    if (editingItem) {
      updateMenuItem(editingItem.id, dataToSave);
    } else {
      const newItemId = `item_${Date.now()}`;
      addMenuItem({
        id: newItemId,
        category_id: itemForm.category_id,
        name_en: dataToSave.name_en,
        name_ar: dataToSave.name_ar,
        description_en: dataToSave.description_en,
        description_ar: dataToSave.description_ar,
        price: dataToSave.price,
        image_url: dataToSave.image_url,
        media_id: dataToSave.media_id,
        tags: parsedTags,
        is_signature: !!dataToSave.is_signature,
        is_sample: !!dataToSave.is_sample,
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
    const headers = ['id', 'category_id', 'name_en', 'name_ar', 'description_en', 'description_ar', 'price', 'is_signature', 'is_sample', 'available', 'visible', 'tags'];
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
              category_id: cols[1] || menuCategories[0]?.id || 'tagines',
              name_en: cols[2] || '',
              name_ar: cols[3] || '',
              description_en: cols[4] || '',
              description_ar: cols[5] || '',
              price: cols[6] ? cols[6] : null,
              is_signature: cols[7] === 'true',
              is_sample: cols[8] === 'true',
              available: cols[9] !== 'false',
              visible: cols[10] !== 'false',
              tags: cols[11] ? cols[11].split(';') : [],
              sort_order: menuItems.length + addedCount
            };
            addMenuItem(newItem);
            addedCount++;
          }
        }
        alert(`تم استيراد ${addedCount} صنف بنجاح.`);
      } catch (_err) {
        alert('حدث خطأ أثناء قراءة ملف CSV. يرجى التأكد من التنسيق.');
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  return (
    <div className="admin-page-container">
      {/* Top Header & Price Visibility Toggle */}
      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '1.375rem' }}>إدارة قائمة الطعام (Menu Manager)</h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
              التحكم في الأقسام، الأصناف، الأسعار الرسمية، وعلامات الأطباق التوضيحية أو المميزة.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-outline-gold btn-sm"
              onClick={handleExportCSV}
              title="تصدير المنيو إلى ملف CSV"
            >
              <Download size={15} />
              <span>تصدير CSV</span>
            </button>

            <label className="btn btn-outline-gold btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
              <Upload size={15} />
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

        {/* Global Price Toggle Warning & Switch */}
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
                {siteSettings.show_prices ? 'عرض الأسعار مفعل في الموقع العام' : 'عرض الأسعار معطل حالياً (موصى به لحين اعتماد المالك)'}
              </strong>
              <div style={{ fontSize: '0.8125rem', color: '#718096', marginTop: '2px' }}>
                المصدر الموثق لأولديش لا ينشر أسعاراً ثابتة على السوشيال ميديا. لإظهار الأسعار للزوار يجب تفعيل هذا الخيار بعد التأكد من أسعار المنيو.
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

      {/* Categories Bar */}
      <div className="admin-card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-charcoal)' }}>أقسام المنيو (Categories)</h3>
          <button 
            type="button" 
            className="btn btn-outline-gold btn-sm"
            onClick={() => handleOpenCatModal()}
          >
            <Plus size={14} />
            <span>إضافة قسم</span>
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

            return (
              <div key={cat.id} style={{ display: 'inline-flex', alignItems: 'center' }} className={`admin-category-pill-group ${isActive ? 'active' : ''}`}>
                <button
                  type="button"
                  className={`admin-category-pill ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveCategoryId(cat.id)}
                  style={{ borderTopRightRadius: '20px', borderBottomRightRadius: '20px', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                >
                  {cat.name_ar} ({count})
                </button>
                <button
                  type="button"
                  title="تعديل القسم"
                  onClick={() => handleOpenCatModal(cat)}
                  style={{
                    background: isActive ? 'var(--color-gold)' : '#eee',
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
                    background: isActive ? 'var(--color-gold)' : '#eee',
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
          <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingRight: '36px' }}
              placeholder="البحث باسم الصنف أو الوصف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Tag filters */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8125rem', color: '#777' }}>فلترة:</span>
            {[
              { id: 'all', label: 'الكل' },
              { id: 'signature', label: 'أطباق مميزة' },
              { id: 'sample', label: 'أطباق توضيحية' },
              { id: 'unavailable', label: 'غير متاح' },
              { id: 'hidden', label: 'مخفي' },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                className={`filter-btn ${filterTag === f.id ? 'active' : ''}`}
                onClick={() => setFilterTag(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dishes Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>الترتيب</th>
                <th style={{ width: '60px' }}>الصورة</th>
                <th>اسم الصنف</th>
                <th>القسم</th>
                <th>السعر</th>
                <th>العلامات</th>
                <th>الحالة</th>
                <th>الظهور</th>
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
                        {item.description_ar && (
                          <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '3px', maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.description_ar}
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
                        {item.price ? (
                          <span style={{ fontWeight: 600, color: 'var(--color-gold)' }}>
                            {item.price}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#999', fontStyle: 'italic' }}>
                            غير محدد
                          </span>
                        )}
                      </td>

                      {/* Badges / Tags */}
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {item.is_signature && (
                            <span className="badge badge-gold" title="طبق مميز من توقيع أولديش">
                              <Star size={11} style={{ marginLeft: '3px' }} />
                              مميز
                            </span>
                          )}
                          {item.is_sample && (
                            <span className="badge badge-warning" title="طبق توضيحي بانتظار تأكيد المالك">
                              توضيحي
                            </span>
                          )}
                          {(item.tags || []).map((t, idx) => (
                            <span key={idx} className="badge badge-subtle">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Availability */}
                      <td>
                        <button
                          type="button"
                          className={`status-pill ${item.available ? 'active' : 'inactive'}`}
                          onClick={() => updateMenuItem(item.id, { available: !item.available })}
                          title="اضغط لتغيير حالة التوفر"
                        >
                          {item.available ? 'متاح اليوم' : 'غير متوفر'}
                        </button>
                      </td>

                      {/* Visibility */}
                      <td>
                        <button
                          type="button"
                          className="btn-icon-subtle"
                          onClick={() => updateMenuItem(item.id, { visible: !item.visible })}
                          title={item.visible ? 'ظاهر للزوار (اضغط للإخفاء)' : 'مخفي عن الزوار (اضغط للإظهار)'}
                        >
                          {item.visible ? <Eye size={17} style={{ color: '#38A169' }} /> : <EyeOff size={17} style={{ color: '#E53E3E' }} />}
                        </button>
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn-icon-subtle"
                            onClick={() => handleOpenItemModal(item)}
                            title="تعديل الصنف"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon-subtle delete"
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف الصنف "${item.name_ar}"؟`)) {
                                deleteMenuItem(item.id);
                              }
                            }}
                            title="حذف الصنف"
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
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <h3>{editingCategory ? 'تعديل قسم' : 'إضافة قسم جديد'}</h3>
              <button type="button" className="btn-close" onClick={() => setIsCatModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory}>
              <div className="admin-modal-body">
                <div className="form-group">
                  <label className="form-label">اسم القسم بالعربية</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={catForm.name_ar}
                    onChange={(e) => setCatForm({ ...catForm, name_ar: e.target.value })}
                    placeholder="مثال: طواجن أولديش الفخارية"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category Name (English)</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    dir="ltr"
                    value={catForm.name_en}
                    onChange={(e) => setCatForm({ ...catForm, name_en: e.target.value })}
                    placeholder="e.g. Clay Tagines"
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={catForm.visible}
                      onChange={(e) => setCatForm({ ...catForm, visible: e.target.checked })}
                    />
                    <span>ظهور القسم في الموقع</span>
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

      {/* Dish Item Modal */}
      {isItemModalOpen && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-card" style={{ maxWidth: '640px' }}>
            <div className="admin-modal-header">
              <h3>{editingItem ? 'تعديل صنف' : 'إضافة صنف جديد للقائمة'}</h3>
              <button type="button" className="btn-close" onClick={() => setIsItemModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveItem}>
              <div className="admin-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">الاسم بالعربية *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={itemForm.name_ar || ''}
                      onChange={(e) => setItemForm({ ...itemForm, name_ar: e.target.value })}
                      placeholder="مثال: طاجن بامية باللحمة البلدي"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Name (English) *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      dir="ltr"
                      value={itemForm.name_en || ''}
                      onChange={(e) => setItemForm({ ...itemForm, name_en: e.target.value })}
                      placeholder="e.g. Okra with Beef Tagine"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">القسم *</label>
                  <select
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">
                      السعر (اختياري)
                      <span style={{ fontSize: '0.75rem', color: '#888', marginRight: '6px' }}>(اتركه فارغاً إذا لم يعتمد)</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={itemForm.price || ''}
                      onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                      placeholder="مثال: 195 ج.م"
                    />
                  </div>

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
                </div>

                {/* Media Image Selector */}
                <div className="form-group">
                  <label className="form-label">صورة الصنف</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
                          {m.alt_ar || m.alt_en} ({m.is_ai ? 'توضيحية' : 'حقيقية'})
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      className="form-input"
                      dir="ltr"
                      placeholder="أو رابط صورة مباشر..."
                      value={itemForm.image_url || ''}
                      onChange={(e) => setItemForm({ ...itemForm, image_url: e.target.value })}
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px', background: '#F9F8F5', padding: '14px', borderRadius: '6px' }}>
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
                      checked={itemForm.is_sample || false}
                      onChange={(e) => setItemForm({ ...itemForm, is_sample: e.target.checked })}
                    />
                    <span style={{ fontSize: '0.875rem' }}>🏷️ طبق توضيحي (Sample)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={itemForm.available ?? true}
                      onChange={(e) => setItemForm({ ...itemForm, available: e.target.checked })}
                    />
                    <span style={{ fontSize: '0.875rem' }}>✅ متاح في القائمة</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={itemForm.visible ?? true}
                      onChange={(e) => setItemForm({ ...itemForm, visible: e.target.checked })}
                    />
                    <span style={{ fontSize: '0.875rem' }}>👁️ ظاهر للجمهور</span>
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
