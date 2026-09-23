import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Hammer, Archive, ChevronDown, X } from 'lucide-react';
import { Channel, ChannelGroup } from '../../../../types';
import { ChannelCard } from './ChannelCard';
import { FloatingArcFanView } from './FloatingArcFanView';
import { FloatingCarouselView } from './FloatingCarouselView';
import { getChannelTotalFollowers, getGlowStyles } from '../../helpers/channelHelpers';

interface ChannelDeckStackProps {
  type: 'planning' | 'paused';
  channels: Channel[];
  group?: ChannelGroup | null;
  contentCountMap: Record<string, number>;
  onEditChannel: (channel: Channel) => void;
  onDeleteChannel: (id: string, name: string) => void;
  onSyncFollowers?: (channelId: string, channelName?: string) => void;
  syncingChannelIdMap?: Record<string, boolean>;
}

export const ChannelDeckStack: React.FC<ChannelDeckStackProps> = ({
  type,
  channels,
  group,
  contentCountMap,
  onEditChannel,
  onDeleteChannel,
  onSyncFollowers,
  syncingChannelIdMap = {},
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHoveredAnchor, setIsHoveredAnchor] = useState(false);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  if (!channels || channels.length === 0) return null;

  const isPlanning = type === 'planning';
  const topChannel = channels[0];
  const isCarouselMode = channels.length >= 6;

  // Mouse Enter Anchor in Grid
  const handleAnchorMouseEnter = () => {
    setIsHoveredAnchor(true);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, 180);
  };

  const handleAnchorMouseLeave = () => {
    setIsHoveredAnchor(false);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  // Card cluster hover handlers
  const handleClusterMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  const handleClusterMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setHoveredCardIndex(null);
    }, 320);
  };

  const handleClose = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsOpen(false);
    setIsHoveredAnchor(false);
    setHoveredCardIndex(null);
  };

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsOpen((prev) => !prev);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  return (
    <>
      {/* =====================================================================
          ANCHOR: Fixed Size Card in the Grid (Layout never shifts or moves)
          ===================================================================== */}
      <div
        onMouseEnter={handleAnchorMouseEnter}
        onMouseLeave={handleAnchorMouseLeave}
        onClick={toggleOpen}
        className="relative min-h-[460px] cursor-pointer group/deck select-none"
        title={`คลิกหรือชี้เพื่อเปิดสำรับ (${channels.length} ช่อง)`}
      >
        {/* Top Floating Badge on Stack */}
        <div className="absolute -top-3 inset-x-3 z-40 flex items-center justify-between px-3 py-1.5 rounded-full shadow-md border-2 border-white transition-all group-hover/deck:scale-[1.02]">
          <div
            className={`flex items-center gap-1.5 text-xs font-black text-white px-2.5 py-0.5 rounded-full ${
              isPlanning
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-sm'
                : 'bg-gradient-to-r from-slate-600 to-slate-800 shadow-sm'
            }`}
          >
            {isPlanning ? (
              <Hammer className="w-3.5 h-3.5 animate-bounce" />
            ) : (
              <Archive className="w-3.5 h-3.5" />
            )}
            <span>{isPlanning ? 'เตรียมเปิดตัว' : 'พักชั่วคราว'}</span>
            <span className="bg-white/30 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {channels.length}
            </span>
          </div>

          <span className="text-[10px] font-bold text-slate-600 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full border border-slate-200/80 flex items-center gap-1 shadow-2xs group-hover/deck:text-indigo-600">
            <span>ชี้หรือคลิก</span>
            <ChevronDown className="w-3 h-3 group-hover/deck:translate-y-0.5 transition-transform" />
          </span>
        </div>

        {/* Layer 2 (Bottom-most card peek) */}
        <motion.div
          animate={{
            rotate: isHoveredAnchor ? -6 : -3,
            x: isHoveredAnchor ? -16 : -7,
            y: isHoveredAnchor ? 14 : 7,
            scale: 0.94,
          }}
          transition={{ type: 'spring', stiffness: 350, damping: 22 }}
          className={`absolute inset-0 rounded-[2rem] border-2 border-b-[3.5px] pointer-events-none -z-20 transition-all ${
            isPlanning
              ? 'bg-gradient-to-b from-amber-100/60 to-orange-100/40 border-amber-300/70 shadow-sm'
              : 'bg-slate-100 border-slate-300/70 shadow-sm'
          }`}
        />

        {/* Layer 1 (Middle card peek) */}
        <motion.div
          animate={{
            rotate: isHoveredAnchor ? 6 : 3,
            x: isHoveredAnchor ? 16 : 7,
            y: isHoveredAnchor ? 10 : 4,
            scale: 0.97,
          }}
          transition={{ type: 'spring', stiffness: 350, damping: 22 }}
          className={`absolute inset-0 rounded-[2rem] border-2 border-b-[3.5px] pointer-events-none -z-10 transition-all ${
            isPlanning
              ? 'bg-gradient-to-b from-amber-50/90 to-orange-50/70 border-amber-300/85 shadow-md'
              : 'bg-slate-50 border-slate-300/80 shadow-md'
          }`}
        />

        {/* Top Main Card (Visual Representative) */}
        <div className="relative z-10 pointer-events-none">
          <ChannelCard
            channel={topChannel}
            group={group}
            contentCount={contentCountMap[topChannel.id] || 0}
            channelTotalFollowers={getChannelTotalFollowers(topChannel)}
            rank={undefined}
            rankTitle={undefined}
            onEdit={() => {}}
            onDelete={() => {}}
            onSyncFollowers={undefined}
            isSyncingFollowers={false}
            glow={getGlowStyles(topChannel.color)}
            bgClass={(topChannel.color || 'bg-gray-100').split(' ')[0].replace('bg-', 'bg-')}
          />
        </div>

        {/* Bottom Stack Peek Bar with Other Avatars */}
        <div className="absolute -bottom-3 inset-x-4 z-30 py-1.5 px-3.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md flex items-center justify-between group-hover/deck:border-indigo-300 transition-all">
          <div className="flex items-center -space-x-2 overflow-hidden">
            {channels.slice(1, 4).map((ch) => (
              <div
                key={ch.id}
                className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-xs flex items-center justify-center text-[9px] font-black text-slate-700"
                title={ch.name}
              >
                {ch.logoUrl ? (
                  <img src={ch.logoUrl} alt={ch.name} className="w-full h-full object-cover" />
                ) : (
                  ch.name.substring(0, 2)
                )}
              </div>
            ))}
            {channels.length > 4 && (
              <span className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 text-[9px] font-black flex items-center justify-center text-slate-700">
                +{channels.length - 4}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] font-black text-indigo-600 group-hover/deck:text-indigo-700">
            <span>สำรับ {channels.length} ช่อง</span>
            <ChevronDown className="w-3 h-3 group-hover/deck:translate-y-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* =====================================================================
          PURE FLOATING CARDS ENGINE: Zero Box, 100% Transparent Backdrop
          Adaptive Dual-Mode:
          - channels.length < 6  => FloatingArcFanView (Safe Padding, Anti-Clipping)
          - channels.length >= 6 => FloatingCarouselView (3D Wheel Scroll, Infinite)
          ===================================================================== */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                onClick={handleClose}
                className="fixed inset-0 z-[9999] bg-transparent backdrop-blur-[2.5px] flex flex-col items-center justify-center p-2 sm:p-6 select-none overflow-hidden"
              >
                {/* Floating Pill Status Bar at Top */}
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16, scale: 0.9 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  onClick={(e) => e.stopPropagation()}
                  className="mb-4 sm:mb-6 flex items-center gap-3 px-4 py-2 rounded-full bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.14)] z-50 shrink-0"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shadow-xs ${
                      isPlanning ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isPlanning ? (
                      <Hammer className="w-4 h-4 animate-bounce" />
                    ) : (
                      <Archive className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs sm:text-sm text-slate-800">
                      {isPlanning ? 'สำรับช่องเตรียมเปิดตัว' : 'สำรับช่องพักชั่วคราว'}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isPlanning
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-200 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {channels.length} ช่อง
                    </span>
                  </div>

                  <div className="h-4 w-px bg-slate-200 mx-1" />

                  <span className="hidden sm:inline text-[11px] text-slate-500 font-medium">
                    {isCarouselMode
                      ? 'เลื่อนลูกกลิ้งเมาส์ / กดลูกศร ซ้าย-ขวา เพื่อเลือกช่อง'
                      : 'ชี้เพื่อยกการ์ด • เลื่อนเมาส์ออกเพื่อเก็บ'}
                  </span>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer ml-1 active:scale-95"
                    title="ปิดสำรับ (Esc)"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>

                {/* Adaptive Display Engine Container */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  onMouseEnter={handleClusterMouseEnter}
                  onMouseLeave={handleClusterMouseLeave}
                  className="w-full flex items-center justify-center overflow-visible"
                >
                  {isCarouselMode ? (
                    <FloatingCarouselView
                      channels={channels}
                      group={group}
                      contentCountMap={contentCountMap}
                      onEditChannel={onEditChannel}
                      onDeleteChannel={onDeleteChannel}
                      onSyncFollowers={onSyncFollowers}
                      syncingChannelIdMap={syncingChannelIdMap}
                      onClose={handleClose}
                    />
                  ) : (
                    <FloatingArcFanView
                      channels={channels}
                      group={group}
                      contentCountMap={contentCountMap}
                      hoveredCardIndex={hoveredCardIndex}
                      setHoveredCardIndex={setHoveredCardIndex}
                      onEditChannel={onEditChannel}
                      onDeleteChannel={onDeleteChannel}
                      onSyncFollowers={onSyncFollowers}
                      syncingChannelIdMap={syncingChannelIdMap}
                      onClose={handleClose}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};
