import React from 'react';
import { 
  FolderKanban, ArrowRight, Radio, Layers, RefreshCw, Users, Sparkles 
} from 'lucide-react';
import { formatFollowersCompact } from '../helpers/channelHelpers';

interface ChannelStatsCardsProps {
  groupsCount: number;
  categorizedCount: number;
  channelsCount: number;
  totalContents: number;
  totalReach: number;
  isRefreshingCounts: boolean;
  onRefreshCounts: () => void;
  isSyncingFollowers?: boolean;
  onSyncFollowers?: () => void;
  onManageGroups: () => void;
}

export const ChannelStatsCards: React.FC<ChannelStatsCardsProps> = ({
  groupsCount,
  categorizedCount,
  channelsCount,
  totalContents,
  totalReach,
  isRefreshingCounts,
  onRefreshCounts,
  isSyncingFollowers = false,
  onSyncFollowers,
  onManageGroups,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* Card 1: Channel Groups / Sections */}
      <div 
        onClick={onManageGroups}
        className="p-5 bg-gradient-to-br from-white/95 via-indigo-50/35 to-white/85 backdrop-blur-md rounded-2xl border border-white/80 border-b-[3px] border-b-indigo-100/80 ring-1 ring-slate-100/60 shadow-[0_8px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_14px_30px_rgba(99,102,241,0.08)] hover:translate-y-[-2px] hover:border-b-indigo-200 transition-all duration-200 cursor-pointer group select-none flex flex-col justify-between"
        title="คลิกเพื่อจัดการกลุ่มรายการและลากช่องเข้าหมวดหมู่"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-indigo-50 to-indigo-100/80 border border-white border-b-2 border-b-indigo-200/80 shadow-md shadow-indigo-100/80 flex items-center justify-center text-indigo-600 group-hover:scale-105 group-hover:shadow-indigo-200 transition-all">
            <FolderKanban className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-indigo-600 group-hover:underline flex items-center gap-1 bg-white/80 px-2.5 py-1 rounded-lg border border-indigo-100/60 shadow-2xs">
            จัดการ <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500">กลุ่มรายการ (Sections)</p>
          <div className="flex items-baseline gap-2 mt-1 flex-wrap">
            <p className="text-2xl font-black text-slate-800 tracking-tight">{groupsCount}</p>
            <span className="text-xs font-semibold text-slate-400">กลุ่ม</span>
            <span className="text-[11px] font-semibold text-indigo-600/80 ml-auto truncate bg-indigo-50/70 px-2.5 py-0.5 rounded-md border border-indigo-100/50">
              {groupsCount === 0 ? 'ยังไม่สร้างกลุ่ม' : `${categorizedCount} จัดกลุ่มแล้ว`}
            </span>
          </div>
        </div>
      </div>

      {/* Card 2: Total Channels */}
      <div className="p-5 bg-gradient-to-br from-white/95 via-sky-50/35 to-white/85 backdrop-blur-md rounded-2xl border border-white/80 border-b-[3px] border-b-sky-100/80 ring-1 ring-slate-100/60 shadow-[0_8px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_14px_30px_rgba(14,165,233,0.08)] hover:translate-y-[-2px] hover:border-b-sky-200 transition-all duration-200 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-sky-50 to-sky-100/80 border border-white border-b-2 border-b-sky-200/80 shadow-md shadow-sky-100/80 flex items-center justify-center text-sky-600 shrink-0">
          <Radio className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-500">รายการในสังกัด</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <p className="text-2xl font-black text-slate-800 tracking-tight">{channelsCount}</p>
            <span className="text-xs font-semibold text-slate-400">ช่อง</span>
          </div>
        </div>
      </div>

      {/* Card 3: Total Contents */}
      <div className="p-5 bg-gradient-to-br from-white/95 via-purple-50/35 to-white/85 backdrop-blur-md rounded-2xl border border-white/80 border-b-[3px] border-b-purple-100/80 ring-1 ring-slate-100/60 shadow-[0_8px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_14px_30px_rgba(168,85,247,0.08)] hover:translate-y-[-2px] hover:border-b-purple-200 transition-all duration-200 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-purple-50 to-purple-100/80 border border-white border-b-2 border-b-purple-200/80 shadow-md shadow-purple-100/80 flex items-center justify-center text-purple-600 shrink-0">
          <Layers className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <p className="text-xs font-bold text-slate-500 truncate">คอนเทนต์ทั้งหมด</p>
            <button
              type="button"
              onClick={onRefreshCounts}
              disabled={isRefreshingCounts}
              title="รีเฟรชยอดคอนเทนต์"
              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-100/60 rounded-lg transition-all disabled:opacity-40 cursor-pointer shadow-2xs bg-white/70 border border-slate-200/60 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingCounts ? 'animate-spin text-purple-600' : ''}`} />
            </button>
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <p className="text-2xl font-black text-slate-800 tracking-tight">{totalContents.toLocaleString()}</p>
            <span className="text-xs font-semibold text-slate-400">คอนเทนต์</span>
          </div>
        </div>
      </div>

      {/* Card 4: Total Reach */}
      <div className="p-5 bg-gradient-to-br from-white/95 via-pink-50/40 to-amber-50/30 backdrop-blur-md rounded-2xl border border-white/80 border-b-[3px] border-b-pink-100/80 ring-1 ring-slate-100/60 shadow-[0_8px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_14px_30px_rgba(244,63,94,0.08)] hover:translate-y-[-2px] hover:border-b-pink-200 transition-all duration-200 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-indigo-500 to-purple-600 border border-white/60 border-b-2 border-b-purple-800 shadow-md shadow-purple-200/90 flex items-center justify-center text-white shrink-0">
          <Users className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <p className="text-xs font-bold text-indigo-900/75 flex items-center gap-1">
              <span>ผู้ติดตามรวม (Reach)</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            </p>
            {onSyncFollowers && (
              <button
                type="button"
                id="btn-sync-reach-card"
                onClick={onSyncFollowers}
                title={isSyncingFollowers ? "กำลังดึงข้อมูลผู้ติดตามล่าสุด... คลิกเพื่อดูสถานะใน Modal" : "ซิงค์ยอดผู้ติดตามทุกช่องรายการตอนนี้ (Auto-Sync 08:00 น.)"}
                className={`transition-all duration-200 cursor-pointer shadow-2xs border shrink-0 flex items-center gap-1.5 ${
                  isSyncingFollowers
                    ? 'px-2 py-1 bg-indigo-50 text-indigo-600 border-indigo-200/80 rounded-lg hover:bg-indigo-100 ring-2 ring-indigo-200/50'
                    : 'p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100/60 bg-white/70 border-slate-200/60 rounded-lg'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFollowers ? 'animate-spin text-indigo-600' : ''}`} />
                {isSyncingFollowers && (
                  <span className="text-[10px] font-bold text-indigo-600 tracking-tight animate-pulse">
                    กำลังดึงข้อมูล...
                  </span>
                )}
              </button>
            )}
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5 truncate">
            {totalReach > 0 ? (
              <>
                <p className="text-2xl font-black text-indigo-950 tracking-tight">{formatFollowersCompact(totalReach)}</p>
                <span className="text-xs font-semibold text-indigo-500/80">คน</span>
              </>
            ) : (
              <span className="text-sm font-semibold text-slate-400">ยังไม่ระบุ</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
