import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Download, 
  Printer, 
  ExternalLink, 
  Copy, 
  Check 
} from 'lucide-react';

export const AdminQrGenerator: React.FC = () => {
  const qrSize = 300;
  const [tableNumber, setTableNumber] = useState('');
  const [qrColor, setQrColor] = useState('#222222');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [dataUrl, setDataUrl] = useState<string>('');
  const [svgString, setSvgString] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Construct target URL
  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/menu` : 'https://oldish.eg/menu';
  const targetUrl = tableNumber.trim() ? `${baseUrl}?table=${encodeURIComponent(tableNumber.trim())}` : baseUrl;

  useEffect(() => {
    // Generate Canvas Data URL
    QRCode.toDataURL(targetUrl, {
      width: qrSize,
      margin: 2,
      color: {
        dark: qrColor,
        light: bgColor,
      },
    })
      .then((url) => {
        setDataUrl(url);
      })
      .catch((err) => {
        console.error('QR generation error:', err);
      });

    // Generate SVG string
    QRCode.toString(targetUrl, {
      type: 'svg',
      margin: 2,
      color: {
        dark: qrColor,
        light: bgColor,
      },
    })
      .then((svg) => {
        setSvgString(svg);
      })
      .catch((err) => {
        console.error('QR SVG error:', err);
      });
  }, [targetUrl, qrColor, bgColor, qrSize]);

  const handleDownloadPNG = () => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `oldish_menu_qr${tableNumber ? `_${tableNumber}` : ''}.png`;
    link.click();
  };

  const handleDownloadSVG = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `oldish_menu_qr${tableNumber ? `_${tableNumber}` : ''}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '1.375rem' }}>مولد باركود الطاولات والمنيو الرقمي (QR Code Generator)</h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
              توليد باركود رقمي عالي الدقة يفتح المنيو السريع للهواتف مباشرة مع دعم تخصيص رقم الطاولة أو بطاقة الطاولة المطبوعة.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-outline-gold btn-sm"
              onClick={handlePrint}
            >
              <Printer size={15} />
              <span>طباعة بطاقة الطاولة</span>
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Controls Column */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>إعدادات الباركود (QR Settings)</h3>
          </div>

          <div className="form-group">
            <label className="form-label">
              رقم / اسم الطاولة (اختياري)
              <span style={{ fontSize: '0.75rem', color: '#888', marginRight: '6px' }}>(اتركه فارغاً لمنيو عام)</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="مثال: Table 14 أو حديقة 3 أو Rooftop"
            />
          </div>

          <div className="form-group">
            <label className="form-label">الرابط المستهدف (Target URL)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                readOnly
                dir="ltr"
                className="form-input"
                style={{ background: '#F8F9FA' }}
                value={targetUrl}
              />
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleCopyLink}
                title="نسخ الرابط"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '16px' }}>
            <div className="form-group">
              <label className="form-label">لون الباركود</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={qrColor}
                  onChange={(e) => setQrColor(e.target.value)}
                  style={{ width: '40px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                />
                <input
                  type="text"
                  dir="ltr"
                  className="form-input"
                  value={qrColor}
                  onChange={(e) => setQrColor(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">لون الخلفية</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  style={{ width: '40px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                />
                <input
                  type="text"
                  dir="ltr"
                  className="form-input"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Quick presets */}
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '0.8125rem', color: '#666', marginBottom: '8px' }}>ألوان مقترحة بهوية أولديش:</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => { setQrColor('#222222'); setBgColor('#FFFFFF'); }}
                style={{ fontSize: '0.75rem' }}
              >
                داكن كلاسيكي
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => { setQrColor('#886E42'); setBgColor('#FAF8F5'); }}
                style={{ fontSize: '0.75rem' }}
              >
                ذهبي تراثي
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={handleDownloadPNG}
              disabled={!dataUrl}
            >
              <Download size={16} />
              <span>تحميل PNG عالي الجودة</span>
            </button>

            <button
              type="button"
              className="btn btn-outline-gold"
              style={{ flex: 1 }}
              onClick={handleDownloadSVG}
              disabled={!svgString}
            >
              <Download size={16} />
              <span>تحميل متجه SVG</span>
            </button>
          </div>
        </div>

        {/* Live Preview / Printable Table Tent */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="admin-card-header" style={{ width: '100%' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>معاينة بطاقة الطاولة المطبوعة (Print Preview)</h3>
            <span style={{ fontSize: '0.8125rem', color: '#777' }}>جاهز للطباعة والقص</span>
          </div>

          {/* Table Tent Card Mockup */}
          <div 
            id="printable-table-tent"
            style={{ 
              width: '280px', 
              background: '#FAF8F5', 
              border: '2px solid #886E42', 
              borderRadius: '12px', 
              padding: '24px 20px',
              textAlign: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
              position: 'relative'
            }}
          >
            {/* Top Logo */}
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.75rem', fontWeight: 700, color: '#886E42', letterSpacing: '0.04em' }}>
              Oldish
            </div>
            <div style={{ fontFamily: 'Amiri, serif', fontSize: '1.125rem', color: '#222', marginTop: '-2px' }}>
              أولديش
            </div>

            <div style={{ width: '40px', height: '1px', background: '#886E42', margin: '12px auto' }} />

            <div style={{ fontSize: '0.8125rem', color: '#555', marginBottom: '14px', lineHeight: '1.4' }}>
              امسح الكود للاطلاع على قائمة المأكولات والمشروبات
            </div>

            {/* QR Code Canvas */}
            <div style={{ background: bgColor, padding: '10px', borderRadius: '8px', display: 'inline-block', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              {dataUrl ? (
                <img src={dataUrl} alt="Oldish Menu QR Code" style={{ width: '180px', height: '180px', display: 'block' }} />
              ) : (
                <div style={{ width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                  جاري التوليد...
                </div>
              )}
            </div>

            {/* Table Number indicator */}
            {tableNumber.trim() && (
              <div style={{ marginTop: '14px', padding: '4px 12px', background: 'rgba(136, 110, 66, 0.1)', borderRadius: '20px', display: 'inline-block', fontWeight: 600, fontSize: '0.875rem', color: '#886E42' }}>
                {tableNumber.trim()}
              </div>
            )}

            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '12px' }}>
              Flavors you'll never forget
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#aaa', marginTop: '2px' }}>
              Downtown Cairo · Mohamed Mahmoud St
            </div>
          </div>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <a 
              href={targetUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="btn btn-outline-gold btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span>فتح الرابط في تبويب جديد</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
