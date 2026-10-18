import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import type { RatingBadge } from '../../types';
import { 
  Star, 
  CheckCircle2, 
  ExternalLink, 
  Edit3, 
  Eye, 
  EyeOff, 
  X,
  ShieldCheck
} from 'lucide-react';

export const AdminRatingsManager: React.FC = () => {
  const { ratingBadges, updateRatingBadge } = useData();
  const [editingBadge, setEditingBadge] = useState<RatingBadge | null>(null);
  const [form, setForm] = useState<Partial<RatingBadge>>({});

  const handleOpenEdit = (badge: RatingBadge) => {
    setEditingBadge(badge);
    setForm({ ...badge });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBadge) return;
    updateRatingBadge(editingBadge.id, form);
    setEditingBadge(null);
  };

  return (
    <div className="admin-page-container">
      {/* Header and Anti-Fabrication Notice */}
      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 6px 0', fontSize: '1.375rem' }}>تقييمات المنصات المعتمدة (Verified Platform Ratings)</h2>
        <p style={{ margin: '0 0 16px 0', fontSize: '0.875rem', color: '#666' }}>
          إدارة شارات التقييم الحقيقية الصادرة عن منصات موثقة فقط (Google Maps، TripAdvisor).
        </p>

        <div 
          style={{ 
            padding: '14px 18px', 
            borderRadius: '6px', 
            background: '#F0FFF4', 
            border: '1px solid #C6F6D5', 
            display: 'flex', 
            gap: '12px',
            alignItems: 'flex-start'
          }}
        >
          <ShieldCheck size={22} style={{ color: '#38A169', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ fontSize: '0.9375rem', color: '#22543D' }}>
              سياسة النزاهة والمصداقية (No Invented Quotes or Ratings)
            </strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: '#276749', lineHeight: '1.5' }}>
              الموقع يعرض أرقام التقييم الرسمية الموثقة بروابط مباشرة إلى صفحات أولديش الأصلية. تم إلغاء كافة الاقتباسات الوهمية لتجنب أي ادعاء غير موثق أمام صاحب المكان والزوار.
            </p>
          </div>
        </div>
      </div>

      {/* Badges Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {ratingBadges.map((badge) => (
          <div key={badge.id} className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--color-charcoal)' }}>
                    {badge.source}
                  </h3>
                  {badge.is_verified && (
                    <span className="badge badge-success" title="موثق برابط رسمي">
                      <CheckCircle2 size={12} style={{ marginLeft: '4px' }} />
                      موثق
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#888', marginTop: '2px' }}>
                  {badge.review_count}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  className="btn-icon-subtle"
                  onClick={() => updateRatingBadge(badge.id, { visible: !badge.visible })}
                  title={badge.visible ? 'ظاهر (اضغط للإخفاء)' : 'مخفي (اضغط للإظهار)'}
                >
                  {badge.visible ? <Eye size={17} style={{ color: '#38A169' }} /> : <EyeOff size={17} style={{ color: '#E53E3E' }} />}
                </button>
                <button
                  type="button"
                  className="btn-icon-subtle"
                  onClick={() => handleOpenEdit(badge)}
                  title="تعديل"
                >
                  <Edit3 size={16} />
                </button>
              </div>
            </div>

            {/* Score Big Display */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '16px 0' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-gold)', lineHeight: 1 }}>
                {badge.score}
              </span>
              <div style={{ display: 'flex', color: '#ECC94B' }}>
                <Star size={18} fill="#ECC94B" />
              </div>
            </div>

            {/* URL Link */}
            <div style={{ borderTop: '1px solid #eee', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <a
                href={badge.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-gold)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  maxWidth: '220px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>فتح صفحة التقييم الرسمية</span>
                <ExternalLink size={13} />
              </a>

              <span className={`badge ${badge.visible ? 'badge-light' : 'badge-subtle'}`}>
                {badge.visible ? 'معروض للزوار' : 'مخفي'}
              </span>
            </div>

            {/* Unverified with owner flag */}
            <div 
              style={{
                marginTop: '12px',
                padding: '8px 10px',
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: '4px',
                fontSize: '0.75rem',
                color: '#92400E',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span style={{ fontSize: '0.875rem' }}>⚠️</span>
              <span><strong>غير موثق - يلزم التأكيد مع الإدارة</strong> (unverified - confirm with owner)</span>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingBadge && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <h3>تعديل شارة {editingBadge.source}</h3>
              <button type="button" className="btn-close" onClick={() => setEditingBadge(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="admin-modal-body">
                <div className="form-group">
                  <label className="form-label">المنصة (Source)</label>
                  <input
                    type="text"
                    disabled
                    className="form-input"
                    value={form.source || ''}
                    style={{ background: '#F7FAFC' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">الدرجة / الترتيب *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      dir="ltr"
                      value={form.score || ''}
                      onChange={(e) => setForm({ ...form, score: e.target.value })}
                      placeholder="مثال: 4.3 أو #4"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">عدد التقييمات *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={form.review_count || ''}
                      onChange={(e) => setForm({ ...form, review_count: e.target.value })}
                      placeholder="مثال: 7,000+ reviews"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">الرابط الموثق للمنصة *</label>
                  <input
                    type="url"
                    required
                    className="form-input"
                    dir="ltr"
                    value={form.url || ''}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="https://maps.google.com/..."
                  />
                </div>

                <div style={{ display: 'flex', gap: '20px', background: '#F9F8F5', padding: '14px', borderRadius: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.is_verified || false}
                      onChange={(e) => setForm({ ...form, is_verified: e.target.checked })}
                    />
                    <span style={{ fontSize: '0.875rem' }}>شارة موثقة</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.visible ?? true}
                      onChange={(e) => setForm({ ...form, visible: e.target.checked })}
                    />
                    <span style={{ fontSize: '0.875rem' }}>إظهار الشارة في الموقع</span>
                  </label>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setEditingBadge(null)}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary">
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
