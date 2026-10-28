import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Hero from './Hero';
import Features from './Features';
import Pricing from './Pricing';
import CustomModuleBuilderView from './CustomModuleBuilderView';
import Footer from './Footer';
import FAQSection from './FAQSection';
import UpdatesSection from './UpdatesSection';
import LegalSection from './LegalSection';
import ContactModal from './ContactModal';
import FastCheckoutOnboardingModal, {
  type FastCheckoutOrderPayload,
} from './FastCheckoutOnboardingModal';
import CreatorSkyBackground, { CreatorBgStage } from './CreatorSkyBackground';
import {
  SweetWarpCurtainTransition,
  type SweetCurtainPhase,
  type SweetCurtainDirection,
} from './SweetWarpCurtainTransition';
import { getLandingSettings, LandingSettings, MOCKUP_SETTINGS } from '../../services/landingService';
import {
  getPlatformLandingConfig,
  PlatformLandingConfig,
  DEFAULT_PLATFORM_LANDING_CONFIG,
} from '../../services/landingConfigService';
import { setDemoIntentFlag } from '../../context/DemoSandboxContext';

interface LandingPageProps {
  onGoToLogin: () => void;
  onStartDemo?: () => void;
  isZoomingOut?: boolean;
}

export type LandingView =
  | 'HOME'
  | 'FEATURES'
  | 'PRICING'
  | 'CUSTOM_BUILDER'
  | 'FAQS'
  | 'UPDATES'
  | 'PRIVACY'
  | 'TERMS';

const HOME_SCROLL_VIEWS: LandingView[] = ['HOME', 'FEATURES', 'PRICING', 'FAQS'];

