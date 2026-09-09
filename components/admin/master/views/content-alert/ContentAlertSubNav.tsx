import React from 'react';
import { Clock, Sunrise, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { AlertSubTabId, ContentAlertSubNavProps } from './types';

export type { AlertSubTabId, ContentAlertSubNavProps };

interface TabItem {
    id: AlertSubTabId;
    label: string;
    sublabel: string;
    icon: React.ElementType;
    badge?: string;
    color: string;
}

export const ContentAlertSubNav: React.FC<ContentAlertSubNavProps> = ({
    activeTab,
    onTabChange,
    leadMinutes,
    dailyAlertTime,
    isDailyAlertEnabled,
    requiredStatusCount,
    channelScopeCount,
    isPreReleaseEnabled,
    excludedStatusCount,
}) => {
    const tabs: TabItem[] = [
        {
            id: 'PRE_RELEASE',
            label: '1. เตือนก่อนคลิปลง',
            sublabel: 'Pre-Release Alert (Realtime)',
            icon: Clock,
            badge: isPreReleaseEnabled ? `${leadMinutes} นาที • ${requiredStatusCount} สถานะพร้อม` : 'ปิดใช้งาน',
            color: 'text-purple-600',
        },
        {
            id: 'DAILY_SUMMARY',
            label: '2. สรุปค้างลงประจำเช้า',
            sublabel: 'Daily Overdue Summary (Cron)',
            icon: Sunrise,
            badge: isDailyAlertEnabled ? `${dailyAlertTime} น. • ยกเว้น ${excludedStatusCount} สถานะ` : 'ปิดใช้งาน',
            color: 'text-amber-600',
        },
        {
            id: 'LINE_INTEGRATION',
            label: '3. ปลายทาง LINE & ทดสอบ',
            sublabel: 'LINE Target & Live Testing',
            icon: MessageSquare,
            badge: 'พร้อมทดสอบ ⚡',
            color: 'text-blue-600',
        },
    ];

    return (
        <div id="content-alert-subnav" className="w-full">
            <div className="bg-slate-100/80 p-1.5 rounded-3xl border border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-2 shadow-2xs backdrop-blur-sm">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onTabChange(tab.id)}
                            className={`relative w-full py-3.5 px-4 rounded-2xl transition-all duration-200 text-left flex items-center justify-between gap-3 cursor-pointer group select-none ${
                                isActive
                                    ? 'text-gray-900 shadow-md'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                            }`}
                        >
                            {/* Active Tab Background Card Animation */}
                            {isActive && (
                                <motion.div
                                    layoutId="active-alert-tab-bg"
                                    className="absolute inset-0 bg-white rounded-2xl border border-purple-200/80 shadow-sm"
                                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                                />
                            )}

                            <div className="relative z-10 flex items-center gap-3 min-w-0">
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                        isActive
                                            ? 'bg-purple-50 text-purple-600 shadow-xs'
                                            : 'bg-white/80 text-gray-400 group-hover:text-purple-600'
                                    }`}
                                >
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold text-sm truncate text-gray-900">
                                        {tab.label}
                                    </div>
                                    <div className="text-[11px] text-gray-500 truncate">
                                        {tab.sublabel}
                                    </div>
                                </div>
                            </div>

                            {tab.badge && (
                                <div className="relative z-10 shrink-0">
                                    <span
                                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                                            isActive
                                                ? 'bg-purple-100 text-purple-800 border-purple-200'
                                                : 'bg-slate-200/60 text-gray-600 border-slate-300/60'
                                        }`}
                                    >
                                        {tab.badge}
                                    </span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
