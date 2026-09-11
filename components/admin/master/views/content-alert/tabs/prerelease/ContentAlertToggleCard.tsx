import React from 'react';
import { Bell, Power } from 'lucide-react';
import { motion } from 'framer-motion';

interface ContentAlertToggleCardProps {
    isEnabled: boolean;
    onToggle: (enabled: boolean) => void;
}

export const ContentAlertToggleCard: React.FC<ContentAlertToggleCardProps> = ({
    isEnabled,
    onToggle,
}) => {
    return (
        <motion.div
            id="content-alert-toggle-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className={`rounded-3xl p-6 border transition-all duration-300 shadow-sm ${
                isEnabled
                    ? 'bg-white border-purple-200/80 shadow-purple-500/5'
                    : 'bg-slate-50/70 border-slate-200 opacity-90'
            }`}
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-4">
                    <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-300 ${
                            isEnabled
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                                : 'bg-slate-200 text-slate-500'
                        }`}
                    >
                        <Bell className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 text-base">
                                ระบบตรวจจับและส่งแจ้งเตือนคิวคลิปผ่าน LINE
                            </h3>
                            <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                                    isEnabled
                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                        : 'bg-gray-100 text-gray-500 border-gray-200'
                                }`}
                            >
                                {isEnabled ? 'เปิดใช้งาน (ACTIVE)' : 'ปิดใช้งาน (OFF)'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            ระบบเบื้องหลังจะสแกนคิวงานจากตารางปฏิทิน และส่งแจ้งเตือนพร้อมปุ่มลัดไปยัง LINE ทันที
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                    <button
                        type="button"
                        onClick={() => onToggle(!isEnabled)}
                        className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 ${
                            isEnabled ? 'bg-purple-600' : 'bg-slate-300'
                        }`}
                        aria-label="Toggle content alert notification system"
                    >
                        <motion.span
                            layout
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 ${
                                isEnabled ? 'translate-x-6' : 'translate-x-0'
                            } flex items-center justify-center`}
                        >
                            <Power
                                className={`w-3.5 h-3.5 ${
                                    isEnabled ? 'text-purple-600' : 'text-slate-400'
                                }`}
                            />
                        </motion.span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
