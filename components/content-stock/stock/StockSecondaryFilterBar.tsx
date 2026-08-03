import React from 'react';
import { motion } from 'framer-motion';
import { Film, Landmark, BarChart3, ChevronDown, ListFilter, CalendarRange } from 'lucide-react';
import { MasterOption, Task } from '../../../types';
import MultiSelectFilter from '../../common/MultiSelectFilter';
import { ShootDatePicker } from './ShootDatePicker';
import FilterDropdown from '../../common/FilterDropdown';

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
            className={`w-full ${isOpen ? 'overflow-visible' : 'overflow-hidden'}`}
        >
            <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex flex-col gap-4">
                {/* Header title */}
                <div className="flex items-center gap-1.5 text-slate-400 select-none">
                    <ListFilter className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">ตัวกรองละเอียด (Advanced Filters)</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full overflow-visible pb-1">
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
                        <div className="shrink-0">
                            <FilterDropdown
                                label="ขั้นตอนย่อย: ทั้งหมด"
                                value={filterChecklistProgress}
                                options={[
                                    { key: 'ALL', label: 'ขั้นตอนย่อย: ทั้งหมด' },
                                    { key: 'STEPS_1_3', label: 'ขั้นตอน 1-3 เสร็จสิ้น' },
                                    { key: 'STEPS_4_5', label: 'ขั้นตอน 4-5 เสร็จสิ้น' },
                                    { key: 'COMPLETED', label: 'เสร็จสมบูรณ์ 100%' },
                                    { key: 'INCOMPLETE', label: 'ยังไม่เสร็จสิ้น' },
                                ]}
                                onChange={(val) => setFilterChecklistProgress(val as any)}
                                icon={<ListFilter className="w-3.5 h-3.5" />}
                                activeColorClass="bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm ring-2 ring-indigo-100 ring-offset-1 font-extrabold"
                                showAllOption={false}
                                clearable={false}
                            />
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
