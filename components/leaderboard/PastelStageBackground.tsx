
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * PastelStageBackground Component
 * 
 * A highly sophisticated, randomized, and animated background for the Leaderboard.
 * Designed to feel like a "Dreamy Award Stage" with pastel tones, dynamic lighting,
 * and rich particle systems.
 * 
 * Features:
 * - Randomized color palettes on every load.
 * - Multi-layered particle systems (Bokeh, Stars, Geometric shapes).
 * - Advanced spotlight system with podium focus.
 * - Fixed positioning to support full-screen scrolling.
 * - High-performance animations using Framer Motion.
 */

interface PastelStageBackgroundProps {
    children: React.ReactNode;
}

// --- Types & Interfaces ---

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
    color: string;
    type: 'bokeh' | 'star' | 'shape';
    shape?: 'circle' | 'square' | 'triangle';
}

interface Palette {
    bg: string;
    gradient: string[];
    spotlight: string;
    particles: string[];
    accent: string;
}

// --- Constants & Palettes ---

const PALETTES: Palette[] = [
    {
        // Sweet Candy Theme
        bg: '#faf5ff',
        gradient: ['#fdf2f8', '#f5f3ff', '#ecfdf5'],
        spotlight: 'rgba(255, 182, 193, 0.3)',
        particles: ['#FFD1DC', '#E0BBE4', '#957DAD', '#D291BC', '#FEC8D8'],
        accent: '#FFB6C1'
    },
    {
        // Ocean Breeze Theme
        bg: '#f0f9ff',
        gradient: ['#e0f2fe', '#f0f9ff', '#f5f3ff'],
        spotlight: 'rgba(186, 230, 253, 0.3)',
        particles: ['#BAE6FD', '#7DD3FC', '#A5F3FC', '#CFFAFE', '#E0F2FE'],
        accent: '#7DD3FC'
    },
    {
        // Sunset Dream Theme
        bg: '#fff7ed',
        gradient: ['#ffedd5', '#fff7ed', '#fdf2f8'],
        spotlight: 'rgba(254, 215, 170, 0.3)',
        particles: ['#FED7AA', '#FDBA74', '#FDA4AF', '#FECDD3', '#FFE4E6'],
        accent: '#FDBA74'
    },
    {
        // Minty Fresh Theme
        bg: '#f0fdf4',
        gradient: ['#dcfce7', '#f0fdf4', '#f0f9ff'],
        spotlight: 'rgba(187, 247, 208, 0.3)',
        particles: ['#BBF7D0', '#86EFAC', '#6EE7B7', '#A7F3D0', '#D1FAE5'],
        accent: '#86EFAC'
    }
];

