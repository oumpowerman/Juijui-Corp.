import React from 'react';
import { TrendingUp, Trophy, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { CollapsibleCard, ConfigSlider } from './SharedComponents';
import { PRETTY_LABELS } from '../utils/tunerHelpers';

interface LevelingKpiTabProps {
    localConfig: any;
    handleChange: (section: string, key: string, value: any) => void;
    getFilteredGroupItems: (groupId: string) => any[];
    match: (key: string, label: string) => boolean;
    searchTerm?: string;
}

export const LevelingKpiTab: React.FC<LevelingKpiTabProps> = ({
    localConfig,
    handleChange,
    getFilteredGroupItems,
    match,
    searchTerm = ''
}) => {
    const growthGroupItems = getFilteredGroupItems('GROWTH');

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Section 1: Growth system */}
            {growthGroupItems.length > 0 && (
                <CollapsibleCard
                    title="ระบบการเติบโตของเลเวลและความยาก (Level Up Rules)"
                    description="ค่าความต้องการพลังงานในการขยับเลเวลสูงสุด โบนัสรางวัลเลเวล และสเกลค่า XP แยกตามความยากภารกิจ"
                    icon={TrendingUp}
                    colorClass="emerald"
                    defaultExpanded={!!searchTerm}
                    badgeText={`${growthGroupItems.length} ตัวแปร`}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {growthGroupItems.map(item => (
                            <ConfigSlider 
                                key={`${item.section}-${item.key}`}
                                label={PRETTY_LABELS[item.key] || item.key} 
                                value={item.value} 
                                min={0} 
                                max={item.key.toLowerCase().includes('max_level') ? 100 : item.key.toLowerCase().includes('level') ? 5000 : 1500} 
                                step={item.key.toLowerCase().includes('level') ? 50 : 5}
                                unit={item.key.toLowerCase().includes('coins') ? 'Coins' : item.key.toLowerCase().includes('level') && !item.key.toLowerCase().includes('max') ? 'XP' : 'เลเวล'}
                                icon={Zap} 
                                color="emerald"
                                onChange={(v: number) => handleChange(item.section, item.key, v)}
                            />
                        ))}
                    </div>
                </CollapsibleCard>
            )}

            {/* Section 2: Weekly KPI Rewards */}
            {localConfig.KPI_REWARDS && (
                <CollapsibleCard
                    title="รางวัลรายสัปดาห์จำแนกตามเกรดประเมินผล (Weekly KPI Grade Rewards)"
                    description="ปรับสมดุลปริมาณเงินปันผล Coins และ XP ที่สมาชิกแต่ละเกรดวินัย (A - F) พึงจะได้รับทุกสัปดาห์"
                    icon={Trophy}
                    colorClass="amber"
                    defaultExpanded={!!searchTerm}
                    badgeText="A, B, C, D, F"
                >
                    <div className="space-y-5">
                        {Object.keys(localConfig.KPI_REWARDS).sort().map(grade => {
                            // filter grade based on search
                            if (!match(grade, `เกรด เกรดระดับ ${grade} Grade`)) return null;
                            
                            return (
                                <div key={grade} className="p-4 bg-white/90 rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-100/80 transition-colors">
                                    <div className="flex items-center gap-1.5 mb-3">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <h5 className="text-xs font-black text-slate-700">ผลประเมิน เกรด {grade}</h5>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <ConfigSlider 
                                            label="รางวัลพลังงาน XP" 
                                            value={localConfig.KPI_REWARDS[grade].xp} 
                                            min={0} max={3000} step={50} unit="XP"
                                            icon={Zap} color="emerald"
                                            onChange={(v) => handleChange('KPI_REWARDS', grade, { ...localConfig.KPI_REWARDS[grade], xp: v })}
                                        />
                                        <ConfigSlider 
                                            label="รางวัลเหรียญ Coins" 
                                            value={localConfig.KPI_REWARDS[grade].coins} 
                                            min={0} max={1500} step={10} unit="Coins"
                                            icon={Zap} color="amber"
                                            onChange={(v) => handleChange('KPI_REWARDS', grade, { ...localConfig.KPI_REWARDS[grade], coins: v })}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CollapsibleCard>
            )}

            {/* Empty State */}
            {growthGroupItems.length === 0 && !localConfig.KPI_REWARDS && (
                <div className="text-center py-12 text-slate-400 bg-white/40 rounded-3xl border border-dashed">
                    ไม่พบข้อมูลตั้งค่าเกณฑ์เลเวลหรือรางวัลเกรดประเมินวินัย 🏆
                </div>
            )}
        </motion.div>
    );
};
