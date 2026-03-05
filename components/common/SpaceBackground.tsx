
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Star, Sparkles, Orbit } from 'lucide-react';

interface SpaceBackgroundProps {
    children: React.ReactNode;
    className?: string;
}

const SpaceBackground: React.FC<SpaceBackgroundProps> = ({ children, className = "" }) => {
    // Generate random stars once
    const stars = useMemo(() => {
        return Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            size: Math.random() * 2 + 1,
            duration: Math.random() * 3 + 2,
            delay: Math.random() * 5
        }));
    }, []);

    // Generate floating sci-fi elements
    const floatingElements = useMemo(() => {
        const icons = [Star, Sparkles, Orbit];
        return Array.from({ length: 8 }).map((_, i) => ({
            id: i,
            Icon: icons[Math.floor(Math.random() * icons.length)],
            top: `${Math.random() * 90}%`,
            left: `${Math.random() * 90}%`,
            size: Math.random() * 20 + 20,
            duration: Math.random() * 20 + 10,
            delay: Math.random() * -20
        }));
    }, []);

    return (
        <div className={`relative min-h-screen w-full overflow-hidden bg-[#020617] ${className}`}>
            {/* 1. Deep Space Gradient */}
            <div className="fixed inset-0 bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#1e1b4b] pointer-events-none z-0" />
            
            {/* 2. Nebula Glows */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '4s' }} />
            </div>

            {/* 3. Sci-fi Grid Overlay */}
            <div 
                className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]" 
                style={{ 
                    backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.2) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px'
                }} 
            />

            {/* 4. Twinkling Stars */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {stars.map((star) => (
                    <motion.div
                        key={star.id}
                        className="absolute bg-white rounded-full"
                        style={{
                            top: star.top,
                            left: star.left,
                            width: star.size,
                            height: star.size,
                        }}
                        animate={{
                            opacity: [0.2, 1, 0.2],
                            scale: [1, 1.2, 1],
                        }}
                        transition={{
                            duration: star.duration,
                            repeat: Infinity,
                            delay: star.delay,
                            ease: "easeInOut"
                        }}
                    />
                ))}
            </div>

            {/* 5. Floating Sci-fi Icons */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {floatingElements.map((el) => (
                    <motion.div
                        key={el.id}
                        className="absolute text-indigo-500/20"
                        style={{
                            top: el.top,
                            left: el.left,
                        }}
                        animate={{
                            y: [0, -30, 0],
                            rotate: [0, 360],
                            opacity: [0.1, 0.3, 0.1]
                        }}
                        transition={{
                            duration: el.duration,
                            repeat: Infinity,
                            delay: el.delay,
                            ease: "linear"
                        }}
                    >
                        <el.Icon size={el.size} />
                    </motion.div>
                ))}
            </div>

            {/* 6. Animated Rocket (The Highlight) */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <motion.div
                    className="absolute text-indigo-400"
                    initial={{ x: '-10%', y: '20%', rotate: 45, opacity: 0 }}
                    animate={{ 
                        x: '110%', 
                        y: ['20%', '25%', '15%', '20%'],
                        opacity: [0, 1, 1, 0]
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        repeatDelay: 10,
                        ease: "linear"
                    }}
                >
                    <div className="relative">
                        <Rocket size={40} className="drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]" />
                        {/* Rocket Trail */}
                        <motion.div 
                            className="absolute -left-8 top-1/2 -translate-y-1/2 w-8 h-2 bg-gradient-to-l from-indigo-400/60 to-transparent blur-sm"
                            animate={{ scaleX: [1, 1.5, 1] }}
                            transition={{ duration: 0.2, repeat: Infinity }}
                        />
                    </div>
                </motion.div>

                {/* Second Rocket or Satellite */}
                <motion.div
                    className="absolute text-purple-400/40"
                    initial={{ x: '110%', y: '70%', rotate: -135, opacity: 0 }}
                    animate={{ 
                        x: '-10%', 
                        y: ['70%', '65%', '75%', '70%'],
                        opacity: [0, 0.5, 0.5, 0]
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        repeatDelay: 5,
                        ease: "linear"
                    }}
                >
                    <Orbit size={30} className="animate-spin-slow" />
                </motion.div>
            </div>

            {/* Content Layer */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};

export default SpaceBackground;
