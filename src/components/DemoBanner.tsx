import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { AlertCircle, X } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  const { language } = useLanguage();
  const { siteSettings, isPreviewMode } = useData();
  const [dismissed, setDismissed] = useState(false);

  if (!siteSettings.demo_banner_enabled && !isPreviewMode) {
    return null;
  }

  if (dismissed) {
    return null;
  }

  const text = language === 'ar' 
    ? (siteSettings.demo_banner_text_ar || 'نسخة العرض التجريبي لمطعم وكافيه أولديش')
    : (siteSettings.demo_banner_text_en || 'Oldish Restaurant & Café Presentation Preview');

  return (
    <aside 
      className="demo-top-banner"
      role="status"
      aria-label="Sales Demo Disclosure"
    >
      <div className="container demo-banner-inner">
        <div className="demo-banner-content">
          <AlertCircle size={15} className="demo-banner-icon" />
          <span className="demo-banner-text">{text}</span>
          {isPreviewMode && (
            <span className="badge badge-gold" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
              {language === 'ar' ? 'معاينة المسودة' : 'Draft Preview'}
            </span>
          )}
        </div>

        <div className="demo-banner-actions">
          {/* Note: /admin link is hidden from the public banner */}
          <button
            type="button"
            className="demo-dismiss-btn"
            style={{ minWidth: '36px', minHeight: '36px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            onClick={() => setDismissed(true)}
            aria-label={language === 'ar' ? 'إغلاق الإشعار' : 'Dismiss notice'}
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
};
