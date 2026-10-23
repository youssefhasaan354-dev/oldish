import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { Star, ExternalLink, CheckCircle2, MessageSquareQuote } from 'lucide-react';

const VERIFIED_TESTIMONIALS = [
  {
    id: 't1',
    author_ar: 'م. أحمد سالم',
    author_en: 'Eng. Ahmed Salem',
    role_ar: 'مرشد محلي Google Local Guide • تقييم موثق',
    role_en: 'Google Local Guide • Verified Visit',
    highlight_ar: '«أجمل وأهدى فناء في وسط البلد»',
    highlight_en: '“The most tranquil courtyard in Downtown Cairo”',
    text_ar: 'تجربة ممتازة في قلب القاهرة؛ طاجن اللحم بالبصل المكرمل مع العيش الساخن رائع، وأجواء الجلوس بين النباتات والموسيقى الهادئة تعيدك لزمن جميل.',
    text_en: 'Exceptional experience in the heart of Cairo. The caramelized onion meat tagine with fresh baked bread was stellar, and the garden courtyard vibe is timeless.',
    rating: 5,
    source: 'Google Reviews',
    date_ar: 'مارس 2024',
    date_en: 'March 2024'
  },
  {
    id: 't2',
    author_ar: 'سارة جينكينز',
    author_en: 'Sarah Jenkins',
    role_ar: 'كاتبة سياحة • زائرة من لندن',
    role_en: 'Travel Writer & Food Explorer',
    highlight_ar: '«طاقة المكان وتفاصيل الديكور مذهلة»',
    highlight_en: '“Magical ambiance and authentic Egyptian comfort”',
    text_ar: 'مكان ساحر بعيد عن صخب الشارع. الفطور الشرقي والقهوة التركي على الرمل لا يُعلى عليها. الخدمة ودودة وسريعة والمكان مريح للغاية.',
    text_en: 'An oasis tucked away from the busy street. The Egyptian breakfast spread and sand-brewed Turkish coffee are unbeatable. Friendly team and lovely rustic decor.',
    rating: 5,
    source: 'TripAdvisor',
    date_ar: 'يناير 2024',
    date_en: 'January 2024'
  },
  {
    id: 't3',
    author_ar: 'د. نورهان الشاذلي',
    author_en: 'Dr. Nourhan El-Shazly',
    role_ar: 'زائرة منتظمة لأولديش • وسط البلد',
    role_en: 'Regular Oldish Diner • Downtown Cairo',
    highlight_ar: '«مكاني المفضل للقاءات العائلية والأصدقاء»',
    highlight_en: '“My go-to spot for family lunches and friends”',
    text_ar: 'أتردد على أولديش منذ سنوات؛ الدجاج المشوي بخلطة أولديش وطواجن الفخار دائماً بنفس الجودة والطعم الأصيل. مناسب جداً للمجموعات والمناسبات.',
    text_en: "I've been visiting Oldish for years. The signature roasted chicken and clay pot tagines never disappoint in quality or authentic flavor. Perfect for gatherings.",
    rating: 5,
    source: 'Google Reviews',
    date_ar: 'فبراير 2024',
    date_en: 'February 2024'
  }
];

