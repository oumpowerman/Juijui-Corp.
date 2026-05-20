
import React from 'react';
import NeoCyberFrame from './frames/NeoCyberFrame';
import PastelDreamFrame from './frames/PastelDreamFrame';
import OnyxLuxeFrame from './frames/OnyxLuxeFrame';
import VoltageOverdriveFrame from './frames/VoltageOverdriveFrame';
import ZenHarmonyFrame from './frames/ZenHarmonyFrame';
import NekoParadiseFrame from './frames/NekoParadiseFrame';
import { User } from '../../../../types';

interface SkinManagerProps {
    user: User;
    mode?: 'avatar' | 'aura' | 'styles';
    children?: React.ReactNode;
}

export const SKIN_CONFIGS: Record<string, {
    bannerGradient: string;
    borderGradient: string;
    glowRgb: string;
    rayRgb: string;
    glassBg: string;
    textColor: string;
    label: string;
}> = {
    'frame-neo-cyber': {
        bannerGradient: 'from-cyan-600 via-blue-500 to-cyan-600',
        borderGradient: 'linear-gradient(135deg, #06b6d4, #3b82f6, #06b6d4)',
        glowRgb: '6, 182, 212',
        rayRgb: '59, 130, 246',
        glassBg: 'rgba(10, 20, 40, 0.7)',
        textColor: 'text-cyan-400',
        label: 'NEO-CYBER PROTOCOL'
    },
    'frame-pastel-dream': {
        bannerGradient: 'from-pink-400 via-purple-300 to-pink-400',
        borderGradient: 'linear-gradient(135deg, #f472b6, #d8b4fe, #f472b6)',
        glowRgb: '244, 114, 182',
        rayRgb: '216, 180, 254',
        glassBg: 'rgba(255, 240, 245, 0.8)',
        textColor: 'text-pink-500',
        label: 'PASTEL DREAMSCAPE'
    },
    'frame-onyx-luxe': {
        bannerGradient: 'from-amber-600 via-yellow-200 to-amber-600',
        borderGradient: 'linear-gradient(135deg, #b45309, #fde047, #b45309)',
        glowRgb: '180, 83, 9',
        rayRgb: '253, 224, 71',
        glassBg: 'rgba(20, 20, 20, 0.9)',
        textColor: 'text-amber-500',
        label: 'ONYX LUXE EDITION'
    },
    'frame-voltage-overdrive': {
        bannerGradient: 'from-violet-600 via-yellow-400 to-violet-600',
        borderGradient: 'linear-gradient(135deg, #7c3aed, #fbbf24, #7c3aed)',
        glowRgb: '124, 58, 237',
        rayRgb: '251, 191, 36',
        glassBg: 'rgba(40, 10, 60, 0.75)',
        textColor: 'text-violet-400',
        label: 'VOLTAGE OVERDRIVE'
    },
    'frame-zen-harmony': {
        bannerGradient: 'from-emerald-500 via-teal-200 to-emerald-500',
        borderGradient: 'linear-gradient(135deg, #10b981, #99f6e4, #10b981)',
        glowRgb: '16, 185, 129',
        rayRgb: '153, 246, 228',
        glassBg: 'rgba(240, 255, 250, 0.85)',
        textColor: 'text-emerald-600',
        label: 'ZEN HARMONY PATH'
    },
    'frame-neko-paradise': {
        bannerGradient: 'from-amber-400 via-orange-300 to-rose-300',
        borderGradient: 'linear-gradient(135deg, #f59e0b, #fb923c, #f43f5e)',
        glowRgb: '245, 158, 11',
        rayRgb: '251, 146, 60',
        glassBg: 'rgba(254, 252, 248, 0.84)',
        textColor: 'text-amber-600',
        label: 'NEO NEKO SHNRYU'
    }
};

