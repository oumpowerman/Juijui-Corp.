
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface MetallicStageBackgroundProps {
    children: React.ReactNode;
}

const MetallicStageBackground: React.FC<MetallicStageBackgroundProps> = ({ children }) => {
    // Generate metallic particles (Gold/Silver)
    const particles = useMemo(() => {
        return Array.from({ length: 60 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 1,
            delay: Math.random() * 5,
            duration: 2 + Math.random() * 3,
            color: Math.random() > 0.5 ? '#FFD700' : '#E5E4E2', // Gold or Silver
        }));
    }, []);

    return (
        <div className="relative min-h-screen w-full bg-[#0f0f0f]">
            {/* Fixed Background Layers to ensure full coverage during scroll */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {/* Deep Metallic Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#2d2412] to-[#1a1a1a]" />
                
                {/* Shiny Metallic Glows */}
                <motion.div 
                    animate={{ 
                        opacity: [0.3, 0.5, 0.3],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-orange-500/10 rounded-full blur-[150px]"
                />
                <motion.div 
                    animate={{ 
                        opacity: [0.2, 0.4, 0.2],
                        scale: [1, 1.3, 1],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] bg-yellow-500/10 rounded-full blur-[150px]"
                />

                {/* Spotlights (Silver/White) */}
                <div className="absolute inset-0 overflow-hidden">
                    <motion.div 
                        animate={{ rotate: [-20, -10, -20], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-[-10%] left-[20%] w-[300px] h-[1000px] bg-gradient-to-b from-white/20 via-white/5 to-transparent origin-top blur-2xl"
                        style={{ transform: 'rotate(-15deg)' }}
                    />
                    <motion.div 
                        animate={{ rotate: [20, 10, 20], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute top-[-10%] right-[20%] w-[300px] h-[1000px] bg-gradient-to-b from-white/20 via-white/5 to-transparent origin-top blur-2xl"
                        style={{ transform: 'rotate(15deg)' }}
                    />
                </div>

                {/* Metallic Particles */}
                {particles.map((p) => (
                    <motion.div
                        key={p.id}
                        initial={{ opacity: 0 }}
                        animate={{ 
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                            y: [0, -20, 0]
                        }}
                        transition={{ 
                            duration: p.duration, 
                            repeat: Infinity, 
                            delay: p.delay,
                            ease: "easeInOut"
                        }}
                        className="absolute rounded-full"
                        style={{
                            left: `${p.x}%`,
                            top: `${p.y}%`,
                            width: p.size,
                            height: p.size,
                            backgroundColor: p.color,
                            boxShadow: `0 0 10px ${p.color}`,
                        }}
                    />
                ))}
            </div>

            {/* Stage Platform (Metallic Silver/Gold) */}
            <div className="fixed bottom-0 left-0 w-full h-[30%] pointer-events-none z-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[160%] h-full bg-gradient-to-b from-[#333] via-[#1a1a1a] to-black clip-path-metallic shadow-[0_-10px_50px_rgba(255,165,0,0.2)] border-t border-white/10" />
                {/* Gold Rim */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[160%] h-[2px] bg-gradient-to-r from-transparent via-yellow-500 to-transparent clip-path-metallic opacity-50" />
            </div>

            {/* Content Wrapper */}
            <div className="relative z-10 px-4 md:px-8 pt-8">
                {children}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .clip-path-metallic {
                    clip-path: polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%);
                }
            `}} />
        </div>
    );
};

export default MetallicStageBackground;
