import React, { useState } from 'react';
import '../../admin.css';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { 
  Home, 
  Image, 
  Sliders, 
  Utensils, 
  MapPin, 
  Star, 
  Type, 
  Layers, 
  Palette, 
  Globe, 
  Inbox, 
  QrCode, 
  Users, 
  Activity, 
  LogOut, 
  ExternalLink, 
  Menu as MenuIcon, 
  X, 
  UploadCloud, 
  RotateCcw, 
  History 
} from 'lucide-react';

// Admin Subpages
import { AdminDashboardHome } from './AdminDashboardHome';
import { AdminMediaLibrary } from './AdminMediaLibrary';
import { AdminImagePlacementManager } from './AdminImagePlacementManager';
import { AdminMenuManager } from './AdminMenuManager';
import { AdminBranchesManager } from './AdminBranchesManager';
import { AdminRatingsManager } from './AdminRatingsManager';
import { AdminTextsEditor } from './AdminTextsEditor';
import { AdminSectionsManager } from './AdminSectionsManager';
import { AdminBrandingManager } from './AdminBrandingManager';
import { AdminSeoManager } from './AdminSeoManager';
import { AdminInquiriesInbox } from './AdminInquiriesInbox';
import { AdminQrGenerator } from './AdminQrGenerator';
import { AdminUsersManager } from './AdminUsersManager';
import { AdminActivityLog } from './AdminActivityLog';
import { useNoIndex } from '../../lib/seo';