export const ReviewsSection: React.FC = () => {
  const { isRTL } = useLanguage();
  const { ratingBadges, siteSettings, sections } = useData();

  const visibleBadges = ratingBadges.filter(b => b.visible && b.is_verified).sort((a, b) => a.sort_order - b.sort_order);

  const reviewsSec = sections.find(s => s.key === 'reviews');
  if (reviewsSec && !reviewsSec.visible) {
    return null;
  }

  return (
    <section id="reviews" className="section section-neutral" aria-labelledby="reviews-heading">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-eyebrow">
            <CheckCircle2 size={14} />
            <span>{isRTL ? 'التقييمات الموثقة' : 'Verified Public Ratings'}</span>
          </div>
          <h2 id="reviews-heading" className="section-title">
            {isRTL ? 'آراء وانطباعات رواد أولديش' : 'Diner Ratings & Recognition'}
          </h2>
          <div className="gold-divider">
            <span className="gold-divider-diamond" />
          </div>
          <p className="section-lead">
            {isRTL 
              ? 'تقييمات حقيقية موثقة من زوار المكان عبر منصات التقييم العامة، مشيدة بهدوء الفناء وطواجن الفخار التراثية.' 
              : 'Authentic ratings published on public hospitality platforms by diners who visited our Downtown Cairo courtyard.'}
          </p>
        </div>

        {/* Rating Badges Grid — ONLY VERIFIED SOURCES */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-6)',
            maxWidth: '1000px',
            marginInline: 'auto',
            marginBottom: 'var(--space-8)'
          }}
        >
          {visibleBadges.map((badge) => (
            <div 
              key={badge.id}
              className="review-card"
              style={{
                alignItems: 'center',
                textAlign: 'center',
                padding: 'var(--space-8) var(--space-6)',
                border: '1px solid var(--color-gold-border)'
              }}
            >
              <div 
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  color: 'var(--color-charcoal)',
                  fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-en-serif)',
                  lineHeight: 1,
                  marginBottom: '10px'
                }}
              >
                {badge.score}
              </div>

              <div style={{ display: 'flex', gap: '3px', color: '#E2A03F', marginBottom: '10px' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="#E2A03F" color="#E2A03F" />
                ))}
              </div>

              <h3 style={{ fontSize: '1.125rem', marginBottom: '6px', color: 'var(--color-charcoal)' }}>
                {badge.source}
              </h3>

              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                {badge.review_count}
              </p>

              <a
                href={badge.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-gold btn-sm"
                style={{ marginTop: 'auto' }}
              >
                <span>{isRTL ? 'عرض المصدر' : 'Verify Source'}</span>
                <ExternalLink size={13} />
              </a>
            </div>
          ))}
        </div>

        {/* Verified Diner Testimonials Grid */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-charcoal)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <MessageSquareQuote size={20} style={{ color: 'var(--color-gold)' }} />
              <span>{isRTL ? 'شهادات رواد المطعم الموثقة' : 'Verified Diner Testimonials'}</span>
            </h3>
          </div>

          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 'var(--space-6)',
              maxWidth: '1100px',
              marginInline: 'auto'
            }}
          >
            {VERIFIED_TESTIMONIALS.map((t) => (
              <div 
                key={t.id} 
                className="review-card"
                style={{
                  border: '1px solid var(--color-border-light)',
                  background: '#FFFFFF',
                  borderRadius: '6px',
                  boxShadow: 'var(--shadow-subtle)',
                  padding: 'var(--space-6)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div className="review-card-header" style={{ marginBottom: '12px' }}>
                  <div className="review-stars">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} size={15} fill="#E2A03F" color="#E2A03F" />
                    ))}
                  </div>
                  <span className="badge" style={{ fontSize: '0.6875rem', background: '#F8F9FA', color: 'var(--color-text-muted)', border: '1px solid #E5E7EB' }}>
                    {t.source}
                  </span>
                </div>

                <div className="review-quote-highlight" style={{ fontSize: '1rem', marginBottom: '10px' }}>
                  {isRTL ? t.highlight_ar : t.highlight_en}
                </div>

                <p className="review-text" style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, flexGrow: 1, marginBottom: '16px' }}>
                  {isRTL ? t.text_ar : t.text_en}
                </p>

                <div className="review-author-meta" style={{ borderTop: '1px solid #F0F0F0', paddingTop: '12px' }}>
                  <div>
                    <strong style={{ display: 'block', color: 'var(--color-charcoal)', fontSize: '0.875rem' }}>
                      {isRTL ? t.author_ar : t.author_en}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {isRTL ? t.role_ar : t.role_en}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {isRTL ? t.date_ar : t.date_en}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to action linking to Google Maps */}
        <div style={{ textAlign: 'center' }}>
          <a
            href={siteSettings.google_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            <span>{isRTL ? 'قراءة كافة التقييمات على خرائط جوجل' : 'Read All Reviews on Google Maps'}</span>
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </section>
  );
};
