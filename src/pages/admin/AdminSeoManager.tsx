import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { 
  Search, 
  Share2, 
  FileCode, 
  AlertTriangle, 
  Save, 
  Check, 
  Copy,
  Download 
} from 'lucide-react';

export const AdminSeoManager: React.FC = () => {
  const { siteSettings, updateSettings } = useData();
  const [form, setForm] = useState({ ...siteSettings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [todayDate] = useState(() => new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const copyToClipboard = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const handleDownloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Structured Data JSON-LD
  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": "Oldish Restaurant & Café",
    "alternateName": "أولديش",
    "image": [
      `${form.site_domain || 'https://oldish-chi.vercel.app'}/images/hero.jpg`
    ],
    "servesCuisine": ["Egyptian", "Middle Eastern", "Cafe", "Breakfast"],
    "priceRange": form.price_range || "$$",
    "telephone": form.phone || "+20 10 60119488",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "20 Mohamed Mahmoud St, behind the Greek Campus, Abdeen",
      "addressLocality": "Downtown Cairo",
      "addressRegion": "Cairo Governorate",
      "addressCountry": "EG"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 30.0444,
      "longitude": 31.2357
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "opens": "08:00",
        "closes": "00:00"
      }
    ],
    "sameAs": [
      form.facebook_url,
      form.instagram_url,
      form.google_maps_url
    ].filter(Boolean)
  };

  const jsonLdString = JSON.stringify(jsonLdData, null, 2);

  // Dynamic Robots.txt preview
  const robotsTxt = form.noindex 
    ? `# Oldish Sales Demo - Indexing Disabled\nUser-agent: *\nDisallow: /\n`
    : `# Oldish Production\nUser-agent: *\nAllow: /\n\nSitemap: ${form.site_domain || 'https://oldish-chi.vercel.app'}/sitemap.xml\n`;

  // Dynamic Sitemap.xml preview
  const sitemapXml = useMemo(() => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${form.site_domain || 'https://oldish-chi.vercel.app'}/</loc>
    <lastmod>${todayDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${form.site_domain || 'https://oldish-chi.vercel.app'}/menu</loc>
    <lastmod>${todayDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;
  }, [form.site_domain, todayDate]);

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '1.375rem' }}>إدارة السيو ومحركات البحث (SEO & Metadata)</h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
              التحكم في بيانات التعريف، معايير السيو المحلي، المعاينة على جوجل ووسائل التواصل الاجتماعي، والبيانات المنظمة (JSON-LD).
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
                <span>تم حفظ إعدادات السيو</span>
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
        {/* Indexing Switch Notice */}
        <div 
          className="admin-card" 
          style={{ 
            marginBottom: '24px', 
            background: form.noindex ? '#FFFDF5' : '#F0FFF4', 
            border: form.noindex ? '1px solid #FEEBC8' : '1px solid #C6F6D5' 
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <AlertTriangle size={24} style={{ color: form.noindex ? '#DD6B20' : '#38A169', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '1rem', color: form.noindex ? '#7B341E' : '#22543D' }}>
                  {form.noindex ? 'حجب الفهرسة مفعل (noindex, nofollow) — وضع العرض التجريبي' : 'الموقع متاح للفهرسة العامة بمحركات البحث'}
                </strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: form.noindex ? '#9C4221' : '#276749' }}>
                  {form.noindex 
                    ? 'يُنصح بالإبقاء على هذا الخيار مفعلاً أثناء تقديم العرض لصاحب المكان، لتجنب أرشفة مسودات المحتوى قبل الاعتماد النهائي.'
                    : 'محركات البحث مثل Google يمكنها الآن الزحف وفهرسة صفحات الموقع.'}
                </p>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.noindex}
                onChange={(e) => setForm({ ...form, noindex: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>حجب الفهرسة (Noindex)</span>
            </label>
          </div>
        </div>

        {/* Domain & Meta Configuration */}
        <div className="admin-card" style={{ marginBottom: '24px' }}>
          <div className="admin-card-header">
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>بيانات السيو الأساسية</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">النطاق المعتمد (Canonical Site Domain)</label>
              <input
                type="url"
                className="form-input"
                dir="ltr"
                value={form.site_domain}
                onChange={(e) => setForm({ ...form, site_domain: e.target.value })}
                placeholder="https://oldish-chi.vercel.app"
              />
              <span style={{ fontSize: '0.75rem', color: '#888' }}>يستخدم لتوليد روابط OpenGraph والخرائط التلقائية</span>
            </div>
          </div>
        </div>

        {/* Google SERP Preview Card */}
        <div className="admin-card" style={{ marginBottom: '24px' }}>
          <div className="admin-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={18} style={{ color: 'var(--color-gold)' }} />
              <h3 style={{ margin: 0, fontSize: '1.125rem' }}>معاينة نتائج بحث جوجل (Google Search Preview)</h3>
            </div>
          </div>

          <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '8px', border: '1px solid #E2E8F0', maxWidth: '640px' }}>
            <div style={{ fontSize: '0.75rem', color: '#202124', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ background: '#F1F3F4', padding: '2px 6px', borderRadius: '4px' }}>{form.site_domain || 'https://oldish-chi.vercel.app'}</span>
              <span>›</span>
              <span>cairo</span>
            </div>
            <div style={{ color: '#1A0DAB', fontSize: '1.125rem', fontWeight: 500, lineHeight: '1.3', marginBottom: '4px', cursor: 'pointer' }}>
              {form.brand_name_en} - {form.subline_en} | Flavors you'll never forget
            </div>
            <div style={{ color: '#4D5156', fontSize: '0.875rem', lineHeight: '1.5' }}>
              Experience authentic Egyptian dishes, clay tagines, breakfast spreads, and specialty coffees in our serene vintage courtyard garden in Downtown Cairo.
            </div>
          </div>
        </div>

        {/* Social Share Card Preview (Open Graph) */}
        <div className="admin-card" style={{ marginBottom: '24px' }}>
          <div className="admin-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Share2 size={18} style={{ color: 'var(--color-gold)' }} />
              <h3 style={{ margin: 0, fontSize: '1.125rem' }}>معاينة المشاركة في السوشيال ميديا (Social Share Card)</h3>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden', maxWidth: '520px' }}>
            <div style={{ height: '220px', background: '#222', position: 'relative', overflow: 'hidden' }}>
              <img 
                src="/images/oldish_courtyard_hero.webp" 
                alt="Oldish Courtyard" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                og:image
              </div>
            </div>
            <div style={{ padding: '14px 16px', background: '#F8F9FA' }}>
              <div style={{ fontSize: '0.75rem', color: '#6C757D', textTransform: 'uppercase' }}>
                {new URL(form.site_domain || 'https://oldish-chi.vercel.app').hostname}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#212529', marginTop: '4px' }}>
                Oldish Restaurant & Café | Downtown Cairo
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#6C757D', marginTop: '4px' }}>
                Flavors you'll never forget. 20 Mohamed Mahmoud St, behind the Greek Campus, Abdeen.
              </div>
            </div>
          </div>
        </div>

        {/* Structured Data Schema.org (JSON-LD) */}
        <div className="admin-card" style={{ marginBottom: '24px' }}>
          <div className="admin-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCode size={18} style={{ color: 'var(--color-gold)' }} />
              <h3 style={{ margin: 0, fontSize: '1.125rem' }}>البيانات المنظمة (Schema.org Restaurant JSON-LD)</h3>
            </div>

            <button
              type="button"
              className="btn btn-outline-gold btn-sm"
              onClick={() => copyToClipboard(jsonLdString, 'jsonld')}
            >
              {copiedSection === 'jsonld' ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedSection === 'jsonld' ? 'تم النسخ' : 'نسخ الكود'}</span>
            </button>
          </div>

          <p style={{ fontSize: '0.8125rem', color: '#666', marginTop: 0 }}>
            كود JSON-LD مدمج تلقائياً في صفحة الموقع الرئيسية لتعريف محركات البحث بموقع المطعم، المطبخ، الهاتف، والمواعيد.
          </p>

          <pre 
            dir="ltr"
            style={{ 
              background: '#1E1E1E', 
              color: '#D4D4D4', 
              padding: '16px', 
              borderRadius: '6px', 
              fontSize: '0.8125rem', 
              overflowX: 'auto',
              maxHeight: '260px'
            }}
          >
            {jsonLdString}
          </pre>
        </div>

        {/* Robots.txt & Sitemap.xml Previews & Manual Download Banner */}
        <div style={{ background: '#FFFDF9', border: '1px solid #EEDFBA', padding: '16px 20px', borderRadius: '8px', marginBottom: '20px', lineHeight: 1.6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8A6D2D', fontWeight: 700, marginBottom: '6px' }}>
            <AlertTriangle size={18} />
            <span>آلية عمل ملفات الفهرسة (Robots.txt & Sitemap) وتوضيح التشغيل</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#5C4813' }}>
            • <strong>الوضع الفعلي للموقع حالياً:</strong> ملف <code>public/robots.txt</code> في الموقع مضبوط بشكل صارم على <code>Disallow: /</code> ولا يوجد ملف sitemap مفعل، وذلك لمنع محركات البحث من أرشفة الموقع التجريبي قبل اعتماده رسمياً.<br />
            • <strong>طريقة العمل:</strong> الأكواد المعروضة أدناه هي <strong>نصوص وتوليدات قابلة للنسخ والتحميل اليدوي</strong> بناءً على النطاق المدخل أعلاه، وليست مخدومة ديناميكياً من الخادم. عند قرار الإطلاق الرسمي (Go-Live)، يمكنك تحميل أو نسخ محتوى الملفين ووضعهما في مجلد <code>public/</code> بالمشروع.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div className="admin-card">
            <div className="admin-card-header">
              <h4 style={{ margin: 0, fontSize: '0.9375rem' }}>محتوى robots.txt المقترح للإطلاق (ملف يدوي)</h4>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-outline-gold btn-sm"
                  onClick={() => copyToClipboard(robotsTxt, 'robots')}
                  title="نسخ المحتوى إلى الحافظة"
                >
                  {copiedSection === 'robots' ? <Check size={13} /> : <Copy size={13} />}
                  <span>نسخ</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline-gold btn-sm"
                  onClick={() => handleDownloadFile(robotsTxt, 'robots.txt', 'text/plain')}
                  title="تحميل كملف robots.txt لوضعه في public/"
                >
                  <Download size={13} />
                  <span>تحميل</span>
                </button>
              </div>
            </div>
            <pre dir="ltr" style={{ background: '#F8F9FA', padding: '12px', borderRadius: '4px', fontSize: '0.8125rem', color: '#333' }}>
              {robotsTxt}
            </pre>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h4 style={{ margin: 0, fontSize: '0.9375rem' }}>محتوى sitemap.xml المقترح للإطلاق (ملف يدوي)</h4>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-outline-gold btn-sm"
                  onClick={() => copyToClipboard(sitemapXml, 'sitemap')}
                  title="نسخ المحتوى إلى الحافظة"
                >
                  {copiedSection === 'sitemap' ? <Check size={13} /> : <Copy size={13} />}
                  <span>نسخ</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline-gold btn-sm"
                  onClick={() => handleDownloadFile(sitemapXml, 'sitemap.xml', 'application/xml')}
                  title="تحميل كملف sitemap.xml لوضعه في public/"
                >
                  <Download size={13} />
                  <span>تحميل</span>
                </button>
              </div>
            </div>
            <pre dir="ltr" style={{ background: '#F8F9FA', padding: '12px', borderRadius: '4px', fontSize: '0.8125rem', color: '#333', maxHeight: '160px', overflowY: 'auto' }}>
              {sitemapXml}
            </pre>
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button type="submit" className="btn btn-primary btn-lg">
            {saveSuccess ? 'تم حفظ إعدادات السيو' : 'حفظ كافة إعدادات السيو'}
          </button>
        </div>
      </form>
    </div>
  );
};
