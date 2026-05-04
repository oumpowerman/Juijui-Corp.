
import React, { useState, useEffect } from 'react';
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
import { getLandingSettings, LandingSettings, MOCKUP_SETTINGS } from '../../services/landingService';

interface LandingPageProps {
  onGoToLogin: () => void;
}

export type LandingView = 'HOME' | 'FEATURES' | 'PRICING' | 'FAQS' | 'UPDATES' | 'PRIVACY' | 'TERMS';

const LandingPage: React.FC<LandingPageProps> = ({ onGoToLogin }) => {
  const [currentView, setCurrentView] = useState<LandingView>('HOME');
  const [settings, setSettings] = useState<LandingSettings>(MOCKUP_SETTINGS);
  const [isContactOpen, setIsContactOpen] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await getLandingSettings();
      setSettings(data);
    };
    fetchSettings();
  }, []);

  const handleNavigate = (path: string) => {
    if (!path || path === '#') return;
    
    const normalizedPath = path.toUpperCase();
    
    // Check for contact keyword or exact match
    if (normalizedPath === 'CONTACT' || normalizedPath.includes('CONTACT')) {
      setIsContactOpen(true);
      return;
    }

    const validViews: LandingView[] = ['HOME', 'FEATURES', 'PRICING', 'FAQS', 'UPDATES', 'PRIVACY', 'TERMS'];
    if (validViews.includes(normalizedPath as LandingView)) {
      setCurrentView(normalizedPath as LandingView);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFE] text-slate-900 font-sans selection:bg-purple-100 selection:text-purple-600">
      <AnimatePresence>
        {isContactOpen && (
          <ContactModal 
            onClose={() => setIsContactOpen(false)}
            contactInfo={settings.contact}
          />
        )}
      </AnimatePresence>

      <Navbar 
        currentView={currentView} 
        onNavigate={handleNavigate} 
        onLogin={onGoToLogin} 
      />

      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {currentView === 'HOME' && (
              <Hero 
                onStart={onGoToLogin} 
                onSeeFeatures={() => setCurrentView('FEATURES')} 
                videoConfig={settings?.hero_video}
              />
            )}
            {currentView === 'FEATURES' && <Features />}
            {currentView === 'PRICING' && (
              <Pricing 
                onContact={() => handleNavigate('CONTACT')} 
                plans={settings.pricing}
              />
            )}
            {currentView === 'FAQS' && <FAQSection faqs={settings.faqs} />}
            {currentView === 'UPDATES' && <UpdatesSection updates={settings.updates} />}
            {(currentView === 'PRIVACY' || currentView === 'TERMS') && (
               <LegalSection type={currentView} />
            )}
          </motion.div>
        </AnimatePresence>
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
