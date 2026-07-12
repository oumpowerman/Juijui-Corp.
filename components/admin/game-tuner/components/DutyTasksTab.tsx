import React from 'react';
import { Target, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { CollapsibleCard, ConfigSlider, ClipboardCheck } from './SharedComponents';
import { PRETTY_LABELS } from '../utils/tunerHelpers';

interface DutyTasksTabProps {
    handleChange: (section: string, key: string, value: any) => void;
    getFilteredGroupItems: (groupId: string) => any[];
    searchTerm?: string;
}

export const DutyTasksTab: React.FC<DutyTasksTabProps> = ({
    handleChange,
    getFilteredGroupItems,
    searchTerm = ''
}) => {
    const dutyGroupItems = getFilteredGroupItems('DUTY');
    const taskGroupItems = getFilteredGroupItems('TASK');

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Section 1: Duty Responsibility */}
            {dutyGroupItems.length > 0 && (
                <CollapsibleCard
                    title="ระบบจัดเวรทำความสะอาดและหน้าที่รับผิดชอบ (Duty Configs)"
                    description="ตัวปรับรางวัลเมื่อทำเวรเสร็จสิ้น ตัวคูณค่าปรับกรณีละเลยเวร และชั่วโมงผ่อนปรนการยื่นหลักฐานส่งเวร"
                    icon={ClipboardCheck}
                    colorClass="orange"
                    defaultExpanded={!!searchTerm}
                    badgeText={`${dutyGroupItems.length} ตัวแปร`}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dutyGroupItems.map(item => (
                            <ConfigSlider 
                                key={`${item.section}-${item.key}`}
                                label={PRETTY_LABELS[item.key] || item.key} 
                                value={item.value} 
                                min={0} 
                                max={item.key.toLowerCase().includes('xp') ? 1000 : item.key.toLowerCase().includes('hour') ? 48 : 200} 
                                step={item.key.toLowerCase().includes('rate') || item.key.toLowerCase().includes('multiplier') ? 0.1 : 1}
                                unit={item.key.toLowerCase().includes('xp') ? 'XP' : item.key.toLowerCase().includes('coin') ? 'Coins' : item.key.toLowerCase().includes('hour') ? 'ชั่วโมง' : 'ค่าปรับ'}
                                icon={Zap} 
                                color="orange"
                                onChange={(v: number) => handleChange(item.section, item.key, v)}
                            />
                        ))}
                    </div>
                </CollapsibleCard>
            )}

            {/* Section 2: Task Performance */}
            {taskGroupItems.length > 0 && (
                <CollapsibleCard
                    title="การส่งมอบภารกิจและผลสัมฤทธิ์งาน (Task Performance Variables)"
                    description="ปรับสมดุลรางวัลพื้นฐานต่อหนึ่งภารกิจ และบทลงโทษหัก HP/Coins รายวันสะสมกรณียื่นงานล่าช้ากว่ากำหนด"
                    icon={Target}
                    colorClass="rose"
                    defaultExpanded={!!searchTerm}
                    badgeText={`${taskGroupItems.length} ตัวแปร`}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {taskGroupItems.map(item => (
                            <ConfigSlider 
                                key={`${item.section}-${item.key}`}
                                label={PRETTY_LABELS[item.key] || item.key} 
                                value={item.value} 
                                min={0} 
                                max={item.key.toLowerCase().includes('xp') ? 1000 : 200} 
                                step={item.key.toLowerCase().includes('rate') || item.key.toLowerCase().includes('multiplier') ? 0.1 : 1}
                                unit={item.key.toLowerCase().includes('xp') ? 'XP' : item.key.toLowerCase().includes('coin') ? 'Coins' : 'อัตรา'}
                                icon={Zap} 
                                color="rose"
                                onChange={(v: number) => handleChange(item.section, item.key, v)}
                            />
                        ))}
                    </div>
                </CollapsibleCard>
            )}

            {/* Empty State */}
            {dutyGroupItems.length === 0 && taskGroupItems.length === 0 && (
                <div className="text-center py-12 text-slate-400 bg-white/40 rounded-3xl border border-dashed">
                    ไม่พบตัวแปรจัดเวรทำความสะอาดหรือภารกิจงานที่ตรงกับการค้นหา 🧹
                </div>
            )}
        </motion.div>
    );
};