const PastelStageBackground: React.FC<PastelStageBackgroundProps> = ({ children }) => {
    
    // 1. Randomly select a palette for this session
    const palette = useMemo(() => {
        const index = Math.floor(Math.random() * PALETTES.length);
        return PALETTES[index];
    }, []);

    // 2. Generate a rich set of particles
    const particles = useMemo(() => {
        const items: Particle[] = [];
        
        // Bokeh / Large Bubbles (30 items)
        for (let i = 0; i < 30; i++) {
            items.push({
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                size: Math.random() * 60 + 20,
                duration: 15 + Math.random() * 15,
                delay: Math.random() * -20,
                color: palette.particles[Math.floor(Math.random() * palette.particles.length)],
                type: 'bokeh'
            });
        }

        // Twinkling Stars (50 items)
        for (let i = 30; i < 80; i++) {
            items.push({
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                size: Math.random() * 4 + 2,
                duration: 2 + Math.random() * 3,
                delay: Math.random() * 5,
                color: '#ffffff',
                type: 'star'
            });
        }

        // Geometric Shapes (15 items)
        const shapes: ('circle' | 'square' | 'triangle')[] = ['circle', 'square', 'triangle'];
        for (let i = 80; i < 95; i++) {
            items.push({
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                size: Math.random() * 20 + 10,
                duration: 20 + Math.random() * 20,
                delay: Math.random() * -20,
                color: palette.particles[Math.floor(Math.random() * palette.particles.length)],
                type: 'shape',
                shape: shapes[Math.floor(Math.random() * shapes.length)]
            });
        }

        return items;
    }, [palette]);

    return (
        <div className="relative min-h-screen w-full bg-white transition-colors duration-1000" style={{ backgroundColor: palette.bg }}>
            
            {/* --- FIXED BACKGROUND LAYERS (Handles Scrolling) --- */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                
                {/* A. Base Gradient Layer */}
                <div 
                    className="absolute inset-0 opacity-60 transition-all duration-1000"
                    style={{ 
                        background: `linear-gradient(135deg, ${palette.gradient[0]} 0%, ${palette.gradient[1]} 50%, ${palette.gradient[2]} 100%)` 
                    }} 
                />

                {/* B. SVG Noise Texture (For that "High-End" feel) */}
                <svg className="absolute inset-0 w-full h-full opacity-[0.03] mix-blend-overlay">
                    <filter id="noiseFilter">
                        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#noiseFilter)" />
                </svg>

                {/* C. Floating Bokeh System */}
                <AnimatePresence>
                    {particles.filter(p => p.type === 'bokeh').map((p) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ 
                                opacity: [0, 0.3, 0],
                                scale: [0.8, 1.2, 0.8],
                                x: [`${p.x}%`, `${p.x + (Math.random() * 10 - 5)}%`],
                                y: [`${p.y}%`, `${p.y - 20}%`]
                            }}
                            transition={{ 
                                duration: p.duration, 
                                repeat: Infinity, 
                                ease: "easeInOut",
                                delay: p.delay 
                            }}
                            className="absolute rounded-full blur-[40px]"
                            style={{
                                left: `${p.x}%`,
                                top: `${p.y}%`,
                                width: p.size * 2,
                                height: p.size * 2,
                                backgroundColor: p.color,
                            }}
                        />
                    ))}
                </AnimatePresence>

                {/* D. Twinkling Stars System */}
                {particles.filter(p => p.type === 'star').map((p) => (
                    <motion.div
                        key={p.id}
                        animate={{ 
                            opacity: [0.2, 1, 0.2],
                            scale: [1, 1.5, 1],
                        }}
                        transition={{ 
                            duration: p.duration, 
                            repeat: Infinity, 
                            ease: "easeInOut",
                            delay: p.delay 
                        }}
                        className="absolute bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                        style={{
                            left: `${p.x}%`,
                            top: `${p.y}%`,
                            width: p.size,
                            height: p.size,
                        }}
                    />
                ))}

                {/* E. Floating Geometric Shapes */}
                {particles.filter(p => p.type === 'shape').map((p) => (
                    <motion.div
                        key={p.id}
                        animate={{ 
                            rotate: [0, 360],
                            x: [`${p.x}%`, `${p.x + 5}%`, `${p.x}%`],
                            y: [`${p.y}%`, `${p.y + 5}%`, `${p.y}%`],
                            opacity: [0.1, 0.2, 0.1]
                        }}
                        transition={{ 
                            duration: p.duration, 
                            repeat: Infinity, 
                            ease: "linear",
                            delay: p.delay 
                        }}
                        className="absolute border-2 opacity-10"
                        style={{
                            left: `${p.x}%`,
                            top: `${p.y}%`,
                            width: p.size,
                            height: p.size,
                            borderColor: p.color,
                            borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'square' ? '4px' : '0',
                            clipPath: p.shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none'
                        }}
                    />
                ))}

                {/* F. Advanced Spotlight System */}
                
                {/* 1. Main Podium Spotlight (Center) */}
                <motion.div 
                    animate={{ 
                        opacity: [0.4, 0.6, 0.4],
                        scaleX: [1, 1.05, 1]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[1200px] origin-top blur-[100px]"
                    style={{ 
                        background: `radial-gradient(circle at top, ${palette.spotlight}, transparent 70%)` 
                    }}
                />

                {/* 2. Side Spotlight Left */}
                <motion.div 
                    animate={{ 
                        rotate: [-25, -15, -25],
                        opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-10%] left-[10%] w-[400px] h-[1000px] origin-top blur-[80px]"
                    style={{ 
                        background: `linear-gradient(to bottom, ${palette.spotlight}, transparent)` 
                    }}
                />

                {/* 3. Side Spotlight Right */}
                <motion.div 
                    animate={{ 
                        rotate: [25, 15, 25],
                        opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute top-[-10%] right-[10%] w-[400px] h-[1000px] origin-top blur-[80px]"
                    style={{ 
                        background: `linear-gradient(to bottom, ${palette.spotlight}, transparent)` 
                    }}
                />
            </div>

            {/* --- CONTENT LAYER --- */}
            <div className="relative z-10 px-4 md:px-8 pt-8 pb-20">
                {/* Subtle Entrance Animation for Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    {children}
                </motion.div>
            </div>

            {/* --- CUSTOM STYLES --- */}
            <style dangerouslySetInnerHTML={{ __html: `
                /* Smooth scroll behavior for the whole page */
                html {
                    scroll-behavior: smooth;
                }

                /* Custom scrollbar to match the pastel theme */
                ::-webkit-scrollbar {
                    width: 8px;
                }
                ::-webkit-scrollbar-track {
                    background: transparent;
                }
                ::-webkit-scrollbar-thumb {
                    background: ${palette.accent}44;
                    border-radius: 10px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: ${palette.accent}88;
                }
            `}} />
        </div>
    );
};

export default PastelStageBackground;
