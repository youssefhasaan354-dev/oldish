import { useEffect } from 'react';
import type { SiteSettings } from '../types';

/**
 * Ensures strict noindex, nofollow meta tag is present (for /admin, /menu, or sales demo)
 */
export function useNoIndex() {
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'robots');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'noindex, nofollow');
  }, []);
}

/**
 * Dynamic SEO manager (Part C #7 & #8):
 * - Keeps noindex ON until owner switches it off
 * - When custom domain is set, updates canonical link & JSON-LD
 * - Dynamically updates favicon & apple-touch-icon from branding slots
 */
export function useDynamicSeo(settings: SiteSettings) {
  useEffect(() => {
    // 1. Robots meta handling
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    if (settings.noindex) {
      metaRobots.setAttribute('content', 'noindex, nofollow');
    } else {
      metaRobots.setAttribute('content', 'index, follow');
    }

    // 2. Canonical URL handling
    if (settings.site_domain && !settings.noindex) {
      const cleanDomain = settings.site_domain.startsWith('http') 
        ? settings.site_domain 
        : `https://${settings.site_domain}`;
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', `${cleanDomain}/`);
    }

    // 3. Dynamic Favicon & Apple Touch Icon from branding slots
    const iconUrl = settings.favicon_url || settings.logo_url;
    if (iconUrl) {
      let iconLink = document.querySelector('link[rel="icon"]');
      if (iconLink) {
        iconLink.setAttribute('href', iconUrl);
      }
      let appleIconLink = document.querySelector('link[rel="apple-touch-icon"]');
      if (!appleIconLink) {
        appleIconLink = document.createElement('link');
        appleIconLink.setAttribute('rel', 'apple-touch-icon');
        document.head.appendChild(appleIconLink);
      }
      appleIconLink.setAttribute('href', iconUrl);
    }

    // 4. Dynamic Social Card (og:image & twitter:image)
    const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL) || 'https://oldish-chi.vercel.app';
    const rawSocial = settings.social_image_url || '/images/og-image.jpg';
    const absoluteSocialImg = rawSocial.startsWith('http') ? rawSocial : `${baseUrl}${rawSocial.startsWith('/') ? '' : '/'}${rawSocial}`;

    const ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg) ogImg.setAttribute('content', absoluteSocialImg);
    const twImg = document.querySelector('meta[name="twitter:image"]');
    if (twImg) twImg.setAttribute('content', absoluteSocialImg);

    // 5. Schema.org JSON-LD update
    let scriptTag = document.querySelector('script[type="application/ld+json"]');
    if (scriptTag) {
      const cleanDomain = settings.site_domain 
        ? (settings.site_domain.startsWith('http') ? settings.site_domain : `https://${settings.site_domain}`)
        : 'https://oldish-chi.vercel.app';

      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Restaurant",
        "name": settings.brand_name_en || "Oldish",
        "alternateName": settings.brand_name_ar || "أولديش",
        "description": "Restaurant · Café · Garden in Downtown Cairo. Flavors you'll never forget.",
        "url": cleanDomain,
        "telephone": "+201060119488",
        "servesCuisine": ["Egyptian", "Middle Eastern", "Mediterranean"],
        "priceRange": "EGP 200-400",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "20 Mohamed Mahmoud St, behind the Greek Campus (opposite AUC library)",
          "addressLocality": "Abdeen, Downtown Cairo",
          "addressRegion": "Cairo Governorate",
          "addressCountry": "EG"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 30.0444,
          "longitude": 31.2357
        },
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "08:00",
            "closes": "00:00"
          }
        ],
        "sameAs": [
          settings.facebook_url,
          settings.instagram_url,
          settings.google_maps_url
        ].filter(Boolean)
      };

      scriptTag.textContent = JSON.stringify(jsonLd, null, 2);
    }
  }, [settings]);
}
