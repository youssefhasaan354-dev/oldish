import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { Phone, Calendar, Navigation, Utensils, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FloatingActions: React.FC = () => {
  const { isRTL } = useLanguage();
  const { siteSettings, trackClick } = useData();

  const handleReserveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.querySelector('#reservations');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const cleanWhatsapp = siteSettings.whatsapp.replace(/[^0-9]/g, '');
  const hasWhatsapp = Boolean(siteSettings.whatsapp && siteSettings.whatsapp.trim());

  const whatsappMessage = encodeURIComponent(
    isRTL 
      ? 'مرحباً، أود الاستفسار عن حجز طاولة وقائمة الطعام في مطعم وكافيه أولديش.' 
      : 'Hello! I would like to inquire about table reservations and the menu at Oldish.'
  );

  return (
    <aside className="mobile-floating-bar" aria-label="Quick Mobile Actions">
      {/* Call */}
      <a
        href={`tel:${siteSettings.phone.replace(/\s+/g, '')}`}
        onClick={() => trackClick('calls')}
        className="floating-action-item"
        aria-label="Call Oldish Restaurant"
      >
        <Phone size={18} style={{ color: 'var(--color-gold)' }} />
        <span>{isRTL ? 'اتصال' : 'Call'}</span>
      </a>

      {/* WhatsApp (only if set) */}
      {hasWhatsapp && (
        <a
          href={`https://wa.me/${cleanWhatsapp}?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackClick('whatsapp_clicks')}
          className="floating-action-item"
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle size={18} style={{ color: '#25D366' }} />
          <span>{isRTL ? 'واتساب' : 'WhatsApp'}</span>
        </a>
      )}

      {/* Standalone Menu Route */}
      <Link
        to="/menu"
        onClick={() => trackClick('menu_views')}
        className="floating-action-item"
        aria-label="Digital Menu"
      >
        <Utensils size={18} style={{ color: 'var(--color-gold)' }} />
        <span>{isRTL ? 'المنيو' : 'Menu'}</span>
      </Link>

      {/* Reserve / Ask About Table */}
      <a
        href="#reservations"
        onClick={handleReserveClick}
        className="floating-action-item highlight"
        aria-label="Ask about a table"
      >
        <Calendar size={18} />
        <span>{isRTL ? 'الطاولات' : 'Tables'}</span>
      </a>

      {/* Directions */}
      <a
        href={siteSettings.google_maps_url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackClick('directions')}
        className="floating-action-item"
        aria-label="Get directions in Google Maps"
      >
        <Navigation size={18} style={{ color: 'var(--color-gold)' }} />
        <span>{isRTL ? 'الخريطة' : 'Map'}</span>
      </a>
    </aside>
  );
};
