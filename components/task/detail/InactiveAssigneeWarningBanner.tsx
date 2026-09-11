import React from 'react';
import { AlertTriangle, Edit3, UserX } from 'lucide-react';
import { motion } from 'framer-motion';

export interface InactiveUserItem {
    id: string;
    name: string;
    avatarUrl?: string;
    roleLabel?: string;
}

interface InactiveAssigneeWarningBannerProps {
    inactiveUsers: InactiveUserItem[];
    onEdit?: () => void;
}

export const InactiveAssigneeWarningBanner: React.FC<InactiveAssigneeWarningBannerProps> = ({
    inactiveUsers,
    onEdit,
}) => {
    if (!inactiveUsers || inactiveUsers.length === 0) return null;

    return (
        <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50/95 border-2 border-amber-300 rounded-[2rem] p-4 sm:p-5 text-amber-900 shadow-sm relative overflow-hidden"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                    <div className="p-2.5 bg-amber-200/90 rounded-2xl text-amber-800 shrink-0 mt-0.5 shadow-sm">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider bg-amber-200 text-amber-950 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                                <UserX className="w-3.5 h-3.5" />
                                พบผู้รับผิดชอบพ้นสภาพ (Inactive)
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-amber-950">
                            {inactiveUsers.map((u, i) => (
                                <span key={u.id}>
                                    {i > 0 && ', '}
                                    <span className="text-amber-800 font-extrabold">{u.name}</span>
                                    {u.roleLabel && <span className="text-amber-700 font-normal text-xs ml-1">({u.roleLabel})</span>}
                                </span>
                            ))}
                            <span className="font-normal text-amber-800 block sm:inline sm:ml-2 text-xs sm:text-sm">
                                (พ้นสภาพ/ไม่ Active แล้ว - กรุณากดแก้ไขเพื่อเปลี่ยนหรือปลดชื่อผู้รับผิดชอบ)
                            </span>
                        </p>
                    </div>
                </div>

                {onEdit && (
                    <button
                        type="button"
                        onClick={onEdit}
                        className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap self-start sm:self-center"
                    >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>กดแก้ไขเพื่อเปลี่ยนคนรับผิดชอบ</span>
                    </button>
                )}
            </div>
        </motion.div>
    );
};

export default InactiveAssigneeWarningBanner;
