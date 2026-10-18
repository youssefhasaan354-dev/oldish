import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { 
  Palette, 
  AlertTriangle, 
  Save, 
  Check 
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
  } catch (e) {
    return 4.5;
  }
}

export const AdminBrandingManager: React.FC = () => {
  const { siteSettings, updateSettings } = useData();
  const [form, setForm] = useState({ ...siteSettings });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Contrast calculations
  const textOnBgContrast = getContrastRatio(form.charcoal_color || '#222222', form.bg_color || '#FAF8F5');
  const goldOnBgContrast = getContrastRatio(form.primary_color || '#886E42', form.bg_color || '#FAF8F5');

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '1.375rem' }}>الهوية البصرية والعلامة التجارية (Branding & Identity)</h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
              التحكم في بيانات العلامة الرسمية، ألوان الويب، والخطوط مع مدقق التباين البصري (WCAG).
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
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

      <form onSubmit={handleSubmit}>
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
                value={form.subline_en}
                onChange={(e) => setForm({ ...form, subline_en: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">الوصف الفرعي (بالعربية)</label>
              <input
                type="text"
                className="form-input"
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
                value={form.category_en}
                onChange={(e) => setForm({ ...form, category_en: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">متابعو فيسبوك الموثقين</label>
              <input
                type="text"
                className="form-input"
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
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">رقم واتساب *</label>
              <input
                type="text"
                required
                className="form-input"
                dir="ltr"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">رابط صفحة فيسبوك</label>
              <input
                type="url"
                className="form-input"
                dir="ltr"
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
                value={form.instagram_url}
                onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">رابط خرائط جوجل (Google Maps Link)</label>
              <input
                type="url"
                className="form-input"
                dir="ltr"
                value={form.google_maps_url}
                onChange={(e) => setForm({ ...form, google_maps_url: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">رابط المنيو على المنيوز (elmenus)</label>
              <input
                type="url"
                className="form-input"
                dir="ltr"
                value={form.elmenus_url || ''}
                onChange={(e) => setForm({ ...form, elmenus_url: e.target.value })}
              />
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
                  onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                  style={{ width: '48px', height: '40px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                />
                <input
                  type="text"
                  className="form-input"
                  dir="ltr"
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
                  onChange={(e) => setForm({ ...form, charcoal_color: e.target.value })}
                  style={{ width: '48px', height: '40px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                />
                <input
                  type="text"
                  className="form-input"
                  dir="ltr"
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
                  onChange={(e) => setForm({ ...form, bg_color: e.target.value })}
                  style={{ width: '48px', height: '40px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                />
                <input
                  type="text"
                  className="form-input"
                  dir="ltr"
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

        {/* Demo Banner Settings */}
        <div className="admin-card" style={{ marginBottom: '24px' }}>
          <div className="admin-card-header">
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>شريط التنبيه التجريبي للعميل (Sales Demo Banner)</h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.demo_banner_enabled}
                onChange={(e) => setForm({ ...form, demo_banner_enabled: e.target.checked })}
              />
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>تفعيل شريط العرض التجريبي</span>
            </label>
          </div>

          <p style={{ fontSize: '0.8125rem', color: '#666', marginTop: 0 }}>
            يظهر هذا الشريط أعلى الموقع لتوضيح أن الموقع نموذج عرض مخصص للمالك مع زر سريع للوحة التحكم، ويمكن إخفاؤه في أي وقت.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">نص التنبيه بالعربية</label>
              <textarea
                rows={2}
                className="form-input"
                value={form.demo_banner_text_ar}
                onChange={(e) => setForm({ ...form, demo_banner_text_ar: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Demo Banner Text (English)</label>
              <textarea
                rows={2}
                className="form-input"
                dir="ltr"
                value={form.demo_banner_text_en}
                onChange={(e) => setForm({ ...form, demo_banner_text_en: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button type="submit" className="btn btn-primary btn-lg">
            {saveSuccess ? 'تم حفظ التعديلات بنجاح' : 'حفظ كافة إعدادات الهوية'}
          </button>
        </div>
      </form>
    </div>
  );
};
