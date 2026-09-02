import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type WaveMode = 'CONTENT' | 'TASK' | 'PLAN';

interface PastelWaveBackgroundProps {
    enabled?: boolean;
    mode?: WaveMode;
    showControls?: boolean;
}

interface PaletteConfig {
    name: string;
    bg: string;
    blobs: {
        color: string;
        radiusMult: number;
        speedX: number;
        speedY: number;
        phaseOffset: number;
    }[];
}

// 3 Dedicated Mode Palettes matching User Specification
const MODE_PALETTES: Record<WaveMode, PaletteConfig> = {
    CONTENT: {
        name: 'Strawberry Velvet 🍓',
        bg: 'from-[#fff1f2] via-[#fff5f6] to-[#ffe4e6]',
        blobs: [
            { color: 'rgba(244, 63, 94, 0.24)', radiusMult: 0.68, speedX: 0.38, speedY: -0.28, phaseOffset: 0 },
            { color: 'rgba(251, 113, 133, 0.22)', radiusMult: 0.72, speedX: -0.32, speedY: 0.35, phaseOffset: Math.PI * 0.5 },
            { color: 'rgba(244, 114, 182, 0.20)', radiusMult: 0.62, speedX: 0.25, speedY: -0.45, phaseOffset: Math.PI },
            { color: 'rgba(253, 164, 175, 0.24)', radiusMult: 0.75, speedX: -0.35, speedY: -0.22, phaseOffset: Math.PI * 1.5 }
        ]
    },
    TASK: {
        name: 'Ocean Breeze & Sky Glaze 🌊',
        bg: 'from-[#f0f9ff] via-[#e0f2fe] to-[#f8fafc]',
        blobs: [
            { color: 'rgba(14, 165, 233, 0.24)', radiusMult: 0.68, speedX: 0.35, speedY: -0.25, phaseOffset: 0 },
            { color: 'rgba(56, 189, 248, 0.22)', radiusMult: 0.72, speedX: -0.28, speedY: 0.38, phaseOffset: Math.PI * 0.5 },
            { color: 'rgba(45, 212, 191, 0.20)', radiusMult: 0.60, speedX: 0.28, speedY: -0.42, phaseOffset: Math.PI },
            { color: 'rgba(125, 211, 252, 0.22)', radiusMult: 0.75, speedX: -0.35, speedY: -0.18, phaseOffset: Math.PI * 1.5 }
        ]
    },
    PLAN: {
        name: 'Dreamy Lavender & Fuchsia Nebula 🔮',
        bg: 'from-[#faf5ff] via-[#fdf4ff] to-[#f5f3ff]',
        blobs: [
            { color: 'rgba(217, 70, 239, 0.24)', radiusMult: 0.68, speedX: 0.36, speedY: -0.30, phaseOffset: 0 },
            { color: 'rgba(168, 85, 247, 0.22)', radiusMult: 0.72, speedX: -0.30, speedY: 0.35, phaseOffset: Math.PI * 0.5 },
            { color: 'rgba(192, 38, 211, 0.20)', radiusMult: 0.62, speedX: 0.22, speedY: -0.45, phaseOffset: Math.PI },
            { color: 'rgba(232, 121, 249, 0.22)', radiusMult: 0.75, speedX: -0.38, speedY: -0.20, phaseOffset: Math.PI * 1.5 }
        ]
    }
};