export const AdminLayout: React.FC = () => {
  useNoIndex();
  const { role, logout } = useAuth();
  const { 
    hasUnsavedDraft, 
    publishChanges, 
    discardDraft, 
    versions, 
    restoreVersion, 
    inquiries, 
    isFirebaseActive 
  } = useData();

  const [activeTab, setActiveTab] = useState<string>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Publish Modal State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishLabel, setPublishLabel] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  // Versions History Modal State
  const [isVersionsModalOpen, setIsVersionsModalOpen] = useState(false);

  const newInquiriesCount = inquiries.filter(i => i.status === 'new').length;

  const navItems = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'media', label: 'مكتبة الوسائط', icon: Image },
    { id: 'slots', label: 'مواقع وضبط الصور', icon: Sliders },
    { id: 'menu', label: 'قائمة الطعام والأسعار', icon: Utensils },
    { id: 'branches', label: 'الفروع والمواعيد', icon: MapPin },
    { id: 'ratings', label: 'تقييمات المنصات', icon: Star },
    { id: 'texts', label: 'النصوص والمحتوى', icon: Type },
    { id: 'sections', label: 'ترتيب الأقسام', icon: Layers },
    { id: 'branding', label: 'الهوية والألوان', icon: Palette },
    { id: 'seo', label: 'السيو ومحركات البحث', icon: Globe },
    { id: 'inquiries', label: 'الطلبات والاستفسارات', icon: Inbox, badge: newInquiriesCount },
    { id: 'qr', label: 'باركود المنيو (QR)', icon: QrCode },
    ...(role === 'owner' ? [{ id: 'users', label: 'المستخدمين والصلاحيات', icon: Users }] : []),
    { id: 'logs', label: 'سجل النشاط', icon: Activity },
  ];

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);
    try {
      const ok = await publishChanges(publishLabel.trim() || 'تحديث الموقع الرسمي');
      if (ok) {
        setIsPublishModalOpen(false);
        setPublishLabel('');
        alert('تم نشر التحديثات بنجاح في الموقع الرسمي!');
      } else {
        alert('فشل نشر التحديثات. يرجى التحقق من الاتصال والمحاولة مرة أخرى.');
      }
    } catch (err: any) {
      console.error(err);
      alert('حدث خطأ أثناء عملية النشر: ' + (err?.message || 'خطأ غير معروف'));
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDiscard = () => {
    if (confirm('هل أنت متأكد من إلغاء كافة التعديلات غير المنشورة والعودة للنسخة المنشورة السابقة؟')) {
      discardDraft();
    }
  };

  const handleRestore = (versionId: string, label: string) => {
    if (confirm(`هل أنت متأكد من استرجاع النسخة "${label}" واستبدال المحتوى الحالي بها؟`)) {
      const ok = restoreVersion(versionId);
      if (ok) {
        setIsVersionsModalOpen(false);
        alert('تم استرجاع النسخة بنجاح!');
      }
    }
  };

  return (
    <div className="admin-shell" dir="rtl">
      {/* Top Header Bar */}
      <header className="admin-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            type="button" 
            className="admin-menu-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title="تبديل القائمة الجانبية"
          >
            <MenuIcon size={20} />
          </button>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-gold)' }}>
              Oldish
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#333' }}>
              لوحة الإدارة
            </span>
          </div>

          {/* Database Mode Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="hide-mobile">
            <span className={`status-dot ${isFirebaseActive ? 'published' : 'draft'}`} />
            <span style={{ fontSize: '0.75rem', color: '#666' }}>
              {isFirebaseActive ? 'Firebase Live' : 'وضع العرض التجريبي (Demo Cache)'}
            </span>
          </div>

          {/* Published / Unpublished Changes Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className={`status-dot ${hasUnsavedDraft ? 'draft' : 'published'}`} />
            <span 
              style={{ 
                fontSize: '0.75rem', 
                fontWeight: 600, 
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: hasUnsavedDraft ? '#FEFCBF' : '#C6F6D5',
                color: hasUnsavedDraft ? '#975A16' : '#22543D',
                border: `1px solid ${hasUnsavedDraft ? '#F6E05E' : '#9AE6B4'}`
              }}
            >
              {hasUnsavedDraft ? 'تعديلات غير منشورة' : 'الموقع منشور ومحدث'}
            </span>
          </div>
        </div>

        {/* Action Controls & User Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Version History Button */}
          <button
            type="button"
            className="btn btn-outline-gold btn-sm"
            onClick={() => setIsVersionsModalOpen(true)}
            title="سجل النسخ السابقة والاسترجاع"
          >
            <History size={14} />
            <span className="hide-mobile">سجل النسخ ({versions.length})</span>
          </button>

          {/* Preview Public Site */}
          <a
            href={hasUnsavedDraft ? '/?preview=draft' : '/'}
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline-gold btn-sm"
            title="معاينة الموقع كزائر"
          >
            <ExternalLink size={14} />
            <span className="hide-mobile">معاينة الموقع</span>
          </a>

          {/* Discard & Publish Draft Buttons */}
          {hasUnsavedDraft && (
            <>
              <button
                type="button"
                className="btn btn-outline btn-sm delete"
                onClick={handleDiscard}
                title="إلغاء المسودة الحالية"
              >
                <RotateCcw size={14} />
                <span className="hide-mobile">إلغاء المسودة</span>
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setIsPublishModalOpen(true)}
                style={{ background: '#38A169', borderColor: '#38A169' }}
              >
                <UploadCloud size={15} />
                <span>نشر التعديلات</span>
              </button>
            </>
          )}

          {/* User & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid #ddd', paddingRight: '12px' }}>
            <span className="badge badge-gold hide-mobile">
              {role === 'owner' ? 'المالك' : role === 'editor' ? 'محرر' : 'مشاهد'}
            </span>
            <button
              type="button"
              className="btn-icon-subtle"
              onClick={logout}
              title="تسجيل الخروج"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Persistent Demo Mode Banner */}
      {!isFirebaseActive && (
        <div 
          style={{
            backgroundColor: '#FEF3C7',
            borderBottom: '1px solid #FCD34D',
            color: '#92400E',
            padding: '10px 16px',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            textAlign: 'center',
            zIndex: 99
          }}
        >
          <span>⚠️</span>
          <span>Demo mode - changes are saved only in this browser / وضع تجريبي - التعديلات محفوظة في هذا المتصفح فقط</span>
        </div>
      )}

      {/* Main Body */}
      <div className="admin-body">
        {/* Sidebar */}
        <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="admin-sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`admin-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="admin-nav-badge">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ padding: '16px', borderTop: '1px solid #eee', fontSize: '0.75rem', color: '#888' }}>
            <div>Oldish Restaurant & Café</div>
            <div style={{ direction: 'ltr', textAlign: 'right', marginTop: '2px' }}>v2.0 · Downtown Cairo</div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="admin-content">
          {activeTab === 'home' && <AdminDashboardHome onNavigateTab={(tab) => setActiveTab(tab)} />}
          {activeTab === 'media' && <AdminMediaLibrary />}
          {activeTab === 'slots' && <AdminImagePlacementManager />}
          {activeTab === 'menu' && <AdminMenuManager />}
          {activeTab === 'branches' && <AdminBranchesManager />}
          {activeTab === 'ratings' && <AdminRatingsManager />}
          {activeTab === 'texts' && <AdminTextsEditor />}
          {activeTab === 'sections' && <AdminSectionsManager />}
          {activeTab === 'branding' && <AdminBrandingManager />}
          {activeTab === 'seo' && <AdminSeoManager />}
          {activeTab === 'inquiries' && <AdminInquiriesInbox />}
          {activeTab === 'qr' && <AdminQrGenerator />}
          {activeTab === 'users' && <AdminUsersManager />}
          {activeTab === 'logs' && <AdminActivityLog />}
        </main>
      </div>

      {/* Publish Snapshot Modal */}
      {isPublishModalOpen && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <h3>نشر التعديلات إلى الموقع العام (Publish Site)</h3>
              <button type="button" className="btn-close" onClick={() => setIsPublishModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePublish}>
              <div className="admin-modal-body">
                <div 
                  style={{ 
                    padding: '12px 16px', 
                    background: '#F0FFF4', 
                    border: '1px solid #C6F6D5', 
                    borderRadius: '6px', 
                    fontSize: '0.875rem', 
                    color: '#22543D',
                    marginBottom: '16px' 
                  }}
                >
                  سيتم حفظ نسخة احتياطية من التعديلات الحالية كلقطة فورية (Snapshot) ونشرها فوراً لكافة زوار الموقع.
                </div>

                <div className="form-group">
                  <label className="form-label">عنوان أو ملاحظة التحديث *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={publishLabel}
                    onChange={(e) => setPublishLabel(e.target.value)}
                    placeholder="مثال: تحديث أطباق الغداء وصور الفناء"
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsPublishModalOpen(false)}>
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ background: '#38A169', borderColor: '#38A169' }}
                  disabled={isPublishing}
                >
                  {isPublishing ? 'جاري النشر...' : 'تأكيد النشر الفوري'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {isVersionsModalOpen && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-card" style={{ maxWidth: '600px' }}>
            <div className="admin-modal-header">
              <h3>سجل النسخ السابقة والاسترجاع (Version History)</h3>
              <button type="button" className="btn-close" onClick={() => setIsVersionsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {versions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                  لا توجد نسخ سابقة محفوظة بعد. يتم إنشاء نسخة جديدة تلقائياً مع كل عملية نشر.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {versions.map((ver) => (
                    <div
                      key={ver.id}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '6px',
                        border: '1px solid #E2E8F0',
                        background: '#FAF8F5',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-charcoal)' }}>
                          {ver.label}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#777', marginTop: '2px' }}>
                          بواسطة: {ver.created_by} · {new Date(ver.created_at).toLocaleString('ar-EG')}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-outline-gold btn-sm"
                        onClick={() => handleRestore(ver.id, ver.label)}
                      >
                        <RotateCcw size={13} />
                        <span>استرجاع</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setIsVersionsModalOpen(false)}>
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
