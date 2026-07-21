import React from 'react';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';
import { Clock, MessageSquare, CheckCircle2, AlertTriangle, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MatchedOtRequest } from './types';

interface OvertimeLogListProps {
    matchedRequests: MatchedOtRequest[];
    activeFilter?: 'ALL' | 'NORMAL_DAY' | 'HOLIDAY' | 'HOLIDAY_OVERTIME';
    onClearFilter?: () => void;
    onSelectRecord?: (req: MatchedOtRequest) => void;
}

export const OvertimeLogList: React.FC<OvertimeLogListProps> = ({ 
    matchedRequests,
    activeFilter = 'ALL',
    onClearFilter,
    onSelectRecord
}) => {
    return (
        <div className="space-y-3">
            <AnimatePresence mode="popLayout">
                {activeFilter !== 'ALL' && (
                    <motion.div 
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="flex items-center justify-between bg-indigo-50/50 border border-indigo-100/60 rounded-2xl px-4 py-2.5 text-xs text-indigo-700 font-medium text-left"
                    >
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            กำลังแสดงเฉพาะ: {' '}
                            <strong className="font-bold">
                                {activeFilter === 'NORMAL_DAY' && 'วันทำงานปกติ (1.5x)'}
                                {activeFilter === 'HOLIDAY' && 'วันหยุดปกติ (2.0x)'}
                                {activeFilter === 'HOLIDAY_OVERTIME' && 'วันหยุดพิเศษ (3.0x)'}
                            </strong>
                        </span>
                        {onClearFilter && (
                            <button 
                                onClick={onClearFilter}
                                className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 bg-white border border-indigo-100 px-2 py-0.5 rounded-lg shadow-sm active:scale-95 transition-all cursor-pointer"
                            >
                                แสดงทั้งหมด
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-3 relative">
                <AnimatePresence mode="popLayout">
                    {matchedRequests.length > 0 ? (
                        matchedRequests.map((req, index) => {
                            const dateObj = new Date(req.date);
                            
                            // Badge details matching the type
                            const typeConfig = {
                                'NORMAL_DAY': {
                                    badgeBg: 'bg-purple-100 text-purple-600',
                                    label: 'วันทำงานปกติ 1.5x',
                                    dot: 'bg-purple-500',
                                    cardHoverShadow: 'hover:shadow-purple-100/40',
                                    cardHoverBorder: 'hover:border-purple-200',
                                    dateContainer: 'bg-gradient-to-b from-purple-50 to-purple-100/40 border-purple-100/80',
                                    dateDayLabel: 'text-purple-400',
                                    dateDayNum: 'text-purple-600',
                                    payContainer: 'bg-purple-50 text-purple-700 border-purple-100 sm:bg-gradient-to-r sm:from-purple-50 sm:to-purple-100/30',
                                    payIcon: 'text-purple-500'
                                },
                                'HOLIDAY': {
                                    badgeBg: 'bg-amber-100 text-amber-600',
                                    label: 'วันหยุดปกติ 2.0x',
                                    dot: 'bg-amber-500',
                                    cardHoverShadow: 'hover:shadow-amber-100/40',
                                    cardHoverBorder: 'hover:border-amber-200',
                                    dateContainer: 'bg-gradient-to-b from-amber-50 to-amber-100/40 border-amber-100/80',
                                    dateDayLabel: 'text-amber-500',
                                    dateDayNum: 'text-amber-600',
                                    payContainer: 'bg-amber-50 text-amber-700 border-amber-100 sm:bg-gradient-to-r sm:from-amber-50 sm:to-amber-100/30',
                                    payIcon: 'text-amber-500'
                                },
                                'HOLIDAY_OVERTIME': {
                                    badgeBg: 'bg-sky-100 text-sky-600',
                                    label: 'วันหยุดล่วงเวลา 3.0x',
                                    dot: 'bg-sky-500',
                                    cardHoverShadow: 'hover:shadow-sky-100/40',
                                    cardHoverBorder: 'hover:border-sky-200',
                                    dateContainer: 'bg-gradient-to-b from-sky-50 to-sky-100/40 border-sky-100/80',
                                    dateDayLabel: 'text-sky-400',
                                    dateDayNum: 'text-sky-600',
                                    payContainer: 'bg-sky-50 text-sky-700 border-sky-100 sm:bg-gradient-to-r sm:from-sky-50 sm:to-sky-100/30',
                                    payIcon: 'text-sky-500'
                                }
                            }[req.type] || {
                                badgeBg: 'bg-slate-100 text-slate-600',
                                label: 'ล่วงเวลา',
                                dot: 'bg-slate-500',
                                cardHoverShadow: 'hover:shadow-slate-100/40',
                                cardHoverBorder: 'hover:border-slate-200',
                                dateContainer: 'bg-gradient-to-b from-slate-50 to-slate-100/40 border-slate-200/80',
                                dateDayLabel: 'text-slate-400',
                                dateDayNum: 'text-slate-600',
                                payContainer: 'bg-slate-100 text-slate-700 border-slate-200 sm:bg-gradient-to-r sm:from-slate-50 sm:to-slate-100/30',
                                payIcon: 'text-slate-500'
                            };

                            const reqStartStr = req.startTime || '18:30';
                            const reqEndStr = req.endTime || '20:30';

                            const validationConfig = {
                                'OK': {
                                    container: 'bg-emerald-50/50 border-emerald-100/80 text-emerald-800 sm:bg-gradient-to-r sm:from-emerald-50/60 sm:to-emerald-100/10',
                                    icon: 'text-emerald-500'
                                },
                                'EARLY': {
                                    container: 'bg-amber-50/50 border-amber-100/80 text-amber-800 sm:bg-gradient-to-r sm:from-amber-50/60 sm:to-amber-100/10',
                                    icon: 'text-amber-500'
                                },
                                'NOT_FOUND': {
                                    container: 'bg-rose-50/50 border-rose-100/80 text-rose-800 sm:bg-gradient-to-r sm:from-rose-50/60 sm:to-rose-100/10',
                                    icon: 'text-rose-500'
                                }
                            }[req.scanStatus] || {
                                container: 'bg-slate-50/50 border-slate-100 text-slate-800',
                                icon: 'text-slate-500'
                            };

                            return (
                                <motion.div 
                                    key={req.id} 
                                    layout
                                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 280,
                                        damping: 30,
                                        mass: 1,
                                        delay: Math.min(index * 0.03, 0.15) // Micro-stagger for organic flow
                                    }}
                                    className={`flex flex-col p-4 sm:p-5 bg-white rounded-2xl sm:rounded-[2rem] border border-slate-100/80 group shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-lg hover:-translate-y-1 ${typeConfig.cardHoverBorder} ${typeConfig.cardHoverShadow} transition-all duration-300 gap-3 sm:gap-4 ${onSelectRecord ? 'cursor-pointer' : ''}`}
                                     onClick={() => onSelectRecord?.(req)}
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                                        <div className="flex items-center gap-3 sm:gap-4 text-left">
                                            {/* Date Display */}
                                            <div className={`w-12 h-12 sm:w-14 sm:h-14 ${typeConfig.dateContainer} rounded-xl sm:rounded-2xl flex flex-col items-center justify-center border shrink-0 transition-colors duration-300 shadow-sm`}>
                                                <span className={`text-[9px] sm:text-[10px] font-bold ${typeConfig.dateDayLabel} uppercase tracking-wider`}>
                                                    {format(dateObj, 'EEE')}
                                                </span>
                                                <span className={`text-sm sm:text-lg font-bold ${typeConfig.dateDayNum}`}>
                                                    {format(dateObj, 'd')}
                                                </span>
                                            </div>
                                            
                                            {/* Content details */}
                                            <div className="space-y-0.5 sm:space-y-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <p className="text-[11px] sm:text-sm font-semibold text-slate-800 truncate">
                                                        {format(dateObj, 'MMMM yyyy', { locale: th })}
                                                    </p>
                                                    <span className={`px-1.5 py-0.5 rounded-lg text-[8px] sm:text-[10px] font-bold uppercase shrink-0 ${typeConfig.badgeBg} transition-colors duration-300 shadow-sm/5`}>
                                                        {typeConfig.label}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-[10px] sm:text-[11px] text-slate-400 sm:text-slate-500 font-bold sm:font-semibold">
                                                    <span className="flex items-center gap-1 shrink-0">
                                                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" /> 
                                                        ขอ: {reqStartStr} - {reqEndStr} ({req.reqHours.toFixed(2)} ชม.)
                                                    </span>
                                                    {req.reason && (
                                                        <span className="flex items-center gap-1 max-w-[190px] xs:max-w-[220px] sm:max-w-xs truncate text-slate-500 italic font-medium">
                                                            <MessageSquare className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                                            "{req.reason}"
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
 
                                        {/* Hours bubble */}
                                        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                                            <div className="md:hidden text-[10px] text-slate-400 font-bold">ยอดอนุมัติจ่ายจริง</div>
                                            <div className={`px-3 py-1.5 sm:px-4 sm:py-2 ${typeConfig.payContainer} rounded-xl sm:rounded-2xl border font-bold text-[11px] sm:text-xs shadow-sm flex items-center gap-1.5 transition-all duration-300`}>
                                                <ShieldCheck className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${typeConfig.payIcon} group-hover:scale-110 group-hover:rotate-[12deg] transition-transform duration-300`} />
                                                จ่ายจริง: {Number(req.durationHours || 0).toFixed(2)} ชม.
                                            </div>
                                        </div>
                                    </div>
 
                                    {/* Safe Minimum Rule Validation Panel */}
                                    <div className={`mt-2 p-3 sm:p-4 md:p-4.5 rounded-xl sm:rounded-2xl border text-[11px] sm:text-xs font-medium flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 transition-all duration-300 ${validationConfig.container}`}>
                                        <div className="flex items-start sm:items-center gap-2.5 text-left flex-1 min-w-0">
                                            {req.scanStatus === 'OK' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5 sm:mt-0" />}
                                            {req.scanStatus === 'EARLY' && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />}
                                            {req.scanStatus === 'NOT_FOUND' && <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5 sm:mt-0" />}
                                            
                                            <div className="min-w-0">
                                                <p className="text-[11px] sm:text-xs md:text-[13px] font-semibold text-slate-700 tracking-tight leading-snug">{req.checkoutDisplay}</p>
                                                <p className="text-[10px] sm:text-[11px] md:text-xs font-medium leading-relaxed opacity-80 mt-1 sm:mt-1.5 max-w-prose">
                                                    {req.scanStatus === 'OK' && 'เช็คเอาท์ตามจริง ครบกำหนดตามช่วงเวลาที่ขออนุมัติ'}
                                                    {req.scanStatus === 'EARLY' && `กลับก่อนเวลาที่ขอ! เวลาทำ OT สแกนจริงได้เพียง ${req.actualScannedHours.toFixed(2)} ชม.`}
                                                    {req.scanStatus === 'NOT_FOUND' && 'ไม่พบข้อมูลการตอกบัตรเช็คเอาท์ในระบบของวันนี้'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Real-time comparison indicators (Micro-Dashboard Concept) */}
                                        <div className="grid grid-cols-3 sm:flex sm:items-center gap-1.5 sm:gap-2.5 text-[9px] sm:text-[10px] md:text-[11px] font-bold shrink-0 bg-white/70 backdrop-blur-sm p-1.5 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm text-center">
                                            <div className="px-1 py-0.5 sm:px-2.5 sm:py-1 rounded bg-slate-50/40 border border-slate-100/50">
                                                <span className="opacity-60 block text-[8px] sm:text-[9px] uppercase tracking-wider font-semibold text-slate-500 mb-0.5">ขออนุมัติ</span>
                                                <span className="text-slate-700 font-bold text-[10px] sm:text-xs">{req.reqHours.toFixed(2)} ชม.</span>
                                            </div>
                                            <div className="px-1 py-0.5 sm:px-2.5 sm:py-1 rounded border-l border-r border-slate-200/50 sm:border sm:border-slate-100/50 bg-slate-50/40">
                                                <span className="opacity-60 block text-[8px] sm:text-[9px] uppercase tracking-wider font-semibold text-slate-500 mb-0.5">สแกนจริง</span>
                                                <span className="text-slate-700 font-bold text-[10px] sm:text-xs">{req.scanStatus === 'NOT_FOUND' ? '0.00' : req.actualScannedHours.toFixed(2)} ชม.</span>
                                            </div>
                                            <div className="px-1 py-0.5 sm:px-2.5 sm:py-1 rounded bg-indigo-50/50 border border-indigo-100/30">
                                                <span className="text-indigo-600/70 block text-[8px] sm:text-[9px] uppercase tracking-wider font-bold mb-0.5">จ่ายจริง</span>
                                                <span className="font-bold text-indigo-600 text-[10px] sm:text-xs">{Number(req.durationHours || 0).toFixed(2)} ชม.</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-col items-center justify-center py-12 text-purple-300 border-2 border-dashed border-purple-50 rounded-[2.5rem] bg-purple-50/10"
                        >
                            <AlertCircle className="w-8 h-8 text-purple-300 mb-2" />
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">ไม่พบข้อมูลที่ได้รับการอนุมัติ</p>
                            <p className="text-[10px] text-slate-400 mt-1">ไม่มีข้อมูลประวัติทำงานล่วงเวลาที่ได้รับการอนุมัติในเดือนนี้</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

