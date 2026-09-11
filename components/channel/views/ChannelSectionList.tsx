import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Tag, ArrowRight, FolderPlus, LayoutTemplate } from 'lucide-react';
import { Channel, ChannelGroup } from '../../../types';
import { ChannelCard } from './cards/ChannelCard';
import { 
  getChannelTotalFollowers, 
  getGlowStyles, 
  formatFollowersCompact, 
  channelContainerVariants 
} from '../helpers/channelHelpers';

interface SectionData {
  groupedMap: Record<string, Channel[]>;
  ungrouped: Channel[];
  categorizedCount: number;
  hasGroups: boolean;
}

interface ChannelSectionListProps {
  channels: Channel[];
  groups: ChannelGroup[];
  selectedGroupFilter: string;
  sectionData: SectionData;
  contentCountMap: Record<string, number>;
  rankingMode?: 'global' | 'group';
  onEditChannel: (channel: Channel) => void;
  onDeleteChannel: (id: string, name: string) => void;
  onOpenGroupModal: () => void;
}

export const ChannelSectionList: React.FC<ChannelSectionListProps> = ({
  channels,
  groups,
  selectedGroupFilter,
  sectionData,
  contentCountMap,
  rankingMode = 'global',
  onEditChannel,
  onDeleteChannel,
  onOpenGroupModal,
}) => {
  // Compute Rank Map and Tooltip Titles based on selected Ranking Mode ('global' or 'group')
  const { rankMap, rankTitleMap } = React.useMemo(() => {
    const rMap: Record<string, number> = {};
    const tMap: Record<string, string> = {};

    if (rankingMode === 'global') {
      // Global Rank: Across all channels in the system
      channels
        .map(ch => ({ id: ch.id, followers: getChannelTotalFollowers(ch) }))
        .filter(item => item.followers > 0)
        .sort((a, b) => b.followers - a.followers)
        .slice(0, 10)
        .forEach((item, idx) => {
          const rankNum = idx + 1;
          rMap[item.id] = rankNum;
          tMap[item.id] = `อันดับ #${rankNum} ยอดผู้ติดตามสูงสุดรวมทั้งระบบ`;
        });
    } else {
      // Per-Group Rank: Computed independently for each group
      // 1. Grouped channels
      Object.entries(sectionData.groupedMap).forEach(([groupId, grpChannels]) => {
        const groupObj = groups.find(g => g.id === groupId);
        const groupName = groupObj?.name || 'กลุ่ม';

        grpChannels
          .map(ch => ({ id: ch.id, followers: getChannelTotalFollowers(ch) }))
          .filter(item => item.followers > 0)
          .sort((a, b) => b.followers - a.followers)
          .slice(0, 10)
          .forEach((item, idx) => {
            const rankNum = idx + 1;
            rMap[item.id] = rankNum;
            tMap[item.id] = `อันดับ #${rankNum} ประจำกลุ่ม "${groupName}"`;
          });
      });

      // 2. Ungrouped channels (if any)
      if (sectionData.ungrouped && sectionData.ungrouped.length > 0) {
        sectionData.ungrouped
          .map(ch => ({ id: ch.id, followers: getChannelTotalFollowers(ch) }))
          .filter(item => item.followers > 0)
          .sort((a, b) => b.followers - a.followers)
          .slice(0, 10)
          .forEach((item, idx) => {
            const rankNum = idx + 1;
            rMap[item.id] = rankNum;
            tMap[item.id] = `อันดับ #${rankNum} ประจำกลุ่มทั่วไป (Ungrouped)`;
          });
      }
    }

    return { rankMap: rMap, rankTitleMap: tMap };
  }, [channels, rankingMode, sectionData, groups]);

  // Sort helper for channels by followers descending
  const sortChannelsByFollowers = (list: Channel[]) => {
    return [...list].sort((a, b) => getChannelTotalFollowers(b) - getChannelTotalFollowers(a));
  };
  if (channels.length === 0) {
    return (
      <div className="py-16 text-center text-gray-400 bg-white rounded-3xl border border-dashed border-gray-300 p-6">
        <LayoutTemplate className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p className="text-base font-bold text-slate-700">ยังไม่มีรายการในระบบ</p>
        <p className="text-xs text-slate-400 mt-1">
          กด "สร้างรายการใหม่" ด้านบนเพื่อเริ่มเพิ่มแบรนด์หรือช่องรายการของคุณ
        </p>
      </div>
    );
  }

  // CASE A: No Groups Created Yet (0 Groups) - Display clean grid with an invitation banner
  if (groups.length === 0) {
    return (
      <div className="space-y-4">
        <div className="p-5 bg-gradient-to-r from-white via-indigo-50/40 to-purple-50/30 backdrop-blur-md rounded-2xl border border-indigo-100/90 border-b-[3px] border-b-indigo-200/80 shadow-[0_8px_20px_rgba(99,102,241,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-b from-indigo-50 to-indigo-100/80 border border-white border-b-2 border-b-indigo-200/80 shadow-md shadow-indigo-100/80 flex items-center justify-center text-indigo-600 shrink-0">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-indigo-950">
                ต้องการจัดหมวดหมู่ช่องรายการเป็น Section หรือไม่?
              </p>
              <p className="text-xs text-indigo-700/70 mt-0.5">
                คุณสามารถสร้างกลุ่ม เช่น <strong>"Lifestyle"</strong>, <strong>"Entertainment"</strong> แล้วลากช่องรายการจัดเป็นกลุ่มได้ทันที
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenGroupModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-bold rounded-xl border border-indigo-500 border-b-[3px] border-b-indigo-700/80 shadow-md shadow-indigo-200/80 transition-all active:translate-y-[2px] active:border-b-[1px] cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            สร้างกลุ่มแรก (เช่น Lifestyle)
          </button>
        </div>

        <motion.div 
          variants={channelContainerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 sm:gap-6"
        >
          {sortChannelsByFollowers(channels).map(channel => {
            const contentCount = contentCountMap[channel.id] || 0;
            const channelTotalFollowers = getChannelTotalFollowers(channel);
            const bgClass = (channel.color || 'bg-gray-100').split(' ')[0].replace('bg-', 'bg-');
            const glow = getGlowStyles(channel.color);

            return (
              <ChannelCard
                key={channel.id}
                channel={channel}
                contentCount={contentCount}
                channelTotalFollowers={channelTotalFollowers}
                rank={rankMap[channel.id]}
                rankTitle={rankTitleMap[channel.id]}
                onEdit={onEditChannel}
                onDelete={onDeleteChannel}
                glow={glow}
                bgClass={bgClass}
              />
            );
          })}
        </motion.div>
      </div>
    );
  }

  // CASE B: Groups Exist (> 0 Groups) - Display Sections
  return (
    <div className="space-y-10">
      {/* 1. Render Group Sections */}
      {groups.map(group => {
        if (selectedGroupFilter !== 'ALL' && selectedGroupFilter !== group.id) {
          return null;
        }

        const groupChannels = sectionData.groupedMap[group.id] || [];
        const sortedGroupChannels = sortChannelsByFollowers(groupChannels);
        const groupTotalContents = groupChannels.reduce((sum, ch) => sum + (contentCountMap[ch.id] || 0), 0);
        const groupTotalFollowers = groupChannels.reduce((sum, ch) => sum + getChannelTotalFollowers(ch), 0);

        return (
          <section key={group.id} className="space-y-4">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/90">
              <div className="flex items-center gap-3">
                <span className={`px-3.5 py-1.5 rounded-xl text-xs font-black border border-b-[2.5px] flex items-center gap-1.5 shadow-2xs ${group.color || 'bg-indigo-50 text-indigo-700 border-indigo-200 border-b-indigo-300'}`}>
                  <Tag className="w-3.5 h-3.5" />
                  {group.name}
                </span>
                {group.description && (
                  <span className="text-xs text-slate-400 line-clamp-1 font-medium">
                    {group.description}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <span className="px-2.5 py-1 rounded-lg bg-white/90 border border-slate-200/80 border-b-2 border-b-slate-300/60 shadow-2xs text-slate-700">
                    {groupChannels.length} รายการ
                  </span>
                  <span>•</span>
                  <span className="text-purple-600 bg-purple-50/60 px-2 py-0.5 rounded-md border border-purple-100">
                    {groupTotalContents} คอนเทนต์
                  </span>
                  {groupTotalFollowers > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-indigo-600 bg-indigo-50/60 px-2 py-0.5 rounded-md border border-indigo-100">
                        {formatFollowersCompact(groupTotalFollowers)} ผู้ติดตาม
                      </span>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onOpenGroupModal}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-indigo-100/80 shadow-2xs"
                >
                  จัดการกลุ่ม
                </button>
              </div>
            </div>

            {/* Section Channels Grid */}
            {groupChannels.length === 0 ? (
              <div 
                onClick={onOpenGroupModal}
                className="p-8 text-center bg-slate-50/50 hover:bg-indigo-50/30 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-300 transition-all cursor-pointer group"
              >
                <p className="text-xs font-bold text-slate-500 group-hover:text-indigo-700">
                  ยังไม่มีรายการในกลุ่ม "{group.name}"
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  คลิกเพื่อเปิดกล่องจัดการ แล้วลากช่องรายการเข้ามาในกลุ่มนี้
                </p>
              </div>
            ) : (
              <motion.div
                variants={channelContainerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 sm:gap-6"
              >
                {sortedGroupChannels.map(channel => {
                  const contentCount = contentCountMap[channel.id] || 0;
                  const channelTotalFollowers = getChannelTotalFollowers(channel);
                  const bgClass = (channel.color || 'bg-gray-100').split(' ')[0].replace('bg-', 'bg-');
                  const glow = getGlowStyles(channel.color);

                  return (
                    <ChannelCard
                      key={channel.id}
                      channel={channel}
                      group={group}
                      contentCount={contentCount}
                      channelTotalFollowers={channelTotalFollowers}
                      rank={rankMap[channel.id]}
                      rankTitle={rankTitleMap[channel.id]}
                      onEdit={onEditChannel}
                      onDelete={onDeleteChannel}
                      glow={glow}
                      bgClass={bgClass}
                    />
                  );
                })}
              </motion.div>
            )}
          </section>
        );
      })}

      {/* 2. Render Ungrouped Section (if any channels don't have a group) */}
      {(selectedGroupFilter === 'ALL' || selectedGroupFilter === 'UNGROUPED') && sectionData.ungrouped.length > 0 && (
        <section className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/90">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-xl text-xs font-black bg-slate-100 text-slate-700 border border-slate-200">
                ช่องที่ยังไม่ได้จัดกลุ่ม (Ungrouped)
              </span>
              <span className="text-xs text-slate-400">
                ({sectionData.ungrouped.length} รายการ)
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenGroupModal}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>ลากจัดกลุ่มที่นี่</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <motion.div
            variants={channelContainerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 sm:gap-6"
          >
            {sortChannelsByFollowers(sectionData.ungrouped).map(channel => {
              const contentCount = contentCountMap[channel.id] || 0;
              const channelTotalFollowers = getChannelTotalFollowers(channel);
              const bgClass = (channel.color || 'bg-gray-100').split(' ')[0].replace('bg-', 'bg-');
              const glow = getGlowStyles(channel.color);

              return (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  group={null}
                  contentCount={contentCount}
                  channelTotalFollowers={channelTotalFollowers}
                  rank={rankMap[channel.id]}
                  rankTitle={rankTitleMap[channel.id]}
                  onEdit={onEditChannel}
                  onDelete={onDeleteChannel}
                  glow={glow}
                  bgClass={bgClass}
                />
              );
            })}
          </motion.div>
        </section>
      )}
    </div>
  );
};
