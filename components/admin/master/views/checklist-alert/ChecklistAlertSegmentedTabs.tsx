import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Activity, Sliders, ShieldCheck } from 'lucide-react';
import { ChecklistAlertSubTab } from './types';

interface ChecklistAlertSegmentedTabsProps {
    activeTab: ChecklistAlertSubTab;
    onTabChange: (tab: ChecklistAlertSubTab) => void;
    pendingCount: number;
    alertTime: string;
    isEnabled: boolean;
}

export const ChecklistAlertSegmentedTabs: React.FC<ChecklistAlertSegmentedTabsProps> = ({
    activeTab,
    onTabChange,
    pendingCount,
    alertTime,
    isEnabled
}) => {
    const tabs: Array<{
        id: ChecklistAlertSubTab;
        label: string;
        icon: React.ComponentType<{ className?: string }>;
        badge?: React.ReactNode;
    }> = [
        {
            id: 'SCHEDULE',
            label: 'เวลา & สวิตช์หลัก',
            icon: Clock,
            badge: (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                }`}>
                    {isEnabled ? `${alertTime} น.` : 'ปิด'}
                </span>
            )
        },
        {
            id: 'LIVE_MONITOR',
            label: 'สถานะงานค้างตรวจ',
            icon: Activity,
            badge: (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    pendingCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                    {pendingCount > 0 ? `${pendingCount} หัวข้อ` : 'ครบถ้วน'}
                </span>
            )
        },
        {
            id: 'ADVANCED',
            label: 'กลุ่ม LINE & รอบตรวจ',
            icon: Sliders
        }
    ];

    return (
        <div className="flex items-center justify-center sm:justify-start">
            <div className="inline-flex items-center gap-1 p-1.5 rounded-[22px] bg-slate-900/[0.04] backdrop-blur-xl border border-white/80 shadow-inner max-w-full overflow-x-auto">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onTabChange(tab.id)}
                            className={`relative px-4 sm:px-5 py-2.5 rounded-[18px] text-xs font-bold transition-colors select-none cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                                isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {/* iOS Active Sliding Pill with Smooth Spring */}
                            {isActive && (
                                <motion.div
                                    layoutId="checklist-active-tab-pill"
                                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                                    className="absolute inset-0 bg-white rounded-[18px] shadow-sm border border-slate-200/60"
                                />
                            )}

                            <span className="relative z-10 flex items-center gap-2">
                                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span>{tab.label}</span>
                                {tab.badge}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
