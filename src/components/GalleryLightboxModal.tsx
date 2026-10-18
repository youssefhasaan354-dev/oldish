import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ImageSlot } from '../types';

interface GalleryLightboxModalProps {
  activeSlot: ImageSlot;
  lightboxIndex: number;
  totalCount: number;
  isRTL: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export const GalleryLightboxModal: React.FC<GalleryLightboxModalProps> = ({
  activeSlot,
  lightboxIndex,
  totalCount,
  isRTL,
  onClose,
  onPrev,
  onNext
}) => {
  return (
    <div
      className="lightbox-modal"
      role="dialog"
      aria-modal="true"
      aria-label={isRTL ? activeSlot.label_ar : activeSlot.label_en}
      onClick={onClose}
    >
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="lightbox-btn close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={24} />
        </button>

        <button
          type="button"
          className="lightbox-btn prev"
          onClick={isRTL ? onNext : onPrev}
          aria-label="Previous"
        >
          <ChevronLeft size={24} />
        </button>

        <img
          src={activeSlot.media_url || activeSlot.default_url || '/images/oldish_courtyard_hero.webp'}
          alt={isRTL ? activeSlot.label_ar : activeSlot.label_en}
          className="lightbox-image"
          width={1200}
          height={800}
        />

        <button
          type="button"
          className="lightbox-btn next"
          onClick={isRTL ? onPrev : onNext}
          aria-label="Next"
        >
          <ChevronRight size={24} />
        </button>

        <div className="lightbox-caption-bar">
          <h3 className="lightbox-title">
            {isRTL ? (activeSlot.caption_ar || activeSlot.label_ar) : (activeSlot.caption_en || activeSlot.label_en)}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-gold-light)', marginTop: '8px', display: 'block' }}>
            {lightboxIndex + 1} / {totalCount}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GalleryLightboxModal;
