import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { Utensils, Calendar, MapPin, ChevronLeft, ChevronRight, Clock, ShoppingBag } from 'lucide-react';
import { getResponsiveSrcSet } from '../lib/cloudinary';

export const Hero: React.FC = () => {
  const { isRTL } = useLanguage();
  const { siteSettings, getImageForSlot } = useData();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Dynamic slides from image slots
  const slide0 = getImageForSlot('hero.slide.0', '/images/oldish_courtyard_hero.webp');
  const slide1 = getImageForSlot('hero.slide.1', '/images/oldish_courtyard_evening.webp');
  const slide2 = getImageForSlot('hero.slide.2', '/images/egyptian_breakfast_spread.webp');

  const slides = [slide0, slide1, slide2];

  const [loadSecondarySlides, setLoadSecondarySlides] = useState(false);

  useEffect(() => {
    // Delay loading extra hero slides until 5.5s (before rotation at 6s)
    const timer = setTimeout(() => setLoadSecondarySlides(true), 5500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  const handleNext = () => {
    setLoadSecondarySlides(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setLoadSecondarySlides(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const scrollTo = (selector: string) => {
    const el = document.querySelector(selector);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const activeSlideData = slides[currentSlide];

  return (
    <section 
      id="hero" 
      className="hero-section"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Welcome Hero Showcase"
    >
      {/* Background Slideshow */}
      <div className="hero-slider-bg" aria-hidden="true">
        {slides.map((slide, index) => {
          if (index > 0 && index !== currentSlide && !loadSecondarySlides) {
            return null;
          }
          const srcSet = getResponsiveSrcSet(slide.url);

          return (
            <div
              key={index}
              className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
            >
              <img
                src={slide.url}
                srcSet={srcSet}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 100vw"
                width={1376}
                height={768}
                alt={slide.slot?.alt_en || 'Oldish Courtyard'}
                className="hero-slide-img"
                fetchPriority={index === 0 ? 'high' : 'low'}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding={index === 0 ? 'sync' : 'async'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: (slide.slot?.object_fit as any) || 'cover',
                  objectPosition: `${slide.slot?.object_position_x ?? 50}% ${slide.slot?.object_position_y ?? 50}%`,
                  transform: slide.slot?.zoom && slide.slot.zoom > 1 ? `scale(${slide.slot.zoom})` : undefined
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Atmospheric Vignette Overlay */}
      <div 
        className="hero-overlay" 
        aria-hidden="true" 
      />

      {/* Main Editorial Content */}
      <div className="hero-content">
        {/* Eyebrow Badge */}
        <div className="hero-badge-wrap">
          <span className="badge hero-chip">
            <MapPin size={14} />
            <span>
              {isRTL 
                ? 'شارع محمد محمود • خلف الجريك كامبس (وسط البلد)' 
                : '20 Mohamed Mahmoud St • Behind Greek Campus'}
            </span>
          </span>
        </div>

        <p className="hero-eyebrow">
          {isRTL ? siteSettings.subline_ar : siteSettings.subline_en}
        </p>

        {/* Real Tagline from Facebook page */}
        <h1 className="hero-headline">
          {isRTL ? siteSettings.tagline_ar : siteSettings.tagline_en}
        </h1>

        <p className="hero-subtitle">
          {isRTL 
            ? 'بيت قاهري عتيق بطراز منتصف القرن الماضي، فناء خارجي هادئ محاط بالطوب الأحمر والشرفات الخضراء، وأشهى المأكولات المصرية التراثية والمشروبات الطازجة.' 
            : 'A nostalgic mid-century Cairo house and leafy brick-lined courtyard sanctuary, serving comforting Egyptian tagines, all-day breakfast, and artisan drinks in Downtown.'}
        </p>

        {/* Real Amenities & Facebook Category Tag */}
        <div className="hero-chips-wrap">
          <span className="badge hero-chip">
            {isRTL ? 'مطعم · مقهى · حديقة' : 'Restaurant · Café · Garden'}
          </span>
          <span className="badge hero-chip">
            {isRTL ? 'أكثر من ١٦٥ ألف متابع على فيسبوك' : '~165K Facebook Community'}
          </span>
          <span className="badge hero-chip">
            {isRTL ? 'جلسات داخلية وخارجية • واي فاي' : 'Indoor & Outdoor • Wi-Fi'}
          </span>
        </div>

        {/* Calls to Action */}
        <div className="hero-ctas">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => scrollTo('#menu')}
          >
            <Utensils size={16} />
            <span>{isRTL ? 'استكشف قائمة الطعام' : 'Explore the Menu'}</span>
          </button>

          <button
            type="button"
            className="btn btn-outline-light"
            onClick={() => scrollTo('#reservations')}
          >
            <Calendar size={16} />
            <span>{isRTL ? 'الاستفسار عن الطاولات' : 'Ask About a Table'}</span>
          </button>

          <a
            href={siteSettings.google_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-gold"
          >
            <MapPin size={16} />
            <span>{isRTL ? 'الاتجاهات والخريطة' : 'Get Directions'}</span>
          </a>

          {siteSettings.elmenus_url && (
            <a
              href={siteSettings.elmenus_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-light"
            >
              <ShoppingBag size={16} />
              <span>{isRTL ? 'طلب دليفري (elmenus)' : 'Order Delivery'}</span>
            </a>
          )}
        </div>

        {/* Hours & Operating Info */}
        <div className="hero-hours-pill">
          <Clock size={15} />
          <span>
            {isRTL ? 'يومياً: 8:00 صباحاً – 12:00 منتصف الليل' : 'Every day: 8:00 AM – 12:00 AM (Midnight)'}
          </span>
          <span className="pill-divider" aria-hidden="true">|</span>
          <span>
            {isRTL ? 'متوسط الفرد: 200–400 ج.م' : 'Approx. EGP 200–400 / person'}
          </span>
        </div>

        {/* Illustrative AI Image Notice for Current Hero Slide */}
        {activeSlideData.isAi && (
          <div style={{ marginBottom: '14px' }}>
            <span className="badge hero-chip" style={{ fontSize: '0.7rem' }}>
              {isRTL ? 'صورة توضيحية' : 'Illustrative image'}
            </span>
          </div>
        )}

        {/* Slideshow Controls */}
        <div className="hero-slide-indicators" role="tablist" aria-label="Slideshow controls">
          <button 
            type="button"
            onClick={handlePrev}
            className="hero-slide-btn"
            aria-label={isRTL ? 'الشريحة السابقة' : 'Previous Slide'}
          >
            {isRTL ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>

          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              role="tab"
              className={`slide-dot ${idx === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(idx)}
              aria-label={isRTL ? `الشريحة ${idx + 1}` : `Slide ${idx + 1}`}
              aria-selected={idx === currentSlide}
            />
          ))}

          <button 
            type="button"
            onClick={handleNext}
            className="hero-slide-btn"
            aria-label={isRTL ? 'الشريحة التالية' : 'Next Slide'}
          >
            {isRTL ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
      </div>
    </section>
  );
};
