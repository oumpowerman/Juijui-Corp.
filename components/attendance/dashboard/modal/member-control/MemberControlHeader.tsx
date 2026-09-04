import React from 'react';
import { X, Users } from 'lucide-react';

interface MemberControlHeaderProps {
    onClose: () => void;
}

export const MemberControlHeader: React.FC<MemberControlHeaderProps> = ({ onClose }) => {
    return (
        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 via-white to-indigo-50/40">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20 shrink-0">
                    <Users className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                        จัดการสถานะสมาชิก & HP
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                        เปิด-ปิดสถานะพักงาน, ปรับแต่ง HP และตรวจสอบประวัติสถานะสมาชิก
                    </p>
                </div>
            </div>
            <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                title="ปิดหน้าต่าง"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
};
