import React from 'react';
import { Coins, Star } from 'lucide-react';

interface GoalRewardsSectionProps {
    rewardXp: number;
    rewardCoin: number;
    onChangeRewardXp: (val: number) => void;
    onChangeRewardCoin: (val: number) => void;
}

export const GoalRewardsSection: React.FC<GoalRewardsSectionProps> = ({
    rewardXp,
    rewardCoin,
    onChangeRewardXp,
    onChangeRewardCoin,
}) => {
    return (
        <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/70 p-4 sm:p-5 rounded-2xl border border-amber-200/70">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <div className="h-5 mb-1.5 px-1 flex items-center justify-between">
                        <label className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span>Reward XP</span>
                        </label>
                        <span className="text-[10px] font-semibold text-amber-600/80">ค่าประสบการณ์</span>
                    </div>
                    <input
                        type="number"
                        className="w-full h-[50px] px-4 bg-white/90 border-2 border-amber-200/90 rounded-2xl text-lg font-bold text-amber-950 focus:bg-white focus:border-amber-400 outline-none tabular-nums text-right transition-all"
                        value={rewardXp}
                        onChange={e => onChangeRewardXp(Number(e.target.value))}
                    />
                </div>
                <div>
                    <div className="h-5 mb-1.5 px-1 flex items-center justify-between">
                        <label className="text-xs font-bold text-yellow-800 uppercase tracking-wider flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                            <span>Reward Coin</span>
                        </label>
                        <span className="text-[10px] font-semibold text-yellow-700/80">เหรียญรางวัล</span>
                    </div>
                    <input
                        type="number"
                        className="w-full h-[50px] px-4 bg-white/90 border-2 border-yellow-200/90 rounded-2xl text-lg font-bold text-yellow-950 focus:bg-white focus:border-yellow-400 outline-none tabular-nums text-right transition-all"
                        value={rewardCoin}
                        onChange={e => onChangeRewardCoin(Number(e.target.value))}
                    />
                </div>
            </div>
        </div>
    );
};
