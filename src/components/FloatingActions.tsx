import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { Phone, Calendar, Navigation, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FloatingActions: React.FC = () => {
  const { isRTL } = useLanguage();
  const { siteSettings } = useData();

  const handleReserveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.querySelector('#reservations');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <aside className="mobile-floating-bar" aria-label="Quick Mobile Actions">
      {/* Call */}
      <a
        href={`tel:${siteSettings.phone.replace(/\s+/g, '')}`}
        className="floating-action-item"
        aria-label="Call Oldish Restaurant"
      >
        <Phone size={18} style={{ color: 'var(--color-gold)' }} />
        <span>{isRTL ? 'اتصال' : 'Call'}</span>
      </a>

      {/* Standalone Menu Route */}
      <Link
        to="/menu"
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
        className="floating-action-item"
        aria-label="Get directions in Google Maps"
      >
        <Navigation size={18} style={{ color: 'var(--color-gold)' }} />
        <span>{isRTL ? 'الخريطة' : 'Map'}</span>
      </a>
    </aside>
  );
};
