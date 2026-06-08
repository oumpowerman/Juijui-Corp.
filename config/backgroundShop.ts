import { BackgroundTheme } from '../components/common/AppBackground';

export interface BackgroundConfig {
    id: string;
    name: string;
    description: string;
    price: number;
    rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    theme: BackgroundTheme;
    pattern: 'grid' | 'dots' | 'icons' | 'none';
}

export const BACKGROUND_SHOP_CONFIG: BackgroundConfig[] = [
    {
        id: 'bg-pastel-wave',
        name: '🌊 คลื่นพาสเทล (Pastel Wave)',
        description: 'ธีมคลื่นคลายเหงาระลอกคลื่นสี่สีสลับไหลลื่น สบายอารมณ์',
        price: 0,
        rarity: 'COMMON',
        theme: 'pastel-amber',
        pattern: 'dots'
    },
    {
        id: 'bg-season-summer',
        name: '☀️ รับลมร้อน (Summer Shore)',
        description: 'เปลี่ยนบรรยากาศเป็นซัมเมอร์แสนสดใส มีดวงอาทิตย์และแอนิเมชันพาร์ติเคิลหน้าร้อนสะท้อนระยิบระยับ',
        price: 1500,
        rarity: 'UNCOMMON',
        theme: 'season-summer',
        pattern: 'none'
    },
    {
        id: 'bg-season-snow',
        name: '❄️ ดินแดนพาร์ติเคิลหิมะ (Snowy Holiday)',
        description: 'เติมหิมะโปรยปรายแสนโรแมนติก พร้อมโทนสีฟ้าครามผ่อนคลายสบายตา',
        price: 2500,
        rarity: 'RARE',
        theme: 'season-snow',
        pattern: 'none'
    },
    {
        id: 'bg-season-rain',
        name: '🌧️ หยาดน้ำผึ้งวารี (Rainy Cozy)',
        description: 'ธีมฝนพรำเย็นใจในเฉดสีเดสก์ท็อปมืดอบอุ่น ตกแต่งด้วยสายฝนผ่านผิวจอก๊าซสว่างไสว',
        price: 2000,
        rarity: 'RARE',
        theme: 'season-rain',
        pattern: 'none'
    },
    {
        id: 'bg-season-autumn',
        name: '🍁 ส้มใบไม้ร่วง (Warm Autumn)',
        description: 'ธีมป่าส้มไออุ่นของฤดูใบไม้ร่วง มีใบเมเปิ้ลปลิวไหวเพิ่มสมาธิในการทำงาน',
        price: 3000,
        rarity: 'EPIC',
        theme: 'season-autumn',
        pattern: 'none'
    }
];
