import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { MapPin, Phone, Clock, Navigation, CheckCircle2, AlertTriangle, Send, MessageCircle } from 'lucide-react';

export const LocationContactSection: React.FC = () => {
  const { isRTL } = useLanguage();
  const { branches, submitInquiry, sections } = useData();

  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    message: '',
    honeypot: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.message.trim()) {
      setErrorMsg(isRTL ? 'يرجى كتابة الاسم والرسالة' : 'Please provide your name and a message');
      return;
    }

    setErrorMsg('');
    setIsSending(true);

    await submitInquiry({
      type: 'contact_inquiry',
      name: contactForm.name,
      phone: contactForm.phone,
      message: contactForm.message,
      honeypot: contactForm.honeypot
    });

    setIsSending(false);
    setFormSubmitted(true);
  };

  const visibleBranches = branches.filter(b => b.visible);

  const locSec = sections.find(s => s.key === 'locations');
  if (locSec && !locSec.visible) {
    return null;
  }

  return (
    <section id="locations" className="section section-neutral" aria-labelledby="locations-heading">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-eyebrow">
            <MapPin size={14} />
            <span>{isRTL ? 'الفروع ومعلومات الوصول' : 'Locations & Contact'}</span>
          </div>
          <h2 id="locations-heading" className="section-title">
            {isRTL ? 'تفضل بزيارتنا في وسط البلد' : 'Visit Oldish in Downtown Cairo'}
          </h2>
          <div className="gold-divider">
            <span className="gold-divider-diamond" />
          </div>
          <p className="section-lead">
            {isRTL 
              ? 'موقع مميز في شارع محمد محمود خلف الجريك كامبس، على بُعد 5 دقائق سيراً من ميدان التحرير ومحطة مترو السادات.' 
              : 'Centrally located on Mohamed Mahmoud St behind the Greek Campus, a 5-minute walk from Tahrir Square and Sadat Metro.'}
          </p>
        </div>

        {/* Locations Grid */}
        <div className="locations-container">
          {/* Branch Cards Stack */}
          <div className="branch-cards-stack">
            {visibleBranches.map((branch) => {
              const isConfirmed = branch.status === 'confirmed';
              return (
                <article key={branch.id} className={`branch-card ${branch.is_primary ? 'primary' : ''}`}>
                  <div className="branch-header">
                    <h3 className="branch-name">
                      {isRTL ? branch.name_ar : branch.name_en}
                    </h3>
                    {isConfirmed ? (
                      <span className="badge badge-verified">
                        <CheckCircle2 size={13} />
                        <span>{isRTL ? 'الفرع الرئيسي المؤكد' : 'Primary Confirmed Branch'}</span>
                      </span>
                    ) : (
                      <span className="badge badge-unverified">
                        <AlertTriangle size={13} />
                        <span>{isRTL ? 'فرع الزمالك - رهن التأكيد مع المالك' : 'Zamalek branch - details to be confirmed with the owner'}</span>
                      </span>
                    )}
                  </div>

                  {/* Branch Note */}
                  <p style={{ fontSize: '0.875rem', color: isConfirmed ? 'var(--color-muted-olive)' : '#A24E38', marginBottom: '16px' }}>
                    {isRTL ? branch.note_ar : branch.note_en}
                  </p>

                  {/* Details List */}
                  <div className="branch-details-list">
                    <div className="branch-detail-row">
                      <MapPin size={18} className="branch-icon" />
                      <div>
                        <strong>{isRTL ? 'العنوان:' : 'Address:'}</strong>
                        <p>{isRTL ? branch.address_ar : branch.address_en}</p>
                      </div>
                    </div>

                    <div className="branch-detail-row">
                      <Navigation size={18} className="branch-icon" />
                      <div>
                        <strong>{isRTL ? 'المعلم والوصول:' : 'Landmark & Directions:'}</strong>
                        <p>{isRTL ? branch.landmark_ar : branch.landmark_en}</p>
                      </div>
                    </div>

                    {/* Hours (only if confirmed) */}
                    {isConfirmed && (
                      <div className="branch-detail-row">
                        <Clock size={18} className="branch-icon" />
                        <div>
                          <strong>{isRTL ? 'مواعيد العمل:' : 'Hours:'}</strong>
                          <p>{isRTL ? branch.hours_summary_ar : branch.hours_summary_en}</p>
                        </div>
                      </div>
                    )}

                    {/* Phone (only if confirmed) */}
                    {isConfirmed && branch.phone && (
                      <div className="branch-detail-row">
                        <Phone size={18} className="branch-icon" />
                        <div>
                          <strong>{isRTL ? 'الهاتف:' : 'Telephone:'}</strong>
                          <p>
                            <a 
                              href={`tel:${branch.phone.replace(/\s+/g, '')}`}
                              style={{ color: 'var(--color-gold-dark)', fontWeight: 600, textDecoration: 'none' }}
                            >
                              {branch.phone}
                            </a>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Branch Actions */}
                  {isConfirmed && (
                    <div className="branch-actions">
                      {branch.phone && (
                        <a
                          href={`tel:${branch.phone.replace(/\s+/g, '')}`}
                          className="btn btn-primary btn-sm"
                        >
                          <Phone size={14} />
                          <span>{isRTL ? 'اتصال مباشر' : 'Call Venue'}</span>
                        </a>
                      )}

                      {branch.map_directions_url && (
                        <a
                          href={branch.map_directions_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline-gold btn-sm"
                        >
                          <Navigation size={14} />
                          <span>{isRTL ? 'فتح في خرائط جوجل' : 'Open in Google Maps'}</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Google Map Embed for Primary Branch */}
                  {branch.is_primary && branch.map_embed_url && (
                    <div className="map-embed-wrapper" aria-label="Downtown Cairo Google Map">
                      <iframe
                        src={branch.map_embed_url}
                        title="Oldish Downtown Cairo Map"
                        loading="lazy"
                        allowFullScreen
                      />
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* Contact Inquiry Form */}
          <div className="contact-form-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <MessageCircle size={20} style={{ color: 'var(--color-gold)' }} />
              <h3 style={{ fontSize: '1.25rem', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-en-serif)' }}>
                {isRTL ? 'تواصل مع فريق أولديش' : 'Send an Inquiry / Message'}
              </h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '18px' }}>
              {isRTL
                ? 'استفسارات المجموعات، مناسبات التصوير، أو ملاحظات الزيارة. رسالتك تصل مباشرة إلى إدارة المكان.'
                : 'Questions regarding group gatherings, photo shoots, or feedback. Messages are sent directly to venue management.'}
            </p>

            {formSubmitted ? (
              <div 
                style={{
                  background: '#EDF7EC',
                  border: '1px solid #C2E4C0',
                  padding: '20px',
                  borderRadius: '4px',
                  textAlign: 'center'
                }}
              >
                <CheckCircle2 size={32} style={{ color: '#2C7326', marginInline: 'auto', marginBottom: '8px' }} />
                <h4 style={{ color: '#1E5319', marginBottom: '6px' }}>
                  {isRTL ? 'تم استلام رسالتك' : 'Message Received'}
                </h4>
                <p style={{ fontSize: '0.875rem', color: '#3A6336' }}>
                  {isRTL ? 'شكراً لتواصلك معنا! تم تسجيل رسالتك بنجاح.' : 'Thank you for contacting Oldish! Your message has been recorded.'}
                </p>
                <button
                  type="button"
                  className="btn btn-outline-gold btn-sm"
                  style={{ marginTop: '12px' }}
                  onClick={() => {
                    setContactForm({ name: '', phone: '', message: '', honeypot: '' });
                    setFormSubmitted(false);
                  }}
                >
                  {isRTL ? 'إرسال رسالة أخرى' : 'Send Another Message'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} noValidate>
                {/* Honeypot field */}
                <input
                  type="text"
                  name="user_comment_security"
                  value={contactForm.honeypot}
                  onChange={(e) => setContactForm({ ...contactForm, honeypot: e.target.value })}
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                {errorMsg && (
                  <div style={{ color: '#C53030', fontSize: '0.8125rem', marginBottom: '12px', fontWeight: 500 }}>
                    {errorMsg}
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label htmlFor="contact-name" className="form-label">
                    {isRTL ? 'الاسم' : 'Name'} *
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label htmlFor="contact-phone" className="form-label">
                    {isRTL ? 'رقم الهاتف' : 'Phone'}
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label htmlFor="contact-message" className="form-label">
                    {isRTL ? 'رسالتك' : 'Message'} *
                  </label>
                  <textarea
                    id="contact-message"
                    rows={3}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="form-textarea"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSending}
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                >
                  <Send size={15} />
                  <span>{isSending ? (isRTL ? 'جارٍ الإرسال...' : 'Sending...') : (isRTL ? 'إرسال الرسالة' : 'Send Message')}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
