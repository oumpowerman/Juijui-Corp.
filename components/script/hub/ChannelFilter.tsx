
import React from 'react';
import { Channel } from '../../../types';
import { Trash2, MonitorPlay } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
interface ChannelFilterProps {
    channels: Channel[];
    selectedIds: string[];
    onToggle: (id: string) => void;
    onClear: () => void;
}

const ChannelFilter: React.FC<ChannelFilterProps> = ({
    channels,
    selectedIds,
    onToggle,
    onClear
}) => {
    const [isHovered, setIsHovered] = React.useState(false);
    
    const unselectedChannels = channels.filter(c => !selectedIds.includes(c.id));
    const selectedChannels = channels.filter(c => selectedIds.includes(c.id));

    return (
        <div className="flex items-center gap-4 sm:gap-6 w-full py-4 overflow-x-auto sm:overflow-visible no-scrollbar">
            <style>{`
                .selected-glow {
                    box-shadow: 0 0 15px rgba(244, 63, 94, 0.3);
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            {/* Left Side: Unselected Stack */}
            <div className="flex items-center gap-4 shrink-0">
                <button
                    onClick={selectedIds.length > 0 ? onClear : undefined}
                    disabled={selectedIds.length === 0}
                    className={`
                        text-[10px] font-black uppercase tracking-widest shrink-0 flex items-center justify-center px-4 py-2 rounded-xl border transition-all duration-500 min-w-[110px] select-none
                        ${selectedIds.length > 0
                            ? 'bg-gradient-to-br from-rose-50 to-pink-100 text-rose-600 border-rose-200 hover:from-rose-100 hover:to-pink-200 cursor-pointer active:scale-95 shadow-sm'
                            : 'bg-white/50 text-gray-400 border-gray-100 cursor-default opacity-60'
                        }
                    `}
                >
                    {selectedIds.length > 0 ? (
                        <><Trash2 className="w-3.5 h-3.5 mr-2 animate-pulse" /> Clear ({selectedIds.length})</>
                    ) : (
                        <><MonitorPlay className="w-3.5 h-3.5 mr-2 opacity-50" /> Channels</>
                    )}
                </button>

                <motion.div 
                    layout
                    className="flex items-center"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {unselectedChannels.map((channel, index) => (
                        <motion.button
                            key={channel.id}
                            layoutId={`channel-${channel.id}`}
                            onClick={() => onToggle(channel.id)}
                            className="relative group/item shrink-0"
                            title={channel.name}
                            animate={{
                                marginLeft: (isHovered || index === 0) ? 0 : -24,
                                zIndex: isHovered ? 10 : unselectedChannels.length - index,
                                filter: isHovered ? 'grayscale(0%) brightness(1)' : 'grayscale(100%) brightness(0.7)',
                                opacity: isHovered ? 1 : 0.8,
                                scale: isHovered ? 1.1 : 1,
                            }}
                            whileHover={{ 
                                scale: 1.2, 
                                y: -8, 
                                zIndex: 50,
                                rotate: 5,
                                marginLeft: 0
                            }}
                            transition={{ 
                                type: "spring", 
                                stiffness: 300, 
                                damping: 30,
                                layout: { duration: 0.4, type: "spring", bounce: 0.2 }
                            }}
                        >
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg bg-black ring-1 ring-black/5">
                                {channel.logoUrl ? (
                                    <img 
                                        src={channel.logoUrl} 
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white font-black text-lg">
                                        {channel.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            {/* Tooltip on hover */}
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover/item:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                                {channel.name}
                            </div>
                        </motion.button>
                    ))}
                </motion.div>
            </div>

            {/* Divider Arrow */}
            <AnimatePresence>
                {selectedChannels.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8, width: 0 }}
                        animate={{ opacity: 1, scale: 1, width: 'auto' }}
                        exit={{ opacity: 0, scale: 0.8, width: 0 }}
                        className="flex-1 flex justify-center items-center px-4 py-6 overflow-hidden"
                    >
                        <div className="h-px bg-gradient-to-r from-transparent via-rose-200 to-transparent w-full relative min-w-[100px]">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-[10px] font-black text-rose-400 uppercase tracking-widest whitespace-nowrap">
                                Selected Channels
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Right Side: Selected Colorful */}
            <motion.div layout className="flex items-center gap-3 ml-auto">
                {selectedChannels.map((channel) => (
                    <motion.button
                        key={channel.id}
                        layoutId={`channel-${channel.id}`}
                        onClick={() => onToggle(channel.id)}
                        className="relative group/selected active:scale-90 transition-transform shrink-0"
                        animate={{ 
                            rotate: 0, 
                            scale: 1,
                            filter: 'grayscale(0%) brightness(1)',
                            opacity: 1
                        }}
                        whileHover={{ scale: 1.1, y: -4, rotate: -5 }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 300, 
                            damping: 30,
                            layout: { duration: 0.4, type: "spring", bounce: 0.2 }
                        }}
                    >
                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-rose-400 shadow-xl selected-glow bg-white p-0.5">
                            <div className="w-full h-full rounded-full overflow-hidden relative">
                                {channel.logoUrl ? (
                                    <img 
                                        src={channel.logoUrl} 
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-500 to-pink-600 text-white font-black text-xl">
                                        {channel.name.charAt(0)}
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover/selected:opacity-100 transition-opacity flex items-end justify-center pb-1">
                                    <Trash2 className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        </div>
                        {/* Label */}
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-rose-600 uppercase tracking-tighter whitespace-nowrap">
                            {channel.name}
                        </div>
                    </motion.button>
                ))}
            </motion.div>
        </div>
    );
};

export default ChannelFilter;
