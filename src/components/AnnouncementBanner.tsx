import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { Sparkles, X, ChevronRight, ChevronLeft } from 'lucide-react';

export const AnnouncementBanner: React.FC = () => {
  const { siteSettings } = useData();
  const { isRTL } = useLanguage();
  const [todayStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('oldish_announcement_dismissed') === 'true';
    }
    return false;
  });

  if (!siteSettings.announcement_enabled || isDismissed) {
    return null;
  }

  // Date validity check
  if (siteSettings.announcement_start_date && todayStr < siteSettings.announcement_start_date) {
    return null;
  }

  if (siteSettings.announcement_end_date && todayStr > siteSettings.announcement_end_date) {
    return null;
  }

  const text = isRTL 
    ? (siteSettings.announcement_text_ar || siteSettings.announcement_text_en)
    : (siteSettings.announcement_text_en || siteSettings.announcement_text_ar);

  if (!text) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('oldish_announcement_dismissed', 'true');
    } catch {
      /* ignore */
    }
  };

  const hasLink = Boolean(siteSettings.announcement_link);

  return (
    <div 
      className="site-announcement-banner"
      role="region"
      aria-label={isRTL ? 'إعلان وعرض خاص' : 'Announcement'}
      style={{
        background: 'linear-gradient(90deg, #886E42 0%, #A38755 50%, #886E42 100%)',
        color: '#FFFFFF',
        padding: '8px 16px',
        fontSize: '0.8125rem',
        fontWeight: 600,
        position: 'relative',
        zIndex: 1001,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Sparkles size={15} style={{ color: '#FFEAA7', flexShrink: 0 }} />
        <span>{text}</span>
        {hasLink && (
          <a
            href={siteSettings.announcement_link}
            style={{
              color: '#FFFFFF',
              background: 'rgba(0,0,0,0.25)',
              padding: '2px 10px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontSize: '0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              border: '1px solid rgba(255,255,255,0.3)',
              marginInlineStart: '6px'
            }}
          >
            <span>{isRTL ? 'تفاصيل أكثر' : 'Learn More'}</span>
            {isRTL ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
          </a>
        )}
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label={isRTL ? 'إغلاق الإعلان' : 'Dismiss announcement'}
        style={{
          position: 'absolute',
          insetInlineEnd: '12px',
          background: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.8)',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px'
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};
