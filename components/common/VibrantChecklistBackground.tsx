
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Camera, Mic, Map, Compass, Luggage, Sun, Cloud, Heart, Star } from 'lucide-react';

interface VibrantChecklistBackgroundProps {
    children: React.ReactNode;
    className?: string;
}

// Suggestion 3: Use React.memo with a custom comparator to make visuals perfectly stable
const BackgroundVisuals = React.memo(() => {
    // Pastel colors for the rainbow/random effect
    const pastelGradients = [
        'from-sky-100 via-blue-50 to-indigo-100',
        'from-rose-100 via-pink-50 to-purple-100',
        'from-emerald-100 via-teal-50 to-cyan-100',
        'from-amber-100 via-orange-50 to-yellow-100',
        'from-purple-100 via-violet-50 to-fuchsia-100',
        'from-lime-100 via-green-50 to-emerald-100'
    ];

    // Pick a random gradient on mount
    const randomGradient = useMemo(() => {
        return pastelGradients[Math.floor(Math.random() * pastelGradients.length)];
    }, []);

    // Floating icons configuration
    const floatingIcons = useMemo(() => {
        const icons = [Camera, Mic, Map, Compass, Luggage, Sun, Cloud, Heart, Star];
        const colors = [
            'text-blue-400', 'text-pink-400', 'text-emerald-400', 
            'text-amber-400', 'text-purple-400', 'text-rose-400',
            'text-indigo-400', 'text-teal-400'
        ];

        return Array.from({ length: 15 }).map((_, i) => ({
            id: i,
            Icon: icons[Math.floor(Math.random() * icons.length)],
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            size: Math.floor(Math.random() * 30) + 20,
            color: colors[Math.floor(Math.random() * colors.length)],
            duration: Math.random() * 20 + 15,
            delay: Math.random() * -20,
            rotate: Math.floor(Math.random() * 360)
        }));
    }, []);

    return (
        <>
            {/* 1. Animated Gradient Background */}
            <motion.div 
                className={`fixed inset-0 bg-gradient-to-br ${randomGradient} pointer-events-none z-0`}
                animate={{
                    background: [
                        'linear-gradient(to bottom right, #e0f2fe, #f0f9ff, #e0e7ff)',
                        'linear-gradient(to bottom right, #fef2f2, #fff1f2, #f5f3ff)',
                        'linear-gradient(to bottom right, #ecfdf5, #f0fdf4, #ecfeff)',
                        'linear-gradient(to bottom right, #fffbeb, #fff7ed, #fefce8)',
                        'linear-gradient(to bottom right, #e0f2fe, #f0f9ff, #e0e7ff)',
                    ]
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />

            {/* 2. Soft Pattern Overlay */}
            <div 
                className="fixed inset-0 pointer-events-none z-0 opacity-20" 
                style={{ 
                    backgroundImage: `radial-gradient(#fff 2px, transparent 2px)`,
                    backgroundSize: '40px 40px'
                }} 
            />

            {/* 3. Floating Icons */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                {floatingIcons.map((item) => (
                    <motion.div
                        key={item.id}
                        className={`absolute ${item.color} opacity-20`}
                        style={{
                            top: item.top,
                            left: item.left,
                        }}
                        animate={{
                            x: [0, Math.random() * 100 - 50, 0],
                            y: [0, Math.random() * 100 - 50, 0],
                            rotate: [item.rotate, item.rotate + 360],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{
                            duration: item.duration,
                            repeat: Infinity,
                            delay: item.delay,
                            ease: "easeInOut"
                        }}
                    >
                        <item.Icon size={item.size} />
                    </motion.div>
                ))}
            </div>
        </>
    );
}, () => true); // Never re-render the visuals

const VibrantChecklistBackground: React.FC<VibrantChecklistBackgroundProps> = ({ children, className = "" }) => {
    return (
        <div className={`relative min-h-screen w-full overflow-hidden ${className}`}>
            <BackgroundVisuals />

            {/* 4. Content Layer */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};

export default VibrantChecklistBackground;
