
import React from 'react';
import { ShieldCheck, Award, Zap, Sparkles, Star } from 'lucide-react';

export interface TierConfig {
    name: string;
    label: string;
    message: string;
    icon: React.ReactNode;
    borderGradient: string;
    bannerGradient: string;
    glowRgb: string; // e.g., "251, 191, 36"
    rayRgb: string;  // e.g., "250, 204, 21"
    textColor: string;
    glassBg: string;
    isMaxHp?: boolean;
}

export const getTierConfig = (hpPercent: number): TierConfig => {
    // 100% - MAX DIVINE
    if (hpPercent === 100) {
        return {
            name: "MAX_DIVINE",
            label: "Absolute Divinity",
            message: "จุติเทพ! พลังชีวิตเต็มแม็กซ์ ไร้เทียมทาน! ✨",
            icon: React.createElement(ShieldCheck, { className: "w-4 h-4 text-white drop-shadow-sm" }),
            borderGradient: "linear-gradient(135deg, #ffc887 0%, #fee18d 20%, #fffdf7 40%, #fee18d 60%, #ffc887 80%, #ffb867 100%)",
            bannerGradient: "from-amber-600 via-yellow-400 to-amber-600",
            glowRgb: "251, 191, 36",
            rayRgb: "250, 204, 21",
            textColor: "text-amber-700",
            glassBg: "rgba(255, 255, 255, 0.7)",
            isMaxHp: true
        };
    }
    
    // 90-99% - DIVINE
    if (hpPercent >= 90) {
        return {
            name: "DIVINE",
            label: "Divine Blessing",
            message: "ออร่าเทพเจ้าแผ่กระจาย! รักษาสุขภาพระดับนี้ไว้ให้ได้นะ! 🌟",
            icon: React.createElement(Sparkles, { className: "w-4 h-4 text-white drop-shadow-sm" }),
            borderGradient: "linear-gradient(135deg, #fbbf24 0%, #fef3c7 25%, #fbbf24 50%, #fef3c7 75%, #fbbf24 100%)",
            bannerGradient: "from-yellow-600 via-amber-400 to-yellow-600",
            glowRgb: "245, 158, 11",
            rayRgb: "251, 191, 36",
            textColor: "text-amber-800",
            glassBg: "rgba(255, 255, 255, 0.75)"
        };
    }

    // 80-89% - ELITE
    if (hpPercent >= 80) {
        return {
            name: "ELITE",
            label: "Elite Status",
            message: "ระดับอีลิท! สุขุม นุ่มลึก พร้อมลุยทุกสถานการณ์! 🥈",
            icon: React.createElement(Award, { className: "w-4 h-4 text-white drop-shadow-sm" }),
            borderGradient: "linear-gradient(135deg, #94a3b8 0%, #f8fafc 25%, #94a3b8 50%, #f8fafc 75%, #94a3b8 100%)",
            bannerGradient: "from-slate-600 via-gray-300 to-slate-600",
            glowRgb: "148, 163, 184",
            rayRgb: "148, 163, 184",
            textColor: "text-slate-700",
            glassBg: "rgba(255, 255, 255, 0.8)"
        };
    }

    // 70-79% - STEADY
    if (hpPercent >= 70) {
        return {
            name: "STEADY",
            label: "Steady Energy",
            message: "พลังกายคงที่! รักษาสมดุลนี้ไว้ งานไหนก็ไม่หวั่น! 🌊",
            icon: React.createElement(Zap, { className: "w-4 h-4 text-white drop-shadow-sm" }),
            borderGradient: "linear-gradient(135deg, #0ea5e9 0%, #e0f2fe 25%, #0ea5e9 50%, #e0f2fe 75%, #0ea5e9 100%)",
            bannerGradient: "from-sky-600 via-cyan-300 to-sky-600",
            glowRgb: "14, 165, 233",
            rayRgb: "14, 165, 233",
            textColor: "text-sky-700",
            glassBg: "rgba(255, 255, 255, 0.85)"
        };
    }

    // 50-69% - BALANCED
    return {
        name: "BALANCED",
        label: "Balanced State",
        message: "สมดุลกำลังดี! ค่อยๆ ก้าวไปข้างหน้าอย่างมั่นคง! ⚖️",
        icon: React.createElement(Star, { className: "w-4 h-4 text-white drop-shadow-sm" }),
        borderGradient: "linear-gradient(135deg, #6366f1 0%, #e0e7ff 25%, #6366f1 50%, #e0e7ff 75%, #6366f1 100%)",
        bannerGradient: "from-indigo-600 via-violet-400 to-indigo-600",
        glowRgb: "99, 102, 241",
        rayRgb: "99, 102, 241",
        textColor: "text-indigo-700",
        glassBg: "rgba(255, 255, 255, 0.9)"
    };
};
