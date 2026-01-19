
import React from 'react';
import { UserX, LogOut, ShieldAlert } from 'lucide-react';
import { User } from '../types';

interface InactiveScreenProps {
    user: User | null;
    onLogout: () => void;
}

const InactiveScreen: React.FC<InactiveScreenProps> = ({ user, onLogout }) => {
    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
            
            {/* Background pattern */}
            <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#64748b 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>

            <div className="bg-white/90 backdrop-blur-xl border border-white/50 w-full max-w-md rounded-3xl shadow-2xl p-8 relative z-10 text-center animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <UserX className="w-8 h-8 text-gray-500" />
                </div>

                <h1 className="text-2xl font-black text-slate-800 mb-2">บัญชีถูกระงับชั่วคราว 🚫</h1>
                <p className="text-slate-500 mb-8 leading-relaxed">
                    สวัสดีคุณ <span className="font-bold text-slate-700">{user?.name}</span>,<br/>
                    บัญชีของคุณถูกตั้งสถานะเป็น <span className="font-bold text-red-500">Inactive</span> ทำให้ไม่สามารถเข้าถึงข้อมูลงานได้
                </p>

                <div className="bg-red-50 rounded-xl p-4 border border-red-100 mb-8 text-left flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-red-800 mb-1">เกิดอะไรขึ้น?</p>
                        <p className="text-xs text-red-600">อาจเกิดจากการพักงาน, ลาออก, หรือการปรับเปลี่ยนโครงสร้างทีม กรุณาติดต่อ Admin หากคิดว่านี่เป็นข้อผิดพลาด</p>
                    </div>
                </div>

                <button 
                    onClick={onLogout}
                    className="flex items-center justify-center w-full py-3 px-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:text-red-500 transition-colors shadow-sm"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    ลงชื่อออก
                </button>
            </div>
        </div>
    );
};

export default InactiveScreen;
