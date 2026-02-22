
import React from 'react';
import { Task, Channel, User, MasterOption } from '../../../types';
import { StickyNote, MoreHorizontal, CalendarPlus, Tag, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Search, Loader2, Video, Calendar, Users } from 'lucide-react';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import th from 'date-fns/locale/th';
import { motion, AnimatePresence } from 'framer-motion';

interface StockTableProps {
    isLoading: boolean;
    isFiltering?: boolean;
    tasks: Task[];
    channels: Channel[];
    users: User[];
    masterOptions: MasterOption[];
    
    // Sort
    sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
    onSort: (key: any) => void;
    
    // Pagination
    totalCount: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    itemsPerPage: number;

    // Actions
    onEdit: (task: Task) => void;
    onSchedule: (task: Task) => void;
}

const StockTable: React.FC<StockTableProps> = ({ 
    isLoading, isFiltering, tasks, channels, users, masterOptions,
    sortConfig, onSort,
    totalCount, currentPage, onPageChange, itemsPerPage,
    onEdit, onSchedule
}) => {
    
    // --- Helpers derived from Master Data ---
    const formatOptions = masterOptions.filter(o => o.type === 'FORMAT' && o.isActive);
    const pillarOptions = masterOptions.filter(o => o.type === 'PILLAR' && o.isActive);
    const categoryOptions = masterOptions.filter(o => o.type === 'CATEGORY' && o.isActive);
    const statusOptions = masterOptions.filter(o => o.type === 'STATUS' && o.isActive);

    const getFormatLabel = (key?: string) => formatOptions.find(o => o.key === key)?.label || key;
    const getPillarLabel = (key?: string) => pillarOptions.find(o => o.key === key)?.label || key;
    const getCategoryLabel = (key?: string) => categoryOptions.find(o => o.key === key || o.label === key)?.label || key;
    
    const getStatusInfo = (key: string) => {
        const option = statusOptions.find(o => o.key === key);
        if (option) {
            return { 
                label: option.label, 
                color: option.color || 'bg-gray-100 text-gray-600 border-gray-200' 
            };
        }
        return { label: key, color: 'bg-gray-100 text-gray-600 border-gray-200' };
    };

    const getChannel = (channelId: string | undefined) => {
        if (!channelId) return null;
        return channels.find(c => c.id === channelId);
    };

    const renderSortIcon = (key: string) => {
        if (sortConfig?.key !== key) return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
        return sortConfig.direction === 'asc' 
            ? <ArrowUp className="w-3 h-3 ml-1 text-indigo-600" />
            : <ArrowDown className="w-3 h-3 ml-1 text-indigo-600" />;
    };

    const renderUserAvatars = (userIds: string[] | undefined) => {
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return <span className="text-gray-300 text-xs">-</span>;
        }
        
        return (
            <div className="flex justify-center -space-x-1.5">
                {userIds.map(id => {
                    const user = users.find(u => u.id === id);
                    if (!user) return null;
                    return (
                        <div key={id} className="w-8 h-8 rounded-full border-2 border-white ring-1 ring-gray-100 bg-gray-100 shadow-sm flex items-center justify-center overflow-hidden transition-transform hover:scale-110 hover:z-10" title={user.name}>
                            {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover"/> : <span className="text-[9px] font-bold text-gray-500">{user.name.charAt(0).toUpperCase()}</span>}
                        </div>
                    );
                })}
            </div>
        );
    };
    
    // Date Formatter Helper
    const formatDateDisplay = (date: Date | undefined, type: 'PUBLISH' | 'SHOOT') => {
        if (!date) return <span className="text-gray-300 text-xs">-</span>;
        const d = new Date(date);
        
        const isTodayDate = isToday(d);
        const isTmr = isTomorrow(d);
        const isOverdue = isPast(d) && !isTodayDate;

        let colorClass = "text-gray-600";
        if (type === 'PUBLISH') {
             if (isTodayDate) colorClass = "text-orange-600 font-bold";
             else if (isOverdue) colorClass = "text-red-500 font-bold";
        } else {
             // Shoot Date styling
             if (isTodayDate) colorClass = "text-indigo-600 font-bold";
        }

        return (
            <span className={`text-xs ${colorClass}`}>
                {isTodayDate ? 'วันนี้!' : isTmr ? 'พรุ่งนี้' : format(d, 'd MMM yy', { locale: th })}
            </span>
        );
    };

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    if (isLoading || isFiltering) {
        return (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden min-h-[400px] p-16 flex flex-col items-center justify-center text-gray-400">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.3, type: 'spring' }}
                    className="flex flex-col items-center"
                >
                    <div className="relative mb-4">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full animate-ping absolute opacity-20"></div>
                        <div className="w-16 h-16 bg-white rounded-full border-4 border-indigo-100 flex items-center justify-center relative z-10 shadow-sm">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        </div>
                    </div>
                    <p className="font-bold text-gray-400 animate-pulse">กำลังโหลดข้อมูล...</p>
                </motion.div>
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px] p-16 text-center flex flex-col items-center justify-center h-full">
                <Search className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-800">ไม่พบรายการที่ค้นหา 🔍</h3>
                <p className="text-gray-400">ลองเปลี่ยนตัวกรอง หรือเพิ่มรายการใหม่ดูนะครับ</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden min-h-[400px] flex flex-col">
            <div className="overflow-x-auto flex-1 scrollbar-hide">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead>
                        <tr className="bg-gray-50/80 backdrop-blur-sm border-b border-gray-200 text-[12px] font-black text-black-400 uppercase tracking-widest">
                            
                            {/* 1. Title (Widened) */}
                            <th className="px-6 py-4 sticky left-0 z-20 bg-gray-50/95 w-[450px] cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => onSort('title')}>
                                <div className="flex items-center justify-center">หัวข้อคอนเทนต์ 🎬 {renderSortIcon('title')}</div>
                            </th>
                            
                            {/* 2. Status */}
                            <th className="px-4 py-4 w-[140px] text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => onSort('status')}>
                                <div className="flex items-center justify-center">สถานะ 🚦 {renderSortIcon('status')}</div>
                            </th>
                            
                            {/* 3. Publish Date */}
                            <th className="px-4 py-4 w-[120px] text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => onSort('date')}>
                                <div className="flex items-center justify-center">วันลงงาน 📅 {renderSortIcon('date')}</div>
                            </th>
                            
                            {/* 4. Shoot Date */}
                            <th className="px-4 py-4 w-[120px] text-center text-indigo-400">
                                วันถ่ายทำ 🎥
                            </th>
                            
                            {/* 5. People Columns */}
                            <th className="px-2 py-4 w-[70px] text-center">คนคิด 💡</th>
                            <th className="px-2 py-4 w-[70px] text-center">คนตัด ✂️</th>
                            <th className="px-2 py-4 w-[70px] text-center text-indigo-400">คนช่วย 🤝</th>
                            
                            {/* 6. Remark (Shrunk) */}
                            <th className="px-4 py-4 text-center cursor-pointer hover:bg-gray-100 transition-colors w-[150px]" onClick={() => onSort('remark')}>
                                โน้ตย่อ 📝 {renderSortIcon('remark')}
                            </th>
                            
                            {/* 7. Action */}
                            <th className="px-4 py-4 text-center sticky right-0 z-20 bg-gray-50/95 w-[80px]">จัดการ ⚙️</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm relative">
                        <AnimatePresence mode='popLayout'>
                        {tasks.map((task) => {
                            const channel = getChannel(task.channelId);
                            const channelStyle = channel ? channel.color : 'bg-gray-100 text-gray-500 border-gray-200';
                            const statusInfo = getStatusInfo(task.status as string);

                            return (
                                <motion.tr 
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{ duration: 0.2 }}
                                    key={task.id} 
                                    onClick={() => onEdit(task)} 
                                    className="hover:bg-indigo-50 transition-colors group cursor-pointer relative"
                                >
                                    {/* 1. Title */}
                                    <td className="px-6 py-4 sticky left-0 bg-white group-hover:bg-indigo-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] align-top border-r border-transparent group-hover:border-indigo-100 transition-colors">
                                        <div className="font-bold text-gray-800 group-hover:text-indigo-700 line-clamp-2 text-sm leading-snug mb-1.5" title={task.title}>
                                            {task.title}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className={`text-[9px] px-2 py-0.5 rounded border font-bold uppercase tracking-tight ${channelStyle}`}>{channel?.name || '-'}</span>
                                            {task.contentFormat && <span className="text-[9px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 font-bold flex items-center">{getFormatLabel(task.contentFormat)}</span>}
                                            {task.pillar && <span className="text-[9px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-bold flex items-center">{getPillarLabel(task.pillar)}</span>}
                                            {task.category && <span className="text-[9px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 font-bold flex items-center"><Tag className="w-2.5 h-2.5 mr-1 opacity-50" />{getCategoryLabel(task.category)}</span>}
                                        </div>
                                    </td>

                                    {/* 2. Status */}
                                    <td className="px-4 py-4 text-center align-middle">
                                        <span className={`inline-block px-3 py-1.5 rounded-lg text-[10px] font-black border w-full text-center whitespace-nowrap shadow-sm uppercase tracking-wide ${statusInfo.color}`}>
                                            {statusInfo.label}
                                        </span>
                                    </td>

                                    {/* 3. Publish Date */}
                                    <td className="px-4 py-4 text-center align-middle whitespace-nowrap">
                                        {task.isUnscheduled ? (
                                            <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded font-bold">Unscheduled</span>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                {formatDateDisplay(task.endDate, 'PUBLISH')}
                                            </div>
                                        )}
                                    </td>

                                    {/* 4. Shoot Date */}
                                    <td className="px-4 py-4 text-center align-middle whitespace-nowrap">
                                         {task.shootDate ? (
                                             <div className="flex flex-col items-center">
                                                <div className="flex items-center gap-1 text-[10px] text-indigo-500 font-bold bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                                                    <Video className="w-3 h-3" />
                                                    {format(new Date(task.shootDate), 'd MMM')}
                                                </div>
                                             </div>
                                         ) : (
                                             <span className="text-gray-300">-</span>
                                         )}
                                    </td>

                                    {/* 5. People */}
                                    <td className="px-2 py-4 text-center align-middle">{renderUserAvatars(task.ideaOwnerIds)}</td>
                                    <td className="px-2 py-4 text-center align-middle">{renderUserAvatars(task.editorIds)}</td>
                                    <td className="px-2 py-4 text-center align-middle">{renderUserAvatars(task.assigneeIds)}</td>

                                    {/* 6. Remark (Shrunk) */}
                                    <td className="px-4 py-4 text-gray-500 text-xs align-middle">
                                        {task.remark ? (
                                            <div className="flex items-center justify-center group/remark relative">
                                                <div className="bg-yellow-50 text-yellow-600 p-2 rounded-lg cursor-help">
                                                    <StickyNote className="w-4 h-4" />
                                                </div>
                                                {/* Tooltip on Hover */}
                                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-gray-800 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover/remark:opacity-100 transition-opacity pointer-events-none z-50">
                                                    {task.remark}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center text-gray-200">-</div>
                                        )}
                                    </td>

                                    {/* 7. Actions */}
                                    <td className="px-4 py-4 text-right sticky right-0 bg-white group-hover:bg-indigo-50 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] align-middle border-l border-transparent group-hover:border-indigo-100 transition-colors">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); onSchedule(task); }} className="p-2 text-gray-400 hover:text-green-600 hover:bg-white rounded-xl transition-all shadow-sm" title="ลงตาราง">
                                                <CalendarPlus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            );
                        })}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            {totalCount > 0 && (
                <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white sticky bottom-0 z-20">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} Items
                    </div>
                    <div className="flex items-center gap-2 mx-auto sm:mx-0">
                        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-500">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-black text-gray-700 px-3 bg-gray-50 py-1.5 rounded-lg border border-gray-200">
                            Page {currentPage} / {totalPages}
                        </span>
                        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-500">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockTable;
