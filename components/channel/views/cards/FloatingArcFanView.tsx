import React from 'react';
import { motion } from 'framer-motion';
import { Channel, ChannelGroup } from '../../../../types';
import { ChannelCard } from './ChannelCard';
import { getChannelTotalFollowers, getGlowStyles } from '../../helpers/channelHelpers';

interface FloatingArcFanViewProps {
  channels: Channel[];
  group?: ChannelGroup | null;
  contentCountMap: Record<string, number>;
  hoveredCardIndex: number | null;
  setHoveredCardIndex: (index: number | null) => void;
  onEditChannel: (channel: Channel) => void;
  onDeleteChannel: (id: string, name: string) => void;
  onSyncFollowers?: (channelId: string, channelName?: string) => void;
  syncingChannelIdMap?: Record<string, boolean>;
  onClose: () => void;
}

export const FloatingArcFanView: React.FC<FloatingArcFanViewProps> = ({
  channels,
  group,
  contentCountMap,
  hoveredCardIndex,
  setHoveredCardIndex,
  onEditChannel,
  onDeleteChannel,
  onSyncFollowers,
  syncingChannelIdMap = {},
  onClose,
}) => {
  const total = channels.length;

  /**
   * คำนวณระยะซ้อนทับตามจำนวนการ์ด 2-5 ใบ:
   * - 2 ใบ: ไม่ต้องซ้อนกันมาก (-space-x-4)
   * - 3 ใบ: ซ้อนปานกลาง (-space-x-8 sm:-space-x-12)
   * - 4-5 ใบ: ซ้อนกระชับ (-space-x-12 sm:-space-x-16)
   */
  const getOverlapClass = () => {
    if (total <= 2) return '-space-x-4 sm:-space-x-6';
    if (total === 3) return '-space-x-8 sm:-space-x-12';
    return '-space-x-12 sm:-space-x-16 md:-space-x-20';
  };

  /**
   * คำนวณองศาเอียง (ไม่เกิน ±5°) และการเยื้องแกน Y สไตล์ Arc
   */
  const getFanTransform = (index: number) => {
    if (total <= 1) return { rotate: 0, y: 0 };
    const mid = (total - 1) / 2;
    const diff = index - mid;
    // Cap rotation to max ~4.5 - 5 degrees
    const rotateStep = total <= 3 ? 4 : 3.5;
    const rotate = diff * rotateStep;
    const y = Math.abs(diff) * (total <= 3 ? 8 : 12);
    return { rotate, y };
  };

  /**
   * Smart Inward Shift เมื่อเมาส์ชี้ เพื่อป้องกันขอบการ์ดซ้าย-ขวาชนขอบจอ
   */
  const getInwardShiftX = (index: number) => {
    if (total <= 1) return 0;
    if (index === 0) return 22; // ใบซ้ายสุด ขยับเข้าหาขวากึ่งกลาง +22px
    if (index === total - 1) return -22; // ใบขวาสุด ขยับเข้าหาซ้ายกึ่งกลาง -22px
    return 0;
  };

  return (
    <div
      className="w-full max-w-[100vw] overflow-visible py-10 px-8 sm:px-16 md:px-24 flex items-center justify-center"
      style={{ perspective: 1400 }}
    >
      <motion.div
        initial="show"
        animate="show"
        className={`flex items-center justify-center ${getOverlapClass()} shrink-0 overflow-visible`}
      >
        {channels.map((channel, idx) => {
          const contentCount = contentCountMap[channel.id] || 0;
          const channelTotalFollowers = getChannelTotalFollowers(channel);
          const bgClass = (channel.color || 'bg-gray-100').split(' ')[0].replace('bg-', 'bg-');
          const glow = getGlowStyles(channel.color);

          const { rotate, y } = getFanTransform(idx);
          const isCardHovered = hoveredCardIndex === idx;
          const inwardX = isCardHovered ? getInwardShiftX(idx) : 0;

          return (
            <motion.div
              key={channel.id}
              initial={{ opacity: 0, scale: 0.7, y: 70, rotate: 0 }}
              animate={{
                opacity: 1,
                scale: isCardHovered ? 1.05 : 0.98,
                x: inwardX,
                y: isCardHovered ? y - 32 : y,
                rotate: isCardHovered ? 0 : rotate,
                zIndex: isCardHovered ? 60 : 20 + idx,
              }}
              exit={{ opacity: 0, scale: 0.85, y: 40 }}
              transition={{
                duration: 0.22,
                ease: 'easeOut',
              }}
              onMouseEnter={() => setHoveredCardIndex(idx)}
              onMouseLeave={() => setHoveredCardIndex(null)}
              className="w-[280px] sm:w-[310px] md:w-[325px] shrink-0 transition-shadow duration-300 overflow-visible"
              style={{
                filter: isCardHovered
                  ? 'drop-shadow(0 28px 45px rgba(0,0,0,0.32))'
                  : 'drop-shadow(0 14px 28px rgba(0,0,0,0.18))',
              }}
            >
              <div className="w-full min-h-[460px]">
                <ChannelCard
                  channel={channel}
                  group={group}
                  contentCount={contentCount}
                  channelTotalFollowers={channelTotalFollowers}
                  rank={undefined}
                  rankTitle={undefined}
                  onEdit={(ch) => {
                    onClose();
                    onEditChannel(ch);
                  }}
                  onDelete={(id, name) => {
                    onDeleteChannel(id, name);
                  }}
                  onSyncFollowers={onSyncFollowers}
                  isSyncingFollowers={Boolean(syncingChannelIdMap[channel.id])}
                  glow={glow}
                  bgClass={bgClass}
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};
