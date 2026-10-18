import React from 'react';
import { useData } from '../context/DataContext';
import { useVisualEdit } from '../context/VisualEditContext';
import { Camera, EyeOff } from 'lucide-react';
import { getResponsiveSrcSet } from '../lib/cloudinary';

interface EditableImageSlotProps {
  slotKey: string;
  fallbackUrl?: string;
  className?: string;
  style?: React.CSSProperties;
  imgStyle?: React.CSSProperties;
  alt?: string;
  width?: number | string;
  height?: number | string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  showOverlay?: boolean;
  children?: React.ReactNode;
}

export const EditableImageSlot: React.FC<EditableImageSlotProps> = ({
  slotKey,
  fallbackUrl,
  className = '',
  style = {},
  imgStyle = {},
  alt,
  width,
  height,
  loading = 'lazy',
  fetchPriority,
  showOverlay = true,
  children
}) => {
  const { getImageForSlot } = useData();
  const { isVisualEditActive, setActiveEditingSlotKey } = useVisualEdit();

  const { url, altEn, altAr, style: slotStyle, slot } = getImageForSlot(slotKey, fallbackUrl);

  // If slot is set to hidden in admin:
  // If visual edit mode is ON, show it dimmed so the owner can edit or unhide it.
  // If visual edit mode is OFF, return null (hide completely from public visitors).
  if (slot && !slot.visible) {
    if (!isVisualEditActive) return null;
    return (
      <div 
        style={{
          position: 'relative',
          opacity: 0.5,
          border: '2px dashed #CBD5E0',
          borderRadius: '4px',
          padding: '8px',
          textAlign: 'center',
          ...style
        }}
      >
        <div style={{ fontSize: '0.75rem', color: '#718096', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <EyeOff size={14} />
          <span>موضع مخفي: {slot.label_ar}</span>
        </div>
        <button
          type="button"
          onClick={() => setActiveEditingSlotKey(slotKey)}
          style={{
            marginTop: '6px',
            background: 'var(--color-gold)',
            color: '#FFF',
            border: 'none',
            borderRadius: '4px',
            padding: '3px 8px',
            fontSize: '0.6875rem',
            cursor: 'pointer'
          }}
        >
          تعديل وإظهار
        </button>
      </div>
    );
  }

  const effectiveAlt = alt || altAr || altEn;

  const srcSet = getResponsiveSrcSet(url);

  return (
    <div 
      className={`editable-slot-wrapper ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: width ? (typeof width === 'number' ? `${width}px` : width) : '100%',
        height: height ? (typeof height === 'number' ? `${height}px` : height) : '100%',
        aspectRatio: slot?.aspect_ratio || (style as any).aspectRatio || undefined,
        ...style
      }}
    >
      <img
        src={url}
        srcSet={srcSet}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        alt={effectiveAlt}
        width={typeof width === 'number' ? width : 640}
        height={typeof height === 'number' ? height : 480}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          ...slotStyle,
          ...imgStyle
        }}
      />

      {/* Dark overlay if configured */}
      {showOverlay && slot?.overlay_opacity && slot.overlay_opacity > 0 ? (
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(0, 0, 0, ${slot.overlay_opacity})`,
            pointerEvents: 'none'
          }}
        />
      ) : null}

      {/* Embedded Children (e.g. content overlays) */}
      {children}

      {/* Visual Edit Mode Overlay Button */}
      {isVisualEditActive && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            insetInlineEnd: '10px',
            zIndex: 999,
            pointerEvents: 'auto'
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveEditingSlotKey(slotKey);
            }}
            style={{
              background: 'rgba(26, 32, 44, 0.92)',
              color: '#FFFFFF',
              border: '1.5px solid var(--color-gold)',
              borderRadius: '20px',
              padding: '5px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              fontFamily: 'Cairo, sans-serif',
              backdropFilter: 'blur(4px)',
              transition: 'transform 0.15s ease'
            }}
            title={`تعديل واستبدال صورة: ${slot?.label_ar || slotKey}`}
          >
            <Camera size={13} style={{ color: 'var(--color-gold)' }} />
            <span>تعديل الصورة</span>
          </button>
        </div>
      )}
    </div>
  );
};
