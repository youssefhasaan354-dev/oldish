import React from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import type { SectionConfig } from '../../types';
import { Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';

export const AdminSectionsManager: React.FC = () => {
  const { sections, reorderSections, updateSection } = useData();
  const { role } = useAuth();
  const isReadOnly = role === 'viewer';

  const sortedSections = [...sections].sort((a, b) => a.sort_order - b.sort_order);

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (isReadOnly) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedSections.length) return;

    const newArray = [...sortedSections];
    const [moved] = newArray.splice(index, 1);
    newArray.splice(targetIndex, 0, moved);

    // Reassign sort_order
    const updated = newArray.map((sec, idx) => ({ ...sec, sort_order: idx }));
    reorderSections(updated);
  };

  const toggleVisibility = (sec: SectionConfig) => {
    if (isReadOnly) return;
    updateSection(sec.key, { visible: !sec.visible });
  };

  return (
    <div className="admin-page-container">
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#161616', margin: '0 0 4px 0' }}>
          إدارة ترتيب وظهور أقسام الموقع (Sections Manager)
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
          إعادة ترتيب الأقسام صعوداً وهبوطاً، إخفاء/إظهار أي قسم، وتعديل أسماء روابط شريط التنقل
        </p>
      </div>

      <div className="admin-card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sortedSections.map((sec, idx) => (
            <div
              key={sec.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: '6px',
                background: sec.visible ? '#FFFFFF' : '#F7F7F7',
                border: '1px solid #E2E8F0',
                gap: '12px',
                opacity: sec.visible ? 1 : 0.65
              }}
            >
              {/* Order Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  disabled={isReadOnly || idx === 0}
                  className="btn btn-outline-light btn-sm"
                  style={{ padding: '6px' }}
                  onClick={() => moveSection(idx, 'up')}
                  title="تحريك لأعلى"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  disabled={isReadOnly || idx === sortedSections.length - 1}
                  className="btn btn-outline-light btn-sm"
                  style={{ padding: '6px' }}
                  onClick={() => moveSection(idx, 'down')}
                  title="تحريك لأسفل"
                >
                  <ArrowDown size={14} />
                </button>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#888', minWidth: '24px', textAlign: 'center' }}>
                  {idx + 1}
                </span>
              </div>

              {/* Title & Section Key */}
              <div style={{ flexGrow: 1, display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="badge badge-gold" style={{ fontSize: '0.6875rem' }}>
                  #{sec.key}
                </span>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={sec.nav_label_ar}
                    disabled={isReadOnly}
                    onChange={(e) => updateSection(sec.key, { nav_label_ar: e.target.value })}
                    className="form-input"
                    style={{ padding: '6px 10px', fontSize: '0.875rem', width: '160px' }}
                    placeholder="الاسم بالعربية"
                  />
                  <input
                    type="text"
                    value={sec.nav_label_en}
                    disabled={isReadOnly}
                    onChange={(e) => updateSection(sec.key, { nav_label_en: e.target.value })}
                    className="form-input"
                    style={{ padding: '6px 10px', fontSize: '0.875rem', width: '160px' }}
                    dir="ltr"
                    placeholder="English Nav Label"
                  />
                </div>
              </div>

              {/* Visibility Switch */}
              <button
                type="button"
                disabled={isReadOnly}
                className={`btn btn-sm ${sec.visible ? 'btn-outline-gold' : 'btn-outline-light'}`}
                style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
                onClick={() => toggleVisibility(sec)}
              >
                {sec.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                <span>{sec.visible ? 'ظاهر بالموقع' : 'مخفي'}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
