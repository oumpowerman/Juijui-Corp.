import React from 'react';
import { motion } from 'framer-motion';
import { Film, Landmark, BarChart3, ChevronDown, ListFilter, CalendarRange } from 'lucide-react';
import { MasterOption, Task } from '../../../types';
import MultiSelectFilter from '../../common/MultiSelectFilter';
import { ShootDatePicker } from './ShootDatePicker';

interface StockSecondaryFilterBarProps {
    filterFormat: string[];
    setFilterFormat: React.Dispatch<React.SetStateAction<string[]>>;
    filterPillar: string[];
    setFilterPillar: React.Dispatch<React.SetStateAction<string[]>>;
    filterCategory: string[];
    setFilterCategory: React.Dispatch<React.SetStateAction<string[]>>;
    filterStatuses: string[];
    setFilterStatuses: React.Dispatch<React.SetStateAction<string[]>>;
    filterChecklistProgress?: 'ALL' | 'STEPS_1_3' | 'STEPS_4_5' | 'COMPLETED' | 'INCOMPLETE';
    setFilterChecklistProgress?: (val: 'ALL' | 'STEPS_1_3' | 'STEPS_4_5' | 'COMPLETED' | 'INCOMPLETE') => void;
    contentSubTab?: 'ACTIVE' | 'ARCHIVE';
    
    // Date Range
    filterHasShootDate: boolean;
    setFilterHasShootDate: (val: boolean) => void;
    filterShootDateStart: string;
    setFilterShootDateStart: (val: string) => void;
    filterShootDateEnd: string;
    setFilterShootDateEnd: (val: string) => void;

    // Options
    formatOptions: MasterOption[];
    pillarOptions: MasterOption[];
    categoryOptions: MasterOption[];
    statusOptions: MasterOption[];
    
    isOpen: boolean;
    tasks?: Task[];
}

export const StockSecondaryFilterBar: React.FC<StockSecondaryFilterBarProps> = React.memo(({
    filterFormat, setFilterFormat,
    filterPillar, setFilterPillar,
    filterCategory, setFilterCategory,
    filterStatuses, setFilterStatuses,
    filterChecklistProgress = 'ALL',
    setFilterChecklistProgress = () => {},
    contentSubTab = 'ACTIVE',
    
    filterHasShootDate, setFilterHasShootDate,
    filterShootDateStart, setFilterShootDateStart,
    filterShootDateEnd, setFilterShootDateEnd,

    formatOptions,
    pillarOptions,
    categoryOptions,
    statusOptions,
    
    isOpen,
    tasks = []
}) => {
    return (
        <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={isOpen ? { 
                height: 'auto', 
                opacity: 1, 
                marginTop: 16,
                transition: {
                    height: { type: 'spring', stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2, delay: 0.05 }
                }
            } : { 
                height: 0, 
                opacity: 0, 
                marginTop: 0,
                transition: {
                    height: { type: 'spring', stiffness: 300, damping: 30 },
                    opacity: { duration: 0.15 }
                }
            }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            className="overflow-hidden w-full"
        >
            <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex flex-col gap-4">
                {/* Header title */}
                <div className="flex items-center gap-1.5 text-slate-400 select-none">
                    <ListFilter className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">ตัวกรองละเอียด (Advanced Filters)</span>
                </div>

                <div className="flex items-center gap-3 w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-1">
                    {/* Format Filter */}
                    <div className="shrink-0">
                        <MultiSelectFilter 
                            label="Format"
                            values={filterFormat}
                            options={formatOptions}
                            onChange={setFilterFormat}
                            icon={<Film className="w-3.5 h-3.5" />}
                            activeColorClass="bg-pink-50 border-pink-200 text-pink-700 shadow-sm ring-2 ring-pink-100 ring-offset-1 font-extrabold"
                        />
                    </div>

                    {/* Pillar Filter */}
                    <div className="shrink-0">
                        <MultiSelectFilter 
                            label="Pillar"
                            values={filterPillar}
                            options={pillarOptions}
                            onChange={setFilterPillar}
                            icon={<Landmark className="w-3.5 h-3.5" />}
                            activeColorClass="bg-blue-50 border-blue-200 text-blue-700 shadow-sm ring-2 ring-blue-100 ring-offset-1 font-extrabold"
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="shrink-0">
                        <MultiSelectFilter 
                            label="Category"
                            values={filterCategory}
                            options={categoryOptions}
                            onChange={setFilterCategory}
                            icon={<BarChart3 className="w-3.5 h-3.5" />}
                            activeColorClass="bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm ring-2 ring-emerald-100 ring-offset-1 font-extrabold"
                        />
                    </div>

                    {/* Status Multi-Select Filter - Hidden in Archive */}
                    {contentSubTab === 'ACTIVE' && (
                        <div className="shrink-0">
                            <MultiSelectFilter 
                                label="สถานะ"
                                values={filterStatuses}
                                options={statusOptions}
                                onChange={setFilterStatuses}
                                icon={<BarChart3 className="w-3.5 h-3.5" />}
                                activeColorClass="bg-amber-50 border-amber-200 text-amber-700 shadow-sm ring-2 ring-amber-100 ring-offset-1 font-extrabold"
                            />
                        </div>
                    )}

                    {/* Checklist Progress Selection Dropdown */}
                    {contentSubTab === 'ACTIVE' && (
                        <div className="relative shrink-0">
                            <select
                                id="checklist-progress-select-secondary"
                                value={filterChecklistProgress}
                                onChange={(e) => setFilterChecklistProgress(e.target.value as any)}
                                className={`
                                    appearance-none pl-10 pr-10 py-3 rounded-2xl text-sm font-bold border transition-all cursor-pointer active:scale-95 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-300 min-h-[44px]
                                    ${filterChecklistProgress !== 'ALL'
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm ring-2 ring-indigo-100 ring-offset-1 font-extrabold'
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'}
                                `}
                            >
                                <option value="ALL">ขั้นตอนย่อย: ทั้งหมด</option>
                                <option value="STEPS_1_3">ขั้นตอน 1-3 เสร็จสิ้น</option>
                                <option value="STEPS_4_5">ขั้นตอน 4-5 เสร็จสิ้น</option>
                                <option value="COMPLETED">เสร็จสมบูรณ์ 100%</option>
                                <option value="INCOMPLETE">ยังไม่เสร็จสิ้น</option>
                            </select>
                            <div className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none ${filterChecklistProgress !== 'ALL' ? 'text-indigo-600' : 'text-gray-400'}`}>
                                <ListFilter className="w-3.5 h-3.5" />
                            </div>
                            <div className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${filterChecklistProgress !== 'ALL' ? 'text-indigo-600' : 'text-gray-400'}`}>
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                    )}

                    {/* Shoot Date Selector (Direct peer element!) */}
                    <div className="shrink-0">
                        <ShootDatePicker 
                            filterHasShootDate={filterHasShootDate}
                            setFilterHasShootDate={setFilterHasShootDate}
                            filterShootDateStart={filterShootDateStart}
                            setFilterShootDateStart={setFilterShootDateStart}
                            filterShootDateEnd={filterShootDateEnd}
                            setFilterShootDateEnd={setFilterShootDateEnd}
                            tasks={tasks}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

StockSecondaryFilterBar.displayName = 'StockSecondaryFilterBar';
