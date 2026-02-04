
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Calendar, ChevronLeft, ChevronRight, CheckCircle2, ArrowUpRight, MonitorPlay, CheckSquare } from 'lucide-react';
import { Task, Channel } from '../../../../types';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { STATUS_COLORS } from '../../../../constants';

interface DoneHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[]; // All completed tasks
    onOpenTask: (task: Task) => void;
}

const ITEMS_PER_PAGE = 10;

const DoneHistoryModal: React.FC<DoneHistoryModalProps> = ({ isOpen, onClose, tasks, onOpenTask }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Filter Logic
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            // 1. Search
            const matchSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
            
            // 2. Date Range (Based on End Date / Completed Date)
            let matchDate = true;
            if (startDate && endDate) {
                const taskDate = new Date(task.endDate);
                matchDate = isWithinInterval(taskDate, {
                    start: startOfDay(new Date(startDate)),
                    end: endOfDay(new Date(endDate))
                });
            }

            return matchSearch && matchDate;
        }).sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()); // Newest first
    }, [tasks, searchQuery, startDate, endDate]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
    const paginatedTasks = filteredTasks.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border-4 border-emerald-50 animate-in zoom-in-95">
                
                {/* Header */}
                <div className="px-8 py-6 bg-emerald-600 text-white shrink-0 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 transform rotate-12">
                        <CheckCircle2 className="w-40 h-40" />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black flex items-center gap-3">
                            <CheckCircle2 className="w-8 h-8 text-emerald-200" />
                            ทำเนียบงานเสร็จ (Done History)
                        </h2>
                        <p className="text-emerald-100 text-sm mt-1 font-medium">รวมผลงานความสำเร็จทั้งหมดของคุณไว้ที่นี่</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors relative z-10">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Filters */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between shrink-0">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="ค้นหาชื่องาน..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
                            value={searchQuery}
                            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                    
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2 gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <input 
                                type="date" 
                                className="text-xs font-bold text-gray-600 outline-none bg-transparent"
                                value={startDate}
                                onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }}
                            />
                            <span className="text-gray-300">-</span>
                            <input 
                                type="date" 
                                className="text-xs font-bold text-gray-600 outline-none bg-transparent"
                                value={endDate}
                                onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                        {(startDate || endDate || searchQuery) && (
                            <button 
                                onClick={() => { setSearchQuery(''); setStartDate(''); setEndDate(''); }}
                                className="px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap"
                            >
                                ล้างตัวกรอง
                            </button>
                        )}
                    </div>
                </div>

                {/* Content List */}
                <div className="flex-1 overflow-y-auto p-6 bg-white space-y-3">
                    {paginatedTasks.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                            <CheckCircle2 className="w-16 h-16 mb-4 text-emerald-200" />
                            <p className="text-lg font-bold">ไม่พบประวัติงาน</p>
                            <p className="text-xs">ลองปรับตัวกรอง หรือคุณอาจจะยังไม่มีงานที่เสร็จในช่วงนี้</p>
                        </div>
                    ) : (
                        paginatedTasks.map(task => {
                            const isContent = task.type === 'CONTENT';
                            return (
                                <div 
                                    key={task.id}
                                    onClick={() => onOpenTask(task)}
                                    className="group flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer bg-white"
                                >
                                    <div className="flex items-start gap-4 overflow-hidden">
                                        {/* Icon Box based on Type */}
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                                            isContent 
                                                ? 'bg-purple-50 text-purple-600 border-purple-100' 
                                                : 'bg-blue-50 text-blue-600 border-blue-100'
                                        }`}>
                                            {isContent ? <MonitorPlay className="w-6 h-6" /> : <CheckSquare className="w-6 h-6" />}
                                        </div>
                                        
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-gray-800 truncate group-hover:text-emerald-700 transition-colors">{task.title}</h4>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded flex items-center">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {format(new Date(task.endDate), 'd MMM yyyy')}
                                                </span>
                                                {task.contentFormat && (
                                                    <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100 font-bold">
                                                        {task.contentFormat}
                                                    </span>
                                                )}
                                                {!isContent && (
                                                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 font-bold">
                                                        TASK
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-gray-300 group-hover:text-emerald-500 transition-colors p-2 rounded-full group-hover:bg-emerald-50">
                                        <ArrowUpRight className="w-5 h-5" />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer Pagination */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                    <span className="text-xs text-gray-500 font-bold">
                        แสดง {paginatedTasks.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredTasks.length)} จาก {filteredTasks.length} รายการ
                    </span>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-4 py-2 bg-white rounded-lg text-xs font-bold text-gray-700 border border-gray-200 shadow-sm flex items-center">
                            หน้า {currentPage} / {totalPages || 1}
                        </span>
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages || 1, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default DoneHistoryModal;
