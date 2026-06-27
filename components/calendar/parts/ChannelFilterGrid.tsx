import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Channel } from '../../../types';

interface ChannelFilterGridProps {
    channels: Channel[];
    tempChannelIds: string[];
    toggleChannel: (id: string) => void;
}

const ChannelFilterGrid: React.FC<ChannelFilterGridProps> = ({
    channels = [],
    tempChannelIds = [],
    toggleChannel
}) => {
    if (channels.length === 0) {
        return (
            <div className="py-16 text-center text-stone-400 font-medium">
                ไม่พบข้อมูลช่องรายการในขณะนี้
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5"
        >
            {channels.map(channel => {
                const isSelected = tempChannelIds.includes(channel.id);
                const channelColor = channel.color || '#78716c'; // Stone-500 fallback

                return (
                    <div
                        key={channel.id}
                        onClick={() => toggleChannel(channel.id)}
                        className={`group relative p-4 rounded-2xl border-2 cursor-pointer select-none flex items-center gap-3.5 transition-all duration-250 ${
                            isSelected
                                ? 'border-stone-800 bg-stone-100/75 shadow-md shadow-stone-800/5'
                                : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
                        }`}
                        style={{
                            // Apply a soft colored aura glow matching the channel color when selected
                            boxShadow: isSelected 
                                ? `0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px ${channelColor}20, inset 0 2px 4px 0 rgba(0,0,0,0.02)` 
                                : undefined
                        }}
                    >
                        {/* Custom decorative left border block */}
                        <div
                            className="absolute left-0 top-3.5 bottom-3.5 w-1.5 rounded-r-lg transition-transform duration-200 group-hover:scale-y-110"
                            style={{ backgroundColor: channelColor }}
                        />

                        {/* Channel Avatar/Logo */}
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-stone-200 bg-stone-50 shadow-inner">
                            {channel.logoUrl ? (
                                <img
                                    src={channel.logoUrl}
                                    alt={channel.name}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div
                                    className="w-full h-full flex items-center justify-center font-black text-white text-sm"
                                    style={{ backgroundColor: channelColor }}
                                >
                                    {channel.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Text Metadata */}
                        <div className="flex-1 min-w-0 pr-4">
                            <h4 className="text-sm font-bold text-stone-800 truncate group-hover:text-stone-900 transition-colors">
                                {channel.name}
                            </h4>
                            <p className="text-[10px] text-stone-500 mt-0.5 truncate leading-relaxed font-normal" title={channel.description || 'ยังไม่มีคำบรรยายเพิ่มเติม'}>
                                {channel.description || 'ยังไม่มีคำบรรยายเพิ่มเติม'}
                            </p>
                        </div>

                        {/* Check Indicator badge */}
                        {isSelected && (
                            <div className="absolute top-3.5 right-3.5 bg-stone-800 text-stone-50 rounded-full p-0.5 shadow-sm">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                        )}
                    </div>
                );
            })}
        </motion.div>
    );
};

export default ChannelFilterGrid;
