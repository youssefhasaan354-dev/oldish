import React, { useState } from 'react';
import '../../admin.css';
import { useAuth } from '../../context/AuthContext';
import { Shield, Key, Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useNoIndex } from '../../lib/seo';

export const AdminLoginPage: React.FC = () => {
  useNoIndex();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isDemoModeActive = !isSupabaseConfigured() && (import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.VITE_DEMO_MODE === true);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate('/admin');
    } else {
      setError(res.error || 'Authentication failed');
    }
  };

  const handleQuickLogin = async (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setLoading(true);
    const res = await login(quickEmail, quickPass);
    setLoading(false);
    if (res.success) {
      navigate('/admin');
    }
  };

  return (
    <div className="admin-login-wrapper" dir="rtl">
      <div className="admin-login-card">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="admin-login-icon">
            <Shield size={32} />
          </div>
          <h1 style={{ fontSize: '1.5rem', color: '#161616', margin: '8px 0 4px 0' }}>
            لوحة تحكم أولديش — Oldish Admin
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#666' }}>
            تسجيل الدخول لإدارة المحتوى، الصور، القائمة، وطلبات الزوار
          </p>
        </div>

        {error && (
          <div className="admin-alert error" style={{ marginBottom: '16px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} noValidate>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontSize: '0.875rem' }}>
              <Mail size={14} style={{ color: 'var(--color-gold)' }} />
              <span>البريد الإلكتروني</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@oldish.eg"
              className="form-input"
              required
              dir="ltr"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ fontSize: '0.875rem' }}>
              <Key size={14} style={{ color: 'var(--color-gold)' }} />
              <span>كلمة المرور</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="form-input"
              required
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: isDemoModeActive ? '18px' : '24px' }}
          >
            <span>{loading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}</span>
          </button>
        </form>

        {/* Quick Demo Logins for Sales Presentation */}
        {isDemoModeActive && (
          <div style={{ borderTop: '1px solid #E5E0D8', paddingTop: '16px' }}>
            <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
              حسابات تجريبية سريعة للعرض (Quick Demo Accounts):
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
              <button
                type="button"
                className="btn btn-outline-gold btn-sm"
                style={{ fontSize: '0.75rem', padding: '6px 4px' }}
                onClick={() => handleQuickLogin('owner@oldish.eg', 'demo123456')}
              >
                👑 المالك (Owner)
              </button>
              <button
                type="button"
                className="btn btn-outline-light btn-sm"
                style={{ fontSize: '0.75rem', padding: '6px 4px', color: '#333', borderColor: '#ccc' }}
                onClick={() => handleQuickLogin('manager@oldish.eg', 'demo123456')}
              >
                ✍️ محرر (Editor)
              </button>
              <button
                type="button"
                className="btn btn-outline-light btn-sm"
                style={{ fontSize: '0.75rem', padding: '6px 4px', color: '#333', borderColor: '#ccc' }}
                onClick={() => handleQuickLogin('auditor@oldish.eg', 'demo123456')}
              >
                👁️ مشاهد (Viewer)
              </button>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#777', textAlign: 'center', background: '#F9F7F4', padding: '6px 10px', borderRadius: '4px' }}>
              كلمة المرور التجريبية: <code style={{ fontWeight: 700, color: '#886E42' }}>demo123456</code>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/" style={{ color: 'var(--color-gold)', fontSize: '0.8125rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={14} />
            <span>العودة إلى الموقع الرئيسي</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
