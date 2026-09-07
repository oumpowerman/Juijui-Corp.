import React from 'react';
import { Clock, ShieldCheck, Tv, MessageSquare, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export type AlertSubTabId = 'TIMING' | 'STATUS_GATE' | 'CHANNEL_SCOPE' | 'LINE_DESTINATION';

interface TabItem {
    id: AlertSubTabId;
    label: string;
    sublabel: string;
    icon: React.ElementType;
    badge?: string;
    color: string;
}

interface ContentAlertSubNavProps {
    activeTab: AlertSubTabId;
    onTabChange: (tab: AlertSubTabId) => void;
    leadMinutes: string;
    requiredStatusCount: number;
    channelScopeCount: string;
}

export const ContentAlertSubNav: React.FC<ContentAlertSubNavProps> = ({
    activeTab,
    onTabChange,
    leadMinutes,
    requiredStatusCount,
    channelScopeCount,
}) => {
    const tabs: TabItem[] = [
        {
            id: 'TIMING',
            label: 'เวลาและเงื่อนไขเตือน',
            sublabel: 'Lead Time & Lookback',
            icon: Clock,
            badge: `${leadMinutes} นาที`,
            color: 'text-purple-600',
        },
        {
            id: 'STATUS_GATE',
            label: 'เกณฑ์สถานะพร้อมลง',
            sublabel: 'Status Gate & Approval',
            icon: ShieldCheck,
            badge: `${requiredStatusCount} สถานะ`,
            color: 'text-emerald-600',
        },
        {
            id: 'CHANNEL_SCOPE',
            label: 'ขอบเขตช่อง & รายการ',
            sublabel: 'Channel & Program Scope',
            icon: Tv,
            badge: channelScopeCount === 'ALL' ? 'ทุกช่อง' : `${channelScopeCount} ช่อง`,
            color: 'text-indigo-600',
        },
        {
            id: 'LINE_DESTINATION',
            label: 'ปลายทาง LINE & เวิร์กโฟลว์',
            sublabel: 'LINE Group & Workflow',
            icon: MessageSquare,
            badge: 'Automation',
            color: 'text-blue-600',
        },
    ];

    return (
        <div id="content-alert-subnav" className="w-full">
            <div className="bg-slate-100/80 p-1.5 rounded-3xl border border-slate-200/80 flex flex-wrap md:flex-nowrap gap-1.5 shadow-2xs backdrop-blur-sm">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onTabChange(tab.id)}
                            className={`relative flex-1 min-w-[160px] py-3 px-4 rounded-2xl transition-all duration-200 text-left flex items-center justify-between gap-3 cursor-pointer group select-none ${
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
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                        isActive
                                            ? 'bg-purple-50 text-purple-600 shadow-xs'
                                            : 'bg-white/80 text-gray-400 group-hover:text-purple-600'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className="truncate">
                                    <div
                                        className={`text-xs font-bold leading-tight truncate ${
                                            isActive ? 'text-gray-900' : 'text-gray-700'
                                        }`}
                                    >
                                        {tab.label}
                                    </div>
                                    <div className="text-[10px] text-gray-400 truncate mt-0.5 font-medium">
                                        {tab.sublabel}
                                    </div>
                                </div>
                            </div>

                            {tab.badge && (
                                <span
                                    className={`relative z-10 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border transition-colors ${
                                        isActive
                                            ? 'bg-purple-100 text-purple-700 border-purple-200'
                                            : 'bg-white text-gray-500 border-gray-200 group-hover:border-purple-200'
                                    }`}
                                >
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
