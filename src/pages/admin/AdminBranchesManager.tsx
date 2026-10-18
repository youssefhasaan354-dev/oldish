import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import type { BranchInfo, BranchWeeklyHours } from '../../types';
import { 
  MapPin, 
  Phone, 
  Clock, 
  AlertTriangle, 
  Edit3, 
  Plus, 
  Trash2, 
  X,
  Compass
} from 'lucide-react';

const DAYS_OF_WEEK: { key: keyof BranchWeeklyHours; labelAr: string; labelEn: string }[] = [
  { key: 'saturday', labelAr: 'السبت', labelEn: 'Saturday' },
  { key: 'sunday', labelAr: 'الأحد', labelEn: 'Sunday' },
  { key: 'monday', labelAr: 'الاثنين', labelEn: 'Monday' },
  { key: 'tuesday', labelAr: 'الثلاثاء', labelEn: 'Tuesday' },
  { key: 'wednesday', labelAr: 'الأربعاء', labelEn: 'Wednesday' },
  { key: 'thursday', labelAr: 'الخميس', labelEn: 'Thursday' },
  { key: 'friday', labelAr: 'الجمعة', labelEn: 'Friday' },
];

const DEFAULT_WEEKLY_HOURS: BranchWeeklyHours = {
  saturday: { open: '08:00', close: '00:00', closed: false },
  sunday: { open: '08:00', close: '00:00', closed: false },
  monday: { open: '08:00', close: '00:00', closed: false },
  tuesday: { open: '08:00', close: '00:00', closed: false },
  wednesday: { open: '08:00', close: '00:00', closed: false },
  thursday: { open: '08:00', close: '00:00', closed: false },
  friday: { open: '08:00', close: '00:00', closed: false },
};

