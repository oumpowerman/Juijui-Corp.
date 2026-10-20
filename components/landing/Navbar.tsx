
import React from 'react';
import { motion } from 'framer-motion';
import { LandingView } from './LandingPage';
import { Sparkles } from 'lucide-react';
import { BRAND_CONFIG } from '../../config/brand.ts';

interface NavbarProps {
  currentView: LandingView;
  onNavigate: (view: LandingView) => void;
  onLogin: () => void;
  onStartDemo?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onLogin, onStartDemo }) => {
  return (
    <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-purple-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => onNavigate('HOME')}
        >
          <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200 group-hover:rotate-6 transition-transform">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 tracking-tight">
            {BRAND_CONFIG.name}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
          <button 
            onClick={() => onNavigate('HOME')}
            className={`hover:text-purple-600 transition-colors ${currentView === 'HOME' ? 'text-purple-600' : ''}`}
          >
            หน้าหลัก
          </button>
          <button 
            onClick={() => onNavigate('FEATURES')}
            className={`hover:text-purple-600 transition-colors ${currentView === 'FEATURES' ? 'text-purple-600' : ''}`}
          >
            ฟีเจอร์
          </button>
          <button 
            onClick={() => onNavigate('PRICING')}
            className={`hover:text-purple-600 transition-colors ${currentView === 'PRICING' ? 'text-purple-600' : ''}`}
          >
            ราคา
          </button>
          <button 
            onClick={() => onNavigate('CONTACT' as LandingView)}
            className="hover:text-purple-600 transition-colors"
          >
            ติดต่อเรา
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={onLogin}
            className="text-sm font-bold text-slate-700 hover:text-purple-600 px-3 py-2 whitespace-nowrap"
          >
            เข้าสู่ระบบ
          </button>
          <button 
            onClick={onStartDemo || onLogin}
            className="hidden sm:flex items-center gap-1.5 text-sm font-bold bg-purple-600 text-white px-5 py-2.5 rounded-full hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-100 transition-all active:scale-95 whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            <span>ทดลองเล่นฟรี 10 นาที</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
