
import React from 'react';
import { Skull, AlertOctagon, ShoppingBag } from 'lucide-react';
import { User } from '../../../../types';

interface DeadStateViewProps {
    user: User;
    onOpenShop: () => void;
    onEditProfile: () => void;
    onOpenDeathHistory: () => void;
}

const DeadStateView: React.FC<DeadStateViewProps> = ({ user, onOpenShop, onEditProfile, onOpenDeathHistory }) => {
    return (
        <div className="bg-slate-900 rounded-[2rem] p-6 shadow-xl border-4 border-red-600 relative overflow-hidden text-white animate-in zoom-in-95 duration-500">
            {/* Scary Background Striping */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#ef4444_10px,#ef4444_20px)] opacity-5 pointer-events-none"></div>
            <button 
                onClick={onOpenDeathHistory}
                className="absolute top-0 right-0 p-8 opacity-20 hover:opacity-40 transition-opacity z-20"
                title="View Death History"
            >
                <Skull className="w-40 h-40 text-red-500" />
            </button>

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                <div className="relative shrink-0">
                    <button 
                        onClick={onOpenDeathHistory}
                        className="w-24 h-24 rounded-full bg-gray-800 grayscale overflow-hidden border-4 border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.6)] group relative"
                        title="View Death History"
                    >
                        <img src={user.avatarUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" alt={user.name} referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Skull className="w-12 h-12 text-red-500 animate-pulse drop-shadow-lg group-hover:scale-110 transition-transform" />
                        </div>
                    </button>
                </div>

                <div className="flex-1">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                        <AlertOctagon className="w-6 h-6 text-red-500 animate-bounce" />
                        <h1 className="text-3xl font-black text-red-500 tracking-widest uppercase drop-shadow-sm">
                            SYSTEM CRITICAL
                        </h1>
                    </div>
                    <p className="text-gray-300 text-sm font-medium mb-6 max-w-xl leading-relaxed">
                        <span className="text-white font-bold">{user.name}</span>, พลังชีวิตของคุณหมดลงแล้ว (0 HP)! <br/>
                        ประสิทธิภาพการทำงานลดลง กรุณาติดต่อฝ่ายบุคคล หรือใช้ไอเทมฟื้นฟูโดยด่วน
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                        <button
                            onClick={onOpenShop}
                            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-900/50 transition-all active:scale-95 flex items-center justify-center gap-2 group"
                        >
                            <ShoppingBag className="w-5 h-5 group-hover:rotate-12 transition-transform" /> 
                            ร้านค้า (กู้ชีพ)
                        </button>
                        <button 
                            onClick={onEditProfile} 
                            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all border border-white/10"
                        >
                            แก้ไขข้อมูล
                        </button>
                    </div>
                </div>

                {/* Minimal Stats for context */}
                <div className="bg-black/40 p-4 rounded-2xl border border-red-500/30 backdrop-blur-sm min-w-[150px]">
                    <div className="text-center">
                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Current Status</p>
                        <p className="text-2xl font-black text-white">EXHAUSTED</p>
                    </div>
                    <div className="w-full h-px bg-red-500/30 my-3"></div>
                    <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                        <span>Wallet</span>
                        <span className="text-yellow-400">{user.availablePoints} JP</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeadStateView;
