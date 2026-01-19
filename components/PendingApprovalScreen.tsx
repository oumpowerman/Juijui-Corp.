
import React from 'react';
import { Lock, LogOut, Clock, ShieldCheck } from 'lucide-react';
import { User } from '../types';

interface PendingApprovalScreenProps {
    user: User | null;
    onLogout: () => void;
}

const PendingApprovalScreen: React.FC<PendingApprovalScreenProps> = ({ user, onLogout }) => {
    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
            
            {/* Background pattern */}
            <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#4f46e5 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>

            <div className="bg-white/80 backdrop-blur-xl border border-white/50 w-full max-w-md rounded-3xl shadow-2xl p-8 relative z-10 text-center animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
                    <Lock className="w-8 h-8 text-orange-500" />
                </div>

                <h1 className="text-2xl font-black text-slate-800 mb-2">รออนุมัติการเข้าใช้งาน 🔒</h1>
                <p className="text-slate-500 mb-8 leading-relaxed">
                    สวัสดีคุณ <span className="font-bold text-slate-700">{user?.name}</span>,<br/>
                    บัญชีของคุณถูกสร้างเรียบร้อยแล้ว แต่ต้องรอให้ <span className="font-bold text-indigo-600">CEO (Admin)</span> อนุมัติก่อนนะครับ ถึงจะเข้าใช้งานระบบได้
                </p>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-8 text-left space-y-3">
                    <div className="flex items-center text-sm text-slate-600">
                        <Clock className="w-4 h-4 mr-3 text-slate-400" />
                        <span>สถานะ: <span className="font-bold text-orange-500">กำลังตรวจสอบ (Pending)</span></span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                        <ShieldCheck className="w-4 h-4 mr-3 text-slate-400" />
                        <span>Role เริ่มต้น: <span className="font-bold">Member</span></span>
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

export default PendingApprovalScreen;
