import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { Menu as MenuIcon, X, Globe, Phone, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LiveCairoStatusBadge } from './LiveCairoStatusBadge';

interface HeaderProps {
  activeSection: string;
}

export const Header: React.FC<HeaderProps> = ({ activeSection }) => {
  const { language, toggleLanguage, t, isRTL } = useLanguage();
  const { siteSettings, sections, imageSlots, trackClick } = useData();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const headerLogoUrl = siteSettings.logo_url || imageSlots['branding.logo']?.media_url;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const visibleSections = sections.filter(s => s.visible).sort((a, b) => a.sort_order - b.sort_order);

  const handleNavClick = (sectionKey: string) => {
    setMobileMenuOpen(false);
    const targetId = sectionKey === 'hero' ? 'hero' : sectionKey;
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <a href="#main-content" className="skip-to-content">
        {isRTL ? 'تخطي إلى المحتوى الرئيسي' : 'Skip to main content'}
      </a>

      <header className={`site-header ${isScrolled ? 'scrolled' : ''}`} role="banner">
        <div className="container header-inner">
          {/* Logo / Clean Text Wordmark */}
          <a href="#hero" className="brand-link" onClick={() => handleNavClick('hero')}>
            {headerLogoUrl ? (
              <img 
                src={headerLogoUrl} 
                alt={isRTL ? siteSettings.brand_name_ar : siteSettings.brand_name_en}
                className="brand-logo-img"
                style={{ maxHeight: '44px', width: 'auto', objectFit: 'contain' }}
              />
            ) : (
              // Real wordmark: "Oldish" / "أولديش" — No "Cairo" or fabricated words in wordmark
              <div className="brand-wordmark-box" aria-label="Oldish Brand Wordmark">
                <span className="brand-wordmark-en">Oldish</span>
                <span className="brand-wordmark-ar">أولديش</span>
              </div>
            )}
            
            <div className="brand-text-block">
              <span className="brand-sub">
                {isRTL ? siteSettings.subline_ar : siteSettings.subline_en}
              </span>
            </div>
          </a>

          {/* Dynamic Desktop Navigation */}
          <nav className="desktop-nav" aria-label="Main Navigation">
            {visibleSections.map((sec) => (
              <a
                key={sec.key}
                href={`#${sec.key}`}
                className={`nav-link ${activeSection === sec.key ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(sec.key);
                }}
              >
                {isRTL ? sec.nav_label_ar : sec.nav_label_en}
              </a>
            ))}
            <Link to="/menu" className="nav-link" title="Standalone Mobile Menu">
              {isRTL ? 'المنيو السريع' : 'Quick Menu'}
            </Link>
          </nav>

          {/* Header Actions */}
          <div className="header-actions">
            {/* Live Cairo Open/Closed Badge (Africa/Cairo) */}
            <div className="desktop-only">
              <LiveCairoStatusBadge variant="header" />
            </div>

            {/* Language Switcher */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="lang-switch-btn"
              aria-label={isRTL ? 'Switch to English' : 'التحويل إلى اللغة العربية'}
              title={isRTL ? 'Switch to English' : 'التحويل إلى اللغة العربية'}
            >
              <Globe size={16} />
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
            </button>

            {/* Call action */}
            <a
              href={`tel:${siteSettings.phone.replace(/\s+/g, '')}`}
              onClick={() => trackClick('calls')}
              className="btn btn-outline-gold btn-sm desktop-only"
              aria-label="Call Oldish"
            >
              <Phone size={14} />
              <span>{isRTL ? 'اتصل بنا' : 'Call'}</span>
            </a>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(true)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              aria-label="Open mobile navigation menu"
            >
              <MenuIcon size={26} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div 
          className="mobile-drawer-overlay" 
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        id="mobile-navigation"
        className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="mobile-drawer-header">
          <div className="brand-wordmark-box">
            <span className="brand-wordmark-en">Oldish</span>
            <span className="brand-wordmark-ar">أولديش</span>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label={t('common.close')}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="mobile-nav-links" aria-label="Mobile Navigation">
          {visibleSections.map((sec) => (
            <a
              key={sec.key}
              href={`#${sec.key}`}
              className={`mobile-nav-link ${activeSection === sec.key ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(sec.key);
              }}
            >
              {isRTL ? sec.nav_label_ar : sec.nav_label_en}
            </a>
          ))}
          <Link 
            to="/menu" 
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            <ExternalLink size={16} style={{ display: 'inline', marginInlineEnd: '6px' }} />
            <span>{isRTL ? 'قائمة الطعام الرقمية' : 'Digital Menu'}</span>
          </Link>
        </nav>

        <div className="mobile-drawer-footer">
          <a
            href={`tel:${siteSettings.phone.replace(/\s+/g, '')}`}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            <Phone size={18} />
            <span>{siteSettings.phone}</span>
          </a>

          <button
            type="button"
            onClick={toggleLanguage}
            className="lang-switch-btn"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <Globe size={16} />
            <span>{language === 'en' ? 'التحويل إلى العربية' : 'Switch to English'}</span>
          </button>

          <Link 
            to="/admin" 
            onClick={() => setMobileMenuOpen(false)}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '6px', 
              fontSize: '0.75rem', 
              color: 'rgba(255, 255, 255, 0.45)', 
              textDecoration: 'none',
              paddingTop: '6px'
            }}
          >
            <span>{isRTL ? 'إدارة الموقع' : 'Portal'}</span>
          </Link>
        </div>
      </aside>
    </>
  );
};
