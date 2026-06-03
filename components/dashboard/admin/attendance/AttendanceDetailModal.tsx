import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Search, UserCheck, Clock, Briefcase, UserX, Users } from 'lucide-react';
import { User } from '../../../../types';
import { supabase } from '../../../../lib/supabase';
import { parseAttendanceMetadata, checkIsLate } from '../../../../lib/attendanceUtils';
import { format } from 'date-fns';
import AttendanceUserRow from './AttendanceUserRow';

interface AttendanceDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    initialTab?: 'ALL' | 'ON_TIME' | 'LATE' | 'LEAVE' | 'ABSENT';
}

const AttendanceDetailModal: React.FC<AttendanceDetailModalProps> = ({ 
    isOpen, 
    onClose, 
    users = [],
    initialTab = 'ALL'
}) => {
    const [todayLogs, setTodayLogs] = useState<any[]>([]);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [startTime, setStartTime] = useState('10:00');
    const [lateBuffer, setLateBuffer] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTabDetail, setActiveTabDetail] = useState<'ALL' | 'ON_TIME' | 'LATE' | 'LEAVE' | 'ABSENT'>(initialTab);

    // Sync state tabs when initialTab overrides it
    useEffect(() => {
        setActiveTabDetail(initialTab);
    }, [initialTab]);

    // Fetch live logs and settings when modal is opened
    useEffect(() => {
        if (!isOpen) return;

        const fetchTodayLogs = async () => {
            setIsLoadingDetail(true);
            try {
                const todayStr = format(new Date(), 'yyyy-MM-dd');
                
                // 1. Fetch live logs for today
                const { data: logsData, error: logsError } = await supabase
                    .from('attendance_logs')
                    .select('*')
                    .eq('date', todayStr);
                
                if (logsError) throw logsError;
                if (logsData) {
                    setTodayLogs(logsData);
                }

                // 2. Fetch work patterns configurations
                const { data: configData } = await supabase
                    .from('master_options')
                    .select('*')
                    .eq('type', 'WORK_CONFIG');

                if (configData) {
                    const start = configData.find((c: any) => c.key === 'START_TIME')?.label || '10:00';
                    const buffer = parseInt(configData.find((c: any) => c.key === 'LATE_BUFFER')?.label || '0');
                    setStartTime(start);
                    setLateBuffer(buffer);
                }
            } catch (e) {
                console.error("Failed to fetch detailed attendance logs and configs:", e);
            } finally {
                setIsLoadingDetail(false);
            }
        };

        fetchTodayLogs();

        // Recalculate or synchronize on realtime events
        const channel = supabase.channel('today_attendance_modal_sync')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'attendance_logs'
            }, () => fetchTodayLogs())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isOpen]);

    // Grouping & calculations for live items
    const detailedUsers = useMemo(() => {
        if (!users || users.length === 0) return [];

        return users
            .filter(u => u.isActive)
            .map(user => {
                const log = todayLogs.find((l: any) => l.user_id === user.id);
                
                let statusClass: 'ON_TIME' | 'LATE' | 'LEAVE' | 'ABSENT' = 'ABSENT';
                let checkInStr = '-';
                let checkOutStr = '-';
                let workTypeDisplay = 'OFFICE';
                let parsedNote: any = { proofUrl: null, location: null, locationName: null, reason: null, cleanNote: '' };

                if (log) {
                    parsedNote = parseAttendanceMetadata(log.note) || {};
                    
                    if (log.status === 'LEAVE' || log.work_type === 'LEAVE') {
                        statusClass = 'LEAVE';
                        workTypeDisplay = 'LEAVE';
                    } else {
                        const isLate = log.status === 'LATE' || (log.check_in_time && checkIsLate(log.check_in_time, startTime, lateBuffer));
                        statusClass = isLate ? 'LATE' : 'ON_TIME';
                        workTypeDisplay = log.work_type || 'OFFICE';
                    }

                    if (log.check_in_time) {
                        const dateObj = new Date(log.check_in_time);
                        checkInStr = dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
                    }
                    if (log.check_out_time) {
                        const dateObj = new Date(log.check_out_time);
                        checkOutStr = dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
                    }
                }

                return {
                    user,
                    log,
                    statusClass,
                    checkInStr,
                    checkOutStr,
                    workTypeDisplay,
                    parsedNote
                };
            });
    }, [users, todayLogs, startTime, lateBuffer]);

    // Live search query matching
    const filteredDetailedUsers = useMemo(() => {
        return detailedUsers.filter(item => {
            const matchesSearch = searchQuery.trim() === '' || 
                item.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.user.position && item.user.position.toLowerCase().includes(searchQuery.toLowerCase())) ||
                item.user.email.toLowerCase().includes(searchQuery.toLowerCase());
                
            const matchesTab = activeTabDetail === 'ALL' || item.statusClass === activeTabDetail;
            return matchesSearch && matchesTab;
        });
    }, [detailedUsers, searchQuery, activeTabDetail]);

    // Dynamically calculate individual tab totals
    const counts = useMemo(() => {
        let all = 0, onTime = 0, late = 0, leave = 0, absent = 0;
        
        detailedUsers.forEach(item => {
            const matchesSearch = searchQuery.trim() === '' || 
                item.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.user.position && item.user.position.toLowerCase().includes(searchQuery.toLowerCase())) ||
                item.user.email.toLowerCase().includes(searchQuery.toLowerCase());
                
            if (matchesSearch) {
                all++;
                if (item.statusClass === 'ON_TIME') onTime++;
                if (item.statusClass === 'LATE') late++;
                if (item.statusClass === 'LEAVE') leave++;
                if (item.statusClass === 'ABSENT') absent++;
            }
        });
        
        return { all, onTime, late, leave, absent };
    }, [detailedUsers, searchQuery]);

    if (!isOpen || typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            
            {/* Modal Box */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="bg-white border border-slate-100 rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden relative z-10"
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-transparent">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                            <span className="p-2.5 bg-indigo-50 text-indigo-500 rounded-2xl border border-indigo-100">
                                <Users className="w-5 h-5" />
                            </span>
                            รายละเอียดการเข้างานประจำวัน (Admin)
                        </h2>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                            ประจำวันที่ {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-full transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                {/* Search & Tabs Controls */}
                <div className="p-6 pb-4 border-b border-slate-100 space-y-4">
                    {/* Search Field */}
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input 
                            type="text"
                            placeholder="ค้นหารายชื่อพนักงาน, ตำแหน่ง, หรืออีเมล..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-10 py-2.5 bg-slate-50/50 border border-slate-100 focus:border-indigo-300 focus:bg-white rounded-2xl text-sm text-slate-700 placeholder-slate-400 outline-none transition-all"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="p-1 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                    
                    {/* Filters Tabs Row */}
                    <div className="flex flex-wrap gap-2">
                        <button 
                            onClick={() => setActiveTabDetail('ALL')}
                            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                                activeTabDetail === 'ALL' 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                                : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
                            }`}
                        >
                            ทั้งหมด
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                activeTabDetail === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                            }`}>
                                {counts.all}
                            </span>
                        </button>
                        
                        <button 
                            onClick={() => setActiveTabDetail('ON_TIME')}
                            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                                activeTabDetail === 'ON_TIME' 
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                                : 'bg-emerald-50/40 text-emerald-700 border-emerald-100 hover:bg-emerald-100/55'
                            }`}
                        >
                            <UserCheck className="w-3.5 h-3.5" />
                            ตรงเวลา
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                activeTabDetail === 'ON_TIME' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                                {counts.onTime}
                            </span>
                        </button>
                        
                        <button 
                            onClick={() => setActiveTabDetail('LATE')}
                            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                                activeTabDetail === 'LATE' 
                                ? 'bg-orange-600 text-white border-orange-600 shadow-sm' 
                                : 'bg-orange-50/40 text-orange-700 border-orange-100 hover:bg-orange-100/55'
                            }`}
                        >
                            <Clock className="w-3.5 h-3.5" />
                            มาสาย
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                activeTabDetail === 'LATE' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-800'
                            }`}>
                                {counts.late}
                            </span>
                        </button>
                        
                        <button 
                            onClick={() => setActiveTabDetail('LEAVE')}
                            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                                activeTabDetail === 'LEAVE' 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                                : 'bg-indigo-50/40 text-indigo-700 border-indigo-100 hover:bg-indigo-100/55'
                            }`}
                        >
                            <Briefcase className="w-3.5 h-3.5" />
                            ลา/WFH
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                activeTabDetail === 'LEAVE' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'
                            }`}>
                                {counts.leave}
                            </span>
                        </button>
                        
                        <button 
                            onClick={() => setActiveTabDetail('ABSENT')}
                            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                                activeTabDetail === 'ABSENT' 
                                ? 'bg-rose-600 text-white border-rose-600 shadow-sm' 
                                : 'bg-rose-50/40 text-rose-700 border-rose-100 hover:bg-rose-100/55'
                            }`}
                        >
                            <UserX className="w-3.5 h-3.5" />
                            ยังไม่เข้างาน
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                activeTabDetail === 'ABSENT' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
                            }`}>
                                {counts.absent}
                            </span>
                        </button>
                    </div>
                </div>
                
                {/* List of Users */}
                <div className="flex-1 overflow-y-auto px-8 py-4 space-y-3 max-h-[50vh]">
                    {isLoadingDetail ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-3">
                            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm font-medium text-slate-400">กำลังดึงข้อมูลรายละเอียดแบบ Real-time...</p>
                        </div>
                    ) : filteredDetailedUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <div className="p-4 bg-slate-50 text-slate-400 rounded-full border border-slate-100">
                                <UserX className="w-8 h-8" />
                            </div>
                            <h4 className="font-bold text-slate-700">ไม่พบรายชื่อในเงื่อนไขที่เลือก</h4>
                            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                                ลองปรับเปลี่ยนคำค้นหาหรือตัวกรอง และตรวจสอบว่าพนักงานมีตัวตนหรือเปิดใช้งานอยู่หรือไม่
                            </p>
                        </div>
                    ) : (
                        filteredDetailedUsers.map((item, index) => (
                            <AttendanceUserRow 
                                key={item.user.id}
                                user={item.user}
                                log={item.log}
                                statusClass={item.statusClass}
                                checkInStr={item.checkInStr}
                                checkOutStr={item.checkOutStr}
                                workTypeDisplay={item.workTypeDisplay}
                                parsedNote={item.parsedNote}
                                index={index}
                            />
                        ))
                    )}
                </div>
                
                {/* Footer */}
                <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        เชื่อมต่อระบบเรียลไทม์กับ Supabase Cloud
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm border border-indigo-700 cursor-pointer text-center"
                    >
                        ปิดหน้ารายละเอียด
                    </button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

export default AttendanceDetailModal;
