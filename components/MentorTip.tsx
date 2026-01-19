
import React, { useState, useEffect } from 'react';
import { Lightbulb, X, Sparkles, ChevronRight, ChevronLeft, Info, Zap, Quote } from 'lucide-react';

interface MentorTipProps {
  messages?: string[];
  message?: string;
  className?: string;
  variant?: 'blue' | 'yellow' | 'purple' | 'green' | 'pink' | 'orange';
  autoPlayInterval?: number;
}

const MentorTip: React.FC<MentorTipProps> = ({ 
  messages = [], 
  message, 
  className = '', 
  variant = 'yellow',
  autoPlayInterval = 8000 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Combine props to ensure we have a list
  const tipList = messages.length > 0 ? messages : (message ? [message] : []);

  useEffect(() => {
    if (!isVisible || isPaused || tipList.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % tipList.length);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [isVisible, isPaused, tipList.length, autoPlayInterval]);

  if (!isVisible || tipList.length === 0) return null;

  const nextTip = () => setCurrentIndex((prev) => (prev + 1) % tipList.length);
  const prevTip = () => setCurrentIndex((prev) => (prev === 0 ? tipList.length - 1 : prev - 1));

  // Modern Vibrant Gradients
  const themes = {
    yellow: 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 shadow-amber-200',
    blue: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 shadow-blue-200',
    purple: 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-600 shadow-purple-200',
    green: 'bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-500 shadow-emerald-200',
    pink: 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 shadow-pink-200',
    orange: 'bg-gradient-to-r from-orange-400 via-red-400 to-orange-500 shadow-orange-200',
  };

  const IconComponent = variant === 'purple' || variant === 'pink' ? Sparkles : 
                        variant === 'blue' ? Info : 
                        variant === 'orange' ? Zap : Lightbulb;

  return (
    <div 
      className={`relative w-full rounded-2xl shadow-lg overflow-hidden text-white transition-all duration-500 ease-in-out hover:shadow-xl hover:-translate-y-0.5 ${themes[variant]} ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Decorative Background Elements (Glassmorphism feel) */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative flex items-center px-4 py-4 md:px-6 md:py-5 gap-4 md:gap-6">
        
        {/* Icon Box with frosted glass effect */}
        <div className="hidden md:flex shrink-0 w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm items-center justify-center shadow-inner border border-white/20">
            <IconComponent className="w-6 h-6 text-white drop-shadow-sm" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 opacity-90">
                <IconComponent className="w-4 h-4 md:hidden" />
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white/90">Mentor Tip</span>
                {tipList.length > 1 && (
                    <span className="bg-white/20 px-1.5 py-0.5 rounded text-[9px] font-bold backdrop-blur-sm border border-white/10">
                        {currentIndex + 1}/{tipList.length}
                    </span>
                )}
            </div>
            
            <div className="relative">
                 <p 
                    key={currentIndex}
                    className="text-sm md:text-base font-bold leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-300 drop-shadow-sm"
                 >
                    "{tipList[currentIndex]}"
                 </p>
            </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-end gap-2 shrink-0 pl-2">
            <button 
                onClick={() => setIsVisible(false)}
                className="p-1.5 bg-white/10 hover:bg-white/30 rounded-full transition-colors backdrop-blur-sm text-white/90 hover:text-white"
                title="ซ่อนคำแนะนำ"
            >
                <X className="w-4 h-4" />
            </button>

            {tipList.length > 1 && (
                <div className="flex items-center gap-1 mt-1">
                    <button 
                        onClick={prevTip}
                        className="p-1 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={nextTip}
                        className="p-1 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default MentorTip;
