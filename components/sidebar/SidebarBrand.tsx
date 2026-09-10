import React, { useState, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { SidebarThemeStyles } from './types';
import { useMasterDataContext } from '../../context/MasterDataContext';
import { BRAND_CONFIG } from '../../config/brand';

interface SidebarBrandProps {
  isCollapsed: boolean;
  themeClasses: SidebarThemeStyles;
  onLogoTrigger?: () => void;
}

export const SidebarBrand: React.FC<SidebarBrandProps> = ({
  isCollapsed,
  themeClasses,
  onLogoTrigger
}) => {
  const { masterOptions } = useMasterDataContext();
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  // Brand Name & Subtitle derived dynamically from masterOptions or BRAND_CONFIG
  const brandName = useMemo(() => {
    const sysNameOpt = masterOptions.find(o => 
      (o.type === 'WORK_CONFIG' || o.type === 'SYSTEM_CONFIG' || o.type === 'BRAND_CONFIG') &&
      (o.key === 'SYSTEM_NAME' || o.key === 'APP_NAME' || o.key === 'BRAND_NAME' || o.key === 'COMPANY_NAME')
    ) || masterOptions.find(o => o.key === 'SYSTEM_NAME' || o.key === 'APP_NAME' || o.key === 'BRAND_NAME');
    
    return sysNameOpt?.label || BRAND_CONFIG.name || 'Kontent OS';
  }, [masterOptions]);

  const { mainPart, subPart } = useMemo(() => {
    const trimmed = brandName.trim();
    const parts = trimmed.split(/\s+/);
    if (parts.length > 1) {
      return {
        mainPart: parts.slice(0, -1).join(' '),
        subPart: parts[parts.length - 1]
      };
    }
    return {
      mainPart: trimmed,
      subPart: ''
    };
  }, [brandName]);

  const handleLogoClick = () => {
    const now = Date.now();
    if (now - lastClickTime > 2000) {
      setClickCount(1);
      setLastClickTime(now);
    } else {
      const newCount = clickCount + 1;
      setClickCount(newCount);
      if (newCount === 5) {
        setClickCount(0);
        onLogoTrigger?.();
      }
    }
  };

  return (
    <div 
      onClick={handleLogoClick} 
      className={`flex items-center bg-gradient-to-b ${themeClasses.logoArea} overflow-hidden cursor-pointer select-none ${
        isCollapsed ? 'px-5 py-8 justify-center' : 'px-8 py-8'
      }`}
    >
      <motion.div 
        initial={{ rotate: -10, scale: 0.9, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`
          ${themeClasses.iconBg} rounded-2xl flex items-center justify-center shrink-0 sidebar-icon relative overflow-hidden group transition-all duration-300
          ${isCollapsed ? 'w-12 h-12' : 'w-12 h-12 mr-4'}
        `}
      >
        <Sparkles className="w-7 h-7 stroke-[2.5px] relative z-10 transition-transform duration-300 group-hover:scale-110" />
        <motion.div 
          animate={{ 
            x: ['-100%', '200%'],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            repeatDelay: 3,
            ease: "linear" 
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
        />
      </motion.div>
      
      {!isCollapsed && (
        <div className="sidebar-item-text overflow-hidden">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.05, delayChildren: 0.1 }
              }
            }}
            className="flex items-center flex-wrap"
          >
            {mainPart.split('').map((char, i) => (
              <motion.span
                key={`${char}-${i}`}
                variants={{
                  hidden: { opacity: 0, y: 5 },
                  visible: { opacity: 1, y: 0 }
                }}
                className={`text-xl font-bold ${themeClasses.text} tracking-tight leading-none font-inter drop-shadow-sm`}
              >
                {char === ' ' ? '\u00A0' : char}
              </motion.span>
            ))}
          </motion.div>
          
          {subPart ? (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="flex items-center gap-1.5 mt-1"
            >
              <div className={`h-[2px] w-4 ${themeClasses.brandAccentBg} rounded-full`} />
              <p className={`text-[10px] font-bold ${themeClasses.brandAccentText} tracking-[0.3em] uppercase font-inter`}>{subPart}</p>
              <div className={`h-[2px] flex-1 bg-gradient-to-r ${themeClasses.brandAccentGradient} to-transparent rounded-full`} />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="flex items-center gap-1.5 mt-1"
            >
              <div className={`h-[2px] flex-1 bg-gradient-to-r ${themeClasses.brandAccentGradient} to-transparent rounded-full`} />
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};
