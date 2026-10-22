import React, { useState, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Palette, 
  AlertTriangle, 
  Save, 
  Check, 
  Upload, 
  Trash2, 
  RotateCcw, 
  Image as ImageIcon,
  Megaphone,
  RefreshCw
} from 'lucide-react';

// WCAG Contrast calculation helpers
function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return 0.5;
  const rgb = [
    parseInt(cleanHex.substring(0, 2), 16) / 255,
    parseInt(cleanHex.substring(2, 4), 16) / 255,
    parseInt(cleanHex.substring(4, 6), 16) / 255,
  ].map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));

  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function getContrastRatio(hex1: string, hex2: string): number {
  try {
    const lum1 = getLuminance(hex1);
    const lum2 = getLuminance(hex2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  } catch {
    return 4.5;
  }
}

export const AdminBrandingManager: React.FC = () => {
  const { 
    siteSettings, 
    updateSettings, 
    imageSlots, 
    replaceSlotImage, 
    resetSlotToDefault, 
    resetAllDemoData 
  } = useData();
  const { role } = useAuth();
  const isReadOnly = role === 'viewer';
  const isOwner = role === 'owner';

  const [form, setForm] = useState({ ...siteSettings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const fileInputRefs = {
    'branding.logo': useRef<HTMLInputElement>(null),
    'branding.logo_dark': useRef<HTMLInputElement>(null),
    'branding.favicon': useRef<HTMLInputElement>(null),
    'branding.social_share': useRef<HTMLInputElement>(null),
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleLogoUpload = async (slotKey: 'branding.logo' | 'branding.logo_dark' | 'branding.favicon' | 'branding.social_share', file: File) => {
    if (isReadOnly) return;
    setUploadingSlot(slotKey);
    try {
      const res = await replaceSlotImage(slotKey, file);
      if (res.success) {
        // Sync local form state
        const updatedMediaUrl = imageSlots[slotKey]?.media_url;
        if (slotKey === 'branding.logo') setForm(prev => ({ ...prev, logo_url: updatedMediaUrl }));
        if (slotKey === 'branding.logo_dark') setForm(prev => ({ ...prev, logo_dark_url: updatedMediaUrl }));
        if (slotKey === 'branding.favicon') setForm(prev => ({ ...prev, favicon_url: updatedMediaUrl }));
        if (slotKey === 'branding.social_share') setForm(prev => ({ ...prev, social_image_url: updatedMediaUrl }));
      } else {
        alert(res.error || 'فشل تحميل الشعار');
      }
    } catch (err: any) {
      alert(err?.message || 'حدث خطأ أثناء تحميل الشعار');
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleRemoveLogo = (slotKey: 'branding.logo' | 'branding.logo_dark' | 'branding.favicon' | 'branding.social_share') => {
    if (isReadOnly) return;
    resetSlotToDefault(slotKey);
    if (slotKey === 'branding.logo') {
      setForm(prev => ({ ...prev, logo_url: '' }));
      updateSettings({ logo_url: '' });
    } else if (slotKey === 'branding.logo_dark') {
      setForm(prev => ({ ...prev, logo_dark_url: '' }));
      updateSettings({ logo_dark_url: '' });
    } else if (slotKey === 'branding.favicon') {
      setForm(prev => ({ ...prev, favicon_url: '' }));
      updateSettings({ favicon_url: '' });
    } else if (slotKey === 'branding.social_share') {
      const defaultSocial = '/images/og-image.jpg';
      setForm(prev => ({ ...prev, social_image_url: defaultSocial }));
      updateSettings({ social_image_url: defaultSocial });
    }
  };

  const handleResetDemoData = async () => {
    if (!isOwner) return;
    setIsResetting(true);
    try {
      await resetAllDemoData();
      setForm({ ...siteSettings });
      setResetConfirmOpen(false);
      alert('تمت إعادة ضبط البيانات التجريبية بنجاح إلى النسخة الأولية المعتمدة.');
      window.location.reload();
    } catch {
      alert('حدث خطأ أثناء إعادة ضبط البيانات.');
    } finally {
      setIsResetting(false);
    }
  };

  // Contrast calculations
  const textOnBgContrast = getContrastRatio(form.charcoal_color || '#222222', form.bg_color || '#FAF8F5');
  const goldOnBgContrast = getContrastRatio(form.primary_color || '#886E42', form.bg_color || '#FAF8F5');

  // Branding Slots
  const brandingSlots = [
    {
      key: 'branding.logo' as const,
      title_ar: 'شعار الهيدر (Header Logo)',
      title_en: 'Header Logo',
      desc_ar: 'يظهر في شريط التنقل العلوي للموقع. إذا لم يتم رفعه، يعرض الموقع اسم "Oldish / أولديش" تلقائياً بالخط التراثي.',
      rec_size: '400 × 120 px • يدعم PNG / SVG / WebP (خلفية شفافة)',
      currentUrl: form.logo_url || imageSlots['branding.logo']?.media_url,
      previewBg: '#FFFFFF',
    },
    {
      key: 'branding.logo_dark' as const,
      title_ar: 'شعار الفوتر للخلفيات الداكنة (Footer Logo)',
      title_en: 'Footer Logo (Dark Background)',
      desc_ar: 'يظهر في الفوتر الداكن أسفل الموقع. يوصى بشعار ذهبي أو أبيض مفرغ (خلفية شفافة).',
      rec_size: '400 × 120 px • يدعم PNG / SVG / WebP',
      currentUrl: form.logo_dark_url || imageSlots['branding.logo_dark']?.media_url,
      previewBg: '#222222',
    },
    {
      key: 'branding.favicon' as const,
      title_ar: 'أيقونة المتصفح والمفضلة (Favicon & App Icon)',
      title_en: 'Browser Favicon',
      desc_ar: 'تظهر في تبويب المتصفح، عند حفظ الصفحة في المفضلة، وكأيقونة لتطبيق الويب على الهاتف.',
      rec_size: '512 × 512 px مربع • يدعم PNG أو SVG أو ICO',
      currentUrl: form.favicon_url || imageSlots['branding.favicon']?.media_url,
      previewBg: '#F8F9FA',
    },
    {
      key: 'branding.social_share' as const,
      title_ar: 'صورة بطاقة المشاركة (OpenGraph / Social Image)',
      title_en: 'Social Share Card',
      desc_ar: 'تظهر كمعاينة غلاف عند إرسال رابط الموقع عبر واتساب، فيسبوك، أو منصات التواصل.',
      rec_size: '1200 × 630 px أفقي • JPEG تحت 300KB (أفضل توافق لمنصات التواصل)',
      currentUrl: form.social_image_url || imageSlots['branding.social_share']?.media_url || '/images/og-image.jpg',
      previewBg: '#000000',
    },
  ];

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '1.375rem' }}>الهوية البصرية والعلامة التجارية (Branding & Identity)</h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
              التحكم في شعارات الموقع، ألوان الويب، شريط الإعلانات، وبيانات التواصل الرسمية.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={isReadOnly}
              onClick={handleSubmit}
            >
              {saveSuccess ? (
                <>
                  <Check size={16} />
                  <span>تم حفظ التعديلات</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>حفظ التعديلات</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* BRANDING LOGO SLOTS (Requirement 4) */}
        <div className="admin-card" style={{ marginBottom: '24px' }}>
          <div className="admin-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ImageIcon size={20} style={{ color: 'var(--color-gold)' }} />
              <h3 style={{ margin: 0, fontSize: '1.125rem' }}>شعارات الهوية الرسمية (Official Brand Logos & Favicon)</h3>
            </div>
            <span style={{ fontSize: '0.8125rem', color: '#777' }}>
              إذا لم يتوفر ملف شعار، يعرض الموقع اسم العلامة كـ Wordmark خطي تراثي تلقائياً
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {brandingSlots.map((slot) => {
              const hasImage = Boolean(slot.currentUrl);
              return (
                <div 
                  key={slot.key}
                  style={{
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '16px',
                    background: '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.9375rem', color: '#1A202C', fontWeight: 700 }}>
                        {slot.title_ar}
                      </h4>
                      <span style={{ fontSize: '0.6875rem', color: '#718096', fontFamily: 'monospace' }}>
                        {slot.title_en}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.75rem', color: '#666', margin: '0 0 12px 0', minHeight: '36px' }}>
                      {slot.desc_ar}
                    </p>

                    {/* Preview Area */}
                    <div 
                      style={{ 
                        height: '110px', 
                        background: slot.previewBg, 
                        border: '1px solid #CBD5E0', 
                        borderRadius: '6px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                        marginBottom: '12px',
                        padding: '10px'
                      }}
                    >
                      {hasImage ? (
                        <img 
                          src={slot.currentUrl} 
                          alt={slot.title_en} 
                          style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} 
                        />
                      ) : (
                        <div style={{ textAlign: 'center', color: slot.previewBg === '#222222' ? '#FAF8F5' : '#222222' }}>
                          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                            {form.brand_name_en}
                          </div>
                          <div style={{ fontSize: '0.8125rem', opacity: 0.8 }}>
                            {form.brand_name_ar} (Wordmark خطي)
                          </div>
                        </div>
                      )}

                      {uploadingSlot === slot.key && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '0.8125rem' }}>
                          جاري الرفع...
                        </div>
                      )}
                    </div>

                    <div style={{ fontSize: '0.6875rem', color: '#888', marginBottom: '12px' }}>
                      {slot.rec_size}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #EDF2F7', paddingTop: '12px' }}>
                    <input 
                      type="file" 
                      ref={fileInputRefs[slot.key]}
                      style={{ display: 'none' }}
                      accept="image/png,image/svg+xml,image/webp,image/jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(slot.key, file);
                        e.target.value = '';
                      }}
                    />

                    <button
                      type="button"
                      disabled={isReadOnly || uploadingSlot === slot.key}
                      className="btn btn-outline-gold btn-sm"
                      style={{ flexGrow: 1, justifyContent: 'center' }}
                      onClick={() => fileInputRefs[slot.key].current?.click()}
                    >
                      <Upload size={14} />
                      <span>{hasImage ? 'استبدال الشعار' : 'رفع الشعار'}</span>
                    </button>

                    {hasImage && (
                      <button
                        type="button"
                        disabled={isReadOnly}
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleRemoveLogo(slot.key)}
                        title="إزالة الشعار والعودة للاسم الخطي (Wordmark)"
                      >
                        <Trash2 size={14} />
                        <span>إزالة</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ANNOUNCEMENT BANNER (Part C #2) */}
        <div className="admin-card" style={{ marginBottom: '24px' }}>
          <div className="admin-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Megaphone size={20} style={{ color: 'var(--color-gold)' }} />
              <h3 style={{ margin: 0, fontSize: '1.125rem' }}>شريط الإعلانات والعروض (Announcement Banner)</h3>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.announcement_enabled || false}
                disabled={isReadOnly}
                onChange={(e) => setForm({ ...form, announcement_enabled: e.target.checked })}
              />
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>تفعيل شريط العروض بالصفحة الرئيسية</span>
            </label>
          </div>

          <p style={{ fontSize: '0.8125rem', color: '#666', marginTop: 0 }}>
            يظهر كشريط مميز وأنيق أعلى الموقع لعرض مناسبات، حفلات، عروض نهاية الأسبوع، أو سهرات وسط البلد مع رابط مخصص وتواريخ سريان.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">نص العرض بالعربية (Announcement Arabic)</label>
              <input
                type="text"
                className="form-input"
                disabled={isReadOnly}
                value={form.announcement_text_ar || ''}
                placeholder="مثال: أمسيات وسط البلد — خصم 15% على العشاء وسهرات موسيقية هادئة"
                onChange={(e) => setForm({ ...form, announcement_text_ar: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Announcement Text (English)</label>
              <input
                type="text"
                className="form-input"
                dir="ltr"
                disabled={isReadOnly}
                value={form.announcement_text_en || ''}
                placeholder="e.g. Special Downtown Evenings — Authentic Egyptian Tagines & Vintage Garden Vibe"
                onChange={(e) => setForm({ ...form, announcement_text_en: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">رابط الزر (Target Link URL)</label>
              <input
                type="text"
                className="form-input"
                dir="ltr"
                disabled={isReadOnly}
                value={form.announcement_link || ''}
                placeholder="#reservations أو #menu أو رابط خارجي"
                onChange={(e) => setForm({ ...form, announcement_link: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">تاريخ بدء العرض (اختياري)</label>
              <input
                type="date"
                className="form-input"
                dir="ltr"
                disabled={isReadOnly}
                value={form.announcement_start_date || ''}
                onChange={(e) => setForm({ ...form, announcement_start_date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">تاريخ انتهاء العرض (اختياري)</label>
              <input
                type="date"
                className="form-input"
                dir="ltr"
                disabled={isReadOnly}
                value={form.announcement_end_date || ''}
                onChange={(e) => setForm({ ...form, announcement_end_date: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Brand Core Truths Section */}
        <div className="admin-card" style={{ marginBottom: '24px' }}>
          <div className="admin-card-header">
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>بيانات العلامة التجارية الرسمية (Brand Truths)</h3>
            <span style={{ fontSize: '0.8125rem', color: '#777' }}>مطابقة بدقة لحسابات فيسبوك وإنستغرام الموثقة</span>
          </div>

          <div 
            style={{ 
              marginBottom: '18px', 
              padding: '12px 16px', 
              background: '#FFFDF5', 
              border: '1px solid #FEEBC8', 
              borderRadius: '6px',
              fontSize: '0.8125rem',
              color: '#7B341E',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <AlertTriangle size={18} style={{ color: '#DD6B20', flexShrink: 0 }} />
            <div>
              <strong>تنبيه الشعار والاسم:</strong> اسم المكان الرسمي هو <strong>Oldish</strong> بالعربية <strong>أولديش</strong>. يُمنع إضافة كلمة "Cairo" أو "القاهرة" إلى اسم البراند أو الوورد مارك.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Brand Name (English) *</label>
              <input
                type="text"
                required
                className="form-input"
                dir="ltr"
                disabled={isReadOnly}
                value={form.brand_name_en}
                onChange={(e) => setForm({ ...form, brand_name_en: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">اسم البراند (بالعربية) *</label>
              <input
                type="text"
                required
                className="form-input"
                disabled={isReadOnly}
                value={form.brand_name_ar}
                onChange={(e) => setForm({ ...form, brand_name_ar: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Slogan / Tagline (English)</label>
              <input
                type="text"
                className="form-input"
                dir="ltr"
                disabled={isReadOnly}
                value={form.tagline_en}
                onChange={(e) => setForm({ ...form, tagline_en: e.target.value })}
              />
              <span style={{ fontSize: '0.75rem', color: '#888' }}>الموثق: "Flavors you'll never forget"</span>
            </div>

            <div className="form-group">
              <label className="form-label">الشعار الترويجي (بالعربية)</label>
              <input
                type="text"
                className="form-input"
                disabled={isReadOnly}
                value={form.tagline_ar}
                onChange={(e) => setForm({ ...form, tagline_ar: e.target.value })}
              />
              <span style={{ fontSize: '0.75rem', color: '#888' }}>الموثق: "نكهات مش هتنساها"</span>
            </div>

            <div className="form-group">
              <label className="form-label">Subline (English)</label>
              <input
                type="text"
                className="form-input"
                dir="ltr"
                disabled={isReadOnly}
                value={form.subline_en}
                onChange={(e) => setForm({ ...form, subline_en: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">الوصف الفرعي (بالعربية)</label>
              <input
                type="text"
                className="form-input"
                disabled={isReadOnly}
                value={form.subline_ar}
                onChange={(e) => setForm({ ...form, subline_ar: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">تصنيف فيسبوك (Category)</label>
              <input
                type="text"
                className="form-input"
                dir="ltr"
                disabled={isReadOnly}
                value={form.category_en}
                onChange={(e) => setForm({ ...form, category_en: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">متابعو فيسبوك الموثقين</label>
              <input
                type="text"
                className="form-input"
                disabled={isReadOnly}
                value={form.facebook_followers}
                onChange={(e) => setForm({ ...form, facebook_followers: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Contact & Social Links */}
        <div className="admin-card" style={{ marginBottom: '24px' }}>
          <div className="admin-card-header">
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>الهواتف وروابط التواصل الاجتماعي المعتمدة</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">رقم الهاتف الرسمي *</label>
              <input
                type="text"
                required
                className="form-input"
                dir="ltr"
                disabled={isReadOnly}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">رقم واتساب * (WhatsApp Number)</label>
              <input
                type="text"
                required
                className="form-input"
                dir="ltr"
                disabled={isReadOnly}
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              />
              <span style={{ fontSize: '0.75rem', color: '#888' }}>يظهر زر الواتساب في الموقع إذا كان هذا الحقل مملوءاً</span>
            </div>

            <div className="form-group">
              <label className="form-label">رابط صفحة فيسبوك</label>
              <input
                type="url"
                className="form-input"
                dir="ltr"
                disabled={isReadOnly}
                value={form.facebook_url}
                onChange={(e) => setForm({ ...form, facebook_url: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">رابط إنستغرام</label>
              <input
                type="url"
                className="form-input"
                dir="ltr"
                disabled={isReadOnly}
                value={form.instagram_url}
                onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
              />
            </div>

            {/* Instagram Strip Toggle & Clear Admin Notice */}
            <div style={{ background: '#FFFDF9', border: '1px solid #EEDFBA', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 600, color: '#333' }}>
                <input
                  type="checkbox"
                  disabled={isReadOnly}
                  checked={Boolean(form.instagram_strip_enabled)}
                  onChange={(e) => setForm({ ...form, instagram_strip_enabled: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-gold)' }}
                />
                <span>إظهار شريط إنستغرام في الموقع (Show Instagram strip)</span>
              </label>
              <div style={{ fontSize: '0.8125rem', color: '#8A6D2D', marginTop: '8px', lineHeight: 1.5 }}>
                ⚠️ <strong>ملاحظة هامة:</strong> شريط إنستغرام معطل افتراضياً لأن الصور الافتراضية هي صور توضيحية تم إنشاؤها بالذكاء الاصطناعي وليست منشورات حقيقية. قم برفع صور حقيقية لرواد وأجواء أولديش أو من حساب <code>@oldisheg</code> ثم فعّل هذا الخيار.
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">رابط خرائط جوجل (Google Maps URL)</label>
              <input
                type="url"
                className="form-input"
                dir="ltr"
                disabled={isReadOnly}
                value={form.google_maps_url}
                onChange={(e) => setForm({ ...form, google_maps_url: e.target.value })}
              />
              <span style={{ fontSize: '0.75rem', color: '#888' }}>يتحكم في ظهور زر "اقرأ التقييمات على خرائط جوجل"</span>
            </div>

            <div className="form-group">
              <label className="form-label">رابط المنيو على المنيوز (elmenus URL)</label>
              <input
                type="url"
                className="form-input"
                dir="ltr"
                disabled={isReadOnly}
                value={form.elmenus_url || ''}
                onChange={(e) => setForm({ ...form, elmenus_url: e.target.value })}
              />
              <span style={{ fontSize: '0.75rem', color: '#888' }}>يتحكم في ظهور زر "اطلب دليفري من elmenus"</span>
            </div>
          </div>
        </div>

        {/* Color Palette & WCAG Accessibility Checker */}
        <div className="admin-card" style={{ marginBottom: '24px' }}>
          <div className="admin-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Palette size={20} style={{ color: 'var(--color-gold)' }} />
              <h3 style={{ margin: 0, fontSize: '1.125rem' }}>لوحة الألوان ومدقق سهولة القراءة (WCAG Checker)</h3>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">اللون الذهبي التراثي (Primary Gold)</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={form.primary_color}
                  disabled={isReadOnly}
                  onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                  style={{ width: '48px', height: '40px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                />
                <input
                  type="text"
                  className="form-input"
                  dir="ltr"
                  disabled={isReadOnly}
                  value={form.primary_color}
                  onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">لون النصوص الداكن (Charcoal)</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={form.charcoal_color}
                  disabled={isReadOnly}
                  onChange={(e) => setForm({ ...form, charcoal_color: e.target.value })}
                  style={{ width: '48px', height: '40px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                />
                <input
                  type="text"
                  className="form-input"
                  dir="ltr"
                  disabled={isReadOnly}
                  value={form.charcoal_color}
                  onChange={(e) => setForm({ ...form, charcoal_color: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">لون الخلفية الدافئ (Warm Background)</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={form.bg_color}
                  disabled={isReadOnly}
                  onChange={(e) => setForm({ ...form, bg_color: e.target.value })}
                  style={{ width: '48px', height: '40px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                />
                <input
                  type="text"
                  className="form-input"
                  dir="ltr"
                  disabled={isReadOnly}
                  value={form.bg_color}
                  onChange={(e) => setForm({ ...form, bg_color: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Contrast Indicators */}
          <div style={{ marginTop: '20px', padding: '16px', background: '#F9F8F5', borderRadius: '6px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9375rem', color: 'var(--color-charcoal)' }}>
              فحص التباين البصري وإمكانية الوصول (WCAG Accessibility Ratings)
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div style={{ background: '#fff', padding: '12px 16px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.8125rem', color: '#666' }}>تباين النص الرئيسي على الخلفية:</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', margin: '6px 0' }}>
                  <span style={{ fontSize: '1.375rem', fontWeight: 700, color: form.charcoal_color }}>
                    {textOnBgContrast.toFixed(2)}:1
                  </span>
                  <span className={`badge ${textOnBgContrast >= 7 ? 'badge-success' : textOnBgContrast >= 4.5 ? 'badge-gold' : 'badge-warning'}`}>
                    {textOnBgContrast >= 7 ? 'ممتاز (AAA)' : textOnBgContrast >= 4.5 ? 'ناجح (AA)' : 'ضعيف'}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#888' }}>الحد الأدنى لـ AA هو 4.5:1 ولـ AAA هو 7:1</div>
              </div>

              <div style={{ background: '#fff', padding: '12px 16px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.8125rem', color: '#666' }}>تباين اللون الذهبي على الخلفية:</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', margin: '6px 0' }}>
                  <span style={{ fontSize: '1.375rem', fontWeight: 700, color: form.primary_color }}>
                    {goldOnBgContrast.toFixed(2)}:1
                  </span>
                  <span className={`badge ${goldOnBgContrast >= 4.5 ? 'badge-success' : goldOnBgContrast >= 3 ? 'badge-gold' : 'badge-warning'}`}>
                    {goldOnBgContrast >= 4.5 ? 'ناجح (AA)' : goldOnBgContrast >= 3 ? 'مناسب للعناوين الكبيرة' : 'ضعيف'}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#888' }}>يستخدم للعناوين والأزرار التفاعلية والحدود</div>
              </div>
            </div>
          </div>
        </div>


        {/* RESET DEMO DATA (Part A #9 - Owner only) */}
        {isOwner && (
          <div className="admin-card" style={{ marginBottom: '24px', border: '1px solid #FEB2B2', background: '#FFF5F5' }}>
            <div className="admin-card-header" style={{ borderBottomColor: '#FED7D7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C53030' }}>
                <RefreshCw size={20} />
                <h3 style={{ margin: 0, fontSize: '1.125rem', color: '#9B2C2C' }}>
                  إعادة ضبط البيانات التجريبية (Factory Reset Demo Data)
                </h3>
              </div>
              <span className="badge" style={{ background: '#FEB2B2', color: '#742A2A', fontWeight: 700 }}>
                خاص بالمالك فقط (Owner Only)
              </span>
            </div>

            <p style={{ fontSize: '0.8125rem', color: '#742A2A', margin: '0 0 16px 0' }}>
              يقوم هذا الزر بمسح التعديلات المؤقتة والصور المرفوعة في التخزين المحلي (IndexedDB + localStorage) واسترجاع البيانات المعتمدة الأصلية مع أحدث إصدار لمخطط البيانات (Schema v5). لن يؤثر هذا على النشر السحابي في Firebase.
            </p>

            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={() => setResetConfirmOpen(true)}
            >
              <RotateCcw size={16} />
              <span>إعادة ضبط البيانات التجريبية إلى الوضع الافتراضي</span>
            </button>
          </div>
        )}

        {/* Save Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={isReadOnly}>
            {saveSuccess ? 'تم حفظ التعديلات بنجاح' : 'حفظ كافة إعدادات الهوية'}
          </button>
        </div>
      </form>

      {/* Confirmation Modal for Reset Demo Data */}
      {resetConfirmOpen && (
        <div className="lightbox-modal" role="dialog" onClick={() => setResetConfirmOpen(false)}>
          <div className="admin-modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#C53030', marginBottom: '14px' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#9B2C2C' }}>تأكيد إعادة الضبط للمصنع</h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#4A5568', lineHeight: 1.6, marginBottom: '20px' }}>
              هل أنت متأكد من رغبتك في حذف كافة التعديلات والصور التجريبية المرفوعة محلياً وإعادة ضبط الموقع للبيانات الأصلية الموثقة؟ لا يمكن التراجع عن هذا الإجراء بعد تنفيذه.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-outline-light"
                onClick={() => setResetConfirmOpen(false)}
                disabled={isResetting}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleResetDemoData}
                disabled={isResetting}
              >
                {isResetting ? 'جاري إعادة الضبط...' : 'نعم، إعادة ضبط البيانات الآن'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
