import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { EditableImageSlot } from './EditableImageSlot';
import { ExternalLink } from 'lucide-react';

const InstagramIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

export const InstagramStripSection: React.FC = () => {
  const { isRTL } = useLanguage();
  const { siteSettings, trackClick } = useData();

  const instagramUrl = siteSettings.instagram_url || 'https://www.instagram.com/oldisheg/';

  const stripSlots = [
    'social.strip.0',
    'social.strip.1',
    'social.strip.2',
    'social.strip.3',
    'social.strip.4',
    'social.strip.5'
  ];

  const handleInstagramClick = () => {
    trackClick('calls'); // or analytics
  };

  return (
    <section 
      className="instagram-strip-section"
      aria-label={isRTL ? 'شريط إنستغرام أولديش' : 'Instagram Feed'}
      style={{
        padding: '50px 0 30px',
        background: '#FAF8F5',
        borderTop: '1px solid #EAE5DC'
      }}
    >
      <div className="container" style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-gold)', marginBottom: '8px' }}>
          <InstagramIcon size={20} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em' }}>
            @oldisheg
          </span>
        </div>
        <h2 style={{ fontSize: '1.5rem', margin: '0 0 6px 0', color: 'var(--color-charcoal)', fontWeight: 700 }}>
          {isRTL ? 'تابع لحظات أولديش على إنستغرام' : 'Moments on Instagram'}
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
          {isRTL ? 'سحر فناء وسط البلد، المأكولات التراثية، وأجواء المساء العتيقة' : 'Downtown Cairo courtyard vibes, Egyptian fare & evening warmth'}
        </p>
      </div>

      {/* 6 Grid items */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '4px',
          padding: '0 4px',
          maxWidth: '1440px',
          margin: '0 auto'
        }}
      >
        {stripSlots.map((slotKey) => (
          <a
            key={slotKey}
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleInstagramClick}
            style={{
              display: 'block',
              position: 'relative',
              aspectRatio: '1/1',
              overflow: 'hidden',
              textDecoration: 'none'
            }}
          >
            <EditableImageSlot
              slotKey={slotKey}
              style={{ width: '100%', height: '100%' }}
              imgStyle={{ transition: 'transform 0.4s ease' }}
              showOverlay={false}
            />

            {/* Illustrative image tag so AI imagery is never mistaken for real posts */}
            <div
              style={{
                position: 'absolute',
                bottom: '6px',
                insetInlineStart: '6px',
                background: 'rgba(0, 0, 0, 0.65)',
                color: '#FAF8F5',
                fontSize: '0.625rem',
                padding: '2px 6px',
                borderRadius: '3px',
                pointerEvents: 'none',
                zIndex: 2,
                backdropFilter: 'blur(2px)'
              }}
            >
              {isRTL ? 'صورة توضيحية' : 'Illustrative'}
            </div>

            {/* Hover icon overlay */}
            <div 
              className="insta-hover-overlay"
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(34, 34, 34, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.25s ease',
                color: '#FFF',
                zIndex: 3
              }}
            >
              <InstagramIcon size={28} />
            </div>
          </a>
        ))}
      </div>

      {/* Follow Button */}
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline-gold"
          style={{ fontSize: '0.8125rem', padding: '8px 20px', borderRadius: '30px' }}
        >
          <InstagramIcon size={15} />
          <span>{isRTL ? 'متابعة حسابنا @oldisheg' : 'Follow @oldisheg on Instagram'}</span>
          <ExternalLink size={13} />
        </a>
      </div>
    </section>
  );
};
