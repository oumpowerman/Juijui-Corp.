
export interface FrameConfig {
    id: string;
    name: string;
    description: string;
    price: number;
    rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    theme: string;
}

export const FRAME_SHOP_CONFIG: FrameConfig[] = [
    {
        id: 'frame-neo-cyber',
        name: '🌌 NEO-CYBER',
        description: 'Advanced HUD interface with digital pulse effects.',
        price: 2500,
        rarity: 'RARE',
        theme: 'sci-fi'
    },
    {
        id: 'frame-pastel-dream',
        name: '🎀 PASTEL DREAM',
        description: 'Cute Sakura pink frame with floating hearts and clouds.',
        price: 1200,
        rarity: 'UNCOMMON',
        theme: 'cute'
    },
    {
        id: 'frame-onyx-luxe',
        name: '🌑 ONYX LUXE',
        description: 'Premium matte black with shimmering rose gold borders.',
        price: 5000,
        rarity: 'EPIC',
        theme: 'premium'
    },
    {
        id: 'frame-voltage-overdrive',
        name: '⚡ VOLTAGE OVERDRIVE',
        description: 'High-energy neon violet and electric yellow with lightning.',
        price: 3500,
        rarity: 'RARE',
        theme: 'cyberpunk'
    },
    {
        id: 'frame-zen-harmony',
        name: '🌿 ZEN HARMONY',
        description: 'Minimalist white with breathing green Emerald leaves.',
        price: 10000,
        rarity: 'LEGENDARY',
        theme: 'nature'
    }
];
