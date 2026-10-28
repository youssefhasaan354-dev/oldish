import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { VisualEditProvider } from './context/VisualEditContext';
import { useDynamicSeo } from './lib/seo';

// Error Boundary
import { ErrorBoundary } from './components/ErrorBoundary';

// Public Landing Components
import { AnnouncementBanner } from './components/AnnouncementBanner';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { StorySection } from './components/StorySection';
import { MenuSection } from './components/MenuSection';
import { AtmosphereSection } from './components/AtmosphereSection';
import { GallerySection } from './components/GallerySection';
import { InstagramStripSection } from './components/InstagramStripSection';
import { ReviewsSection } from './components/ReviewsSection';
import { ReservationSection } from './components/ReservationSection';
import { LocationContactSection } from './components/LocationContactSection';
import { Footer } from './components/Footer';
import { FloatingActions } from './components/FloatingActions';
import { FloatingQuickButtons } from './components/FloatingQuickButtons';

// Public Standalone Menu Page (Direct import to eliminate dynamic chunk round-trip on /menu)
import { PublicMenuPage } from './pages/PublicMenuPage';

// Lazy-loaded Admin Pages & 404
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

// Lazy-loaded Visual Edit Overlays (strictly not loaded for anonymous visitors)
const VisualImageEditToolbar = lazy(() => import('./components/VisualImageEditToolbar').then(m => ({ default: m.VisualImageEditToolbar })));
const VisualSlotEditorModal = lazy(() => import('./components/VisualSlotEditorModal').then(m => ({ default: m.VisualSlotEditorModal })));

// Public Styles Only (admin.css is loaded inside AdminLayout/AdminLoginPage)
import './App.css';

// Public Landing Page Component
const PublicLandingPage: React.FC = () => {
  const { siteSettings } = useData();
  const { isAuthenticated } = useAuth();
  useDynamicSeo(siteSettings);
  const [activeSection, setActiveSection] = useState<string>('hero');

  useEffect(() => {
    const sections = ['hero', 'story', 'atmosphere', 'menu', 'gallery', 'reviews', 'reservations', 'locations'];
    
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll reveal animation observer (IntersectionObserver, CSS only transitions)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.reveal-on-scroll').forEach(el => el.classList.add('is-revealed'));
      return;
    }

    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    if (!revealElements.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });

    revealElements.forEach(el => observer.observe(el));

    // Fallback safety net (~2.5s after mount) to guarantee no tall section stays hidden
    const fallbackTimer = window.setTimeout(() => {
      document.querySelectorAll('.reveal-on-scroll:not(.is-revealed)').forEach(el => {
        el.classList.add('is-revealed');
      });
    }, 2500);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <div className="site-wrapper">
      <AnnouncementBanner />
      <Header activeSection={activeSection} />
      <main id="main-content">
        <Hero />
        <div className="reveal-on-scroll"><StorySection /></div>
        <div className="reveal-on-scroll"><AtmosphereSection /></div>
        <MenuSection />
        <div className="reveal-on-scroll"><GallerySection /></div>
        {siteSettings.instagram_strip_enabled && <div className="reveal-on-scroll"><InstagramStripSection /></div>}
        <div className="reveal-on-scroll"><ReviewsSection /></div>
        <div className="reveal-on-scroll"><ReservationSection /></div>
        <div className="reveal-on-scroll"><LocationContactSection /></div>
      </main>
      <Footer />
      <FloatingActions />
      <FloatingQuickButtons />
      {isAuthenticated && (
        <Suspense fallback={null}>
          <VisualImageEditToolbar />
          <VisualSlotEditorModal />
        </Suspense>
      )}
    </div>
  );
};

// Protected Admin Route Handler
const ProtectedAdminRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F8F9FA' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.75rem', color: '#886E42', fontWeight: 700, marginBottom: '8px' }}>
            Oldish
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>
            جاري التحميل...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLoginPage />;
  }

  return <AdminLayout />;
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <DataProvider>
              <VisualEditProvider>
                <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#886E42' }}>جاري التحميل...</div>}>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<PublicLandingPage />} />
                    <Route path="/menu" element={<PublicMenuPage />} />

                    {/* Admin Routes */}
                    <Route path="/admin/login" element={<AdminLoginPage />} />
                    <Route path="/admin/*" element={<ProtectedAdminRoute />} />

                    {/* Custom 404 Page (Part B Robustness) */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </VisualEditProvider>
            </DataProvider>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
