import React, { useState, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import type { ImageSlot, MediaItem } from '../../types';
import { 
  Crosshair, 
  Eye, 
  EyeOff, 
  Image as ImageIcon, 
  Smartphone, 
  Monitor, 
  X, 
  Upload, 
  RotateCcw, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  AlertTriangle, 
  Check, 
  Info,
  Layers
} from 'lucide-react';

export const AdminImagePlacementManager: React.FC = () => {
  const { 
    imageSlots, 
    updateImageSlot, 
    replaceSlotImage,
    undoSlotReplacement,
    resetSlotToDefault,
    addSlotAtPosition,
    deleteSlot,
    reorderSlots,
    sessionUndoMap,
    mediaList, 
    siteSettings 
  } = useData();
  const { role } = useAuth();
  const isReadOnly = role === 'viewer';

  const [activeSectionFilter, setActiveSectionFilter] = useState<string>('all');
  const [selectedSlotKey, setSelectedSlotKey] = useState<string>('hero.slide.0');
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [cropWarning, setCropWarning] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Add at position state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addPosition, setAddPosition] = useState<'before' | 'after'>('after');
  const [addRelativeToKey, setAddRelativeToKey] = useState<string>('');
  const [addSlotLabelEn, setAddSlotLabelEn] = useState('');
  const [addSlotLabelAr, setAddSlotLabelAr] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  const sectionsList = [
    { id: 'all', label_ar: 'الكل (جميع المواقع)', label_en: 'All Slots' },
    { id: 'branding', label_ar: 'الهوية والشعار (Branding)', label_en: 'Branding' },
    { id: 'hero', label_ar: 'واجهة الهيرو (Hero Slides)', label_en: 'Hero' },
    { id: 'story', label_ar: 'قصتنا وتاريخنا (Story Blocks)', label_en: 'Story' },
    { id: 'atmosphere', label_ar: 'الأجواء والديكور (Atmosphere)', label_en: 'Atmosphere' },
    { id: 'menu', label_ar: 'قائمة الطعام والبانر (Menu)', label_en: 'Menu' },
    { id: 'gallery', label_ar: 'معرض الصور (Gallery)', label_en: 'Gallery' },
    { id: 'social', label_ar: 'شريط إنستغرام (Instagram Strip)', label_en: 'Social' },
  ];

  const allSlots = Object.values(imageSlots);
  const filteredSlots = allSlots
    .filter(slot => activeSectionFilter === 'all' || slot.section === activeSectionFilter)
    .sort((a, b) => a.sort_order - b.sort_order);

  const activeSlot: ImageSlot = imageSlots[selectedSlotKey] || filteredSlots[0] || allSlots[0] || {
    slot_key: 'hero.slide.0',
    label_en: 'Hero Slide 1',
    label_ar: 'شريحة الواجهة 1',
    section: 'hero',
    object_position_x: 50,
    object_position_y: 50,
    object_fit: 'cover',
    zoom: 1,
    overlay_opacity: 0.65,
    sort_order: 0,
    visible: true
  };

  const currentMedia = activeSlot.media_id ? mediaList.find(m => m.id === activeSlot.media_id) : null;
  const currentImageUrl = activeSlot.media_url || currentMedia?.public_url || activeSlot.default_url || '/images/oldish_courtyard_hero.webp';

  // Interactive Click on Image to Set Focal Point
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReadOnly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    updateImageSlot(activeSlot.slot_key, {
      object_position_x: Math.max(0, Math.min(100, x)),
      object_position_y: Math.max(0, Math.min(100, y)),
    });
  };

  // Replace from library modal
  const handleSelectMedia = (media: MediaItem) => {
    if (isReadOnly) return;
    updateImageSlot(activeSlot.slot_key, {
      media_id: media.id,
      media_url: media.public_url
    });
    setMediaPickerOpen(false);
  };

  // File Upload Handler (Replace in place)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isReadOnly) return;
    await executeReplace(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Drag and drop handler
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isReadOnly) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await executeReplace(file);
    }
  };

  const executeReplace = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(10);
    setUploadStatus('جاري فحص وتجهيز الملف...');
    setCropWarning(null);
    setUploadError(null);
    setUploadSuccess(false);

    const result = await replaceSlotImage(activeSlot.slot_key, file, {
      onProgress: (pct, msg) => {
        setUploadProgress(pct);
        setUploadStatus(msg);
      }
    });

    setIsUploading(false);
    if (result.success) {
      setUploadSuccess(true);
      if (result.cropWarning) {
        setCropWarning(result.cropWarning);
      }
      setTimeout(() => setUploadSuccess(false), 4000);
    } else {
      setUploadError(result.error || 'فشل استبدال الصورة.');
    }
  };

  // Open "Add image in specific spot" dialog
  const handleOpenAddModal = (relativeKey: string, position: 'before' | 'after') => {
    if (isReadOnly) return;
    setAddRelativeToKey(relativeKey);
    setAddPosition(position);
    setAddSlotLabelEn('');
    setAddSlotLabelAr('');
    setCropWarning(null);
    setUploadError(null);
    setAddModalOpen(true);
  };

  const handleAddFileSubmit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isReadOnly) return;

    setIsUploading(true);
    setUploadProgress(10);
    setUploadStatus('جاري إدراج الصورة في الموضع المحدد...');
    setUploadError(null);

    const section = activeSlot.section === 'branding' ? 'gallery' : activeSlot.section;
    const result = await addSlotAtPosition(
      section,
      addRelativeToKey || activeSlot.slot_key,
      addPosition,
      file,
      {
        label_en: addSlotLabelEn || `New ${section} photo`,
        label_ar: addSlotLabelAr || `صورة جديدة بقسم ${section}`
      },
      (pct, msg) => {
        setUploadProgress(pct);
        setUploadStatus(msg);
      }
    );

    setIsUploading(false);
    if (result.success && result.newSlotKey) {
      setSelectedSlotKey(result.newSlotKey);
      setAddModalOpen(false);
      if (result.cropWarning) {
        setCropWarning(result.cropWarning);
      }
    } else {
      setUploadError(result.error || 'فشل إضافة الصورة.');
    }

    if (addFileInputRef.current) addFileInputRef.current.value = '';
  };

  // Reorder items in current section
  const handleMoveItem = (slot: ImageSlot, direction: 'up' | 'down') => {
    if (isReadOnly) return;
    const sectionSlots = allSlots
      .filter(s => s.section === slot.section)
      .sort((a, b) => a.sort_order - b.sort_order);

    const currentIndex = sectionSlots.findIndex(s => s.slot_key === slot.slot_key);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sectionSlots.length) return;

    const newOrder = [...sectionSlots];
    const [moved] = newOrder.splice(currentIndex, 1);
    newOrder.splice(targetIndex, 0, moved);

    reorderSlots(slot.section, newOrder.map(s => s.slot_key));
  };

  const isMultiItemSection = ['hero', 'story', 'atmosphere', 'gallery', 'social', 'menu'].includes(activeSlot.section);
  const hasUndo = Boolean(sessionUndoMap[activeSlot.slot_key]);

  return (
    <div className="admin-page-container">
      {/* Page Title & Intro */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: '#161616', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={22} style={{ color: 'var(--color-gold)' }} />
            <span>السجل المركزي للصور (Central Image Registry)</span>
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
            تحكم دقيق بكل مواضع الصور في الموقع: استبدال في المكان مع الاحتفاظ بالإعدادات، إضافة في مواضع محددة، ونقاط التركيز (Focal Points)
          </p>
        </div>

        {/* Live Preview Mode Switch */}
        <div style={{ display: 'flex', background: '#EEE', borderRadius: '4px', padding: '3px' }}>
          <button
            type="button"
            className={`admin-preview-btn ${previewMode === 'desktop' ? 'active' : ''}`}
            onClick={() => setPreviewMode('desktop')}
          >
            <Monitor size={15} />
            <span>كمبيوتر (Desktop)</span>
          </button>
          <button
            type="button"
            className={`admin-preview-btn ${previewMode === 'mobile' ? 'active' : ''}`}
            onClick={() => setPreviewMode('mobile')}
          >
            <Smartphone size={15} />
            <span>موبايل (375px)</span>
          </button>
        </div>
      </div>

      {/* Section Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px', borderBottom: '1px solid #E2E8F0' }}>
        {sectionsList.map(sec => {
          const count = allSlots.filter(s => sec.id === 'all' || s.section === sec.id).length;
          const isActive = activeSectionFilter === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSectionFilter(sec.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: isActive ? '1px solid var(--color-gold)' : '1px solid #CBD5E0',
                background: isActive ? 'var(--color-gold)' : '#FFFFFF',
                color: isActive ? '#FFFFFF' : '#4A5568',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{sec.label_ar}</span>
              <span style={{ 
                background: isActive ? 'rgba(255,255,255,0.25)' : '#EDF2F7', 
                padding: '2px 6px', 
                borderRadius: '10px', 
                fontSize: '0.6875rem' 
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Slots Sidebar on Left, Active Slot Editor on Right */}
      <div className="placement-manager-grid">
        {/* Left Column: Grouped Slots List */}
        <div className="slots-list-sidebar" style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #E5E0D8' }}>
            <h3 style={{ fontSize: '0.9375rem', color: '#333', margin: 0, fontWeight: 700 }}>
              المواضع المسجلة ({filteredSlots.length})
            </h3>
            {isMultiItemSection && !isReadOnly && (
              <button
                type="button"
                className="btn btn-outline-gold btn-sm"
                style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                onClick={() => handleOpenAddModal(activeSlot.slot_key, 'after')}
              >
                <Plus size={12} />
                <span>+ إضافة صورة هنا</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredSlots.map((slot) => {
              const isSelected = slot.slot_key === activeSlot.slot_key;
              const slotMedia = slot.media_id ? mediaList.find(m => m.id === slot.media_id) : null;
              const thumbUrl = slot.media_url || slotMedia?.public_url || slot.default_url || '/images/oldish_courtyard_hero.webp';

              return (
                <div
                  key={slot.slot_key}
                  className={`slot-nav-item ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedSlotKey(slot.slot_key)}
                  style={{
                    position: 'relative',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    border: isSelected ? '2px solid var(--color-gold)' : '1px solid #E2E8F0',
                    background: isSelected ? '#FFFDF5' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <img 
                    src={thumbUrl} 
                    alt="" 
                    className="slot-item-thumb"
                    style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', background: '#333' }}
                  />

                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1A202C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {slot.label_ar}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#718096' }}>
                      {slot.section} • {slot.recommended_size || 'حجم تلقائي'}
                    </div>
                    {slot.where_appears_ar && (
                      <div style={{ fontSize: '0.625rem', color: '#A0AEC0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {slot.where_appears_ar}
                      </div>
                    )}
                  </div>

                  {/* Actions preview in item */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    {slot.visible ? (
                      <Eye size={14} style={{ color: 'var(--color-muted-olive)' }} />
                    ) : (
                      <EyeOff size={14} style={{ color: '#A0AEC0' }} />
                    )}

                    {sessionUndoMap[slot.slot_key] && (
                      <span title="يمكن التراجع عن الاستبدال" style={{ fontSize: '0.625rem', color: '#D97706', fontWeight: 700 }}>
                        مُعدل
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Slot Controls & Live Interactive Preview */}
        <div className="slot-editor-panel" style={{ background: '#FFFFFF', padding: '20px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          {activeSlot.section === 'social' && (
            <div style={{ background: '#FFFDF9', border: '1px solid #EEDFBA', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.8125rem', color: '#8A6D2D', lineHeight: 1.5 }}>
              ⚠️ <strong>حالة شريط إنستغرام:</strong> شريط صور إنستغرام في الموقع العام معطل افتراضياً لمنع الإيحاء بأن صور الذكاء الاصطناعي هي منشورات حقيقية من حساب إنستغرام. استبدل هذه الصور بصور فوتوغرافية حقيقية للمكان ثم فعّل إظهار الشريط عبر صفحة <strong>الهوية والألوان (Branding)</strong>.
            </div>
          )}

          {/* Active Slot Header Details */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid #E5E0D8' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="badge badge-gold" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  {activeSlot.section}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#718096', fontFamily: 'monospace' }}>
                  key: {activeSlot.slot_key}
                </span>
              </div>
              <h3 style={{ fontSize: '1.25rem', margin: '0 0 4px 0', color: 'var(--color-charcoal)', fontWeight: 700 }}>
                {activeSlot.label_ar}
              </h3>
              <div style={{ fontSize: '0.8125rem', color: '#666' }}>
                {activeSlot.label_en}
              </div>
              {activeSlot.where_appears_ar && (
                <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Info size={13} style={{ color: 'var(--color-gold)' }} />
                  <span>موضع الظهور: {activeSlot.where_appears_ar}</span>
                </div>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {/* Replace in place file trigger */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
                style={{ display: 'none' }}
              />
              <button
                type="button"
                disabled={isReadOnly || isUploading}
                className="btn btn-primary btn-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} />
                <span>استبدال الصورة (Replace)</span>
              </button>

              {/* Pick from library */}
              <button
                type="button"
                disabled={isReadOnly || isUploading}
                className="btn btn-outline-dark btn-sm"
                onClick={() => setMediaPickerOpen(true)}
              >
                <ImageIcon size={14} />
                <span>من المكتبة</span>
              </button>

              {/* Undo replacement for active session */}
              {hasUndo && (
                <button
                  type="button"
                  disabled={isReadOnly}
                  className="btn btn-outline-gold btn-sm"
                  onClick={() => undoSlotReplacement(activeSlot.slot_key)}
                  title="تراجع عن الصورة الجديدة واستعادة السابقة"
                >
                  <RotateCcw size={14} />
                  <span>تراجع (Undo)</span>
                </button>
              )}

              {/* Reset to default */}
              {activeSlot.default_url && (
                <button
                  type="button"
                  disabled={isReadOnly}
                  className="btn btn-outline-light btn-sm"
                  onClick={() => resetSlotToDefault(activeSlot.slot_key)}
                  title="استعادة الصورة الأصلية الافتراضية"
                >
                  <span>استعادة الافتراضي</span>
                </button>
              )}

              {/* Hide / Show */}
              <button
                type="button"
                disabled={isReadOnly}
                className={`btn btn-sm ${activeSlot.visible ? 'btn-outline-gold' : 'btn-outline-light'}`}
                onClick={() => updateImageSlot(activeSlot.slot_key, { visible: !activeSlot.visible })}
              >
                {activeSlot.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                <span>{activeSlot.visible ? 'إخفاء' : 'إظهار'}</span>
              </button>

              {/* Delete custom slot */}
              {activeSlot.can_delete && (
                <button
                  type="button"
                  disabled={isReadOnly}
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => {
                    if (window.confirm(`هل أنت متأكد من حذف هذا الموضع (${activeSlot.label_ar})؟`)) {
                      deleteSlot(activeSlot.slot_key);
                    }
                  }}
                  title="حذف هذا الموضع"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Upload Status / Progress Bar */}
          {isUploading && (
            <div style={{ background: '#FFFDF5', border: '1px solid #FEEBC8', borderRadius: '6px', padding: '12px 16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '6px', fontWeight: 600, color: '#7B341E' }}>
                <span>{uploadStatus}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div style={{ height: '6px', width: '100%', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--color-gold)', transition: 'width 200ms ease' }} />
              </div>
            </div>
          )}

          {/* Upload Success Alert */}
          {uploadSuccess && (
            <div style={{ background: '#F0FFF4', border: '1px solid #9AE6B4', color: '#22543D', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem' }}>
              <Check size={16} style={{ color: '#38A169' }} />
              <span>تم استبدال الصورة بنجاح مع الاحتفاظ بكامل إعدادات الموضع (نقطة التركيز، التكبير، والتعتيم)!</span>
            </div>
          )}

          {/* Crop Warning Alert */}
          {cropWarning && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', color: '#92400E', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8125rem' }}>
              <AlertTriangle size={18} style={{ color: '#D97706', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>تنبيه نسبة الأبعاد (Aspect Ratio Warning):</strong>
                <div style={{ marginTop: '2px' }}>{cropWarning}</div>
                <div style={{ marginTop: '2px', fontSize: '0.75rem', color: '#B45309' }}>
                  يمكنك ضبط نقطة التركيز (Focal Point) بالأسفل لتحديد الجزء المراد إظهاره بدقة داخل الإطار.
                </div>
              </div>
            </div>
          )}

          {/* Upload Error Alert */}
          {uploadError && (
            <div style={{ background: '#FFF5F5', border: '1px solid #FEB2B2', color: '#9B2C2C', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem' }}>
              <X size={16} style={{ color: '#E53E3E' }} />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed #CBD5E0',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
              background: '#F7FAFC',
              cursor: 'pointer',
              marginBottom: '20px',
              transition: 'border-color 0.2s ease'
            }}
          >
            <Upload size={22} style={{ color: 'var(--color-gold)', margin: '0 auto 6px' }} />
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2D3748' }}>
              اسحب وأفلت صورة جديدة هنا، أو اضغط للاختيار من جهازك
            </div>
            <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: '4px' }}>
              المقاس الموصى به: <strong>{activeSlot.recommended_size || 'حسب المحتوى'}</strong> ({activeSlot.recommended_aspect_ratio || 'حر'}) • يدعم JPG, PNG, WebP, AVIF, SVG (أقصى حجم 20MB)
            </div>
          </div>

          {/* Ordering controls for multi-item sections */}
          {isMultiItemSection && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8F9FA', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', border: '1px solid #EDF2F7' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#4A5568' }}>
                الترتيب في القسم (الترتيب: {activeSlot.sort_order + 1}):
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  disabled={isReadOnly}
                  className="btn btn-outline-light btn-sm"
                  onClick={() => handleMoveItem(activeSlot, 'up')}
                  title="تحريك لأعلى"
                >
                  <ArrowUp size={14} />
                  <span>تحريك للأمام</span>
                </button>
                <button
                  type="button"
                  disabled={isReadOnly}
                  className="btn btn-outline-light btn-sm"
                  onClick={() => handleMoveItem(activeSlot, 'down')}
                  title="تحريك لأسفل"
                >
                  <ArrowDown size={14} />
                  <span>تحريك للخلف</span>
                </button>
                <button
                  type="button"
                  disabled={isReadOnly}
                  className="btn btn-outline-gold btn-sm"
                  onClick={() => handleOpenAddModal(activeSlot.slot_key, 'before')}
                >
                  <Plus size={14} />
                  <span>+ إضافة قبله</span>
                </button>
                <button
                  type="button"
                  disabled={isReadOnly}
                  className="btn btn-outline-gold btn-sm"
                  onClick={() => handleOpenAddModal(activeSlot.slot_key, 'after')}
                >
                  <Plus size={14} />
                  <span>+ إضافة بعده</span>
                </button>
              </div>
            </div>
          )}

          {/* Interactive Click-to-Focal-Point Canvas */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#2D3748' }}>
                <Crosshair size={14} style={{ display: 'inline', marginInlineEnd: '4px', color: 'var(--color-gold)' }} />
                انقر على أي نقطة بالصورة لتحديد مركز التركيز (Focal Point):
              </span>
              <span style={{ fontSize: '0.75rem', color: '#718096', fontFamily: 'monospace' }}>
                X: {activeSlot.object_position_x}% | Y: {activeSlot.object_position_y}%
              </span>
            </div>

            <div 
              className="interactive-focal-canvas"
              onClick={handleImageClick}
              title="انقر هنا لنقل نقطة التركيز"
              style={{ position: 'relative', overflow: 'hidden', borderRadius: '6px', cursor: 'crosshair', background: '#111' }}
            >
              <img 
                src={currentImageUrl} 
                alt="Focal calibration" 
                style={{ width: '100%', height: '340px', objectFit: 'contain', display: 'block' }} 
              />
              {/* Crosshair indicator */}
              <div 
                className="focal-crosshair-marker"
                style={{
                  position: 'absolute',
                  left: `${activeSlot.object_position_x}%`,
                  top: `${activeSlot.object_position_y}%`,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none'
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '2px solid #FFF',
                  borderRadius: '50%',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.6), 0 0 10px rgba(0,0,0,0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{ width: '6px', height: '6px', background: 'var(--color-gold)', borderRadius: '50%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Controls Sliders (Zoom, Darkness, Fit) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: '#F8F6F2', padding: '16px', borderRadius: '6px', marginBottom: '24px' }}>
            {/* Zoom Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                <span>نسبة التكبير (Zoom)</span>
                <span>{activeSlot.zoom || 1}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.05"
                value={activeSlot.zoom || 1}
                disabled={isReadOnly}
                onChange={(e) => updateImageSlot(activeSlot.slot_key, { zoom: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--color-gold)' }}
              />
            </div>

            {/* Overlay Darkness Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                <span>تعتيم الخلفية (Overlay)</span>
                <span>{Math.round((activeSlot.overlay_opacity || 0) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.9"
                step="0.05"
                value={activeSlot.overlay_opacity || 0}
                disabled={isReadOnly}
                onChange={(e) => updateImageSlot(activeSlot.slot_key, { overlay_opacity: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--color-gold)' }}
              />
            </div>

            {/* Object Fit Dropdown */}
            <div>
              <label className="form-label" style={{ fontSize: '0.8125rem', marginBottom: '4px', display: 'block', fontWeight: 600 }}>
                طريقة الملء (Object Fit)
              </label>
              <select
                value={activeSlot.object_fit || 'cover'}
                disabled={isReadOnly}
                onChange={(e) => updateImageSlot(activeSlot.slot_key, { object_fit: e.target.value as any })}
                className="form-select"
                style={{ padding: '6px 10px', fontSize: '0.8125rem', width: '100%' }}
              >
                <option value="cover">Cover (تغطية كامل الإطار)</option>
                <option value="contain">Contain (احتواء كامل بدون قص)</option>
                <option value="fill">Fill (تمدد)</option>
              </select>
            </div>
          </div>

          {/* Alt text and Caption Editors */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>نص بديل بالعربية (Alt text AR)</label>
              <input
                type="text"
                className="form-input"
                value={activeSlot.alt_ar || ''}
                disabled={isReadOnly}
                placeholder="وصف الصورة لمحركات البحث وقارئات الشاشة"
                onChange={(e) => updateImageSlot(activeSlot.slot_key, { alt_ar: e.target.value })}
                style={{ fontSize: '0.8125rem' }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>نص بديل بالإنجليزية (Alt text EN)</label>
              <input
                type="text"
                className="form-input"
                value={activeSlot.alt_en || ''}
                disabled={isReadOnly}
                placeholder="Accessible image description for search engines"
                onChange={(e) => updateImageSlot(activeSlot.slot_key, { alt_en: e.target.value })}
                style={{ fontSize: '0.8125rem' }}
              />
            </div>
          </div>

          {/* Live Component Preview Window */}
          <div>
            <h4 style={{ fontSize: '0.9375rem', color: '#444', marginBottom: '10px', fontWeight: 600 }}>
              معاينة حية للمظهر النهائي بالموقع ({previewMode === 'mobile' ? 'شاشة الهاتف 375px' : 'شاشة الكمبيوتر Desktop'}):
            </h4>

            <div className={`live-preview-viewport ${previewMode === 'mobile' ? 'mobile-frame' : 'desktop-frame'}`} style={{ maxWidth: previewMode === 'mobile' ? '375px' : '100%', margin: '0 auto', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
              <div 
                style={{
                  position: 'relative',
                  width: '100%',
                  height: previewMode === 'mobile' ? '280px' : '360px',
                  overflow: 'hidden',
                  background: '#111'
                }}
              >
                <img
                  src={currentImageUrl}
                  alt={activeSlot.alt_ar || 'Live preview'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: activeSlot.object_fit || 'cover',
                    objectPosition: `${activeSlot.object_position_x}% ${activeSlot.object_position_y}%`,
                    transform: activeSlot.zoom > 1 ? `scale(${activeSlot.zoom})` : undefined,
                    transition: 'all 200ms ease'
                  }}
                />
                <div 
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: `rgba(0, 0, 0, ${activeSlot.overlay_opacity || 0})`,
                    pointerEvents: 'none'
                  }}
                />

                {/* Sample overlay typography */}
                <div 
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    insetInlineStart: '20px',
                    insetInlineEnd: '20px',
                    color: '#FFF',
                    textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                    pointerEvents: 'none'
                  }}
                >
                  <span className="badge badge-gold" style={{ fontSize: '0.6875rem', marginBottom: '6px' }}>
                    {siteSettings.brand_name_ar} • {activeSlot.section}
                  </span>
                  <div style={{ fontSize: previewMode === 'mobile' ? '1.125rem' : '1.375rem', fontWeight: 700 }}>
                    {activeSlot.label_ar}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Select Media Modal */}
      {mediaPickerOpen && (
        <div className="lightbox-modal" role="dialog" onClick={() => setMediaPickerOpen(false)}>
          <div className="admin-modal-card" style={{ maxWidth: '800px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>اختر صورة من المكتبة للموقع: {activeSlot.label_ar}</h3>
              <button type="button" onClick={() => setMediaPickerOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', flexGrow: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
              {mediaList.map((m) => (
                <div 
                  key={m.id} 
                  className="media-picker-item"
                  onClick={() => handleSelectMedia(m)}
                  style={{ cursor: 'pointer', border: '1px solid #E2E8F0', borderRadius: '6px', overflow: 'hidden' }}
                >
                  <img src={m.public_url} alt={m.alt_ar || m.alt_en} style={{ width: '100%', height: '110px', objectFit: 'cover' }} />
                  <div style={{ padding: '6px', fontSize: '0.75rem', color: '#333', textAlign: 'center', background: '#F8F9FA' }}>
                    {m.is_ai ? '🤖 صورة توضيحية' : '📷 صورة حقيقية'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add in specific spot Modal */}
      {addModalOpen && (
        <div className="lightbox-modal" role="dialog" onClick={() => setAddModalOpen(false)}>
          <div className="admin-modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={18} style={{ color: 'var(--color-gold)' }} />
                <span>إضافة صورة في موضع محدد</span>
              </h3>
              <button type="button" onClick={() => setAddModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '0.8125rem', color: '#666', margin: '0 0 12px 0' }}>
                سيتم إدراج الصورة {addPosition === 'before' ? 'قبل' : 'بعد'} العنصر: <strong>{activeSlot.label_ar}</strong>
              </p>

              <div style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '0.8125rem' }}>عنوان الصورة بالعربية:</label>
                <input
                  type="text"
                  className="form-input"
                  value={addSlotLabelAr}
                  onChange={(e) => setAddSlotLabelAr(e.target.value)}
                  placeholder="مثال: ركن الفناء المسائي"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontSize: '0.8125rem' }}>عنوان الصورة بالإنجليزية (Label EN):</label>
                <input
                  type="text"
                  className="form-input"
                  value={addSlotLabelEn}
                  onChange={(e) => setAddSlotLabelEn(e.target.value)}
                  placeholder="e.g. Evening Courtyard Corner"
                />
              </div>

              {/* Upload trigger */}
              <input
                type="file"
                ref={addFileInputRef}
                onChange={handleAddFileSubmit}
                accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
                style={{ display: 'none' }}
              />

              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={isUploading}
                onClick={() => addFileInputRef.current?.click()}
              >
                <Upload size={16} />
                <span>اختر ملف الصورة وادرجها فوراً</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
