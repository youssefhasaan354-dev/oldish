import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { 
  Inbox, 
  Phone, 
  MessageCircle, 
  CheckCircle2, 
  Archive, 
  RotateCcw,
  Download, 
  Calendar, 
  Users, 
  Clock, 
  AlertCircle,
  Search
} from 'lucide-react';

export const AdminInquiriesInbox: React.FC = () => {
  const { inquiries, updateInquiryStatus, markInquiryHandled, archiveInquiry } = useData();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInquiries = useMemo(() => {
    return inquiries.filter(item => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesPhone = item.phone.includes(q);
        const matchesMsg = item.message?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesPhone && !matchesMsg) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [inquiries, statusFilter, typeFilter, searchQuery]);

  const newCount = inquiries.filter(i => i.status === 'new').length;
  const handledCount = inquiries.filter(i => i.status === 'handled').length;

  const handleExportCSV = () => {
    const headers = ['id', 'type', 'name', 'phone', 'email', 'date', 'time', 'guests', 'branch', 'message', 'status', 'created_at'];
    const rows = filteredInquiries.map(i => [
      i.id,
      i.type,
      `"${(i.name || '').replace(/"/g, '""')}"`,
      `"${i.phone}"`,
      `"${i.email || ''}"`,
      i.date || '',
      i.time || '',
      i.guests || '',
      `"${i.branch || ''}"`,
      `"${(i.message || '').replace(/"/g, '""')}"`,
      i.status,
      i.created_at
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `oldish_inquiries_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getCleanWhatsAppPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('01')) {
      return `2${digits}`;
    }
    if (digits.startsWith('20')) {
      return digits;
    }
    return digits;
  };

  return (
    <div className="admin-page-container">
      {/* Top Banner */}
      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '1.375rem' }}>صندوق طلبات واستفسارات الزوار (Inquiries Inbox)</h2>
              {newCount > 0 && (
                <span className="badge badge-warning">
                  {newCount} طلب جديد
                </span>
              )}
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.875rem', color: '#666' }}>
              إدارة كافة طلبات الحجز التجريبية ورسائل التواصل الواردة عبر نماذج الموقع.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline-gold btn-sm"
            onClick={handleExportCSV}
            disabled={filteredInquiries.length === 0}
          >
            <Download size={15} />
            <span>تصدير الطلبات (CSV)</span>
          </button>
        </div>

        {/* Factual Truth Note */}
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
          <AlertCircle size={18} style={{ color: '#DD6B20', flexShrink: 0 }} />
          <div>
            <strong>صندوق رسائل الموقع:</strong> يتم استلام وتسجيل طلبات واستفسارات الزوار الواردة من الموقع هنا مع دعم كامل لفلترة الرسائل ومزود بحقل Honeypot لمنع الرسائل المزعجة (Spam).
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="admin-stats-grid" style={{ marginBottom: '20px' }}>
        <div className="admin-stat-card" style={{ cursor: 'default' }}>
          <div className="stat-icon-wrap" style={{ background: 'rgba(136, 110, 66, 0.15)', color: 'var(--color-gold)' }}>
            <Inbox size={20} />
          </div>
          <div>
            <div className="stat-value">{inquiries.length}</div>
            <div className="stat-label">إجمالي الطلبات</div>
          </div>
        </div>

        <div className="admin-stat-card" style={{ cursor: 'default' }}>
          <div className="stat-icon-wrap" style={{ background: 'rgba(221, 107, 32, 0.15)', color: '#DD6B20' }}>
            <Clock size={20} />
          </div>
          <div>
            <div className="stat-value">{newCount}</div>
            <div className="stat-label">طلبات جديدة غير معالجة</div>
          </div>
        </div>

        <div className="admin-stat-card" style={{ cursor: 'default' }}>
          <div className="stat-icon-wrap" style={{ background: 'rgba(56, 161, 105, 0.15)', color: '#38A169' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="stat-value">{handledCount}</div>
            <div className="stat-label">تمت معالجتها والرد</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-card" style={{ marginBottom: '20px', padding: '14px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingRight: '36px' }}
              placeholder="البحث بالاسم، الهاتف أو محتوى الرسالة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filters */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8125rem', color: '#777' }}>الحالة:</span>
            {[
              { id: 'all', label: 'الكل' },
              { id: 'new', label: 'جديد' },
              { id: 'handled', label: 'تمت المعالجة' },
              { id: 'archived', label: 'المؤرشفة' }
            ].map(s => (
              <button
                key={s.id}
                type="button"
                className={`filter-btn ${statusFilter === s.id ? 'active' : ''}`}
                onClick={() => setStatusFilter(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Type Filters */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8125rem', color: '#777' }}>النوع:</span>
            {[
              { id: 'all', label: 'الكل' },
              { id: 'reservation_request', label: 'طلب حجز' },
              { id: 'contact_inquiry', label: 'استفسار عام' }
            ].map(t => (
              <button
                key={t.id}
                type="button"
                className={`filter-btn ${typeFilter === t.id ? 'active' : ''}`}
                onClick={() => setTypeFilter(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inquiries List */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>تاريخ الطلب</th>
                <th>نوع الطلب</th>
                <th>اسم العميل</th>
                <th>الهاتف والتواصل</th>
                <th>التفاصيل (التاريخ والضيوف)</th>
                <th>الرسالة</th>
                <th>الحالة</th>
                <th style={{ textAlign: 'center' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredInquiries.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    لا توجد طلبات أو استفسارات تطابق الفلترة الحالية.
                  </td>
                </tr>
              ) : (
                filteredInquiries.map((inq) => {
                  const cleanWa = getCleanWhatsAppPhone(inq.phone);
                  return (
                    <tr key={inq.id} style={{ background: inq.status === 'new' ? '#FFFDF9' : 'transparent' }}>
                      {/* Date */}
                      <td style={{ fontSize: '0.8125rem', color: '#666', whiteSpace: 'nowrap' }}>
                        {new Date(inq.created_at).toLocaleDateString('ar-EG', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      {/* Type Badge */}
                      <td>
                        <span className={`badge ${inq.type === 'reservation_request' ? 'badge-gold' : 'badge-light'}`}>
                          {inq.type === 'reservation_request' ? 'طلب حجز' : 'استفسار عام'}
                        </span>
                      </td>

                      {/* Name */}
                      <td style={{ fontWeight: 600, color: 'var(--color-charcoal)' }}>
                        {inq.name}
                        {inq.email && (
                          <div style={{ fontSize: '0.75rem', color: '#888', direction: 'ltr', textAlign: 'right' }}>
                            {inq.email}
                          </div>
                        )}
                      </td>

                      {/* Phone & Direct Actions */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span dir="ltr" style={{ fontWeight: 600, color: '#333' }}>
                            {inq.phone}
                          </span>
                          <a
                            href={`https://wa.me/${cleanWa}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-icon-subtle"
                            title="محادثة واتساب مباشرة"
                            style={{ color: '#25D366' }}
                          >
                            <MessageCircle size={15} />
                          </a>
                          <a
                            href={`tel:${inq.phone}`}
                            className="btn-icon-subtle"
                            title="اتصال هاتفي مباشر"
                            style={{ color: 'var(--color-gold)' }}
                          >
                            <Phone size={15} />
                          </a>
                        </div>
                      </td>

                      {/* Details (Date / Time / Guests / Branch) */}
                      <td>
                        {inq.type === 'reservation_request' ? (
                          <div style={{ fontSize: '0.8125rem', color: '#444', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {inq.date && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar size={13} style={{ color: 'var(--color-gold)' }} />
                                <span>{inq.date} {inq.time && `(${inq.time})`}</span>
                              </div>
                            )}
                            {inq.guests && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Users size={13} style={{ color: 'var(--color-gold)' }} />
                                <span>{inq.guests} أفراد</span>
                              </div>
                            )}
                            {inq.branch && (
                              <div style={{ fontSize: '0.75rem', color: '#888' }}>
                                الفرع: {inq.branch}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8125rem', color: '#888' }}>-</span>
                        )}
                      </td>

                      {/* Message */}
                      <td style={{ maxWidth: '240px' }}>
                        <div style={{ fontSize: '0.8125rem', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={inq.message}>
                          {inq.message || <span style={{ color: '#aaa', fontStyle: 'italic' }}>بدون ملاحظات</span>}
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <select
                          value={inq.status}
                          onChange={(e) => updateInquiryStatus(inq.id, e.target.value as 'new' | 'handled' | 'archived')}
                          className={`status-pill ${inq.status === 'new' ? 'pending' : inq.status === 'handled' ? 'active' : 'inactive'}`}
                          style={{
                            cursor: 'pointer',
                            outline: 'none',
                            border: 'none',
                            fontWeight: 600,
                            fontFamily: 'inherit'
                          }}
                          title="تغيير الحالة فوراً"
                        >
                          <option value="new">جديد (New)</option>
                          <option value="handled">تم الرد (Handled)</option>
                          <option value="archived">مؤرشف (Archived)</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          {inq.status !== 'handled' && (
                            <button
                              type="button"
                              className="btn btn-outline-gold btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              onClick={() => markInquiryHandled(inq.id)}
                              title="تعليم كـ تم الرد"
                            >
                              <CheckCircle2 size={13} />
                              <span>تم الرد</span>
                            </button>
                          )}

                          {inq.status !== 'archived' ? (
                            <button
                              type="button"
                              className="btn-icon-subtle"
                              onClick={() => archiveInquiry(inq.id)}
                              title="أرشفة الطلب"
                            >
                              <Archive size={15} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-icon-subtle"
                              onClick={() => updateInquiryStatus(inq.id, 'new')}
                              title="إعادة كـ جديد"
                            >
                              <RotateCcw size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