const LandingPage: React.FC<LandingPageProps> = ({
  onGoToLogin,
  onStartDemo,
  isZoomingOut = false,
}) => {
  const [currentView, setCurrentView] = useState<LandingView>('HOME');
  const [homeScrollStage, setHomeScrollStage] = useState<'HERO' | 'FEATURES' | 'PRICING' | 'FAQS'>('HERO');
  const [settings, setSettings] = useState<LandingSettings>(MOCKUP_SETTINGS);
  const [platformConfig, setPlatformConfig] = useState<PlatformLandingConfig>(DEFAULT_PLATFORM_LANDING_CONFIG);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [fastCheckoutOrder, setFastCheckoutOrder] = useState<FastCheckoutOrderPayload | null>(null);

  // --- HYBRID SWEET CLOUD CURTAIN & FALLING DESSERT TRANSITION STATE ---
  const [sweetCurtainPhase, setSweetCurtainPhase] = useState<SweetCurtainPhase>('IDLE');
  const [sweetCurtainDirection, setSweetCurtainDirection] =
    useState<SweetCurtainDirection>('TO_SWEET_LAND');

  const isManualNavigatingRef = useRef(false);
  const manualNavTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swapSceneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishCurtainTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const heroSectionRef = useRef<HTMLDivElement | null>(null);
  const featuresSectionRef = useRef<HTMLDivElement | null>(null);
  const pricingSectionRef = useRef<HTMLDivElement | null>(null);
  const faqsSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await getLandingSettings();
      setSettings(data);
    };

    const fetchPlatformConfig = async () => {
      try {
        const pData = await getPlatformLandingConfig();
        setPlatformConfig(pData);
      } catch (err) {
        console.warn('Fallback to default platform landing config:', err);
      }
    };

    fetchSettings();
    fetchPlatformConfig();
  }, []);

  useEffect(() => {
    return () => {
      if (manualNavTimerRef.current) clearTimeout(manualNavTimerRef.current);
      if (swapSceneTimerRef.current) clearTimeout(swapSceneTimerRef.current);
      if (finishCurtainTimerRef.current) clearTimeout(finishCurtainTimerRef.current);
    };
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
      if (isManualNavigatingRef.current) {
        ticking = false;
        return;
      }

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
      : currentView === 'PRICING' || currentView === 'CUSTOM_BUILDER'
      ? 'PRICING'
      : currentView === 'FAQS'
      ? 'FAQS'
      : currentView === 'UPDATES'
      ? 'UPDATES'
      : 'LEGAL';

  const activeNavSection: LandingView =
    currentView === 'CUSTOM_BUILDER'
      ? 'PRICING'
      : currentView !== 'HOME'
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

  /**
   * 2-Stage Hybrid Cloud Curtain + Falling Desserts Transition (Main Land -> Sweet Land)
   * Mirrors SkyCloudCurtainTransition in App.tsx
   */
  const triggerWarpToSweetLand = useCallback(() => {
    if (sweetCurtainPhase !== 'IDLE') return;

    setSweetCurtainDirection('TO_SWEET_LAND');
    setSweetCurtainPhase('COVERING');

    if (swapSceneTimerRef.current) clearTimeout(swapSceneTimerRef.current);
    if (finishCurtainTimerRef.current) clearTimeout(finishCurtainTimerRef.current);

    // Stage 2 (500ms): Swap scene while 3D Cotton Candy Clouds & Falling Desserts blanket the viewport
    swapSceneTimerRef.current = setTimeout(() => {
      setCurrentView('CUSTOM_BUILDER');
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      setSweetCurtainPhase('PARTING');
    }, 500);

    // Stage 3 (1140ms): Reset curtain to IDLE after clouds & desserts finish parting
    finishCurtainTimerRef.current = setTimeout(() => {
      setSweetCurtainPhase('IDLE');
    }, 1140);
  }, [sweetCurtainPhase]);

  /**
   * 2-Stage Hybrid Cloud Curtain + Falling Desserts Transition (Sweet Land -> Main Land)
   */
  const triggerWarpBackToMainLand = useCallback(() => {
    if (sweetCurtainPhase !== 'IDLE') return;

    setSweetCurtainDirection('TO_MAIN_LAND');
    setSweetCurtainPhase('COVERING');

    if (swapSceneTimerRef.current) clearTimeout(swapSceneTimerRef.current);
    if (finishCurtainTimerRef.current) clearTimeout(finishCurtainTimerRef.current);

    // Stage 2 (500ms): Swap back to Main Land and jump directly to #pricing behind the curtain
    swapSceneTimerRef.current = setTimeout(() => {
      setCurrentView('HOME');
      setHomeScrollStage('PRICING');
      isManualNavigatingRef.current = true;
      if (manualNavTimerRef.current) clearTimeout(manualNavTimerRef.current);
      manualNavTimerRef.current = setTimeout(() => {
        isManualNavigatingRef.current = false;
      }, 900);

      setTimeout(() => {
        const pricingEl = pricingSectionRef.current;
        if (pricingEl) {
          const top = pricingEl.getBoundingClientRect().top + window.scrollY - 84;
          window.scrollTo({ top: Math.max(0, top), behavior: 'instant' as ScrollBehavior });
        }
      }, 30);

      setSweetCurtainPhase('PARTING');
    }, 500);

    // Stage 3 (1140ms): Reset curtain to IDLE
    finishCurtainTimerRef.current = setTimeout(() => {
      setSweetCurtainPhase('IDLE');
    }, 1140);
  }, [sweetCurtainPhase]);

  const handleNavigate = (path: string) => {
    if (!path || path === '#') return;

    const normalizedPath = path.toUpperCase();

    if (normalizedPath === 'CONTACT' || normalizedPath.includes('CONTACT')) {
      setIsContactOpen(true);
      return;
    }

    if (normalizedPath === 'CUSTOM_BUILDER') {
      triggerWarpToSweetLand();
      return;
    }

    const validViews: LandingView[] = [
      'HOME',
      'FEATURES',
      'PRICING',
      'CUSTOM_BUILDER',
      'FAQS',
      'UPDATES',
      'PRIVACY',
      'TERMS',
    ];
    if (validViews.includes(normalizedPath as LandingView)) {
      const nextView = normalizedPath as LandingView;

      if (HOME_SCROLL_VIEWS.includes(nextView)) {
        const targetStage = nextView === 'HOME' ? 'HERO' : (nextView as 'FEATURES' | 'PRICING' | 'FAQS');
        setHomeScrollStage(targetStage);

        isManualNavigatingRef.current = true;
        if (manualNavTimerRef.current) clearTimeout(manualNavTimerRef.current);
        manualNavTimerRef.current = setTimeout(() => {
          isManualNavigatingRef.current = false;
        }, 800);

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

  const isSweetLand = currentView === 'CUSTOM_BUILDER';
  const effectiveZoomOut = isZoomingOut || sweetCurtainPhase === 'COVERING';

  return (
    <div className="relative min-h-screen w-full overflow-x-clip bg-transparent text-slate-900 font-google-sans selection:bg-purple-100 selection:text-purple-700 scrollbar-hide touch-pan-y landing-mobile-no-scroll">
      {/* Mobile-only Scrollbar Elimination with Full Native Touch Scroll Preservation */}
      <style>{`
        @media (max-width: 640px) {
          html, body {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
            -webkit-overflow-scrolling: touch !important;
            touch-action: pan-y !important;
          }
          html::-webkit-scrollbar, body::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          .landing-mobile-no-scroll,
          .landing-mobile-no-scroll * {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          .landing-mobile-no-scroll::-webkit-scrollbar,
          .landing-mobile-no-scroll *::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
        }
      `}</style>

      {/* Hybrid 3D Cotton Candy Cloud Curtain & Falling Sweet Dessert Cascade Transition */}
      <SweetWarpCurtainTransition
        phase={sweetCurtainPhase}
        direction={sweetCurtainDirection}
      />

      {/* Contact Modal works across both worlds */}
      <AnimatePresence>
        {isContactOpen && (
          <ContactModal
            onClose={() => setIsContactOpen(false)}
            contactInfo={settings.contact}
          />
        )}
      </AnimatePresence>

      {/* 2-Step Fast Checkout & Instant Workspace Provisioning Modal */}
      <AnimatePresence>
        {fastCheckoutOrder && (
          <FastCheckoutOnboardingModal
            key="fast-checkout-onboarding-modal"
            order={fastCheckoutOrder}
            billingConfig={platformConfig?.billing_payment_config}
            onClose={() => setFastCheckoutOrder(null)}
            onCompletedEnterApp={() => setFastCheckoutOrder(null)}
          />
        )}
      </AnimatePresence>

      {/* STANDALONE WORLD 2: SWEET PATISSERIE LAND (Hides Main Sky, Navbar & Footer completely) */}
      {isSweetLand ? (
        <motion.div
          key="sweet-patisserie-world"
          animate={
            effectiveZoomOut
              ? { scale: 1.07, y: -16, opacity: 0, filter: 'blur(5px)' }
              : { scale: 1, y: 0, opacity: 1, filter: 'blur(0px)' }
          }
          transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <CustomModuleBuilderView
            config={platformConfig?.custom_module_config}
            pricingPlans={platformConfig?.pricing_plans}
            onBack={triggerWarpBackToMainLand}
            onStartWithRecipe={handleStartFreeTrial}
            onOpenFastCheckout={setFastCheckoutOrder}
            onContact={() => setIsContactOpen(true)}
          />
        </motion.div>
      ) : (
        /* WORLD 1: MAIN CREATOR SKY LANDING PAGE */
        <>
          <CreatorSkyBackground activeStage={effectiveBgStage} isZoomingOut={effectiveZoomOut} />

          <motion.div
            animate={
              effectiveZoomOut
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
                    videoConfig={platformConfig?.hero_video || settings?.hero_video}
                    isZoomingOut={effectiveZoomOut}
                  />
                </div>

                <motion.div
                  animate={
                    effectiveZoomOut
                      ? { scale: 1.08, y: -20, opacity: 0, filter: 'blur(5px)' }
                      : { scale: 1, y: 0, opacity: 1, filter: 'blur(0px)' }
                  }
                  transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1] as const }}
                >
                  <div id="features" ref={featuresSectionRef} className="scroll-mt-24">
                    <Features featureVideos={platformConfig?.feature_videos} />
                  </div>

                  <div id="pricing" ref={pricingSectionRef} className="scroll-mt-24">
                    <Pricing
                      onContact={() => handleNavigate('CONTACT')}
                      onStartFreeTrial={handleStartFreeTrial}
                      onOpenFastCheckout={setFastCheckoutOrder}
                      onOpenCustomBuilder={triggerWarpToSweetLand}
                      plans={platformConfig?.pricing_plans}
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
                  effectiveZoomOut
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
        </>
      )}
    </div>
  );
};

export default LandingPage;
