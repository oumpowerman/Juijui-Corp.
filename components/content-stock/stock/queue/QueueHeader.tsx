import React, { useState, useRef, useEffect } from 'react';
import { 
    ListChecks, 
    PlayCircle, 
    LayoutGrid, 
    List, 
    Clock, 
    Trash2, 
    RotateCcw, 
    MoreVertical, 
    AlertCircle, 
    CheckSquare,
    Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QueueViewMode } from './types';

interface QueueHeaderProps {
    includeScripts: boolean;
    setIncludeScripts: (val: boolean) => void;
    viewMode: QueueViewMode;
    setViewMode: (mode: QueueViewMode) => void;
    totalCount: number;
    finishedCount: number;
    unfinishedCount: number;
    selectedCount: number;
    isBatchProcessing: boolean;
    onBatchProcess: () => void;
    onSortByTime: () => void;
    onClearUnfinished: () => void;
    onClearAll: () => void;
    onSelectAll?: () => void;
    isAllSelected?: boolean;
}

const QueueHeader: React.FC<QueueHeaderProps> = ({
    includeScripts,
    setIncludeScripts,
    viewMode,
    setViewMode,
    totalCount,
    finishedCount,
    unfinishedCount,
    selectedCount,
    isBatchProcessing,
    onBatchProcess,
    onSortByTime,
    onClearUnfinished,
    onClearAll,
    onSelectAll,
    isAllSelected
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative z-20 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/80 backdrop-blur-md p-4 md:p-5 rounded-2xl border border-white/80 shadow-sm">
            {/* Title and Summary Badges */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-md shadow-indigo-100">
                    <ListChecks className="w-5 h-5" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-800">Checklist ถ่ายทำวันนี้</h2>
                        {totalCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {totalCount} รายการ
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium">
                        <span>เสร็จแล้ว <strong className="text-emerald-600 font-bold">{finishedCount}</strong></span>
                        <span>•</span>
                        <span>คงเหลือ <strong className="text-amber-600 font-bold">{unfinishedCount}</strong></span>
                        {selectedCount > 0 && (
                            <>
                                <span>•</span>
                                <span className="text-indigo-600 font-bold">เลือกอยู่ {selectedCount}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions & Controls */}
            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
                {/* Select All Toggle Button (Convenient for mobile/header) */}
                {totalCount > 0 && onSelectAll && (
                    <button
                        onClick={onSelectAll}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm active:scale-95 ${
                            isAllSelected 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-100' 
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                        title={isAllSelected ? 'ยกเลิกการเลือกทั้งหมด' : 'เลือกทั้งหมด'}
                    >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>{isAllSelected ? 'ยกเลิกเลือก' : 'เลือกทั้งหมด'}</span>
                    </button>
                )}

                {/* Sort by Time */}
                {totalCount > 1 && (
                    <button
                        onClick={onSortByTime}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                        title="เรียงตามเวลาที่วางแผนไว้"
                    >
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>เรียงตามเวลา</span>
                    </button>
                )}

                {/* View Switcher */}
                <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
                    <button
                        onClick={() => setViewMode('GRID')}
                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'GRID' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        title="มุมมองการ์ด"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('TABLE')}
                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'TABLE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        title="มุมมองตาราง"
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>

                {/* Filter Switcher */}
                <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
                    <button 
                        onClick={() => setIncludeScripts(true)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${includeScripts ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        รวมสคริปต์
                    </button>
                    <button 
                        onClick={() => setIncludeScripts(false)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${!includeScripts ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        เฉพาะสต็อก
                    </button>
                </div>

                {/* Quick Action: Clear Unfinished Shortcut Button */}
                {unfinishedCount > 0 && totalCount > 0 && (
                    <button
                        onClick={onClearUnfinished}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                        title="นำรายการที่ยังถ่ายไม่เสร็จออกจากคิวทั้งหมดในคลิกเดียว"
                    >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                        <span>ล้างที่ยังไม่เสร็จ ({unfinishedCount})</span>
                    </button>
                )}

                {/* Quick Menu / More Options Dropdown */}
                {totalCount > 0 && (
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setIsMenuOpen(prev => !prev)}
                            className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all shadow-sm"
                            title="ตัวเลือกเพิ่มเติม"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>

                        <AnimatePresence>
                            {isMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 space-y-1"
                                >
                                    {unfinishedCount > 0 && (
                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                onClearUnfinished();
                                            }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 rounded-xl transition-colors text-left"
                                        >
                                            <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
                                            <div>
                                                <p>ล้างรายการที่ยังไม่เสร็จ</p>
                                                <p className="text-[10px] text-amber-600/70 font-normal">นำ {unfinishedCount} รายการออกจากคิว</p>
                                            </div>
                                        </button>
                                    )}

                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            onClearAll();
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left"
                                    >
                                        <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
                                        <div>
                                            <p>ล้างคิวถ่ายทำทั้งหมด</p>
                                            <p className="text-[10px] text-rose-500/70 font-normal">นำทั้ง {totalCount} รายการออกจากคิว</p>
                                        </div>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Batch Process Completed Items */}
                {finishedCount > 0 && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={onBatchProcess}
                        disabled={isBatchProcessing}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 ml-auto lg:ml-0"
                    >
                        <PlayCircle className="w-4 h-4" />
                        <span>ประมวลผลที่เสร็จแล้ว ({finishedCount})</span>
                    </motion.button>
                )}
            </div>
        </div>
    );
};

export default QueueHeader;
