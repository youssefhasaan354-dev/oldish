import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Image, 
  Utensils, 
  MapPin, 
  Inbox, 
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Calendar,
  Clock,
  Users,
  Bell
} from 'lucide-react';

interface Props {
  onNavigateTab: (tabId: string) => void;
}

export const AdminDashboardHome: React.FC<Props> = ({ onNavigateTab }) => {
  const { 
    siteSettings, 
    menuItems, 
    mediaList, 
    branches, 
    inquiries, 
    hasUnsavedDraft, 
    versions 
  } = useData();
  const { user, role } = useAuth();

  const [todayStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [todayFormatted] = useState(() => 
    new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  );
  
  const pendingInquiries = useMemo(() => inquiries.filter(i => i.status === 'new'), [inquiries]);
  const pendingCount = pendingInquiries.length;

  const todayBookings = useMemo(() => {
    return inquiries.filter(i => 
      (i.type === 'reservation_request' || !i.type) && 
      (i.date === todayStr || (i.created_at && i.created_at.startsWith(todayStr)))
    );
  }, [inquiries, todayStr]);

  const handledCount = useMemo(() => {
    return inquiries.filter(i => i.status === 'handled').length;
  }, [inquiries]);

  const eventInquiriesCount = useMemo(() => {
    return inquiries.filter(i => i.type === 'event_request').length;
  }, [inquiries]);

  const unreadInquiries = pendingCount;
  const aiMediaCount = mediaList.filter(m => m.is_ai).length;
  const unconfirmedBranches = branches.filter(b => b.status === 'unconfirmed').length;

  const lastVersion = versions.length > 0 ? versions[0] : null;

  // Go-Live Readiness Checklist Items
  const checklist = [
    {
      id: 'logo',
      title: 'رفع الشعار الرسمي للمطعم (Real Logo)',
      titleEn: 'Upload Official Restaurant Logo',
      done: false, // Default pending owner logo
      hint: 'الموقع يستخدم حالياً وورد مارك نصي نظيف بانتظار تزويد الشعار الرسمي',
      tab: 'branding'
    },
    {
      id: 'photos',
      title: 'استبدال الصور التوضيحية بصور حقيقية',
      titleEn: 'Replace Illustrative AI Photos with Real Venue Photos',
      done: aiMediaCount === 0,
      hint: `${aiMediaCount} صور توضيحية حالية بانتظار صور الفناء والأطباق الحقيقية`,
      tab: 'media'
    },
    {
      id: 'prices',
      title: 'اعتماد أسعار قائمة الطعام الرسمية',
      titleEn: 'Confirm Official Menu Pricing',
      done: siteSettings.show_prices,
      hint: siteSettings.show_prices ? 'عرض الأسعار مفعل' : 'الأسعار معطلة حالياً ومحددة بمتوسط 200–400 ج.م للفرد لحين التأكيد',
      tab: 'menu'
    },
    {
      id: 'zamalek',
      title: 'تأكيد حالة فرع الزمالك مع الإدارة',
      titleEn: 'Confirm Zamalek Branch Operating Status',
      done: unconfirmedBranches === 0,
      hint: 'فرع الزمالك معلّم حالياً كموقع قيد التأكيد بدون هواتف أو مواعيد لحين الاعتماد',
      tab: 'branches'
    },
    {
      id: 'seo',
      title: 'إلغاء حجب الفهرسة (Turn off Noindex) عند الإطلاق',
      titleEn: 'Disable Noindex for Public Launch',
      done: !siteSettings.noindex,
      hint: siteSettings.noindex ? 'الفهرسة محجوبة حالياً لحماية سرية العرض التجريبي' : 'الموقع متاح لمحركات البحث',
      tab: 'seo'
    }
  ];

  return (
    <div className="admin-page-container">
      {/* Welcome Banner */}
      <div className="admin-welcome-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-gold">
                {role === 'owner' ? '👑 حساب المالك (Owner)' : role === 'editor' ? '✍️ محرر (Editor)' : '👁️ حساب عرض (Viewer)'}
              </span>
              <span style={{ fontSize: '0.8125rem', color: '#666' }}>
                {user?.email}
              </span>
            </div>
            <h2 style={{ fontSize: '1.625rem', color: '#161616', margin: '0 0 6px 0' }}>
              مرحباً بك في لوحة إدارة أولديش
            </h2>
            <p style={{ fontSize: '0.9375rem', color: '#555', margin: 0 }}>
              تحكم كامل في كل صورة، نص، طبق، وفرع بالموقع مع مزامنة فورية ونظام حفظ مسودات آمن.
            </p>
          </div>

          <div style={{ textAlign: 'left', minWidth: '180px' }}>
            <div style={{ fontSize: '0.8125rem', color: '#777' }}>حالة النشر:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBlock: '4px' }}>
              <span className={`status-dot ${hasUnsavedDraft ? 'draft' : 'published'}`} />
              <strong style={{ color: hasUnsavedDraft ? '#C05621' : '#22543D' }}>
                {hasUnsavedDraft ? 'توجد مسودة غير منشورة' : 'الموقع منشور ومحدث'}
              </strong>
            </div>
            {lastVersion && (
              <span style={{ fontSize: '0.75rem', color: '#888' }}>
                آخر نشر: {new Date(lastVersion.created_at).toLocaleDateString('ar-EG')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Urgent Operational Alert if pending requests exist */}
      {pendingCount > 0 && (
        <div 
          style={{
            background: 'linear-gradient(90deg, #FFF5F5 0%, #FED7D7 100%)',
            border: '1px solid #FEB2B2',
            borderRadius: '8px',
            padding: '14px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#E53E3E', color: '#FFF', borderRadius: '50%', padding: '8px', display: 'flex' }}>
              <Bell size={18} />
            </div>
            <div>
              <strong style={{ color: '#9B2C2C', fontSize: '0.9375rem' }}>
                تنبيه تشغيلي عاجل: يوجد {pendingCount} طلب حجز أو استفسار بانتظار التأكيد والمتابعة
              </strong>
              <div style={{ fontSize: '0.8125rem', color: '#C53030' }}>
                يُفضل الرد سريعاً لضمان أفضل تجربة للضيوف وتأكيد حجوزات الطاولات.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{ background: '#C53030', borderColor: '#C53030' }}
            onClick={() => onNavigateTab('inquiries')}
          >
            <span>مراجعة الطلبات المعلقة ({pendingCount})</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Daily Operations Quick Metrics (Task 5) */}
      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div className="admin-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} style={{ color: 'var(--color-gold)' }} />
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>
              مؤشرات الأداء والتشغيل اليومي (Daily Operations KPIs)
            </h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#718096' }}>
            تاريخ اليوم: {todayFormatted}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          {/* Card 1: Today's Bookings */}
          <div 
            style={{ 
              background: '#F0F9FF', 
              border: '1px solid #BAE6FD', 
              borderRadius: '6px', 
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}
          >
            <div style={{ background: '#0284C7', color: '#FFF', borderRadius: '8px', padding: '10px', display: 'flex' }}>
              <Clock size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.625rem', fontWeight: 700, color: '#0369A1', lineHeight: 1 }}>
                {todayBookings.length}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#0284C7', fontWeight: 600, marginTop: '4px' }}>
                حجوزات اليوم
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                طاولات مجدولة لتاريخ اليوم
              </div>
            </div>
          </div>

          {/* Card 2: Pending Unhandled Inquiries */}
          <div 
            onClick={() => onNavigateTab('inquiries')}
            style={{ 
              background: pendingCount > 0 ? '#FEF2F2' : '#F8FAFC', 
              border: pendingCount > 0 ? '1px solid #FECACA' : '1px solid #E2E8F0', 
              borderRadius: '6px', 
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              cursor: 'pointer'
            }}
          >
            <div style={{ background: pendingCount > 0 ? '#DC2626' : '#94A3B8', color: '#FFF', borderRadius: '8px', padding: '10px', display: 'flex' }}>
              <Inbox size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.625rem', fontWeight: 700, color: pendingCount > 0 ? '#B91C1C' : '#475569', lineHeight: 1 }}>
                {pendingCount}
              </div>
              <div style={{ fontSize: '0.8125rem', color: pendingCount > 0 ? '#DC2626' : '#64748B', fontWeight: 600, marginTop: '4px' }}>
                طلبات معلقة
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                بانتظار التأكيد مع الزبائن
              </div>
            </div>
          </div>

          {/* Card 3: Handled Inquiries */}
          <div 
            style={{ 
              background: '#F0FDF4', 
              border: '1px solid #BBF7D0', 
              borderRadius: '6px', 
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}
          >
            <div style={{ background: '#16A34A', color: '#FFF', borderRadius: '8px', padding: '10px', display: 'flex' }}>
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.625rem', fontWeight: 700, color: '#15803D', lineHeight: 1 }}>
                {handledCount}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#16A34A', fontWeight: 600, marginTop: '4px' }}>
                طلبات تمت معالجتها
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                تم التواصل وتأكيد الحضور
              </div>
            </div>
          </div>

          {/* Card 4: Event & Group Bookings */}
          <div 
            onClick={() => onNavigateTab('inquiries')}
            style={{ 
              background: '#FAF5FF', 
              border: '1px solid #E9D5FF', 
              borderRadius: '6px', 
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              cursor: 'pointer'
            }}
          >
            <div style={{ background: '#9333EA', color: '#FFF', borderRadius: '8px', padding: '10px', display: 'flex' }}>
              <Users size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.625rem', fontWeight: 700, color: '#7E22CE', lineHeight: 1 }}>
                {eventInquiriesCount}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#9333EA', fontWeight: 600, marginTop: '4px' }}>
                مناسبات ومجموعات
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                فعاليات واجتماعات خاصة
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Metric Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card" onClick={() => onNavigateTab('menu')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon-wrap" style={{ background: 'rgba(136, 110, 66, 0.15)', color: 'var(--color-gold)' }}>
            <Utensils size={22} />
          </div>
          <div>
            <div className="stat-value">{menuItems.length}</div>
            <div className="stat-label">أصناف القائمة (Menu Items)</div>
          </div>
        </div>

        <div className="admin-stat-card" onClick={() => onNavigateTab('slots')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon-wrap" style={{ background: 'rgba(83, 99, 75, 0.15)', color: 'var(--color-muted-olive)' }}>
            <Image size={22} />
          </div>
          <div>
            <div className="stat-value">{mediaList.length}</div>
            <div className="stat-label">سجل مواضع الصور (Image Slots)</div>
          </div>
        </div>

        <div className="admin-stat-card" onClick={() => onNavigateTab('inquiries')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon-wrap" style={{ background: 'rgba(158, 71, 56, 0.15)', color: 'var(--color-brick)' }}>
            <Inbox size={22} />
          </div>
          <div>
            <div className="stat-value">{unreadInquiries}</div>
            <div className="stat-label">طلبات زوار جديدة (Inquiries)</div>
          </div>
        </div>

        <div className="admin-stat-card" onClick={() => onNavigateTab('branches')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon-wrap" style={{ background: 'rgba(51, 51, 51, 0.15)', color: 'var(--color-charcoal)' }}>
            <MapPin size={22} />
          </div>
          <div>
            <div className="stat-value">{branches.length}</div>
            <div className="stat-label">الفروع (Downtown + Zamalek)</div>
          </div>
        </div>
      </div>

      {/* Local Click Analytics Card (Part C #5) */}
      <div className="admin-card" style={{ marginTop: '20px' }}>
        <div className="admin-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} style={{ color: 'var(--color-gold)' }} />
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>
              إحصائيات تفاعل ونقرات الزوار (Privacy-Friendly Click Analytics)
            </h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#718096' }}>
            تُحسب محلياً بدون ملفات تعريف ارتباط (No Cookies / Fully Private)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', textAlign: 'center' }}>
          <div style={{ background: '#F8F9FA', padding: '12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-gold)' }}>
              {siteSettings.analytics_clicks?.calls || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>📞 نقرات الاتصال</div>
          </div>

          <div style={{ background: '#F8F9FA', padding: '12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#38A169' }}>
              {siteSettings.analytics_clicks?.whatsapp_clicks || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>💬 محادثات واتساب</div>
          </div>

          <div style={{ background: '#F8F9FA', padding: '12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3182CE' }}>
              {siteSettings.analytics_clicks?.directions || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>📍 طلبات الاتجاهات</div>
          </div>

          <div style={{ background: '#F8F9FA', padding: '12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#D69E2E' }}>
              {siteSettings.analytics_clicks?.menu_views || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>📖 استعراض المنيو</div>
          </div>

          <div style={{ background: '#F8F9FA', padding: '12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#805AD5' }}>
              {inquiries.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>📝 طلبات الطاولات</div>
          </div>
        </div>
      </div>

      {/* Go-Live Readiness Checklist */}
      <div className="admin-card" style={{ marginTop: '24px' }}>
        <div className="admin-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} style={{ color: 'var(--color-gold)' }} />
            <h3 style={{ margin: 0, fontSize: '1.1875rem' }}>
              قائمة الجاهزية للإطلاق الرسمي (Go-Live Checklist)
            </h3>
          </div>
          <span style={{ fontSize: '0.8125rem', color: '#666' }}>
            إرشادات تسليم الموقع لصاحب المكان
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {checklist.map((item) => (
            <div 
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: '6px',
                background: item.done ? '#F0FFF4' : '#FFFDF5',
                border: item.done ? '1px solid #C6F6D5' : '1px solid #FEEBC8',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {item.done ? (
                  <CheckCircle2 size={22} style={{ color: '#38A169', flexShrink: 0 }} />
                ) : (
                  <AlertTriangle size={22} style={{ color: '#DD6B20', flexShrink: 0 }} />
                )}
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '0.9375rem', color: '#1A202C' }}>
                    {item.title}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#718096' }}>
                    {item.hint}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-outline-gold btn-sm"
                onClick={() => onNavigateTab(item.tab)}
              >
                <span>تعديل</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '24px' }}>
        <div className="admin-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles size={18} style={{ color: 'var(--color-gold)' }} />
            <h4 style={{ margin: 0, fontSize: '1rem' }}>التحكم الدقيق بالصور (Image Slots)</h4>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#666', lineHeight: '1.6', marginBottom: '14px' }}>
            حدد نقطة التركيز (Focal Point) بالضغط المباشر على الصورة، وضبط التكبير، والتعتيم لكل سلايد وبلوك بالموقع.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onNavigateTab('slots')}
          >
            <span>فتح مدير مواقع الصور</span>
          </button>
        </div>

        <div className="admin-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ExternalLink size={18} style={{ color: 'var(--color-gold)' }} />
            <h4 style={{ margin: 0, fontSize: '1rem' }}>المنيو الرقمي والباركود (QR Code)</h4>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#666', lineHeight: '1.6', marginBottom: '14px' }}>
            توليد باركود للطاولات قابل للطباعة يفتح مباشرة المنيو الرقمي السريع المخصص للهواتف المحمولة.
          </p>
          <button
            type="button"
            className="btn btn-outline-gold btn-sm"
            onClick={() => onNavigateTab('qr')}
          >
            <span>توليد باركود الطاولات</span>
          </button>
        </div>
      </div>
    </div>
  );
};
