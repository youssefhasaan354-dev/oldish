import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { Camera, ZoomIn } from 'lucide-react';
import { EditableImageSlot } from './EditableImageSlot';

const GalleryLightboxModal = lazy(() => import('./GalleryLightboxModal'));

export const GallerySection: React.FC = () => {
  const { isRTL } = useLanguage();
  const { imageSlots, sections } = useData();
  const [activeTag, setActiveTag] = useState<string>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Gallery items derived from central imageSlots
  const gallerySlots = useMemo(() => {
    return Object.values(imageSlots)
      .filter((s) => s.section === 'gallery')
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [imageSlots]);

  const filteredSlots = useMemo(() => {
    if (activeTag === 'all') return gallerySlots;
    return gallerySlots.filter((slot) => {
      const key = slot.slot_key.toLowerCase();
      if (activeTag === 'courtyard') return key.includes('0') || key.includes('1') || key.includes('courtyard');
      if (activeTag === 'interior') return key.includes('2') || key.includes('interior');
      if (activeTag === 'food') return key.includes('3') || key.includes('4') || key.includes('tagine') || key.includes('breakfast');
      if (activeTag === 'drinks') return key.includes('5') || key.includes('juice');
      return true;
    });
  }, [gallerySlots, activeTag]);

  const activeSlot = lightboxIndex !== null ? filteredSlots[lightboxIndex] : null;

  const handleNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % filteredSlots.length);
  }, [lightboxIndex, filteredSlots.length]);

  const handlePrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + filteredSlots.length) % filteredSlots.length);
  }, [lightboxIndex, filteredSlots.length]);

  const handleClose = () => {
    setLightboxIndex(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowRight') {
        if (isRTL) handlePrev(); else handleNext();
      }
      if (e.key === 'ArrowLeft') {
        if (isRTL) handleNext(); else handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, handleNext, handlePrev, isRTL]);

  const tags = [
    { id: 'all', label: isRTL ? 'الكل' : 'All' },
    { id: 'courtyard', label: isRTL ? 'الفناء والحديقة' : 'Courtyard' },
    { id: 'interior', label: isRTL ? 'الصالون الداخلي' : 'Interior' },
    { id: 'food', label: isRTL ? 'المأكولات التراثية' : 'Food' },
    { id: 'drinks', label: isRTL ? 'المشروبات' : 'Drinks' },
  ];

  const gallerySec = sections.find(s => s.key === 'gallery');
  if (gallerySec && !gallerySec.visible) {
    return null;
  }

  return (
    <section id="gallery" className="section" aria-labelledby="gallery-heading">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-eyebrow">
            <Camera size={14} />
            <span>{isRTL ? 'الصور والأجواء' : 'Visual Gallery'}</span>
          </div>
          <h2 id="gallery-heading" className="section-title">
            {isRTL ? 'لقطات من بيت أولديش والفناء' : 'Glimpses of Oldish Cairo'}
          </h2>
          <div className="gold-divider">
            <span className="gold-divider-diamond" />
          </div>
          <p className="section-lead">
            {isRTL 
              ? 'جولة بصرية في تفاصيل الفناء المحاط بالطوب الأحمر، وأجواء البيوت القديمة، وأطباقنا التراثية.' 
              : 'A visual journey exploring our brick courtyard sanctuary, nostalgic decor, and signature dishes.'}
          </p>
        </div>

        {/* Filter bar */}
        <div className="gallery-filter-bar" role="tablist" aria-label="Gallery category filters">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className={`cat-pill ${activeTag === tag.id ? 'active' : ''}`}
              onClick={() => setActiveTag(tag.id)}
              role="tab"
              aria-selected={activeTag === tag.id}
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="gallery-grid">
          {filteredSlots.map((slot, idx) => (
            <div
              key={slot.slot_key}
              className="gallery-card"
              onClick={() => setLightboxIndex(idx)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setLightboxIndex(idx);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`View ${isRTL ? slot.label_ar : slot.label_en} in full screen`}
              style={{ position: 'relative' }}
            >
              <EditableImageSlot
                slotKey={slot.slot_key}
                fallbackUrl={slot.default_url || '/images/oldish_courtyard_hero.webp'}
                style={{ width: '100%', height: '100%' }}
                showOverlay={false}
              />

              <div className="gallery-card-zoom-icon" aria-hidden="true">
                <ZoomIn size={16} />
              </div>

              <div className="gallery-card-overlay">
                <p className="gallery-card-title">
                  {isRTL ? (slot.caption_ar || slot.label_ar) : (slot.caption_en || slot.label_en)}
                </p>
                <span style={{ fontSize: '0.8125rem', color: '#D6D2CA' }}>
                  {isRTL ? 'انقر للتكبير' : 'Click to enlarge'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Accessible Lightbox Modal (Code-split) */}
      {activeSlot && lightboxIndex !== null && (
        <Suspense fallback={null}>
          <GalleryLightboxModal
            activeSlot={activeSlot}
            lightboxIndex={lightboxIndex}
            totalCount={filteredSlots.length}
            isRTL={isRTL}
            onClose={handleClose}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        </Suspense>
      )}
    </section>
  );
};
