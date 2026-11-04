import React from 'react';
import { Radio } from 'lucide-react';
import { Channel, Platform } from '../../../../types';
import { formatThaiFollowerSyncTime } from '../../../channel/helpers/channelHelpers';

interface GoalChannelSyncBannerProps {
    linkedChannel: Channel | null;
    platform: Platform | 'ALL';
    lastSyncedAt: string | null;
}

export const GoalChannelSyncBanner: React.FC<GoalChannelSyncBannerProps> = ({
    linkedChannel,
    platform,
    lastSyncedAt,
}) => {
    return (
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 min-w-0">
                {linkedChannel?.logoUrl ? (
                    <img
                        src={linkedChannel.logoUrl}
                        alt={linkedChannel.name}
                        className="w-10 h-10 rounded-full object-cover border border-white/15 shrink-0"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-sm font-bold text-indigo-300 shrink-0">
                        {linkedChannel ? linkedChannel.name.substring(0, 1).toUpperCase() : 'ALL'}
                    </div>
                )}
                <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                        {linkedChannel ? linkedChannel.name : 'รวมทุกช่องในองค์กร'}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>แพลตฟอร์ม: {platform === 'ALL' ? 'ทุกแพลตฟอร์ม' : platform}</span>
                    </p>
                </div>
            </div>

            <div className="text-right shrink-0">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                    <Radio className="w-3 h-3 animate-pulse" /> เชื่อมต่อระบบช่องแล้ว
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                    {lastSyncedAt
                        ? `อัปเดตเมื่อ ${formatThaiFollowerSyncTime(lastSyncedAt)}`
                        : 'ยังไม่เคยซิงค์'}
                </p>
            </div>
        </div>
    );
};
