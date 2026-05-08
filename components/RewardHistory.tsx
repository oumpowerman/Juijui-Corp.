
import React from 'react';
import { createPortal } from 'react-dom';
import { Redemption } from '../types';
import { X, History, User, CheckCircle2, Clock, Ban, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';

interface RewardHistoryProps {
    redemptions: (Redemption & { user?: any })[];
    onClose: () => void;
    isAdmin: boolean;
    onUpdateStatus?: (id: string, status: 'APPROVED' | 'REJECTED') => void;
}

const RewardHistory: React.FC<RewardHistoryProps> = ({ redemptions, onClose, isAdmin, onUpdateStatus }) => {
    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return { label: 'อนุมัติแล้ว', color: 'text-emerald-600 bg-emerald-50', icon: <CheckCircle2 className="w-3 h-3" /> };
            case 'REJECTED':
                return { label: 'ไม่อนุมัติ', color: 'text-red-600 bg-red-50', icon: <Ban className="w-3 h-3" /> };
            case 'USED':
                return { label: 'รอตรวจสอบ', color: 'text-amber-600 bg-amber-50', icon: <Clock className="w-3 h-3" /> };
            case 'OWNED':
                return { label: 'ยังไม่ใช้งาน', color: 'text-blue-600 bg-blue-50', icon: <AlertCircle className="w-3 h-3" /> };
            default:
                return { label: status, color: 'text-gray-600 bg-gray-50', icon: <History className="w-3 h-3" /> };
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 border-b-8 border-purple-100">
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <History className="w-6 h-6 text-purple-600" /> 
                            ประวัติการแลกสวัสดิการ
                        </h3>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Redemption & Usage History</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30 scrollbar-thin">
                    {redemptions.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <History className="w-10 h-10 opacity-20" />
                            </div>
                            <p className="font-medium">ยังไม่มีประวัติการแลกตอนนี้ครับ</p>
                        </div>
                    ) : (
                        redemptions.map(record => {
                            const rewardTitle = record.rewardSnapshot?.title || 'Unknown Reward';
                            const cost = record.rewardSnapshot?.cost || 0;
                            const statusInfo = getStatusInfo(record.status || 'OWNED');
                            
                            return (
                                <div key={record.id} className="bg-white border border-gray-100 p-5 rounded-[1.5rem] shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-3xl group-hover:bg-purple-100 transition-colors shrink-0">
                                                {record.rewardSnapshot?.icon || '🎁'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="font-black text-gray-800 text-lg leading-tight">{rewardTitle}</h4>
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 border ${statusInfo.color}`}>
                                                        {statusInfo.icon} {statusInfo.label}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col text-xs text-gray-400 font-medium mt-1">
                                                    <span>แลกเมื่อ: {format(record.redeemedAt, 'd MMM yyyy HH:mm', { locale: th })}</span>
                                                    {record.usedAt && (
                                                        <span className="text-amber-600 font-bold">ใช้เมื่อ: {format(record.usedAt, 'd MMM yyyy HH:mm', { locale: th })}</span>
                                                    )}
                                                    {isAdmin && record.user && (
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden border border-indigo-200">
                                                                {record.user.avatarUrl ? (
                                                                    <img src={record.user.avatarUrl} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <User className="w-3 h-3 text-indigo-600" />
                                                                )}
                                                            </div>
                                                            <span className="text-indigo-600 font-black">{record.user.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            <div className="text-right">
                                                <span className="text-xl font-black text-red-500">-{cost.toLocaleString()}</span>
                                                <span className="text-[10px] text-gray-400 block uppercase font-black tracking-tighter">Points Spent</span>
                                            </div>

                                            {isAdmin && record.status === 'USED' && onUpdateStatus && (
                                                <div className="flex gap-2 mt-2">
                                                    <button 
                                                        onClick={() => onUpdateStatus(record.id, 'APPROVED')}
                                                        className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                                                    >
                                                        อนุมัติ ✅
                                                    </button>
                                                    <button 
                                                        onClick={() => onUpdateStatus(record.id, 'REJECTED')}
                                                        className="px-4 py-1.5 bg-red-100 text-red-600 rounded-xl text-[10px] font-black hover:bg-red-200 transition-all"
                                                    >
                                                        ปฏิเสธ ❌
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(modalContent, document.body);
};

export default RewardHistory;
