import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import type { MediaItem } from '../types';
import { Camera, ZoomIn, X, ChevronLeft, ChevronRight } from 'lucide-react';

export const GallerySection: React.FC = () => {
  const { isRTL } = useLanguage();
  const { mediaList, sections } = useData();
  const [activeTag, setActiveTag] = useState<string>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filteredItems = mediaList.filter((item) => {
    if (activeTag === 'all') return true;
    return item.tags?.includes(activeTag);
  });

  const activePhoto: MediaItem | null = lightboxIndex !== null ? filteredItems[lightboxIndex] : null;

  const handleNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % filteredItems.length);
  }, [lightboxIndex, filteredItems.length]);

  const handlePrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + filteredItems.length) % filteredItems.length);
  }, [lightboxIndex, filteredItems.length]);

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
          {filteredItems.map((item, idx) => (
            <div
              key={item.id}
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
              aria-label={`View ${isRTL ? item.alt_ar : item.alt_en} in full screen`}
            >
              <img
                src={item.public_url}
                alt={isRTL ? item.alt_ar : item.alt_en}
                loading="lazy"
              />
              <div className="gallery-card-zoom-icon" aria-hidden="true">
                <ZoomIn size={16} />
              </div>

              {item.is_ai && (
                <span 
                  className="badge" 
                  style={{
                    position: 'absolute',
                    top: '10px',
                    insetInlineStart: '10px',
                    background: 'rgba(0,0,0,0.7)',
                    color: '#E0DDD7',
                    fontSize: '0.6875rem',
                    zIndex: 2
                  }}
                >
                  {isRTL ? 'صورة توضيحية' : 'Illustrative image'}
                </span>
              )}

              <div className="gallery-card-overlay">
                <p className="gallery-card-title">
                  {isRTL ? (item.caption_ar || item.alt_ar) : (item.caption_en || item.alt_en)}
                </p>
                <span style={{ fontSize: '0.8125rem', color: '#D6D2CA' }}>
                  {isRTL ? 'انقر للتكبير' : 'Click to enlarge'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Accessible Lightbox Modal */}
      {activePhoto && lightboxIndex !== null && (
        <div
          className="lightbox-modal"
          role="dialog"
          aria-modal="true"
          aria-label={isRTL ? activePhoto.alt_ar : activePhoto.alt_en}
          onClick={handleClose}
        >
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="lightbox-btn close"
              onClick={handleClose}
              aria-label="Close"
            >
              <X size={24} />
            </button>

            <button
              type="button"
              className="lightbox-btn prev"
              onClick={isRTL ? handleNext : handlePrev}
              aria-label="Previous"
            >
              <ChevronLeft size={24} />
            </button>

            <img
              src={activePhoto.public_url}
              alt={isRTL ? activePhoto.alt_ar : activePhoto.alt_en}
              className="lightbox-image"
            />

            <button
              type="button"
              className="lightbox-btn next"
              onClick={isRTL ? handlePrev : handleNext}
              aria-label="Next"
            >
              <ChevronRight size={24} />
            </button>

            <div className="lightbox-caption-bar">
              <h3 className="lightbox-title">
                {isRTL ? (activePhoto.caption_ar || activePhoto.alt_ar) : (activePhoto.caption_en || activePhoto.alt_en)}
              </h3>
              {activePhoto.is_ai && (
                <span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: '#FFD79A', fontSize: '0.75rem', marginInline: 'auto' }}>
                  {isRTL ? 'صورة توضيحية — بانتظار استبدالها بصور المكان الحقيقية' : 'Illustrative image — Pending real venue photography'}
                </span>
              )}
              <span style={{ fontSize: '0.75rem', color: 'var(--color-gold-light)', marginTop: '8px', display: 'block' }}>
                {lightboxIndex + 1} / {filteredItems.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
