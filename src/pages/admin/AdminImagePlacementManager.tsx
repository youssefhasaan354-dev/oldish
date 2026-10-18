import React, { useState } from 'react';
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
  X
} from 'lucide-react';

export const AdminImagePlacementManager: React.FC = () => {
  const { imageSlots, updateImageSlot, mediaList, siteSettings } = useData();
  const { role } = useAuth();
  const isReadOnly = role === 'viewer';

  const [selectedSlotKey, setSelectedSlotKey] = useState<string>('hero.slide.0');
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const slotsArray = Object.values(imageSlots).sort((a, b) => a.sort_order - b.sort_order);
  const activeSlot: ImageSlot = imageSlots[selectedSlotKey] || slotsArray[0] || {
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

  // Resolve current image URL
  const currentMedia = activeSlot.media_id ? mediaList.find(m => m.id === activeSlot.media_id) : null;
  const currentImageUrl = activeSlot.media_url || currentMedia?.public_url || '/images/oldish_courtyard_hero.jpg';

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

  const handleSelectMedia = (media: MediaItem) => {
    if (isReadOnly) return;
    updateImageSlot(activeSlot.slot_key, {
      media_id: media.id,
      media_url: media.public_url
    });
    setMediaPickerOpen(false);
  };

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: '#161616', margin: '0 0 4px 0' }}>
            مدير مواقع وتحكم الصور (Image Placement &amp; Focal Points)
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
            تحكم دقيق في كل موضع صورة بالموقع: التكبير، نقطة التركيز (Focal Point)، نسبة التعتيم، ومعاينة حية للموبايل والكمبيوتر
          </p>
        </div>

        {/* Live Preview Width Selector */}
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

      {/* Main Workspace Split Layout */}
      <div className="placement-manager-grid">
        {/* Left Column: Slots List Navigation */}
        <div className="slots-list-sidebar">
          <h3 style={{ fontSize: '1rem', color: '#333', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #E5E0D8' }}>
            مواقع الصور بالموقع ({slotsArray.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {slotsArray.map((slot) => {
              const isSelected = slot.slot_key === activeSlot.slot_key;
              const slotMedia = slot.media_id ? mediaList.find(m => m.id === slot.media_id) : null;
              const thumbUrl = slot.media_url || slotMedia?.public_url || '/images/oldish_courtyard_hero.jpg';

              return (
                <div
                  key={slot.slot_key}
                  className={`slot-nav-item ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedSlotKey(slot.slot_key)}
                >
                  <img src={thumbUrl} alt="" className="slot-item-thumb" />
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {slot.label_ar}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#888' }}>
                      {slot.section} • {slot.visible ? 'ظاهر' : 'مخفي'}
                    </div>
                  </div>
                  {slot.visible ? (
                    <Eye size={14} style={{ color: 'var(--color-muted-olive)' }} />
                  ) : (
                    <EyeOff size={14} style={{ color: '#999' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Slot Controls & Live Interactive Preview */}
        <div className="slot-editor-panel">
          {/* Active Slot Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #E5E0D8' }}>
            <div>
              <span className="badge badge-gold" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>
                قسم: {activeSlot.section}
              </span>
              <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--color-charcoal)' }}>
                {activeSlot.label_ar} ({activeSlot.label_en})
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                disabled={isReadOnly}
                className="btn btn-primary btn-sm"
                onClick={() => setMediaPickerOpen(true)}
              >
                <ImageIcon size={14} />
                <span>تبديل الصورة من المكتبة</span>
              </button>

              <button
                type="button"
                disabled={isReadOnly}
                className={`btn btn-sm ${activeSlot.visible ? 'btn-outline-gold' : 'btn-outline-light'}`}
                onClick={() => updateImageSlot(activeSlot.slot_key, { visible: !activeSlot.visible })}
              >
                {activeSlot.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                <span>{activeSlot.visible ? 'إخفاء الصورة' : 'إظهار الصورة'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Click-to-Focal-Point Canvas */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#333' }}>
                <Crosshair size={14} style={{ display: 'inline', marginInlineEnd: '4px', color: 'var(--color-gold)' }} />
                انقر على أي نقطة بالصورة لتحديد مركز التركيز (Focal Point):
              </span>
              <span style={{ fontSize: '0.75rem', color: '#666' }}>
                X: {activeSlot.object_position_x}% | Y: {activeSlot.object_position_y}%
              </span>
            </div>

            <div 
              className="interactive-focal-canvas"
              onClick={handleImageClick}
              title="انقر هنا لنقل نقطة التركيز"
            >
              <img 
                src={currentImageUrl} 
                alt="Focal calibration" 
                style={{ width: '100%', height: '320px', objectFit: 'contain', background: '#111', display: 'block' }} 
              />
              {/* Crosshair indicator */}
              <div 
                className="focal-crosshair-marker"
                style={{
                  left: `${activeSlot.object_position_x}%`,
                  top: `${activeSlot.object_position_y}%`
                }}
              >
                <div className="crosshair-center-dot" />
              </div>
            </div>
          </div>

          {/* Controls Sliders */}
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
                style={{ width: '100%' }}
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
                style={{ width: '100%' }}
              />
            </div>

            {/* Object Fit Dropdown */}
            <div>
              <label className="form-label" style={{ fontSize: '0.8125rem', marginBottom: '4px' }}>طريقة الملء (Object Fit)</label>
              <select
                value={activeSlot.object_fit || 'cover'}
                disabled={isReadOnly}
                onChange={(e) => updateImageSlot(activeSlot.slot_key, { object_fit: e.target.value as any })}
                className="form-select"
                style={{ padding: '6px 10px', fontSize: '0.8125rem' }}
              >
                <option value="cover">Cover (تغطية كامل الإطار)</option>
                <option value="contain">Contain (احتواء كامل بدون قص)</option>
                <option value="fill">Fill (تمدد)</option>
              </select>
            </div>
          </div>

          {/* Live Component Preview Window */}
          <div>
            <h4 style={{ fontSize: '0.9375rem', color: '#444', marginBottom: '10px' }}>
              معاينة حية للشكل النهائي بالموقع ({previewMode === 'mobile' ? 'شاشة الهاتف 375px' : 'شاشة الكمبيوتر'}):
            </h4>

            <div className={`live-preview-viewport ${previewMode === 'mobile' ? 'mobile-frame' : 'desktop-frame'}`}>
              <div 
                style={{
                  position: 'relative',
                  width: '100%',
                  height: previewMode === 'mobile' ? '280px' : '360px',
                  overflow: 'hidden',
                  borderRadius: '4px'
                }}
              >
                <img
                  src={currentImageUrl}
                  alt="Live result"
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

                {/* Sample overlay typography to visualize contrast */}
                <div 
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    insetInlineStart: '20px',
                    insetInlineEnd: '20px',
                    color: '#FFF',
                    textShadow: '0 2px 8px rgba(0,0,0,0.8)'
                  }}
                >
                  <span className="badge badge-gold" style={{ fontSize: '0.6875rem', marginBottom: '6px' }}>
                    {siteSettings.tagline_ar}
                  </span>
                  <div style={{ fontSize: previewMode === 'mobile' ? '1rem' : '1.375rem', fontWeight: 700 }}>
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
                >
                  <img src={m.public_url} alt={m.alt_ar || m.alt_en} />
                  <div style={{ padding: '6px', fontSize: '0.75rem', color: '#333', textAlign: 'center' }}>
                    {m.is_ai ? '🤖 صورة توضيحية' : '📷 صورة حقيقية'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
