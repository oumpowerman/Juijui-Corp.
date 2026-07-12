import React from 'react';
import { Gavel, ShieldAlert, ShieldQuestion, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { CollapsibleCard, ConfigSlider } from './SharedComponents';
import { PRETTY_LABELS } from '../utils/tunerHelpers';

interface LawTribunalTabProps {
    handleChange: (section: string, key: string, value: any) => void;
    getFilteredGroupItems: (groupId: string) => any[];
    uncategorizedConfigs: any[];
    searchTerm?: string;
}

export const LawTribunalTab: React.FC<LawTribunalTabProps> = ({
    handleChange,
    getFilteredGroupItems,
    uncategorizedConfigs,
    searchTerm = ''
}) => {
    const tribunalGroupItems = getFilteredGroupItems('TRIBUNAL');
    const systemGroupItems = getFilteredGroupItems('SYSTEM');

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Section 1: Tribunal Rules */}
            {tribunalGroupItems.length > 0 && (
                <CollapsibleCard
                    title="ระบบศาลสภาวินัยและการไต่สวน (Tribunal Penalties & Rewards)"
                    description="การปรับสมดุลรางวัล HP และแต้มศาลสำหรับผู้ช่วยกวดขันวินัย พร้อมโทษสำหรับเคสแจ้งเหตุเท็จ"
                    icon={Gavel}
                    colorClass="amber"
                    defaultExpanded={!!searchTerm}
                    badgeText={`${tribunalGroupItems.length} ตัวแปร`}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tribunalGroupItems.map(item => (
                            <ConfigSlider 
                                key={`${item.section}-${item.key}`}
                                label={PRETTY_LABELS[item.key] || item.key} 
                                value={item.value} 
                                min={0} 
                                max={150} 
                                step={1}
                                unit={item.key.toLowerCase().includes('points') ? 'แต้ม' : 'HP'}
                                icon={Zap} 
                                color="amber"
                                onChange={(v: number) => handleChange(item.section, item.key, v)}
                            />
                        ))}
                    </div>
                </CollapsibleCard>
            )}

            {/* Section 2: AI Automations */}
            {systemGroupItems.length > 0 && (
                <CollapsibleCard
                    title="ระบบ AI ตรวจตราและอัตราภาษีความเพิกเฉย (AI & Automation Mechanics)"
                    description="พารามิเตอร์ตรวจสอบประวัติย้อนหลังของ AI โทษวินัยเพิกเฉยงาน และอัตราภาษีนำส่งร้านค้าอุปกรณ์"
                    icon={ShieldAlert}
                    colorClass="slate"
                    defaultExpanded={!!searchTerm}
                    badgeText={`${systemGroupItems.length} ตัวแปร`}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {systemGroupItems.map(item => (
                            <ConfigSlider 
                                key={`${item.section}-${item.key}`}
                                label={PRETTY_LABELS[item.key] || item.key} 
                                value={item.value} 
                                min={0} 
                                max={item.key.toLowerCase().includes('percent') || item.key.toLowerCase().includes('rate') ? 100 : item.key.toLowerCase().includes('days') ? 90 : 150} 
                                step={item.key.toLowerCase().includes('percent') || item.key.toLowerCase().includes('rate') ? 1 : 1}
                                unit={item.key.toLowerCase().includes('percent') || item.key.toLowerCase().includes('tax') ? '%' : item.key.toLowerCase().includes('days') ? 'วัน' : 'HP'}
                                icon={Zap} 
                                color="slate"
                                onChange={(v: number) => handleChange(item.section, item.key, v)}
                            />
                        ))}
                    </div>
                </CollapsibleCard>
            )}

            {/* Uncategorized Configs */}
            {uncategorizedConfigs.length > 0 && (
                <CollapsibleCard
                    title="พารามิเตอร์เสริมอื่นๆ (Safety Net Configs)"
                    description="ตัวแปรใหม่ที่ยังไม่ได้จัดหมวดหมู่ระบบ เพื่อให้มั่นใจว่าคุณยังคงควบคุมพฤติกรรมได้ทุกตัว"
                    icon={ShieldQuestion}
                    colorClass="slate"
                    defaultExpanded={!!searchTerm}
                    badgeText={`${uncategorizedConfigs.length} ตัวแปร`}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {uncategorizedConfigs.map(item => (
                            <ConfigSlider 
                                key={`${item.section}-${item.key}`}
                                label={PRETTY_LABELS[item.key] || item.key} 
                                value={item.value} 
                                min={0} 
                                max={500} 
                                step={1}
                                unit="ค่าตั้ง"
                                icon={Zap} 
                                color="slate"
                                onChange={(v: number) => handleChange(item.section, item.key, v)}
                            />
                        ))}
                    </div>
                </CollapsibleCard>
            )}

            {/* Empty State */}
            {tribunalGroupItems.length === 0 && systemGroupItems.length === 0 && uncategorizedConfigs.length === 0 && (
                <div className="text-center py-12 text-slate-400 bg-white/40 rounded-3xl border border-dashed">
                    ไม่พบข้อมูลตั้งค่าระบบศาลและระบบ AI อัตโนมัติที่สอดคล้อง ⚖️
                </div>
            )}
        </motion.div>
    );
};
