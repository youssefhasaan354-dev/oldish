import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { Star, ExternalLink, CheckCircle2 } from 'lucide-react';

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
                  <Star key={i} size={16} fill="#E2A03F" />
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

        {/* Call to action linking to Google Maps */}
        <div style={{ textAlign: 'center' }}>
          <a
            href={siteSettings.google_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            <span>{isRTL ? 'قراءة التقييمات على خرائط جوجل' : 'Read Reviews on Google Maps'}</span>
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </section>
  );
};