// Preset Premium Pastel Color Schemes for Default Random Mode
const PASTEL_PALETTES: PaletteConfig[] = [
    {
        name: 'Strawberry Milk & Lavender 🍓',
        bg: 'from-[#fff5f6] via-[#fbf0ff] to-[#f0f3ff]',
        blobs: [
            { color: 'rgba(244, 63, 94, 0.24)', radiusMult: 0.65, speedX: 0.4, speedY: -0.3, phaseOffset: 0 },
            { color: 'rgba(168, 85, 247, 0.22)', radiusMult: 0.70, speedX: -0.3, speedY: 0.4, phaseOffset: Math.PI * 0.5 },
            { color: 'rgba(236, 72, 153, 0.20)', radiusMult: 0.60, speedX: 0.2, speedY: -0.5, phaseOffset: Math.PI },
            { color: 'rgba(99, 102, 241, 0.24)', radiusMult: 0.75, speedX: -0.4, speedY: -0.2, phaseOffset: Math.PI * 1.5 }
        ]
    },
    {
        name: 'Mint Gelato & Lemon Sorbet 🍏',
        bg: 'from-[#f0fdf4] via-[#fefce8] to-[#ecfeff]',
        blobs: [
            { color: 'rgba(16, 185, 129, 0.20)', radiusMult: 0.65, speedX: 0.35, speedY: -0.25, phaseOffset: 0 },
            { color: 'rgba(234, 179, 8, 0.18)', radiusMult: 0.70, speedX: -0.25, speedY: 0.35, phaseOffset: Math.PI * 0.5 },
            { color: 'rgba(45, 212, 191, 0.22)', radiusMult: 0.60, speedX: 0.25, speedY: -0.45, phaseOffset: Math.PI },
            { color: 'rgba(14, 165, 233, 0.20)', radiusMult: 0.75, speedX: -0.35, speedY: -0.15, phaseOffset: Math.PI * 1.5 }
        ]
    },
    {
        name: 'Peach Sunset & Lilac Sky 🍑',
        bg: 'from-[#fff7ed] via-[#fff1f2] to-[#faf5ff]',
        blobs: [
            { color: 'rgba(249, 115, 22, 0.20)', radiusMult: 0.68, speedX: 0.3, speedY: -0.3, phaseOffset: 0 },
            { color: 'rgba(168, 85, 247, 0.20)', radiusMult: 0.72, speedX: -0.3, speedY: 0.3, phaseOffset: Math.PI * 0.5 },
            { color: 'rgba(244, 63, 94, 0.22)', radiusMult: 0.62, speedX: 0.2, speedY: -0.4, phaseOffset: Math.PI },
            { color: 'rgba(236, 72, 153, 0.20)', radiusMult: 0.70, speedX: -0.4, speedY: -0.2, phaseOffset: Math.PI * 1.5 }
        ]
    },
    {
        name: 'Dreamy Cyan & Cotton Candy 🍬',
        bg: 'from-[#f0f9ff] via-[#fdf4ff] to-[#f5f3ff]',
        blobs: [
            { color: 'rgba(6, 182, 212, 0.22)', radiusMult: 0.70, speedX: 0.4, speedY: -0.2, phaseOffset: 0 },
            { color: 'rgba(236, 72, 153, 0.24)', radiusMult: 0.65, speedX: -0.3, speedY: 0.4, phaseOffset: Math.PI * 0.5 },
            { color: 'rgba(56, 189, 248, 0.20)', radiusMult: 0.75, speedX: 0.2, speedY: -0.5, phaseOffset: Math.PI },
            { color: 'rgba(217, 70, 239, 0.22)', radiusMult: 0.62, speedX: -0.4, speedY: -0.3, phaseOffset: Math.PI * 1.5 }
        ]
    }
];

function parseRgba(str: string): [number, number, number, number] {
    const match = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d\.]+))?\)/);
    if (match) {
        return [
            parseInt(match[1], 10),
            parseInt(match[2], 10),
            parseInt(match[3], 10),
            match[4] !== undefined ? parseFloat(match[4]) : 1.0
        ];
    }
    return [255, 255, 255, 0.2];
}

function lerpColor(curr: [number, number, number, number], target: [number, number, number, number], factor: number): [number, number, number, number] {
    return [
        curr[0] + (target[0] - curr[0]) * factor,
        curr[1] + (target[1] - curr[1]) * factor,
        curr[2] + (target[2] - curr[2]) * factor,
        curr[3] + (target[3] - curr[3]) * factor
    ];
}

