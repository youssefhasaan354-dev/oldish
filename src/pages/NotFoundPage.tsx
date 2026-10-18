import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Utensils } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNoIndex } from '../lib/seo';

export const NotFoundPage: React.FC = () => {
  useNoIndex();
  const { isRTL } = useLanguage();

  return (
    <div 
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FAF8F5',
        padding: '24px',
        textAlign: 'center',
        fontFamily: isRTL ? 'Cairo, sans-serif' : 'Poppins, sans-serif'
      }}
    >
      <div 
        style={{
          maxWidth: '540px',
          width: '100%',
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '48px 24px',
          border: '1px solid #EAE5DC',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.06)'
        }}
      >
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '4.5rem', fontWeight: 800, color: 'var(--color-gold)', lineHeight: 1, marginBottom: '12px' }}>
          404
        </div>

        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', color: '#1A202C', fontWeight: 700, marginBottom: '8px' }}>
          {isRTL ? 'الصفحة غير موجودة' : 'Page Not Found'}
        </div>

        <p style={{ fontSize: '0.9375rem', color: '#718096', maxWidth: '420px', margin: '0 auto 28px', lineHeight: '1.6' }}>
          {isRTL 
            ? 'عذراً، الرابط الذي تحاول الوصول إليه غير موجود أو تم نقله. يمكنك العودة للصفحة الرئيسية أو استعراض قائمة الطعام.' 
            : 'The page you are looking for does not exist or has been moved. Return home or browse our digital menu.'}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-primary" style={{ padding: '10px 22px' }}>
            <Home size={16} />
            <span>{isRTL ? 'الصفحة الرئيسية' : 'Return Home'}</span>
          </Link>

          <Link to="/menu" className="btn btn-outline-gold" style={{ padding: '10px 22px' }}>
            <Utensils size={16} />
            <span>{isRTL ? 'قائمة الطعام' : 'Browse Menu'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
