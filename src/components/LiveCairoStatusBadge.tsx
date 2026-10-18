import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export function getCairoLiveStatus() {
  const now = new Date();
  const cairoFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Cairo',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });

  const parts = cairoFormatter.formatToParts(now);
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  const minutesSinceMidnight = hour * 60 + minute;

  // Daily hours: 08:00 AM to 00:00 Midnight (08:00 - 24:00)
  const isOpen = minutesSinceMidnight >= 8 * 60 && minutesSinceMidnight < 24 * 60;

  return {
    isOpen,
    statusTextAr: isOpen ? 'مفتوح الآن' : 'مغلق الآن',
    statusTextEn: isOpen ? 'Open Now' : 'Closed Now',
    subTextAr: isOpen ? 'حتى 12 منتصف الليل' : 'يفتح 8:00 صباحاً',
    subTextEn: isOpen ? 'Until 12:00 AM' : 'Opens at 8:00 AM',
    cairoTimeStr: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  };
}

interface LiveCairoStatusBadgeProps {
  variant?: 'header' | 'hero' | 'card';
  showSubText?: boolean;
}

export const LiveCairoStatusBadge: React.FC<LiveCairoStatusBadgeProps> = ({ 
  variant = 'header',
  showSubText = true 
}) => {
  const { isRTL } = useLanguage();
  const [status, setStatus] = useState(getCairoLiveStatus);

  useEffect(() => {
    // Update every 60 seconds
    const interval = setInterval(() => {
      setStatus(getCairoLiveStatus());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const { isOpen, statusTextAr, statusTextEn, subTextAr, subTextEn } = status;
  const label = isRTL ? statusTextAr : statusTextEn;
  const sub = isRTL ? subTextAr : subTextEn;

  if (variant === 'hero') {
    return (
      <div 
        className="live-status-hero"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(26, 32, 44, 0.75)',
          backdropFilter: 'blur(8px)',
          border: isOpen ? '1px solid rgba(72, 187, 120, 0.5)' : '1px solid rgba(229, 62, 62, 0.5)',
          borderRadius: '24px',
          padding: '6px 14px',
          color: '#FFFFFF',
          fontSize: '0.8125rem',
          fontWeight: 600
        }}
      >
        <span 
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isOpen ? '#48BB78' : '#E53E3E',
            boxShadow: isOpen ? '0 0 10px #48BB78' : '0 0 10px #E53E3E'
          }}
        />
        <span>{label}</span>
        {showSubText && (
          <>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>•</span>
            <span style={{ color: '#E2E8F0', fontWeight: 400, fontSize: '0.75rem' }}>{sub}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div 
      className="live-cairo-badge"
      title={`بتوقيت القاهرة (Cairo Time): 08:00 - 00:00 يومياً`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '20px',
        background: isOpen ? '#F0FFF4' : '#FFF5F5',
        border: isOpen ? '1px solid #C6F6D5' : '1px solid #FED7D7',
        color: isOpen ? '#22543D' : '#9B2C2C',
        fontSize: '0.75rem',
        fontWeight: 600
      }}
    >
      <span 
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: isOpen ? '#38A169' : '#E53E3E',
          display: 'inline-block'
        }}
      />
      <span>{label}</span>
      {showSubText && (
        <span style={{ color: isOpen ? '#38A169' : '#C53030', fontWeight: 500, fontSize: '0.6875rem' }}>
          ({sub})
        </span>
      )}
    </div>
  );
};
