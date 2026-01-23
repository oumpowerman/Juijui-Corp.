
import React from 'react';
import { Reward } from '../types';
import { X, Gift, History, Coins } from 'lucide-react';

interface RewardShopProps {
    rewards: Reward[];
    userPoints: number;
    onRedeem: (reward: Reward) => void;
    onClose: () => void;
    onOpenHistory: () => void;
}

const RewardShop: React.FC<RewardShopProps> = ({ rewards, userPoints, onRedeem, onClose, onOpenHistory }) => {
    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 border-4 border-purple-50">
                
                {/* Header */}
                <div className="bg-purple-600 p-6 text-white relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Gift className="w-40 h-40" />
                    </div>
                    
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <h2 className="text-2xl font-black flex items-center gap-2">
                                <Gift className="w-8 h-8 text-yellow-300" /> ร้านแลกของรางวัล
                            </h2>
                            <p className="text-purple-200 text-sm mt-1">Reward Redemption Center</p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="mt-6 flex justify-between items-end relative z-10">
                        <div className="flex items-center gap-3 bg-black/20 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center border-4 border-white/20 shadow-inner">
                                <Coins className="w-6 h-6 text-yellow-800" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-purple-200 uppercase tracking-wider">แต้มสะสม (Your Points)</p>
                                <p className="text-3xl font-black leading-none">{userPoints.toLocaleString()}</p>
                            </div>
                        </div>

                        <button 
                            onClick={onOpenHistory}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all border border-white/20"
                        >
                            <History className="w-4 h-4" /> ประวัติการแลก
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rewards.filter(r => r.isActive).map(reward => {
                            const canAfford = userPoints >= reward.cost;
                            return (
                                <div key={reward.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-all group relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div className="text-4xl">{reward.icon || '🎁'}</div>
                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${canAfford ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {reward.cost} Pts
                                        </span>
                                    </div>
                                    
                                    <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-purple-600 transition-colors">{reward.title}</h3>
                                    <p className="text-sm text-gray-500 mb-4 flex-1">{reward.description || 'ไม่มีรายละเอียด'}</p>
                                    
                                    <button
                                        onClick={() => canAfford && onRedeem(reward)}
                                        disabled={!canAfford}
                                        className={`
                                            w-full py-3 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95 flex items-center justify-center
                                            ${canAfford 
                                                ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-200' 
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                                        `}
                                    >
                                        {canAfford ? 'แลกเลย ✨' : 'แต้มไม่พอ 🔒'}
                                    </button>
                                </div>
                            );
                        })}
                        
                        {rewards.length === 0 && (
                            <div className="col-span-full py-20 text-center text-gray-400">
                                <Gift className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p>ยังไม่มีของรางวัลในระบบ</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RewardShop;
