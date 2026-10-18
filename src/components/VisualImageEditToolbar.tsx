import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useVisualEdit } from '../context/VisualEditContext';
import { Camera, Sliders, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const VisualImageEditToolbar: React.FC = () => {
  const { isAuthenticated, role } = useAuth();
  const { isVisualEditActive, setIsVisualEditActive } = useVisualEdit();

  // Only show floating toolbar if logged in as owner or editor
  if (!isAuthenticated || (role !== 'owner' && role !== 'editor')) {
    return null;
  }

  return (
    <div 
      className="visual-edit-floating-toolbar"
      style={{
        position: 'fixed',
        bottom: '24px',
        insetInlineStart: '24px',
        zIndex: 99990,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: '#1A202C',
        color: '#FFFFFF',
        padding: '8px 14px',
        borderRadius: '30px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
        border: isVisualEditActive ? '2px solid var(--color-gold)' : '1px solid #4A5568',
        fontSize: '0.8125rem',
        fontFamily: 'Cairo, sans-serif',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <ShieldCheck size={16} style={{ color: 'var(--color-gold)' }} />
        <span style={{ fontWeight: 600 }}>{role === 'owner' ? 'المالك' : 'محرر'}</span>
      </div>

      <div style={{ width: '1px', height: '18px', background: '#4A5568' }} />

      {/* Visual Edit Mode Toggle */}
      <button
        type="button"
        onClick={() => setIsVisualEditActive(!isVisualEditActive)}
        style={{
          background: isVisualEditActive ? 'var(--color-gold)' : '#2D3748',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '20px',
          padding: '4px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.75rem',
          transition: 'all 0.2s ease'
        }}
        title="تفعيل ظهور أزرار استبدال وضبط الصور مباشرة داخل صفحات الموقع"
      >
        <Camera size={14} />
        <span>تعديل الصور: {isVisualEditActive ? 'مُفعّل (ON)' : 'مُعطل (OFF)'}</span>
      </button>

      <div style={{ width: '1px', height: '18px', background: '#4A5568' }} />

      {/* Admin Link */}
      <Link
        to="/admin"
        style={{
          color: '#CBD5E0',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.75rem'
        }}
        title="الانتقال إلى لوحة التحكم الإدارية"
      >
        <Sliders size={13} />
        <span>لوحة التحكم</span>
      </Link>
    </div>
  );
};
