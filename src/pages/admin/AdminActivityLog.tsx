import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { 
  Activity, 
  Search, 
  Clock 
} from 'lucide-react';

export const AdminActivityLog: React.FC = () => {
  const { activityLogs } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      if (actionFilter !== 'all' && !log.action.toLowerCase().includes(actionFilter.toLowerCase())) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesUser = log.user_email.toLowerCase().includes(q);
        const matchesEntity = log.entity.toLowerCase().includes(q);
        const matchesDetails = log.details?.toLowerCase().includes(q) || false;
        if (!matchesUser && !matchesEntity && !matchesDetails) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [activityLogs, actionFilter, searchQuery]);

  const getActionBadgeClass = (action: string) => {
    if (action.includes('publish')) return 'badge-gold';
    if (action.includes('delete')) return 'badge-danger';
    if (action.includes('add') || action.includes('create')) return 'badge-success';
    if (action.includes('login')) return 'badge-light';
    return 'badge-subtle';
  };

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Activity size={20} style={{ color: 'var(--color-gold)' }} />
              <h2 style={{ margin: 0, fontSize: '1.375rem' }}>سجل النشاط والتعديلات (Activity Audit Log)</h2>
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.875rem', color: '#666' }}>
              تتبع زمني دقيق لكافة عمليات النشر، تعديل القوائم، رفع الصور، وتغيير الإعدادات لضمان الشفافية.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-card" style={{ marginBottom: '20px', padding: '14px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingRight: '36px' }}
              placeholder="البحث بالمستخدم، القسم، أو تفاصيل العملية..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8125rem', color: '#777' }}>النشاط:</span>
            {[
              { id: 'all', label: 'الكل' },
              { id: 'publish', label: 'نشر الموقع' },
              { id: 'menu', label: 'المنيو' },
              { id: 'media', label: 'الوسائط' },
              { id: 'settings', label: 'الإعدادات' },
            ].map(a => (
              <button
                key={a.id}
                type="button"
                className={`filter-btn ${actionFilter === a.id ? 'active' : ''}`}
                onClick={() => setActionFilter(a.id)}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '160px' }}>التوقيت</th>
                <th>المستخدم</th>
                <th>نوع الإجراء</th>
                <th>العنصر</th>
                <th>التفاصيل والملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    لا توجد سجلات نشاط مسجلة تطابق معايير البحث.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.8125rem', color: '#666', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={13} style={{ color: '#aaa' }} />
                        <span>
                          {new Date(log.created_at).toLocaleDateString('ar-EG', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div 
                          style={{ 
                            width: '26px', 
                            height: '26px', 
                            borderRadius: '50%', 
                            background: '#F0ECE1', 
                            color: 'var(--color-charcoal)', 
                            fontSize: '0.75rem', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontWeight: 600
                          }}
                        >
                          {log.user_email ? log.user_email[0].toUpperCase() : 'U'}
                        </div>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#333' }}>
                          {log.user_email}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    <td style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-charcoal)' }}>
                      {log.entity}
                    </td>

                    <td style={{ fontSize: '0.8125rem', color: '#555' }}>
                      {log.details || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
