import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { Phone, Calendar, Clock, Users, User, Mail, CheckCircle, AlertTriangle, Send, MessageCircle } from 'lucide-react';

export const ReservationSection: React.FC = () => {
  const { isRTL } = useLanguage();
  const { siteSettings, submitInquiry, sections } = useData();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    date: '',
    time: '19:00',
    guests: '2',
    message: '',
    honeypot: '' // bot honeypot field
  });

  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; phone?: string } = {};
    if (!form.name.trim()) {
      newErrors.name = isRTL ? 'يرجى كتابة الاسم' : 'Please provide your name';
    }
    if (!form.phone.trim() || form.phone.trim().length < 8) {
      newErrors.phone = isRTL ? 'يرجى كتابة رقم هاتف صحيح' : 'Please provide a valid phone number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitError(null);
    setIsSubmitting(true);

    const res = await submitInquiry({
      type: 'reservation_request',
      name: form.name,
      phone: form.phone,
      email: form.email,
      date: form.date,
      time: form.time,
      guests: form.guests,
      message: form.message,
      branch: 'Downtown Cairo',
      honeypot: form.honeypot
    });

    setIsSubmitting(false);

    if (res.success) {
      setIsSubmitted(true);
      setSubmitError(null);
    } else {
      setSubmitError(
        isRTL 
          ? 'تعذر إرسال طلب الحجز إلى النظام حالياً. يرجى الاتصال بنا هاتفياً أو مراسلتنا عبر واتساب لتأكيد حجزك فوراً:' 
          : 'Could not submit your reservation request to the server. Please call us directly or message via WhatsApp to confirm your table:'
      );
    }
  };

  const resSec = sections.find(s => s.key === 'reservations');
  if (resSec && !resSec.visible) {
    return null;
  }

  return (
    <section id="reservations" className="section" aria-labelledby="reservations-heading">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-eyebrow">
            <Calendar size={14} />
            <span>{isRTL ? 'الحجز والاستفسار' : 'Reservations & Inquiries'}</span>
          </div>
          <h2 id="reservations-heading" className="section-title">
            {isRTL ? 'حجز طاولة واستفسارات' : 'Book a Table & Inquiries'}
          </h2>
          <div className="gold-divider">
            <span className="gold-divider-diamond" />
          </div>
          <p className="section-lead">
            {isRTL 
              ? 'يسعدنا دائماً استقبالكم في فناء أولديش الساحر بوسط البلد. للاستفسار السريع أو طلب حجز خاص، نوصي بالاتصال الهاتفي أو تسجيل بياناتكم أدناه.' 
              : 'We look forward to welcoming you to Oldish in Downtown Cairo. For immediate table inquiries or private events, please call us directly or submit your details below.'}
          </p>
        </div>

        {/* Primary Recommended Direct Action: CALL TO ASK ABOUT A TABLE */}
        <div 
          style={{
            maxWidth: '680px',
            marginInline: 'auto',
            textAlign: 'center',
            marginBottom: 'var(--space-8)'
          }}
        >
          <a
            href={`tel:${siteSettings.phone.replace(/\s+/g, '')}`}
            className="btn btn-primary"
            style={{ 
              padding: '18px 28px', 
              fontSize: '1.0625rem', 
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 14px rgba(136, 110, 66, 0.35)',
              width: '100%',
              maxWidth: '440px'
            }}
          >
            <Phone size={20} />
            <strong>
              {isRTL 
                ? `الاتصال للاستفسار عن طاولة: ${siteSettings.phone}` 
                : `Call to ask about a table: ${siteSettings.phone}`}
            </strong>
          </a>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '14px', flexWrap: 'wrap' }}>
            <a
              href={siteSettings.facebook_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-gold btn-sm"
            >
              <span>{isRTL ? 'صفحة فيسبوك' : 'Facebook Page'}</span>
            </a>
            <a
              href={siteSettings.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-gold btn-sm"
            >
              <span>{isRTL ? 'صفحة إنستغرام' : 'Instagram Page'}</span>
            </a>
          </div>
        </div>

        {/* Interactive Demo Form Card */}
        <div className="reservation-box">
          {/* Visible Direct Service Banner */}
          <div 
            style={{
              background: '#FFF8E6',
              border: '1px solid #EEDFBA',
              padding: '14px 18px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '0.875rem',
              color: '#8A6D2D',
              marginBottom: '24px',
              lineHeight: 1.5
            }}
          >
            <AlertTriangle size={20} style={{ flexShrink: 0, color: '#B7791F' }} />
            <span>
              <strong>
                {isRTL ? 'خدمة الاستفسار المباشر: ' : 'Direct Inquiry Service: '}
              </strong>
              {isRTL
                ? 'يمكنك تسجيل طلبك هنا للتنسيق مع فريق الضيافة، أو الاتصال بنا مباشرة للتحقق الفوري من توفر الطاولات.'
                : 'You can register your inquiry here to coordinate with our hosting team, or call us directly for immediate table availability.'}
            </span>
          </div>

          {isSubmitted ? (
            <div className="reservation-success-box" role="status">
              <div className="success-icon-wrap" aria-hidden="true">
                <CheckCircle size={36} />
              </div>
              <h3 style={{ fontSize: '1.375rem', marginBottom: '8px', color: '#1B4D18' }}>
                {isRTL ? 'تم استلام طلبكم بنجاح' : 'Inquiry Received'}
              </h3>
              <p style={{ fontSize: '0.9375rem', color: '#3A5C37', marginBottom: '18px', lineHeight: '1.6' }}>
                {isRTL 
                  ? 'شكراً لتواصلكم مع أولديش. تم تسجيل طلبكم وسيقوم فريق العمل بمراجعته وتأكيد التفاصيل معكم.' 
                  : 'Thank you for reaching out to Oldish. Your inquiry has been registered and our team will review and confirm details with you.'}
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <a
                  href={`tel:${siteSettings.phone.replace(/\s+/g, '')}`}
                  className="btn btn-primary btn-sm"
                >
                  <Phone size={15} />
                  <span>{isRTL ? 'الاتصال بالمطعم للاستفسار' : 'Call Venue directly'}</span>
                </a>

                <button
                  type="button"
                  className="btn btn-outline-gold btn-sm"
                  onClick={() => setIsSubmitted(false)}
                >
                  {isRTL ? 'إرسال طلب آخر' : 'Send another request'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {submitError && (
                <div 
                  className="reservation-error-box"
                  style={{
                    background: '#FFF5F5',
                    border: '1px solid #FEB2B2',
                    borderRadius: '8px',
                    padding: '16px 20px',
                    marginBottom: '20px',
                    color: '#9B2C2C',
                    lineHeight: 1.6
                  }}
                  role="alert"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <AlertTriangle size={20} style={{ color: '#E53E3E', flexShrink: 0 }} />
                    <strong style={{ fontSize: '1rem' }}>
                      {isRTL ? 'تنبيه في إرسال طلب الحجز' : 'Submission Alert'}
                    </strong>
                  </div>
                  <p style={{ margin: '0 0 12px 0', fontSize: '0.875rem' }}>
                    {submitError}
                  </p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <a
                      href={`tel:${siteSettings.phone.replace(/\s+/g, '')}`}
                      className="btn btn-primary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Phone size={14} />
                      <span>{isRTL ? `اتصال مباشر: ${siteSettings.phone}` : `Call: ${siteSettings.phone}`}</span>
                    </a>
                    {siteSettings.whatsapp && (
                      <a
                        href={`https://wa.me/${siteSettings.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          isRTL 
                            ? `مرحباً، أود حجز طاولة في أولديش باسم ${form.name || ''} لتاريخ ${form.date || ''}` 
                            : `Hello, I would like to reserve a table at Oldish for ${form.name || ''} on ${form.date || ''}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-gold btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <MessageCircle size={14} />
                        <span>{isRTL ? 'مراسلة عبر واتساب' : 'WhatsApp'}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Anti-spam honeypot - hidden from human users */}
              <input 
                type="text" 
                name="user_nickname_field"
                value={form.honeypot} 
                onChange={(e) => setForm({ ...form, honeypot: e.target.value })} 
                style={{ display: 'none' }} 
                tabIndex={-1} 
                autoComplete="off" 
              />

              <div className="reservation-form-grid">
                <div className="form-group">
                  <label htmlFor="res-name" className="form-label">
                    <User size={15} style={{ color: 'var(--color-gold)' }} />
                    <span>{isRTL ? 'الاسم' : 'Full Name'} *</span>
                  </label>
                  <input
                    id="res-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={`form-input ${errors.name ? 'has-error' : ''}`}
                    placeholder={isRTL ? 'اسمك الكريم' : 'Your Name'}
                    required
                  />
                  {errors.name && <span className="form-error-msg">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="res-phone" className="form-label">
                    <Phone size={15} style={{ color: 'var(--color-gold)' }} />
                    <span>{isRTL ? 'رقم الهاتف' : 'Phone Number'} *</span>
                  </label>
                  <input
                    id="res-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={`form-input ${errors.phone ? 'has-error' : ''}`}
                    placeholder="+20 1X XXXX XXXX"
                    required
                  />
                  {errors.phone && <span className="form-error-msg">{errors.phone}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="res-date" className="form-label">
                    <Calendar size={15} style={{ color: 'var(--color-gold)' }} />
                    <span>{isRTL ? 'التاريخ المتوقع' : 'Expected Date'}</span>
                  </label>
                  <input
                    id="res-date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="res-time" className="form-label">
                    <Clock size={15} style={{ color: 'var(--color-gold)' }} />
                    <span>{isRTL ? 'الوقت التقريبي' : 'Approximate Time'}</span>
                  </label>
                  <select
                    id="res-time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="form-select"
                  >
                    <option value="10:00">10:00 AM (Breakfast)</option>
                    <option value="13:00">01:00 PM (Lunch)</option>
                    <option value="16:00">04:00 PM (Afternoon)</option>
                    <option value="19:00">07:00 PM (Dinner)</option>
                    <option value="21:00">09:00 PM (Evening)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="res-guests" className="form-label">
                    <Users size={15} style={{ color: 'var(--color-gold)' }} />
                    <span>{isRTL ? 'عدد الأفراد' : 'Party Size'}</span>
                  </label>
                  <select
                    id="res-guests"
                    value={form.guests}
                    onChange={(e) => setForm({ ...form, guests: e.target.value })}
                    className="form-select"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6+">6+</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="res-email" className="form-label">
                    <Mail size={15} style={{ color: 'var(--color-gold)' }} />
                    <span>{isRTL ? 'البريد الإلكتروني (اختياري)' : 'Email (Optional)'}</span>
                  </label>
                  <input
                    id="res-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group form-full-width">
                  <label htmlFor="res-message" className="form-label">
                    <span>{isRTL ? 'ملاحظة خاصة أو استفسار' : 'Special Notes / Requests'}</span>
                  </label>
                  <textarea
                    id="res-message"
                    rows={2}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="form-textarea"
                    placeholder={isRTL ? 'احتفال عائلي، مناسبة، متطلبات خاصة...' : 'Gathering, study session, birthday...'}
                  />
                </div>
              </div>

              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-secondary"
                  style={{ minWidth: '220px' }}
                >
                  <Send size={15} />
                  <span>{isSubmitting ? (isRTL ? 'جارٍ الإرسال...' : 'Sending...') : (isRTL ? 'إرسال طلب الحجز' : 'Send Reservation Request')}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
