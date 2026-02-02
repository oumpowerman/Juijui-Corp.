
import React from 'react';
import { Redemption } from '../types';
import { X, History, User } from 'lucide-react';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';

interface RewardHistoryProps {
    redemptions: (Redemption & { user?: any })[];
    onClose: () => void;
    isAdmin: boolean;
}

const RewardHistory: React.FC<RewardHistoryProps> = ({ redemptions, onClose, isAdmin }) => {
    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 flex items-center">
                            <History className="w-5 h-5 mr-2 text-gray-500" /> 
                            ประวัติการแลกของรางวัล
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {redemptions.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <p>ยังไม่มีประวัติการแลก</p>
                        </div>
                    ) : (
                        redemptions.map(record => {
                            const rewardTitle = record.rewardSnapshot?.title || 'Unknown Reward';
                            const cost = record.rewardSnapshot?.cost || 0;
                            
                            return (
                                <div key={record.id} className="bg-white border border-gray-100 p-4 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-xl">
                                            {record.rewardSnapshot?.icon || '🎁'}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800">{rewardTitle}</h4>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span>{format(record.redeemedAt, 'd MMM yyyy HH:mm', { locale: th })}</span>
                                                {isAdmin && record.user && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="flex items-center text-indigo-600 font-bold bg-indigo-50 px-1.5 rounded">
                                                            <User className="w-3 h-3 mr-1" /> {record.user.name}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-black text-red-500">-{cost}</span>
                                        <span className="text-[10px] text-gray-400 block uppercase font-bold">Points</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default RewardHistory;
