import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Hero from './Hero';
import Features from './Features';
import Pricing from './Pricing';
import Footer from './Footer';
import FAQSection from './FAQSection';
import UpdatesSection from './UpdatesSection';
import LegalSection from './LegalSection';
import ContactModal from './ContactModal';
import CreatorSkyBackground, { CreatorBgStage } from './CreatorSkyBackground';
import { getLandingSettings, LandingSettings, MOCKUP_SETTINGS } from '../../services/landingService';
import { setDemoIntentFlag } from '../../context/DemoSandboxContext';

interface LandingPageProps {
  onGoToLogin: () => void;
  onStartDemo?: () => void;
  isZoomingOut?: boolean;
}

export type LandingView = 'HOME' | 'FEATURES' | 'PRICING' | 'FAQS' | 'UPDATES' | 'PRIVACY' | 'TERMS';

const HOME_SCROLL_VIEWS: LandingView[] = ['HOME', 'FEATURES', 'PRICING', 'FAQS'];

const LandingPage: React.FC<LandingPageProps> = ({
  onGoToLogin,
  onStartDemo,
  isZoomingOut = false,
}) => {
  const [currentView, setCurrentView] = useState<LandingView>('HOME');
  const [homeScrollStage, setHomeScrollStage] = useState<'HERO' | 'FEATURES' | 'PRICING' | 'FAQS'>('HERO');
  const [settings, setSettings] = useState<LandingSettings>(MOCKUP_SETTINGS);
  const [isContactOpen, setIsContactOpen] = useState(false);

  const heroSectionRef = useRef<HTMLDivElement | null>(null);
  const featuresSectionRef = useRef<HTMLDivElement | null>(null);
  const pricingSectionRef = useRef<HTMLDivElement | null>(null);
  const faqsSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await getLandingSettings();
      setSettings(data);
    };
    fetchSettings();
  }, []);

  const scrollToSection = useCallback((target: LandingView) => {
    const refMap: Partial<Record<LandingView, React.RefObject<HTMLDivElement | null>>> = {
      HOME: heroSectionRef,
      FEATURES: featuresSectionRef,
      PRICING: pricingSectionRef,
      FAQS: faqsSectionRef,
    };

    if (target === 'HOME') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const sectionEl = refMap[target]?.current;
    if (sectionEl) {
      const navOffset = 84;
      const top = sectionEl.getBoundingClientRect().top + window.scrollY - navOffset;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
  }, []);

  // Real-time Scroll Spy when browsing unified HOME view
  useEffect(() => {
    if (currentView !== 'HOME') return;

    let ticking = false;
    const evaluateScrollStage = () => {
      const triggerLine = window.innerHeight * 0.45;
      const faqsEl = faqsSectionRef.current;
      const pricingEl = pricingSectionRef.current;
      const featuresEl = featuresSectionRef.current;

      if (faqsEl && faqsEl.getBoundingClientRect().top <= triggerLine) {
        setHomeScrollStage((prev) => (prev !== 'FAQS' ? 'FAQS' : prev));
        ticking = false;
        return;
      }

      if (pricingEl && pricingEl.getBoundingClientRect().top <= triggerLine) {
        setHomeScrollStage((prev) => (prev !== 'PRICING' ? 'PRICING' : prev));
        ticking = false;
        return;
      }

      if (featuresEl && featuresEl.getBoundingClientRect().top <= triggerLine) {
        setHomeScrollStage((prev) => (prev !== 'FEATURES' ? 'FEATURES' : prev));
        ticking = false;
        return;
      }

      setHomeScrollStage((prev) => (prev !== 'HERO' ? 'HERO' : prev));
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(evaluateScrollStage);
      }
    };

    evaluateScrollStage();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [currentView]);

  const effectiveBgStage: CreatorBgStage =
    currentView === 'HOME'
      ? homeScrollStage
      : currentView === 'FEATURES'
      ? 'FEATURES'
      : currentView === 'PRICING'
      ? 'PRICING'
      : currentView === 'FAQS'
      ? 'FAQS'
      : currentView === 'UPDATES'
      ? 'UPDATES'
      : 'LEGAL';

  const activeNavSection: LandingView =
    currentView !== 'HOME'
      ? currentView
      : homeScrollStage === 'HERO'
      ? 'HOME'
      : homeScrollStage;

  const handleStartFreeTrial = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('juijui_trial_signup_intent', '1');
    }
    setDemoIntentFlag(false);
    onGoToLogin();
  };

  const handleNavigate = (path: string) => {
    if (!path || path === '#') return;

    const normalizedPath = path.toUpperCase();

    if (normalizedPath === 'CONTACT' || normalizedPath.includes('CONTACT')) {
      setIsContactOpen(true);
      return;
    }

    const validViews: LandingView[] = ['HOME', 'FEATURES', 'PRICING', 'FAQS', 'UPDATES', 'PRIVACY', 'TERMS'];
    if (validViews.includes(normalizedPath as LandingView)) {
      const nextView = normalizedPath as LandingView;

      // Unified Single-Page Smooth Scroll for HOME, FEATURES, PRICING, FAQS
      if (HOME_SCROLL_VIEWS.includes(nextView)) {
        const targetStage = nextView === 'HOME' ? 'HERO' : (nextView as 'FEATURES' | 'PRICING' | 'FAQS');
        setHomeScrollStage(targetStage);

        if (currentView !== 'HOME') {
          setCurrentView('HOME');
          setTimeout(() => {
            scrollToSection(nextView);
          }, 80);
        } else {
          scrollToSection(nextView);
        }
        return;
      }

      setCurrentView(nextView);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-clip bg-transparent text-slate-900 font-google-sans selection:bg-purple-100 selection:text-purple-700">
      {/* Synchronized Multi-Stage Morphing & Scroll Parallax Background */}
      <CreatorSkyBackground activeStage={effectiveBgStage} isZoomingOut={isZoomingOut} />

      <AnimatePresence>
        {isContactOpen && (
          <ContactModal
            onClose={() => setIsContactOpen(false)}
            contactInfo={settings.contact}
          />
        )}
      </AnimatePresence>

      <motion.div
        animate={
          isZoomingOut
            ? { opacity: 0, y: -16, scale: 1.04 }
            : { opacity: 1, y: 0, scale: 1 }
        }
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] as const }}
        className="relative z-40"
      >
        <Navbar
          currentView={currentView}
          activeSection={activeNavSection}
          onNavigate={handleNavigate}
          onLogin={() => {
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('juijui_trial_signup_intent');
            }
            onGoToLogin();
          }}
          onStartDemo={onStartDemo || onGoToLogin}
        />
      </motion.div>

      <main className="relative z-10">
        {currentView === 'HOME' ? (
          <div>
            <div id="hero" ref={heroSectionRef}>
              <Hero
                onStart={() => {
                  if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('juijui_trial_signup_intent');
                  }
                  onGoToLogin();
                }}
                onStartDemo={onStartDemo || onGoToLogin}
                onStartFreeTrial={handleStartFreeTrial}
                onSeeFeatures={() => handleNavigate('FEATURES')}
                videoConfig={settings?.hero_video}
                isZoomingOut={isZoomingOut}
              />
            </div>

            <motion.div
              animate={
                isZoomingOut
                  ? { scale: 1.08, y: -20, opacity: 0, filter: 'blur(5px)' }
                  : { scale: 1, y: 0, opacity: 1, filter: 'blur(0px)' }
              }
              transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1] as const }}
            >
              <div id="features" ref={featuresSectionRef} className="scroll-mt-24">
                <Features />
              </div>

              <div id="pricing" ref={pricingSectionRef} className="scroll-mt-24">
                <Pricing
                  onContact={() => handleNavigate('CONTACT')}
                  onStartFreeTrial={handleStartFreeTrial}
                  plans={settings.pricing}
                />
              </div>

              <div id="faqs" ref={faqsSectionRef} className="scroll-mt-24">
                <FAQSection faqs={settings.faqs} />
              </div>
            </motion.div>
          </div>
        ) : (
          <motion.div
            animate={
              isZoomingOut
                ? { scale: 1.08, y: -20, opacity: 0, filter: 'blur(5px)' }
                : { scale: 1, y: 0, opacity: 1, filter: 'blur(0px)' }
            }
            transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1] as const }}
            className="pt-24"
          >
            {currentView === 'UPDATES' && <UpdatesSection updates={settings.updates} />}
            {(currentView === 'PRIVACY' || currentView === 'TERMS') && (
              <LegalSection type={currentView} />
            )}
          </motion.div>
        )}
      </main>

      <Footer
        socialLinks={settings?.social_links}
        categories={settings?.footer_categories}
        onNavigate={handleNavigate}
      />
    </div>
  );
};

export default LandingPage;
