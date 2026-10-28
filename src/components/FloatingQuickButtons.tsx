import React, { useEffect, useState } from 'react';
import { ArrowUp, MessageCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { toWhatsappNumber } from '../lib/whatsapp';

/**
 * Floating WhatsApp button (desktop; mobile already has it in the bottom bar)
 * + a "back to top" button that jumps instantly after the user scrolls down.
 */
export const FloatingQuickButtons: React.FC = () => {
  const { isRTL } = useLanguage();
  const { siteSettings, trackClick } = useData();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const waNumber = toWhatsappNumber(siteSettings.whatsapp || siteSettings.phone);
  const waMessage = encodeURIComponent(
    isRTL
      ? 'مرحباً، أود الاستفسار عن حجز طاولة وقائمة الطعام في مطعم وكافيه أولديش.'
      : 'Hello! I would like to inquire about table reservations and the menu at Oldish.'
  );

  const goTop = () => {
    // "instant" overrides the global `scroll-behavior: smooth` so it jumps at once
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <>
      {waNumber && (
        <a
          href={`https://wa.me/${waNumber}?text=${waMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackClick('whatsapp_clicks')}
          className="fab fab-whatsapp no-print"
          aria-label={isRTL ? 'تواصل معنا عبر واتساب' : 'Chat with us on WhatsApp'}
        >
          <MessageCircle size={26} />
        </a>
      )}

      <button
        type="button"
        onClick={goTop}
        className={`fab fab-top no-print${showTop ? ' is-visible' : ''}`}
        aria-label={isRTL ? 'العودة إلى أعلى الصفحة' : 'Back to top'}
        tabIndex={showTop ? 0 : -1}
      >
        <ArrowUp size={20} />
      </button>
    </>
  );
};