export const SkinPattern: React.FC<{ user: User }> = ({ user }) => {
    const hpPercent = (user.hp / (user.maxHp || 100)) * 100;
    const skinId = (user as any).equippedFrameId;
    const skin = SKIN_CONFIGS[skinId];
    
    if (!skin || hpPercent < 50) return null;

    return (
        <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none z-0">
            {/* Skin-specific Rays Override */}
            <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250%] h-[250%] animate-[rays-skin_40s_linear_infinite]" 
                style={{ 
                    background: `radial-gradient(circle at center, rgba(${skin.rayRgb}, 0.15) 0%, rgba(${skin.rayRgb}, 0.05) 50%, transparent 80%)` 
                }}
            />

            {skinId === 'frame-neo-cyber' && (
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] opacity-[0.05]" />
            )}
            {skinId === 'frame-onyx-luxe' && (
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-900/10 via-transparent to-amber-900/10" />
            )}
            {skinId === 'frame-voltage-overdrive' && (
                <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-yellow-500/5" />
            )}
            {skinId === 'frame-zen-harmony' && (
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-[0.03]" />
            )}
            {skinId === 'frame-neko-paradise' && (
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-transparent to-rose-500/5" />
            )}

            {/* Special Skin Particles */}
            {skinId === 'frame-neo-cyber' && (
                <div className="absolute inset-0 bg-cyan-500/5 animate-pulse" />
            )}
        </div>
    );
};

export const SkinStyles: React.FC<{ user: User }> = ({ user }) => {
    const hpPercent = (user.hp / (user.maxHp || 100)) * 100;
    const skinId = (user as any).equippedFrameId;
    const skin = SKIN_CONFIGS[skinId];
    
    if (!skin || hpPercent < 50) return null;

    return (
        <style>{`
            @keyframes shine-skin {
                0% { background-position: -200% center; }
                100% { background-position: 200% center; }
            }
            @keyframes rays-skin {
                0% { transform: rotate(0deg) scale(1); opacity: 0.1; }
                50% { transform: rotate(180deg) scale(1.1); opacity: 0.2; }
                100% { transform: rotate(360deg) scale(1); opacity: 0.1; }
            }
            .skin-border-${skinId} {
                position: relative;
                box-shadow: 
                    0 8px 32px -4px rgba(${skin.glowRgb}, 0.3),
                    0 16px 48px -8px rgba(${skin.glowRgb}, 0.1),
                    inset 0 1px 1px 0 rgba(255, 255, 255, 0.6);
                background: ${skin.glassBg} !important;
                backdrop-filter: blur(24px) saturate(200%) !important;
            }
            .skin-border-${skinId}::before {
                content: '';
                position: absolute;
                inset: -2px;
                background: ${skin.borderGradient};
                background-size: 200% 200%;
                border-radius: 2.1rem;
                padding: 2px;
                z-index: -1;
                mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                mask-composite: exclude;
                -webkit-mask-composite: destination-out;
                animation: shine-skin 8s linear infinite;
                opacity: 0.8;
            }
        `}</style>
    );
};

const SkinManager: React.FC<SkinManagerProps> = ({ user, mode = 'avatar', children }) => {
    const hpPercent = (user.hp / (user.maxHp || 100)) * 100;
    const isHealthy = hpPercent >= 50;
    const equippedFrameId = (user as any).equippedFrameId;

    if (mode === 'avatar') {
        if (!isHealthy || !equippedFrameId) {
            return (
                <div className={`relative group shrink-0 transition-all duration-500 ${!isHealthy ? 'grayscale-[0.5] contrast-[1.2]' : ''}`}>
                    <div className={`w-16 h-16 lg:w-20 lg:h-20 rounded-full p-1 shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl ${!isHealthy ? 'bg-red-500 animate-pulse border-2 border-red-600/50' : 'bg-gradient-to-tr from-indigo-500 to-purple-500'}`}>
                        <div className="w-full h-full rounded-full overflow-hidden border-4 border-white relative">
                            {children}
                            {!isHealthy && (
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/shattered-glass.png')] opacity-40 pointer-events-none" />
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        switch (equippedFrameId) {
            case 'frame-neo-cyber': return <NeoCyberFrame>{children}</NeoCyberFrame>;
            case 'frame-pastel-dream': return <PastelDreamFrame>{children}</PastelDreamFrame>;
            case 'frame-onyx-luxe': return <OnyxLuxeFrame>{children}</OnyxLuxeFrame>;
            case 'frame-voltage-overdrive': return <VoltageOverdriveFrame>{children}</VoltageOverdriveFrame>;
            case 'frame-zen-harmony': return <ZenHarmonyFrame>{children}</ZenHarmonyFrame>;
            case 'frame-neko-paradise': return <NekoParadiseFrame>{children}</NekoParadiseFrame>;
            default:
                return (
                    <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg">
                        <div className="w-full h-full rounded-full overflow-hidden border-4 border-white">
                            {children}
                        </div>
                    </div>
                );
        }
    }

    return <>{children}</>;
};

export default SkinManager;
