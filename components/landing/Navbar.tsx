import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LandingView } from './LandingPage';
import { Sparkles, Play, LogIn, Menu, X } from 'lucide-react';
import { BRAND_CONFIG } from '../../config/brand.ts';

interface NavbarProps {
  currentView: LandingView;
  activeSection?: LandingView;
  onNavigate: (view: LandingView | 'CONTACT') => void;
  onLogin: () => void;
  onStartDemo?: () => void;
}

const NAV_ITEMS: { label: string; view: LandingView }[] = [
  { label: 'หน้าหลัก', view: 'HOME' },
  { label: 'ฟีเจอร์ครีเอเตอร์', view: 'FEATURES' },
  { label: 'แพ็กเกจราคา', view: 'PRICING' },
  { label: 'คำถามพบบ่อย', view: 'FAQS' },
];

const Navbar: React.FC<NavbarProps> = ({
  currentView,
  activeSection,
  onNavigate,
  onLogin,
  onStartDemo,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const highlightedView = activeSection || currentView;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 18);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (target: LandingView | 'CONTACT') => {
    setMobileMenuOpen(false);
    onNavigate(target);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-3 sm:pt-4 px-3 sm:px-6 pointer-events-none font-google-sans">
      <div className="max-w-7xl mx-auto">
        {/* Floating Pastel Rainbow Glass Capsule — blends seamlessly with CreatorSkyBackground */}
        <div
          className={`pointer-events-auto relative rounded-[1.6rem] sm:rounded-[1.85rem] px-3.5 sm:px-5 h-16 sm:h-[4.5rem] flex items-center justify-between gap-3 transition-all duration-300 ${
            isScrolled
              ? 'bg-white/82 backdrop-blur-2xl border border-white/95 shadow-[0_18px_42px_-12px_rgba(124,58,237,0.18),0_4px_16px_-4px_rgba(244,63,94,0.08),inset_0_1px_2px_rgba(255,255,255,1)]'
              : 'bg-white/58 hover:bg-white/72 backdrop-blur-2xl border border-white/85 shadow-[0_12px_34px_-10px_rgba(139,92,246,0.12),inset_0_1px_2px_rgba(255,255,255,0.95)]'
          }`}
        >
          {/* Delicate Top Prismatic Rainbow Shimmer Hairline */}
          <div
            aria-hidden="true"
            className="absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-rose-300/70 via-amber-200/70 via-sky-300/70 to-transparent pointer-events-none"
          />

          {/* Brand Identity */}
          <button
            type="button"
            onClick={() => handleNavClick('HOME')}
            className="flex items-center gap-3 cursor-pointer group text-left focus:outline-none shrink-0"
          >
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-rose-500 via-purple-500 to-indigo-500 p-[2px] shadow-[0_10px_25px_-5px_rgba(139,92,246,0.42)] group-hover:scale-105 group-hover:rotate-3 transition-transform">
              <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <span className="block text-lg sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-800 tracking-tight leading-none">
                {BRAND_CONFIG.name}
              </span>
              <span className="block text-[10px] sm:text-[11px] font-semibold text-slate-500 tracking-wide mt-0.5">
                Creator Studio OS
              </span>
            </div>
          </button>

          {/* Center Navigation Links — Pastel Glass Capsule Track */}
          <div className="hidden md:flex items-center gap-1 p-1.5 rounded-2xl bg-gradient-to-r from-rose-50/70 via-purple-50/75 to-sky-50/70 border border-purple-200/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8)]">
            {NAV_ITEMS.map((item) => {
              const isActive = highlightedView === item.view;
              return (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => handleNavClick(item.view)}
                  className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                    isActive
                      ? 'text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="navbar-active-pill"
                      transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                      className="absolute inset-0 rounded-xl bg-white border border-purple-200/80 shadow-[0_6px_18px_-4px_rgba(139,92,246,0.24),inset_0_1px_1px_rgba(255,255,255,1)]"
                    />
                  )}
                  <span className="relative z-10 inline-flex items-center gap-1.5">
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-rose-500 to-purple-600" />
                    )}
                    <span
                      className={
                        isActive
                          ? 'bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-500'
                          : ''
                      }
                    >
                      {item.label}
                    </span>
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => handleNavClick('CONTACT')}
              className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all cursor-pointer"
            >
              ติดต่อเรา
            </button>
          </div>

          {/* Right Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={onLogin}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-indigo-600 bg-white/85 hover:bg-white border border-purple-200/70 px-3.5 sm:px-4 py-2.5 rounded-2xl shadow-sm transition-all active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-indigo-500" />
              <span>เข้าสู่ระบบ</span>
            </button>

            <button
              type="button"
              onClick={onStartDemo || onLogin}
              className="hidden sm:inline-flex items-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-500 hover:from-indigo-500 hover:via-purple-500 hover:to-rose-500 px-5 py-2.5 rounded-2xl shadow-[0_12px_25px_-6px_rgba(139,92,246,0.48),inset_0_1px_1px_rgba(255,255,255,0.45)] hover:-translate-y-0.5 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>ทดลองเล่นฟรี 10 นาที</span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="เปิดเมนูนำทาง"
              className="md:hidden w-10 h-10 rounded-xl bg-white/85 border border-purple-200/70 flex items-center justify-center text-slate-700 hover:text-indigo-600 shadow-sm cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Glass Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] as const }}
              className="pointer-events-auto md:hidden mt-2 p-3 rounded-3xl bg-white/90 backdrop-blur-2xl border border-white shadow-[0_20px_45px_-12px_rgba(124,58,237,0.22)] flex flex-col gap-1.5"
            >
              {NAV_ITEMS.map((item) => {
                const isActive = highlightedView === item.view;
                return (
                  <button
                    key={item.view}
                    type="button"
                    onClick={() => handleNavClick(item.view)}
                    className={`w-full px-4 py-3 rounded-2xl text-left text-sm font-bold flex items-center justify-between transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-50 via-purple-50 to-rose-50 text-indigo-700 border border-purple-200/80'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-600 to-rose-500" />
                    )}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => handleNavClick('CONTACT')}
                className="w-full px-4 py-3 rounded-2xl text-left text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
              >
                ติดต่อเรา
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onStartDemo) onStartDemo();
                  else onLogin();
                }}
                className="mt-1 w-full py-3 px-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-500 shadow-md flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>ทดลองเล่นฟรี 10 นาที</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Navbar;