export const PastelWaveBackground: React.FC<PastelWaveBackgroundProps> = ({ 
    enabled = true,
    mode,
    showControls = false
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // If mode is passed, use the specific mode palette; otherwise pick from random presets
    const [selectedPalette, setSelectedPalette] = useState<PaletteConfig>(() => {
        if (mode && MODE_PALETTES[mode]) {
            return MODE_PALETTES[mode];
        }
        const randomIndex = Math.floor(Math.random() * PASTEL_PALETTES.length);
        return PASTEL_PALETTES[randomIndex];
    });

    // Update palette when mode prop changes
    useEffect(() => {
        if (mode && MODE_PALETTES[mode]) {
            setSelectedPalette(MODE_PALETTES[mode]);
        }
    }, [mode]);

    // Keep active blob states with smooth color morphing
    const blobsRef = useRef<Array<{
        x: number;
        y: number;
        vx: number;
        vy: number;
        baseRadius: number;
        phase: number;
        phaseSpeed: number;
        currentColor: [number, number, number, number];
        targetColor: [number, number, number, number];
    }>>([]);

    useEffect(() => {
        if (!enabled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = containerRef.current?.offsetWidth || window.innerWidth);
        let height = (canvas.height = containerRef.current?.offsetHeight || window.innerHeight);

        // Keep canvas pixel-ratio responsive
        const handleResize = () => {
            if (!containerRef.current || !canvas) return;
            width = canvas.width = containerRef.current.offsetWidth;
            height = canvas.height = containerRef.current.offsetHeight;
        };

        const resizeObserver = new ResizeObserver(handleResize);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        // Initialize or update blob target colors for smooth morphing
        if (blobsRef.current.length === 0) {
            const startPositions = [
                { x: width * 0.2, y: height * 0.2 },
                { x: width * 0.8, y: height * 0.25 },
                { x: width * 0.3, y: height * 0.75 },
                { x: width * 0.75, y: height * 0.8 }
            ];

            blobsRef.current = selectedPalette.blobs.map((config, index) => {
                const startPos = startPositions[index % startPositions.length];
                const parsed = parseRgba(config.color);
                return {
                    x: startPos.x,
                    y: startPos.y,
                    vx: config.speedX,
                    vy: config.speedY,
                    baseRadius: Math.max(width, height) * config.radiusMult * 0.5,
                    phase: config.phaseOffset,
                    phaseSpeed: 0.0015,
                    currentColor: parsed,
                    targetColor: parsed
                };
            });
        } else {
            // Update target colors smoothly without restarting positions
            selectedPalette.blobs.forEach((config, index) => {
                if (blobsRef.current[index]) {
                    blobsRef.current[index].targetColor = parseRgba(config.color);
                    blobsRef.current[index].baseRadius = Math.max(width, height) * config.radiusMult * 0.5;
                }
            });
        }

        // Core Render Loop Engine for Fluid Jelly Color Mesh Gradient
        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            blobsRef.current.forEach((blob) => {
                // Smooth color morphing interpolation
                blob.currentColor = lerpColor(blob.currentColor, blob.targetColor, 0.04);

                // Update position
                blob.x += blob.vx;
                blob.y += blob.vy;

                // Bounce at borders with margin
                const margin = blob.baseRadius * 0.8;
                if (blob.x < -margin) { blob.x = -margin; blob.vx *= -1; }
                if (blob.x > width + margin) { blob.x = width + margin; blob.vx *= -1; }
                if (blob.y < -margin) { blob.y = -margin; blob.vy *= -1; }
                if (blob.y > height + margin) { blob.y = height + margin; blob.vy *= -1; }

                blob.phase += blob.phaseSpeed;

                // Organic pulsate
                const pulse = 1 + Math.sin(blob.phase * 2) * 0.18;
                const activeRadius = Math.max(20, blob.baseRadius * pulse);

                const c = blob.currentColor;
                const colorStr = `rgba(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])}, ${c[3].toFixed(3)})`;
                const colorMid = `rgba(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])}, ${(c[3] * 0.5).toFixed(3)})`;
                const colorLow = `rgba(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])}, ${(c[3] * 0.15).toFixed(3)})`;

                const radialGrad = ctx.createRadialGradient(
                    blob.x,
                    blob.y,
                    0,
                    blob.x,
                    blob.y,
                    activeRadius
                );
                
                radialGrad.addColorStop(0, colorStr);
                radialGrad.addColorStop(0.5, colorMid);
                radialGrad.addColorStop(0.8, colorLow);
                radialGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

                ctx.fillStyle = radialGrad;
                ctx.beginPath();
                ctx.arc(blob.x, blob.y, activeRadius, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationFrameId);
            resizeObserver.disconnect();
        };
    }, [enabled, selectedPalette]);

    const cyclePalette = () => {
        setSelectedPalette((prev) => {
            const currentIndex = PASTEL_PALETTES.findIndex(p => p.name === prev.name);
            const nextIndex = (currentIndex + 1) % PASTEL_PALETTES.length;
            return PASTEL_PALETTES[nextIndex];
        });
    };

    return (
        <div 
            ref={containerRef} 
            className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0"
        >
            <AnimatePresence>
                {enabled ? (
                    <motion.div
                        key="canvas-container"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className={`absolute inset-0 bg-gradient-to-tr ${selectedPalette.bg} transition-colors duration-1000 w-full h-full`}
                    >
                        <canvas 
                            ref={canvasRef} 
                            className="absolute top-0 left-0 w-full h-full opacity-90"
                        />
                        
                        {/* Switch color scheme buttons (when manual controls enabled) */}
                        {showControls && (
                            <div className="absolute bottom-4 right-16 pointer-events-auto z-10">
                                <button
                                    type="button"
                                    onClick={cyclePalette}
                                    title={`เปลี่ยนคู่สีพาสเทล: ${selectedPalette.name}`}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/70 hover:bg-white/95 border border-white/50 backdrop-blur-md rounded-full shadow-sm hover:shadow text-[9.5px] text-indigo-700 font-extrabold transition-all duration-300 transform scale-90 hover:scale-95 active:scale-90"
                                >
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                                    </span>
                                    {selectedPalette.name} (สุ่มคู่สีคู่ถัดไป)
                                </button>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="fallback-bg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-50/50 w-full h-full transition-colors duration-1000"
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default PastelWaveBackground;
