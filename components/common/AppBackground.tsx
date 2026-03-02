
import React, { useMemo } from 'react';

export type BackgroundTheme = 
  | 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'
  | 'pastel-red' | 'pastel-orange' | 'pastel-yellow' | 'pastel-green' | 'pastel-blue' 
  | 'pastel-indigo' | 'pastel-purple' | 'pastel-pink' | 'pastel-rose' | 'pastel-teal'
  | 'pastel-cyan' | 'pastel-sky' | 'pastel-emerald' | 'pastel-lime' | 'pastel-amber'
  | 'pastel-stone' | 'pastel-slate' | 'pastel-zinc' | 'neutral';

interface AppBackgroundProps {
    theme?: BackgroundTheme;
    pattern?: 'grid' | 'dots' | 'icons' | 'none';
    className?: string;
    children?: React.ReactNode;
}

const AppBackground: React.FC<AppBackgroundProps> = ({ 
    theme = 'neutral', 
    pattern = 'grid', 
    className = '', 
    children 
}) => {
    const themeConfig = useMemo(() => {
        const configs: Record<BackgroundTheme, string> = {
            sunday: 'from-red-50 to-rose-100',
            monday: 'from-yellow-50 to-amber-100',
            tuesday: 'from-pink-50 to-rose-100',
            wednesday: 'from-green-50 to-emerald-100',
            thursday: 'from-orange-50 to-amber-100',
            friday: 'from-blue-50 to-sky-100',
            saturday: 'from-purple-50 to-violet-100',
            'pastel-red': 'from-red-50 to-red-100',
            'pastel-orange': 'from-orange-50 to-orange-100',
            'pastel-yellow': 'from-yellow-50 to-yellow-100',
            'pastel-green': 'from-green-50 to-green-100',
            'pastel-blue': 'from-blue-50 to-blue-100',
            'pastel-indigo': 'from-indigo-50 to-indigo-100',
            'pastel-purple': 'from-purple-50 to-purple-100',
            'pastel-pink': 'from-pink-50 to-pink-100',
            'pastel-rose': 'from-rose-50 to-rose-100',
            'pastel-teal': 'from-teal-50 to-teal-100',
            'pastel-cyan': 'from-cyan-50 to-cyan-100',
            'pastel-sky': 'from-sky-50 to-sky-100',
            'pastel-emerald': 'from-emerald-50 to-emerald-100',
            'pastel-lime': 'from-lime-50 to-lime-100',
            'pastel-amber': 'from-amber-50 to-amber-100',
            'pastel-stone': 'from-stone-50 to-stone-100',
            'pastel-slate': 'from-slate-50 to-slate-100',
            'pastel-zinc': 'from-zinc-50 to-zinc-100',
            neutral: 'from-gray-50 to-slate-100',
        };
        return configs[theme] || configs.neutral;
    }, [theme]);

    const patternStyle = useMemo(() => {
        if (pattern === 'grid') {
            return {
                backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
                opacity: 0.03
            };
        }
        if (pattern === 'dots') {
            return {
                backgroundImage: `radial-gradient(#000 1px, transparent 1px)`,
                backgroundSize: '20px 20px',
                opacity: 0.05
            };
        }
        if (pattern === 'icons') {
            // Subtle icons pattern using a small repeating SVG or just a different grid
            return {
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                opacity: 0.3
            };
        }
        return {};
    }, [pattern]);

    return (
        <div className={`relative min-h-full w-full bg-gradient-to-br ${themeConfig} transition-colors duration-1000 ${className}`}>
            <div className="absolute inset-0 pointer-events-none" style={patternStyle} />
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};

export default AppBackground;
