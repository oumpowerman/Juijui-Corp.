import React from 'react';
import { Radio, Clapperboard, Activity, Users } from 'lucide-react';

export type TabType = 'CHANNELS' | 'FORMATS' | 'STATUSES' | 'ASSIGNEES';

interface FilterTabHeaderProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
    tempChannelIdsCount: number;
    tempFormatsCount: number;
    tempStatusesCount: number;
    tempAssigneesCount?: number;
    handleSelectAllCurrent: () => void;
    handleClearAllCurrent: () => void;
    viewMode?: 'CONTENT' | 'TASK' | 'PLAN';
}

const FilterTabHeader: React.FC<FilterTabHeaderProps> = ({
    activeTab,
    setActiveTab,
    tempChannelIdsCount,
    tempFormatsCount,
    tempStatusesCount,
    tempAssigneesCount = 0,
    handleSelectAllCurrent,
    handleClearAllCurrent,
    viewMode = 'CONTENT'
}) => {
    return (
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50/50 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-1.5 bg-stone-100 p-1 rounded-2xl border border-stone-200/60 shadow-inner">
                {/* Tab: Assignees (Visible in TASK mode or general) */}
                <button
                    onClick={() => setActiveTab('ASSIGNEES')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                        activeTab === 'ASSIGNEES'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                            : 'text-stone-500 hover:text-stone-800 hover:bg-stone-200/50'
                    }`}
                >
                    <Users className="w-3.5 h-3.5" />
                    สมาชิกผู้รับผิดชอบ
                    {tempAssigneesCount > 0 && (
                        <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                            activeTab === 'ASSIGNEES' ? 'bg-indigo-700 text-white' : 'bg-stone-200 text-stone-700'
                        }`}>
                            {tempAssigneesCount}
                        </span>
                    )}
                </button>

                {/* Tab: Channels */}
                <button
                    onClick={() => setActiveTab('CHANNELS')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                        activeTab === 'CHANNELS'
                            ? 'bg-stone-800 text-stone-50 shadow-md shadow-stone-800/10'
                            : 'text-stone-500 hover:text-stone-800 hover:bg-stone-200/50'
                    }`}
                >
                    <Radio className="w-3.5 h-3.5" />
                    ช่องรายการ
                    {tempChannelIdsCount > 0 && (
                        <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                            activeTab === 'CHANNELS' ? 'bg-stone-600 text-stone-100' : 'bg-stone-200 text-stone-700'
                        }`}>
                            {tempChannelIdsCount}
                        </span>
                    )}
                </button>

                {/* Tab: Formats */}
                <button
                    onClick={() => setActiveTab('FORMATS')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                        activeTab === 'FORMATS'
                            ? 'bg-stone-800 text-stone-50 shadow-md shadow-stone-800/10'
                            : 'text-stone-500 hover:text-stone-800 hover:bg-stone-200/50'
                    }`}
                >
                    <Clapperboard className="w-3.5 h-3.5" />
                    รูปแบบเนื้อหา
                    {tempFormatsCount > 0 && (
                        <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                            activeTab === 'FORMATS' ? 'bg-stone-600 text-stone-100' : 'bg-stone-200 text-stone-700'
                        }`}>
                            {tempFormatsCount}
                        </span>
                    )}
                </button>

                {/* Tab: Statuses */}
                <button
                    onClick={() => setActiveTab('STATUSES')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                        activeTab === 'STATUSES'
                            ? 'bg-stone-800 text-stone-50 shadow-md shadow-stone-800/10'
                            : 'text-stone-500 hover:text-stone-800 hover:bg-stone-200/50'
                    }`}
                >
                    <Activity className="w-3.5 h-3.5" />
                    สถานะ
                    {tempStatusesCount > 0 && (
                        <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                            activeTab === 'STATUSES' ? 'bg-stone-600 text-stone-100' : 'bg-stone-200 text-stone-700'
                        }`}>
                            {tempStatusesCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Select/Deselect Active Actions */}
            <div className="flex gap-2 text-xs font-bold">
                <button
                    onClick={handleSelectAllCurrent}
                    className="px-3.5 py-1.5 rounded-xl text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-100/80 border border-stone-200 shadow-sm active:scale-95 transition-all"
                >
                    เลือกทั้งหมด
                </button>
                <button
                    onClick={handleClearAllCurrent}
                    className="px-3.5 py-1.5 rounded-xl text-stone-500 hover:text-stone-800 bg-white hover:bg-stone-100/80 border border-stone-200 shadow-sm active:scale-95 transition-all"
                >
                    ล้างแท็บนี้
                </button>
            </div>
        </div>
    );
};

export default FilterTabHeader;