export const AdminBranchesManager: React.FC = () => {
  const { branches, updateBranch, addBranch, deleteBranch } = useData();
  const [editingBranch, setEditingBranch] = useState<BranchInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'hours'>('info');

  const [form, setForm] = useState<Partial<BranchInfo>>({});

  const handleOpenModal = (branch?: BranchInfo) => {
    if (branch) {
      setEditingBranch(branch);
      setForm({
        ...branch,
        weekly_hours: branch.weekly_hours || DEFAULT_WEEKLY_HOURS
      });
    } else {
      setEditingBranch(null);
      setForm({
        name_en: '',
        name_ar: '',
        status: 'unconfirmed',
        address_en: '',
        address_ar: '',
        phone: '',
        hours_summary_en: 'Daily 8:00 AM – 12:00 AM',
        hours_summary_ar: 'يومياً 8:00 ص – 12:00 منتصف الليل',
        weekly_hours: DEFAULT_WEEKLY_HOURS,
        landmark_en: '',
        landmark_ar: '',
        map_embed_url: '',
        map_directions_url: '',
        is_primary: false,
        visible: true,
        note_en: '',
        note_ar: ''
      });
    }
    setActiveTab('info');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name_en || !form.name_ar) return;

    if (editingBranch) {
      updateBranch(editingBranch.id, form);
    } else {
      const newId = `branch_${Date.now()}`;
      addBranch({
        id: newId,
        name_en: form.name_en || '',
        name_ar: form.name_ar || '',
        status: form.status || 'unconfirmed',
        address_en: form.address_en || '',
        address_ar: form.address_ar || '',
        phone: form.phone,
        hours_summary_en: form.hours_summary_en || '',
        hours_summary_ar: form.hours_summary_ar || '',
        weekly_hours: form.weekly_hours || DEFAULT_WEEKLY_HOURS,
        landmark_en: form.landmark_en || '',
        landmark_ar: form.landmark_ar || '',
        map_embed_url: form.map_embed_url,
        map_directions_url: form.map_directions_url,
        is_primary: !!form.is_primary,
        visible: form.visible ?? true,
        note_en: form.note_en,
        note_ar: form.note_ar
      });
    }
    setIsModalOpen(false);
  };

  const updateDayHour = (day: keyof BranchWeeklyHours, field: 'open' | 'close' | 'closed', value: any) => {
    setForm(prev => {
      const currentHours = prev.weekly_hours || DEFAULT_WEEKLY_HOURS;
      return {
        ...prev,
        weekly_hours: {
          ...currentHours,
          [day]: {
            ...currentHours[day],
            [field]: value
          }
        }
      };
    });
  };

  return (
    <div className="admin-page-container">
      {/* Top Banner with Strict Truth Guidelines */}
      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '1.375rem' }}>إدارة الفروع وساعات العمل (Branches & Hours)</h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
              التحكم في بيانات الفروع المعتمدة وساعات العمل الأسبوعية وروابط خرائط جوجل.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => handleOpenModal()}
          >
            <Plus size={16} />
            <span>إضافة فرع جديد</span>
          </button>
        </div>

        <div 
          style={{ 
            marginTop: '16px', 
            padding: '12px 16px', 
            borderRadius: '6px', 
            background: '#FFFDF5', 
            border: '1px solid #FEEBC8',
            fontSize: '0.8125rem',
            color: '#7B341E',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <AlertTriangle size={18} style={{ color: '#DD6B20', flexShrink: 0 }} />
          <div>
            <strong>تنبيه الدقة الجغرافية:</strong> فرع وسط البلد (شارع محمد محمود) هو الفرع الرئيسي الموثق بدقة مع الهاتف 01060119488 والمواعيد (8 ص - 12 ص). فرع الزمالك محدد كـ "قيد التأكيد" حتى يتم تزويد أرقام الهاتف ومواعيده الرسمية من صاحب المكان.
          </div>
        </div>
      </div>

      {/* Branches Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {branches.map((b) => (
          <div 
            key={b.id} 
            className="admin-card" 
            style={{ 
              position: 'relative',
              borderTop: b.is_primary ? '4px solid var(--color-gold)' : '4px solid #CBD5E0'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--color-charcoal)' }}>
                    {b.name_ar}
                  </h3>
                  {b.is_primary && (
                    <span className="badge badge-gold">الفرع الرئيسي</span>
                  )}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#777', direction: 'ltr', textAlign: 'right' }}>
                  {b.name_en}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className={`badge ${b.status === 'confirmed' ? 'badge-success' : 'badge-warning'}`}>
                  {b.status === 'confirmed' ? 'معتمد' : 'قيد التأكيد'}
                </span>
                {!b.visible && (
                  <span className="badge badge-subtle">مخفي</span>
                )}
              </div>
            </div>

            {/* Address */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '10px' }}>
              <MapPin size={17} style={{ color: 'var(--color-gold)', marginTop: '2px', flexShrink: 0 }} />
              <div style={{ fontSize: '0.875rem', color: '#333' }}>
                <div>{b.address_ar}</div>
                {b.landmark_ar && (
                  <div style={{ fontSize: '0.75rem', color: '#777', marginTop: '2px' }}>
                    علامة مميزة: {b.landmark_ar}
                  </div>
                )}
              </div>
            </div>

            {/* Phone */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
              <Phone size={17} style={{ color: 'var(--color-gold)', flexShrink: 0 }} />
              <div style={{ fontSize: '0.875rem', color: '#333' }}>
                {b.phone ? (
                  <a href={`tel:${b.phone}`} style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}>
                    {b.phone}
                  </a>
                ) : (
                  <span style={{ color: '#999', fontStyle: 'italic', fontSize: '0.8125rem' }}>
                    لا يوجد هاتف مسجل (بانتظار التأكيد)
                  </span>
                )}
              </div>
            </div>

            {/* Hours */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '16px' }}>
              <Clock size={17} style={{ color: 'var(--color-gold)', marginTop: '2px', flexShrink: 0 }} />
              <div style={{ fontSize: '0.875rem', color: '#333' }}>
                <div>{b.hours_summary_ar}</div>
                <div style={{ fontSize: '0.75rem', color: '#777', direction: 'ltr', textAlign: 'right' }}>
                  {b.hours_summary_en}
                </div>
              </div>
            </div>

            {/* Unconfirmed Warning Note */}
            {b.status === 'unconfirmed' && (
              <div 
                style={{ 
                  background: '#FFF5F5', 
                  border: '1px solid #FEB2B2', 
                  borderRadius: '6px', 
                  padding: '8px 12px', 
                  fontSize: '0.75rem', 
                  color: '#C53030', 
                  marginBottom: '14px' 
                }}
              >
                {b.note_ar || 'تفاصيل هذا الفرع قيد التأكيد مع إدارة أولديش.'}
              </div>
            )}

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '12px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {b.map_directions_url && (
                  <a 
                    href={b.map_directions_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="btn btn-outline-gold btn-sm"
                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                  >
                    <Compass size={13} />
                    <span>الاتجاهات</span>
                  </a>
                )}
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-outline-gold btn-sm"
                  onClick={() => handleOpenModal(b)}
                >
                  <Edit3 size={14} />
                  <span>تعديل</span>
                </button>

                {!b.is_primary && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm delete"
                    onClick={() => {
                      if (confirm(`هل أنت متأكد من حذف فرع "${b.name_ar}"؟`)) {
                        deleteBranch(b.id);
                      }
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Branch Modal */}
      {isModalOpen && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-card" style={{ maxWidth: '680px' }}>
            <div className="admin-modal-header">
              <h3>{editingBranch ? 'تعديل بيانات الفرع' : 'إضافة فرع جديد'}</h3>
              <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #ddd', padding: '0 20px', background: '#F9F8F5' }}>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveTab('info')}
              >
                البيانات الأساسية
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'hours' ? 'active' : ''}`}
                onClick={() => setActiveTab('hours')}
              >
                ساعات العمل الأسبوعية
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="admin-modal-body" style={{ maxHeight: '68vh', overflowY: 'auto' }}>
                {activeTab === 'info' ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div className="form-group">
                        <label className="form-label">اسم الفرع بالعربية *</label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          value={form.name_ar || ''}
                          onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                          placeholder="مثال: فرع وسط البلد"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Branch Name (English) *</label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          dir="ltr"
                          value={form.name_en || ''}
                          onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                          placeholder="e.g. Downtown Cairo Branch"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div className="form-group">
                        <label className="form-label">حالة التوثيق *</label>
                        <select
                          className="form-input"
                          value={form.status || 'unconfirmed'}
                          onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                        >
                          <option value="confirmed">معتمد ومؤكد (Confirmed)</option>
                          <option value="unconfirmed">قيد الاعتماد مع الإدارة (Unconfirmed)</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">رقم الهاتف</label>
                        <input
                          type="text"
                          className="form-input"
                          dir="ltr"
                          value={form.phone || ''}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="+20 10 60119488"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">العنوان بالعربية</label>
                      <input
                        type="text"
                        className="form-input"
                        value={form.address_ar || ''}
                        onChange={(e) => setForm({ ...form, address_ar: e.target.value })}
                        placeholder="20 شارع محمد محمود، عابدين..."
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Address (English)</label>
                      <input
                        type="text"
                        className="form-input"
                        dir="ltr"
                        value={form.address_en || ''}
                        onChange={(e) => setForm({ ...form, address_en: e.target.value })}
                        placeholder="20 Mohamed Mahmoud St, Abdeen..."
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div className="form-group">
                        <label className="form-label">علامة مميزة بالعربية</label>
                        <input
                          type="text"
                          className="form-input"
                          value={form.landmark_ar || ''}
                          onChange={(e) => setForm({ ...form, landmark_ar: e.target.value })}
                          placeholder="خلف الجريك كامبس، أمام مكتبة الجامعة الأمريكية"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Landmark (English)</label>
                        <input
                          type="text"
                          className="form-input"
                          dir="ltr"
                          value={form.landmark_en || ''}
                          onChange={(e) => setForm({ ...form, landmark_en: e.target.value })}
                          placeholder="Behind The Greek Campus, opposite AUC library"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div className="form-group">
                        <label className="form-label">ملخص ساعات العمل بالعربية</label>
                        <input
                          type="text"
                          className="form-input"
                          value={form.hours_summary_ar || ''}
                          onChange={(e) => setForm({ ...form, hours_summary_ar: e.target.value })}
                          placeholder="يومياً 8:00 ص – 12:00 منتصف الليل"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Hours Summary (English)</label>
                        <input
                          type="text"
                          className="form-input"
                          dir="ltr"
                          value={form.hours_summary_en || ''}
                          onChange={(e) => setForm({ ...form, hours_summary_en: e.target.value })}
                          placeholder="Daily 8:00 AM – 12:00 AM"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">رابط خرائط جوجل (Google Maps Embed URL)</label>
                      <input
                        type="text"
                        className="form-input"
                        dir="ltr"
                        value={form.map_embed_url || ''}
                        onChange={(e) => setForm({ ...form, map_embed_url: e.target.value })}
                        placeholder="https://www.google.com/maps/embed?..."
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">رابط الاتجاهات (Google Maps Directions Link)</label>
                      <input
                        type="text"
                        className="form-input"
                        dir="ltr"
                        value={form.map_directions_url || ''}
                        onChange={(e) => setForm({ ...form, map_directions_url: e.target.value })}
                        placeholder="https://maps.google.com/?cid=..."
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '20px', marginTop: '16px', background: '#F9F8F5', padding: '14px', borderRadius: '6px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={form.is_primary || false}
                          onChange={(e) => setForm({ ...form, is_primary: e.target.checked })}
                        />
                        <span style={{ fontSize: '0.875rem' }}>الفرع الرئيسي</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={form.visible ?? true}
                          onChange={(e) => setForm({ ...form, visible: e.target.checked })}
                        />
                        <span style={{ fontSize: '0.875rem' }}>ظاهر للزوار بالموقع</span>
                      </label>
                    </div>
                  </>
                ) : (
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '16px' }}>
                      حدد ساعات الفتح والإغلاق لكل يوم من أيام الأسبوع:
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {DAYS_OF_WEEK.map(d => {
                        const dayData = (form.weekly_hours && form.weekly_hours[d.key]) || DEFAULT_WEEKLY_HOURS[d.key];
                        return (
                          <div 
                            key={d.key} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              background: dayData.closed ? '#F7FAFC' : '#FFFDF9',
                              border: '1px solid #E2E8F0',
                              borderRadius: '6px',
                              gap: '12px',
                              flexWrap: 'wrap'
                            }}
                          >
                            <div style={{ width: '90px', fontWeight: 600, color: 'var(--color-charcoal)' }}>
                              {d.labelAr}
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8125rem' }}>
                              <input
                                type="checkbox"
                                checked={dayData.closed}
                                onChange={(e) => updateDayHour(d.key, 'closed', e.target.checked)}
                              />
                              <span style={{ color: dayData.closed ? '#E53E3E' : '#718096' }}>مغلق</span>
                            </label>

                            {!dayData.closed ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.8125rem', color: '#666' }}>من:</span>
                                <input
                                  type="time"
                                  className="form-input"
                                  style={{ padding: '4px 8px', width: '120px' }}
                                  value={dayData.open}
                                  onChange={(e) => updateDayHour(d.key, 'open', e.target.value)}
                                />
                                <span style={{ fontSize: '0.8125rem', color: '#666' }}>إلى:</span>
                                <input
                                  type="time"
                                  className="form-input"
                                  style={{ padding: '4px 8px', width: '120px' }}
                                  value={dayData.close}
                                  onChange={(e) => updateDayHour(d.key, 'close', e.target.value)}
                                />
                              </div>
                            ) : (
                              <div style={{ color: '#E53E3E', fontSize: '0.8125rem', fontStyle: 'italic' }}>
                                مغلق طوال اليوم
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary">
                  حفظ الفرع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
