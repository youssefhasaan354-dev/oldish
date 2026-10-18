import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { Trees, Lamp, Laptop, CreditCard } from 'lucide-react';

export const AtmosphereSection: React.FC = () => {
  const { isRTL } = useLanguage();
  const { sections, getImageForSlot } = useData();

  const atmosphereSec = sections.find(s => s.key === 'atmosphere');
  const content = atmosphereSec?.content || {};
  const bannerImg = getImageForSlot('atmosphere.quote_banner', '/images/oldish_courtyard_evening.webp');

  const features = [
    {
      icon: <Trees size={24} />,
      titleEn: content.card1_title_en || 'Brick-Lined Courtyard & Garden',
      titleAr: content.card1_title_ar || 'فناء وحديقة بالطوب الأحمر',
      descEn: content.card1_desc_en || 'Outdoor garden seating with trees, balconies, and hanging flower pots.',
      descAr: content.card1_desc_ar || 'جلسات خارجية في الهواء الطلق بين الأشجار والشرفات وأواني الزهور.'
    },
    {
      icon: <Lamp size={24} />,
      titleEn: content.card2_title_en || 'Nostalgic Vintage Interior',
      titleAr: content.card2_title_ar || 'صالون بتراث منتصف القرن',
      descEn: content.card2_desc_en || 'Torn newspaper collage walls, vintage radio, jacket and tarboush display, and historic Downtown windows.',
      descAr: content.card2_desc_ar || 'جدران بقصاصات الجرائد القديمة، فترينة الراديو والطربوش العتيق، ونوافذ بيوت وسط البلد.'
    },
    {
      icon: <Laptop size={24} />,
      titleEn: content.card3_title_en || 'Work, Study & Photo-Friendly',
      titleAr: content.card3_title_ar || 'مناسب للدراسة والعمل والصور',
      descEn: content.card3_desc_en || 'Free Wi-Fi, comfortable tables, and scenic retro corners favored by Greek Campus students and creators.',
      descAr: content.card3_desc_ar || 'واي فاي متاح، طاولات مريحة، وأركان تصوير محبوبة لطلاب الجريك كامبس والمبدعين.'
    },
    {
      icon: <CreditCard size={24} />,
      titleEn: content.card4_title_en || 'Amenities & Convenience',
      titleAr: content.card4_title_ar || 'خدمات وتسهيلات متكاملة',
      descEn: content.card4_desc_en || 'Indoor and outdoor seating, credit cards accepted (Visa/Mastercard), takeaway, delivery, and street parking.',
      descAr: content.card4_desc_ar || 'جلسات داخلية وخارجية، قبول بطاقات الائتمان (فيزا وماستركارد)، طلبات خارجية وتوصيل، ومواقف سيارات.'
    }
  ];

  if (atmosphereSec && !atmosphereSec.visible) {
    return null;
  }

  return (
    <section id="atmosphere" className="section section-dark" aria-labelledby="atmosphere-heading">
      <div className="container">
        {/* Header */}
        <div className="section-header">
          <div className="section-eyebrow">
            <span>{isRTL ? 'الأجواء والخدمات' : 'Atmosphere & Amenities'}</span>
          </div>
          <h2 id="atmosphere-heading" className="section-title">
            {isRTL ? 'ملامح التجربة في أولديش' : 'The Distinctive Oldish Ambiance'}
          </h2>
          <div className="gold-divider">
            <span className="gold-divider-diamond" />
          </div>
          <p className="section-lead">
            {isRTL 
              ? 'أجواء بيت قاهري دافئ يجمع بين هدوء الفناء المفتوح، وتفاصيل الديكور الكلاسيكي، وسهولة الخدمات.' 
              : 'A welcoming mid-century Cairo venue blending courtyard tranquility, nostalgic decor, and practical comforts.'}
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="atmosphere-grid">
          {features.map((feat, idx) => (
            <div key={idx} className="atmosphere-card">
              <div className="atmosphere-icon-wrap" aria-hidden="true">
                {feat.icon}
              </div>
              <h3 style={{ fontSize: '1.125rem', margin: '0 0 8px 0', fontWeight: 600 }}>{isRTL ? feat.titleAr : feat.titleEn}</h3>
              <p>{isRTL ? feat.descAr : feat.descEn}</p>
            </div>
          ))}
        </div>

        {/* Atmospheric Quote Banner */}
        <div 
          style={{
            marginTop: 'var(--space-12)',
            borderRadius: '4px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-elevated)',
            border: '1px solid var(--color-gold-border)'
          }}
        >
          <div 
            style={{
              backgroundImage: `url(${bannerImg.url})`,
              backgroundSize: bannerImg.slot?.object_fit || 'cover',
              backgroundPosition: `${bannerImg.slot?.object_position_x ?? 50}% ${bannerImg.slot?.object_position_y ?? 50}%`,
              minHeight: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-8)',
              position: 'relative'
            }}
          >
            <div 
              style={{
                position: 'absolute',
                inset: 0,
                background: `rgba(18, 18, 18, ${bannerImg.slot?.overlay_opacity || 0.75})`
              }}
              aria-hidden="true"
            />
            <div 
              style={{
                position: 'relative',
                zIndex: 2,
                maxWidth: '720px',
                textAlign: 'center'
              }}
            >
              <p 
                style={{
                  fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-en-serif)',
                  fontSize: '1.25rem',
                  color: '#FFFFFF',
                  lineHeight: '1.7',
                  marginBottom: '16px'
                }}
              >
                {isRTL
                  ? '«فناء مفتوح محاط بالطوب الأحمر والشرفات العتيقة، وقصاصات الجرائد التي تحكي تاريخ القاهرة، ورائحة الفخار والشاي بالنعناع... مكان صُمم لكي لا تنسى نكهاته أبداً.»'
                  : '“An open brick courtyard embraced by green balconies, vintage newspaper collages reflecting Cairo’s mid-century soul, and comforting dishes crafted to create flavors you’ll never forget.”'}
              </p>
              <span 
                style={{ 
                  color: 'var(--color-gold)', 
                  fontSize: '0.875rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.1em',
                  fontWeight: 600
                }}
              >
                — Oldish • Downtown Cairo
              </span>

              {bannerImg.isAi && (
                <div style={{ marginTop: '12px' }}>
                  <span className="badge" style={{ background: 'rgba(0,0,0,0.6)', color: '#bbb', fontSize: '0.6875rem' }}>
                    {isRTL ? 'صورة توضيحية' : 'Illustrative image'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
