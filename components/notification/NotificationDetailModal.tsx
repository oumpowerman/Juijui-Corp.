import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, ArrowRight, ShieldAlert, AlertTriangle, Clock, 
    User, Trophy, HeartCrack, Info, Wallet, Heart, Coins, 
    CheckCircle2, Flame, UserCheck, Eye, Calendar, Sparkles
} from 'lucide-react';
import { AppNotification, Task, ViewMode } from '../../types';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface NotificationDetailModalProps {
    isOpen: boolean;
    notification: AppNotification | null;
    tasks: Task[];
    onClose: () => void;
    onMarkRead: (id: string) => void;
    onNavigate: (view: ViewMode, queryParams?: Record<string, string>) => void;
    onOpenTask: (task: Task) => void;
}

export const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
    isOpen,
    notification,
    tasks,
    onClose,
    onMarkRead,
    onNavigate,
    onOpenTask
}) => {
    if (!isOpen || !notification) return null;

    // --- PARSE DYNAMIC STATS FROM TEXT/METADATA ---
    const stats = useMemo(() => {
        let hp = notification.metadata?.hp || 0;
        let xp = notification.metadata?.xp || 0;
        let coins = notification.metadata?.coins || 0;

        // Parse from message text as fallback
        if (hp === 0) {
            const hpMatch = notification.message.match(/([+-]\d+)\s*HP/i);
            if (hpMatch) hp = parseInt(hpMatch[1], 10);
        }
        if (xp === 0) {
            const xpMatch = notification.message.match(/([+-]\d+)\s*XP/i);
            if (xpMatch) xp = parseInt(xpMatch[1], 10);
        }
        if (coins === 0) {
            const coinsMatch = notification.message.match(/([+-]\d+)\s*(JP|ทอง|Coins|เหรียญ)/i);
            if (coinsMatch) coins = parseInt(coinsMatch[1], 10);
        }

        return { hp, xp, coins };
    }, [notification]);

    // --- CLASSIFICATION & UI VARIABLES ---
    const isUrgent = notification.type === 'OVERDUE' || notification.type === 'GAME_PENALTY' || notification.type === 'SYSTEM_LOCK_PENALTY';
    const isApproval = notification.type === 'APPROVAL_REQ';
    const isFinance = notification.actionLink === 'FINANCE' || notification.title.includes('เงินเดือน');
    
    const categoryType = useMemo(() => {
        if (isUrgent) return { label: 'ด่วน (Urgent)', color: 'bg-red-500 text-white', icon: ShieldAlert };
        if (isApproval) return { label: 'คน (Approval)', color: 'bg-amber-500 text-white', icon: User };
        if (isFinance) return { label: 'การเงิน (Finance)', color: 'bg-emerald-500 text-white', icon: Wallet };
        return { label: 'ระบบ (System)', color: 'bg-indigo-500 text-white', icon: Info };
    }, [isUrgent, isApproval, isFinance]);

    const importance = isUrgent || notification.type === 'DEATH_WARNING' || notification.type === 'NEGLIGENCE' ? 'สูง (High)' : 'ปกติ (Normal)';

    // --- METADATA ENVIRONMENT DETAILS ---
    const parsedEnvironment = useMemo(() => {
        const envDetails: Array<{ label: string; value: string }> = [];

        // Try extracting time if present
        const timeMatch = notification.message.match(/(\d{2}:\d{2})\s*(น\.)?/);
        if (timeMatch) {
            envDetails.push({ label: 'เวลาที่บันทึก', value: `${timeMatch[1]} น.` });
        }

        // Try extracting admin name if present
        const adminMatch = notification.message.match(/(อนุมัติโดย|ผู้ตรวจสอบ|แอดมิน):\s*([ก-๙a-zA-Z\s]+)/);
        if (adminMatch) {
            envDetails.push({ label: 'ผู้ดำเนินงาน', value: adminMatch[2].trim() });
        } else if (notification.message.includes('อนุมัติ')) {
            // Check for patterns like 'Admin approved'
            envDetails.push({ label: 'สถานะดำเนินการ', value: 'ผ่านการอนุมัติโดยฝ่ายบุคคล' });
        }

        // Location indicators
        if (notification.message.includes('นอกพื้นที่') || notification.message.includes('พิกัดภายนอก')) {
            envDetails.push({ label: 'พิกัดการลงเวลา', value: 'ภายนอกพิกัดสำนักงาน (หักคะแนน)' });
        }

        return envDetails;
    }, [notification]);

    // --- MARK READ & CLOSE HANDLER ---
    const handleClose = () => {
        if (notification.id) {
            onMarkRead(notification.id);
        }
        onClose();
    };

    // --- NAVIGATION HANDLER ---
    const handleActionClick = () => {
        // Mark as read first
        if (notification.id) {
            onMarkRead(notification.id);
        }

        // Extract raw request ID if this is an attendance or approval-based notification
        let rawId = '';
        if (notification.id.startsWith('leave_')) {
            rawId = notification.id.replace('leave_', '');
        } else if (notification.taskId) {
            rawId = notification.taskId;
        } else {
            // Look for uuid in notification ID or messages
            const uuidMatch = notification.id.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
            if (uuidMatch) rawId = uuidMatch[0];
        }

        // Handle navigation based on notification criteria
        if (notification.actionLink === 'ATTENDANCE' || isApproval || notification.id.startsWith('leave_')) {
            // Route to Attendance under Approvals tab and highlight card
            onNavigate('ATTENDANCE', { tab: 'APPROVALS', highlightReqId: rawId });
        } else if (notification.actionLink === 'ADMIN_DASHBOARD') {
            onNavigate('DASHBOARD');
        } else if (notification.taskId) {
            const task = tasks.find(t => t.id === notification.taskId);
            if (task) {
                onOpenTask(task);
            } else {
                onNavigate('CALENDAR');
            }
        } else if (notification.actionLink) {
            onNavigate(notification.actionLink as ViewMode);
        } else {
            onNavigate('DASHBOARD');
        }
        onClose();
    };

    // Determine Action Button Label
    const actionLabel = useMemo(() => {
        if (notification.actionLink === 'ATTENDANCE' || isApproval || notification.id.startsWith('leave_')) {
            return 'ตรวจสอบคำขอลงเวลา (Go to Approvals)';
        }
        if (notification.taskId) {
            return 'แก้ไขงาน / ดูรายละเอียดบอร์ด';
        }
        if (notification.actionLink) {
            return `เปิดดูสถิติใน ${notification.actionLink}`;
        }
        return 'ไปยังระบบที่เกี่ยวข้อง';
    }, [notification, isApproval]);

    const CategoryIcon = categoryType.icon;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                {/* Backdrop overlay */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                    onClick={handleClose}
                />

                {/* Main Modal Panel */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
                    className="relative bg-white w-full max-w-lg rounded-[2.5rem] border-4 border-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header Banner - Colored decoration */}
                    <div className={`h-3 w-full bg-gradient-to-r ${isUrgent ? 'from-rose-500 to-red-600' : isApproval ? 'from-amber-400 to-orange-500' : isFinance ? 'from-emerald-400 to-teal-500' : 'from-indigo-500 to-purple-600'}`} />

                    {/* Header Section */}
                    <div className="p-6 pb-4 border-b border-gray-100 flex justify-between items-start">
                        <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Category Badge */}
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide shadow-sm ${categoryType.color}`}>
                                    <CategoryIcon className="w-3.5 h-3.5" />
                                    {categoryType.label}
                                </span>

                                {/* Importance Badge */}
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border shadow-sm ${
                                    importance.includes('สูง') ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-500 border-gray-200'
                                }`}>
                                    <Clock className="w-3.5 h-3.5" />
                                    ความสำคัญ: {importance}
                                </span>
                            </div>

                            <h3 className="text-xl font-extrabold text-gray-900 leading-tight mt-3 break-words">
                                {notification.title}
                            </h3>
                        </div>

                        {/* Close button */}
                        <button 
                            onClick={handleClose}
                            className="p-2.5 rounded-2xl bg-gray-50 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all flex-shrink-0 border border-transparent hover:border-gray-200"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable Body Content */}
                    <div className="p-6 overflow-y-auto space-y-6 flex-1">
                        {/* Message text card */}
                        <div className="bg-slate-50 border border-slate-100 p-5 rounded-3xl relative overflow-hidden shadow-inner">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-slate-100/40 rounded-bl-[3rem] flex items-center justify-center">
                                <Info className="w-5 h-5 text-slate-400" />
                            </div>
                            <p className="text-gray-700 font-medium text-sm leading-relaxed whitespace-pre-wrap relative z-10">
                                {notification.message}
                            </p>
                        </div>

                        {/* Gamification Points Impact (Health / Scorebars) */}
                        {(stats.hp !== 0 || stats.xp !== 0 || stats.coins !== 0) && (
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-500" /> ผลกระทบต่อค่าสเตตัส (Gamification)
                                </h4>

                                <div className="grid grid-cols-1 gap-3">
                                    {/* HP Damage/Gain */}
                                    {stats.hp !== 0 && (
                                        <div className={`p-4 rounded-3xl border flex items-center justify-between ${stats.hp < 0 ? 'bg-rose-50/50 border-rose-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2.5 rounded-2xl ${stats.hp < 0 ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'} shadow-md`}>
                                                    {stats.hp < 0 ? <HeartCrack className="w-5 h-5" /> : <Heart className="w-5 h-5 fill-current" />}
                                                </div>
                                                <div>
                                                    <span className="text-sm font-bold text-gray-800 block">พลังชีวิต (Health Points)</span>
                                                    <span className="text-xs text-gray-500 font-medium">
                                                        {stats.hp < 0 ? 'ถูกลงโทษปรับลดแต้มความปลอดภัย' : 'ได้รับแต้มรักษาวินัยเพิ่ม'}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={`text-lg font-black font-mono px-3 py-1.5 rounded-2xl ${stats.hp < 0 ? 'text-rose-600 bg-rose-100/50' : 'text-emerald-600 bg-emerald-100/50'}`}>
                                                {stats.hp > 0 ? '+' : ''}{stats.hp} HP
                                            </span>
                                        </div>
                                    )}

                                    {/* Coins / JP Points */}
                                    {stats.coins !== 0 && (
                                        <div className="p-4 rounded-3xl border bg-yellow-50/40 border-yellow-100 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md">
                                                    <Coins className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <span className="text-sm font-bold text-gray-800 block">แต้มจ็อบพ้อยท์ (Job Points)</span>
                                                    <span className="text-xs text-gray-500 font-medium">
                                                        {stats.coins > 0 ? 'สะสมเพื่อใช้ซื้อไอเทมหรือแลกสิทธิ์พิเศษ' : 'ถูกหักแต้มวินัยสะสม'}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-lg font-black font-mono text-amber-600 bg-yellow-100/60 px-3 py-1.5 rounded-2xl">
                                                {stats.coins > 0 ? '+' : ''}{stats.coins} JP
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Metadata details list */}
                        {parsedEnvironment.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                    ข้อมูลแวดล้อม (Environment Details)
                                </h4>
                                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 divide-y divide-gray-200/50">
                                    {parsedEnvironment.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0">
                                            <span className="text-xs font-bold text-gray-500">{item.label}</span>
                                            <span className="text-xs font-extrabold text-gray-800 bg-white border border-gray-100 px-3 py-1 rounded-xl shadow-sm">
                                                {item.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Creation Timestamp info */}
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-gray-50/50 px-4 py-3 rounded-2xl border border-gray-100/50 justify-center">
                            <Clock className="w-4 h-4 text-gray-400" />
                            ส่งแจ้งเตือนเมื่อ: {format(new Date(notification.date), "d MMMM yyyy 'เวลา' HH:mm 'น.'", { locale: th })}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleClose}
                            className="flex-1 px-5 py-3.5 bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 rounded-2xl text-xs font-extrabold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                            ปิดหน้าต่าง
                        </button>
                        
                        <button
                            onClick={handleActionClick}
                            className={`flex-2 px-5 py-3.5 text-white rounded-2xl text-xs font-extrabold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg hover:shadow-xl ${
                                isUrgent ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-100' : isApproval ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-100' : isFinance ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                            }`}
                        >
                            <span>{actionLabel}</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
