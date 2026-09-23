import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Channel, ChannelGroup } from '../../../../types';
import { ChannelCard } from './ChannelCard';
import { getChannelTotalFollowers, getGlowStyles } from '../../helpers/channelHelpers';

interface FloatingCarouselViewProps {
  channels: Channel[];
  group?: ChannelGroup | null;
  contentCountMap: Record<string, number>;
  onEditChannel: (channel: Channel) => void;
  onDeleteChannel: (id: string, name: string) => void;
  onSyncFollowers?: (channelId: string, channelName?: string) => void;
  syncingChannelIdMap?: Record<string, boolean>;
  onClose: () => void;
}

export const FloatingCarouselView: React.FC<FloatingCarouselViewProps> = ({
  channels,
  group,
  contentCountMap,
  onEditChannel,
  onDeleteChannel,
  onSyncFollowers,
  syncingChannelIdMap = {},
  onClose,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const total = channels.length;
  const wheelLockRef = useRef(false);

  const prevCard = useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
  }, [total]);

  const nextCard = useCallback(() => {
    setActiveIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
  }, [total]);

  // Keyboard Arrow Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevCard();
      } else if (e.key === 'ArrowRight') {
        nextCard();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevCard, nextCard]);

  // Mouse Wheel Navigation (with smooth debounce lock)
  const handleWheel = (e: React.WheelEvent) => {
    // Only intercept if noticeable wheel motion
    if (Math.abs(e.deltaY) < 18 && Math.abs(e.deltaX) < 18) return;
    if (wheelLockRef.current) return;

    wheelLockRef.current = true;
    if (e.deltaY > 0 || e.deltaX > 0) {
      nextCard();
    } else {
      prevCard();
    }

    setTimeout(() => {
      wheelLockRef.current = false;
    }, 280);
  };

  /**
   * คำนวณ 3D Perspective Cover Flow
   * Offset: ระยะห่างจากการ์ดตรงกลาง (-3, -2, -1, 0, 1, 2, 3)
   */
  const getCardStyle = (index: number) => {
    let offset = index - activeIndex;

    // Wrap around for nearest circular path
    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;

    const absOffset = Math.abs(offset);

    // ซ่อนการ์ดที่อยู่นอกเหนือระยะโฟกัส (แสดงเฉพาะ offset -2 ถึง +2 เพื่อประสิทธิภาพและความสะอาดตา)
    if (absOffset > 2) {
      return {
        x: offset * 260,
        scale: 0.7,
        rotateY: offset * 35,
        opacity: 0,
        zIndex: 0,
        pointerEvents: 'none' as const,
      };
    }

    if (offset === 0) {
      // การ์ดตรงกลาง: เด่นสุด ขนาดใหญ่สุด หน้าสุด
      return {
        x: 0,
        scale: 1.04,
        rotateY: 0,
        opacity: 1,
        zIndex: 50,
        pointerEvents: 'auto' as const,
      };
    }

    // การ์ดซ้าย-ขวา (-1, +1, -2, +2)
    const sign = offset > 0 ? 1 : -1;
    const xDist = sign * (absOffset === 1 ? 260 : 430);
    const rotateY = -sign * (absOffset === 1 ? 24 : 36);
    const scale = absOffset === 1 ? 0.88 : 0.76;
    const opacity = absOffset === 1 ? 0.85 : 0.45;
    const zIndex = 40 - absOffset * 10;

    return {
      x: xDist,
      scale,
      rotateY,
      opacity,
      zIndex,
      pointerEvents: 'auto' as const,
    };
  };

  return (
    <div
      onWheel={handleWheel}
      className="relative w-full max-w-[100vw] h-[540px] flex flex-col items-center justify-center overflow-visible select-none"
      style={{ perspective: 1300 }}
    >
      {/* Floating 3D Carousel Stage */}
      <div className="relative w-full h-full flex items-center justify-center overflow-visible">
        {channels.map((channel, idx) => {
          const contentCount = contentCountMap[channel.id] || 0;
          const channelTotalFollowers = getChannelTotalFollowers(channel);
          const bgClass = (channel.color || 'bg-gray-100').split(' ')[0].replace('bg-', 'bg-');
          const glow = getGlowStyles(channel.color);

          const style = getCardStyle(idx);
          const isCenter = idx === activeIndex;

          return (
            <motion.div
              key={channel.id}
              initial={false}
              animate={{
                x: style.x,
                scale: style.scale,
                rotateY: style.rotateY,
                opacity: style.opacity,
                zIndex: style.zIndex,
              }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 28,
                opacity: { duration: 0.22, ease: 'easeOut' },
              }}
              onClick={() => {
                if (!isCenter) {
                  setActiveIndex(idx);
                }
              }}
              style={{
                pointerEvents: style.pointerEvents,
                filter: isCenter
                  ? 'drop-shadow(0 28px 50px rgba(0,0,0,0.36))'
                  : 'drop-shadow(0 14px 28px rgba(0,0,0,0.18))',
              }}
              className={`absolute w-[300px] sm:w-[325px] cursor-pointer transition-all duration-300 origin-center ${
                !isCenter ? 'hover:brightness-105' : ''
              }`}
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
      </div>

      {/* Floating Minimal Navigation Controls (Left & Right Arrow Buttons) */}
      <div className="absolute inset-x-4 sm:inset-x-12 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none z-50">
        <button
          type="button"
          onClick={prevCard}
          className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-xl border border-slate-200/90 shadow-xl flex items-center justify-center text-slate-700 hover:text-slate-900 hover:scale-110 active:scale-95 transition-all pointer-events-auto cursor-pointer"
          title="ช่องก่อนหน้า (Arrow Left)"
        >
          <ChevronLeft className="w-6 h-6 -ml-0.5" />
        </button>

        <button
          type="button"
          onClick={nextCard}
          className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-xl border border-slate-200/90 shadow-xl flex items-center justify-center text-slate-700 hover:text-slate-900 hover:scale-110 active:scale-95 transition-all pointer-events-auto cursor-pointer"
          title="ช่องถัดไป (Arrow Right)"
        >
          <ChevronRight className="w-6 h-6 -mr-0.5" />
        </button>
      </div>

      {/* Floating Dot Pagination & Counter Indicator */}
      <div className="relative z-50 mt-6 flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-xl border border-slate-200/90 shadow-md">
        <div className="flex items-center gap-1.5 max-w-[240px] overflow-hidden px-1">
          {channels.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                i === activeIndex
                  ? 'w-6 bg-indigo-600'
                  : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
              title={`ช่องที่ ${i + 1}`}
            />
          ))}
        </div>

        <span className="text-xs font-mono font-bold text-slate-600 border-l border-slate-200 pl-2">
          {activeIndex + 1} / {total}
        </span>
      </div>
    </div>
  );
};
