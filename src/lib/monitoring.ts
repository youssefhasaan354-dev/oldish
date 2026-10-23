/**
 * Optional Monitoring & Analytics
 * Supports:
 * 1. Sentry error reporting (only if VITE_SENTRY_DSN is configured, lazy-loaded)
 * 2. Vercel Analytics (only if VITE_VERCEL_ANALYTICS is true or ID provided)
 * 3. Plausible Analytics (only if VITE_PLAUSIBLE_DOMAIN is configured)
 *
 * If env vars are absent, all features remain completely inactive with zero overhead.
 */

declare global {
  interface Window {
    Sentry?: {
      init: (options: Record<string, any>) => void;
      captureException: (error: unknown, context?: Record<string, any>) => void;
      captureMessage: (msg: string) => void;
    };
    va?: (action: string, options: Record<string, any>) => void;
    plausible?: (eventName: string, options?: { props?: Record<string, any> }) => void;
  }
}

export function initMonitoring(): void {
  if (typeof window === 'undefined') return;

  // 1. Optional Sentry Error Reporting
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  if (sentryDsn && typeof sentryDsn === 'string' && sentryDsn.trim() !== '') {
    try {
      const script = document.createElement('script');
      script.src = 'https://browser.sentry-cdn.com/8.0.0/bundle.min.js';
      script.crossOrigin = 'anonymous';
      script.async = true;
      script.onload = () => {
        if (window.Sentry) {
          window.Sentry.init({
            dsn: sentryDsn.trim(),
            tracesSampleRate: 0.1,
            replaysSessionSampleRate: 0.0,
            replaysOnErrorSampleRate: 0.0,
          });
        }
      };
      document.head.appendChild(script);
    } catch (err) {
      console.warn('Failed to load Sentry SDK:', err);
    }
  }

  // 2. Optional Vercel Web Analytics
  const vercelAnalytics = import.meta.env.VITE_VERCEL_ANALYTICS === 'true' || Boolean(import.meta.env.VITE_VERCEL_ANALYTICS_ID);
  if (vercelAnalytics) {
    try {
      const script = document.createElement('script');
      script.src = '/_vercel/insights/script.js';
      script.defer = true;
      document.head.appendChild(script);
    } catch (err) {
      console.warn('Failed to load Vercel Analytics script:', err);
    }
  }

  // 3. Optional Plausible Analytics
  const plausibleDomain = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
  if (plausibleDomain && typeof plausibleDomain === 'string' && plausibleDomain.trim() !== '') {
    try {
      const script = document.createElement('script');
      const plausibleHost = (import.meta.env.VITE_PLAUSIBLE_API_HOST as string) || 'https://plausible.io';
      script.src = `${plausibleHost.replace(/\/+$/, '')}/js/script.js`;
      script.defer = true;
      script.setAttribute('data-domain', plausibleDomain.trim());
      document.head.appendChild(script);
    } catch (err) {
      console.warn('Failed to load Plausible script:', err);
    }
  }
}

export function captureException(error: unknown, context?: Record<string, any>): void {
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.captureException(error, { extra: context });
  }
}

export function trackAnalyticsEvent(eventName: string, props?: Record<string, any>): void {
  if (typeof window === 'undefined') return;

  if (window.plausible) {
    window.plausible(eventName, { props });
  }
  if (window.va) {
    window.va('event', { name: eventName, data: props });
  }
}
