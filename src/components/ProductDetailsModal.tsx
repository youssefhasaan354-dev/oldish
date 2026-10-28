import React, { useEffect } from 'react';
import type { MenuItem, MenuCategory, BranchInfo } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatPrice } from '../lib/priceUtils';
import { X, Star, MapPin, ShieldCheck, Utensils, AlertCircle } from 'lucide-react';

interface ProductDetailsModalProps {
  item: MenuItem | null;
  categories: MenuCategory[];
  branches: BranchInfo[];
  onClose: () => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  item,
  categories,
  branches,
  onClose
}) => {
  const { isRTL } = useLanguage();

  useEffect(() => {
    if (!item) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [item, onClose]);

  if (!item) return null;

  const category = categories.find(c => c.id === item.category_id);
  const formattedPrice = formatPrice(item, isRTL);
  const isUnavailable = item.is_unavailable || item.available === false;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '8px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={isRTL ? 'إغلاق' : 'Close modal'}
          style={{
            position: 'absolute',
            top: '12px',
            insetInlineEnd: '12px',
            zIndex: 10,
            background: 'rgba(0,0,0,0.6)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >
          <X size={18} />
        </button>

        {/* Media or Neutral Placeholder Header */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '240px',
            backgroundColor: '#F5EFE6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={isRTL ? (item.image_alt_ar || item.name_ar) : (item.image_alt_en || item.name_en)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '20px',
                color: 'var(--color-gold, #886E42)'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(136, 110, 66, 0.1)',
                  margin: '0 auto 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Utensils size={32} />
              </div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', fontWeight: 700 }}>
                Oldish • أولديش
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#888', marginTop: '4px' }}>
                {category ? (isRTL ? category.name_ar : category.name_en) : ''}
              </div>
            </div>
          )}

          {category && (
            <span
              style={{
                position: 'absolute',
                top: '12px',
                insetInlineStart: '12px',
                background: 'rgba(34, 34, 34, 0.85)',
                color: '#FAF8F5',
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: '4px',
                fontWeight: 600
              }}
            >
              {isRTL ? category.name_ar : category.name_en}
            </span>
          )}
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '12px' }}>
            <div>
              <h2
                id="product-modal-title"
                style={{
                  fontSize: '1.375rem',
                  fontWeight: 700,
                  color: 'var(--color-charcoal, #222222)',
                  margin: '0 0 4px 0'
                }}
              >
                {isRTL ? item.name_ar : item.name_en}
              </h2>
              <div style={{ fontSize: '0.9375rem', color: '#666', fontStyle: 'italic' }}>
                {isRTL ? item.name_en : item.name_ar}
              </div>
            </div>

            {formattedPrice && (
              <span
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: '#886E42',
                  background: '#F9F6F0',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid rgba(136, 110, 66, 0.2)',
                  whiteSpace: 'nowrap'
                }}
              >
                {formattedPrice}
              </span>
            )}
          </div>

          {/* Description */}
          <div style={{ marginBlock: '16px', borderTop: '1px solid #EEE', borderBottom: '1px solid #EEE', paddingBlock: '14px' }}>
            {(isRTL ? item.description_ar : item.description_en) ? (
              <p style={{ margin: 0, fontSize: '0.9375rem', lineHeight: '1.6', color: '#444' }}>
                {isRTL ? item.description_ar : item.description_en}
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#888', fontStyle: 'italic' }}>
                {isRTL ? 'الطبق يقدم طازجاً في فروع أولديش.' : 'Served fresh at Oldish branches.'}
              </p>
            )}
          </div>

          {/* Badges / Attributes */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {isUnavailable ? (
              <span
                style={{
                  background: '#FEE2E2',
                  color: '#991B1B',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <AlertCircle size={14} />
                {isRTL ? 'غير متوفر اليوم' : 'Unavailable today'}
              </span>
            ) : (
              <span
                style={{
                  background: '#ECFDF5',
                  color: '#065F46',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ShieldCheck size={14} />
                {isRTL ? 'متوفر حالياً' : 'Available now'}
              </span>
            )}

            {item.is_signature && (
              <span
                style={{
                  background: '#FEF3C7',
                  color: '#92400E',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Star size={12} fill="currentColor" />
                {isRTL ? 'من الأطباق المميزة' : 'Oldish Signature'}
              </span>
            )}

            {item.tags?.map((t, idx) => (
              <span
                key={idx}
                style={{
                  background: '#F3F4F6',
                  color: '#374151',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '0.75rem'
                }}
              >
                {t}
              </span>
            ))}
          </div>

          {/* Branch Availability */}
          <div style={{ background: '#FAF8F5', borderRadius: '6px', padding: '12px 16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', fontWeight: 600, color: '#886E42', marginBottom: '6px' }}>
              <MapPin size={14} />
              <span>{isRTL ? 'الفروع المتاح بها الصنف' : 'Branch Availability'}</span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#555', lineHeight: '1.5' }}>
              {branches.length > 0 ? (
                branches.filter(b => b.visible).map(b => (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span style={{ color: '#10B981' }}>✓</span>
                    <span>{isRTL ? b.name_ar : b.name_en}</span>
                  </div>
                ))
              ) : (
                <span>{isRTL ? 'متاح بفرعي وسط البلد والزمالك' : 'Available at Downtown & Zamalek branches'}</span>
              )}
            </div>
          </div>

          {/* Verification Attribution Note */}
          <div style={{ fontSize: '0.75rem', color: '#888', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} style={{ color: '#10B981' }} />
            <span>
              {isRTL 
                ? 'بيانات وصلاحية الصنف موثقة من قائمة مطعم أولديش المرجعية.' 
                : 'Verified item data from official Oldish menu reference.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

