
import React, { useState } from 'react';
import { User } from '../../../types';
import { Trash2, User as UserIcon, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreatorFilterProps {
    users: User[];
    selectedIds: string[];
    onToggle: (id: string) => void;
    onClear: () => void;
}

const CreatorFilter: React.FC<CreatorFilterProps> = ({
    users,
    selectedIds,
    onToggle,
    onClear
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    
    const activeUsers = users.filter(u => u.isActive);
    const unselectedUsers = activeUsers.filter(u => !selectedIds.includes(u.id));
    const selectedUsers = activeUsers.filter(u => selectedIds.includes(u.id));

    // Logic for +N
    const LIMIT = 6;
    const showPlusN = !isExpanded && unselectedUsers.length > LIMIT;
    const displayedUnselected = showPlusN ? unselectedUsers.slice(0, LIMIT - 1) : unselectedUsers;
    const hiddenCount = unselectedUsers.length - (LIMIT - 1);

    return (
        <div className="flex items-center gap-6 w-full py-4 overflow-visible">
            <style>{`
                .selected-glow-indigo {
                    box-shadow: 0 0 15px rgba(99, 102, 241, 0.3);
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
                            ? 'bg-gradient-to-br from-indigo-50 to-blue-100 text-indigo-600 border-indigo-200 hover:from-indigo-100 hover:to-blue-200 cursor-pointer active:scale-95 shadow-sm'
                            : 'bg-white/50 text-gray-400 border-gray-100 cursor-default opacity-60'
                        }
                    `}
                >
                    {selectedIds.length > 0 ? (
                        <><Trash2 className="w-3.5 h-3.5 mr-2 animate-pulse" /> Clear ({selectedIds.length})</>
                    ) : (
                        <><UserIcon className="w-3.5 h-3.5 mr-2 opacity-50" /> Creators</>
                    )}
                </button>

                <motion.div 
                    className="flex items-center"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {displayedUnselected.map((user, index) => (
                        <motion.button
                            key={user.id}
                            layoutId={`creator-${user.id}`}
                            onClick={() => onToggle(user.id)}
                            className="relative group/item shrink-0"
                            title={user.name}
                            initial={false}
                            animate={{
                                x: (isHovered || isExpanded) ? 0 : index * -24,
                                zIndex: (isHovered || isExpanded) ? 10 : displayedUnselected.length - index,
                                filter: (isHovered || isExpanded) ? 'grayscale(0%)' : 'grayscale(100%) brightness(0.8)',
                                opacity: (isHovered || isExpanded) ? 1 : 0.8,
                                scale: (isHovered || isExpanded) ? 1.1 : 1,
                            }}
                            whileHover={{ 
                                scale: 1.2, 
                                y: -8, 
                                zIndex: 50,
                                rotate: 5
                            }}
                            transition={{ 
                                type: "spring", 
                                stiffness: 300, 
                                damping: 30,
                                layout: { duration: 0.6, type: "spring", bounce: 0.3 }
                            }}
                        >
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg bg-gray-200 ring-1 ring-black/5">
                              {user.avatarUrl ? (
                                <img 
                                  src={user.avatarUrl} 
                                  alt={user.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-black text-sm">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            {/* Tooltip on hover */}
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover/item:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                                {user.name}
                            </div>
                        </motion.button>
                    ))}

                    {showPlusN && (
                        <motion.button
                            key="plus-n"
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{
                                x: (isHovered || isExpanded)
                                    ? 0
                                    : (displayedUnselected.length) * -24,

                                zIndex: (isHovered || isExpanded)
                                    ? 10
                                    : 0,
                                    
                                opacity: (isHovered || isExpanded) ? 1 : 0.8,
                                scale: (isHovered || isExpanded) ? 1.1 : 1,
                                filter: (isHovered || isExpanded)
                                  ? 'grayscale(0%)'
                                  : 'grayscale(100%) brightness(0.8)'
                             }}
                            onClick={() => setIsExpanded(true)}
                            className="w-12 h-12 rounded-full bg-white border-2 border-dashed border-indigo-300 flex items-center justify-center text-indigo-500 font-black text-xs shadow-lg hover:bg-indigo-50 transition-colors z-10 shrink-0"
                        >
                            +{hiddenCount}
                        </motion.button>
                    )}
                </motion.div>
            </div>

            {/* Divider Arrow */}
            {selectedUsers.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex justify-center items-center px-4"
                >
                    <div className="h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent w-full relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-[10px] font-black text-indigo-400 uppercase tracking-widest whitespace-nowrap">
                            Selected Creators
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Right Side: Selected Colorful */}
            <div className="flex items-center gap-3 ml-auto">
                {selectedUsers.map((user) => (
                    <motion.button
                        key={user.id}
                        layoutId={`user-${user.id}`}
                        onClick={() => onToggle(user.id)}
                        className="relative group/selected active:scale-90 transition-transform shrink-0"
                        initial={false}
                        animate={{ rotate: 0, scale: 1 }}
                        whileHover={{ scale: 1.1, y: -4, rotate: -5 }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 300, 
                            damping: 30,
                            layout: { duration: 0.6, type: "spring", bounce: 0.3 }
                        }}
                    >
                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-indigo-400 shadow-xl selected-glow-indigo bg-white p-0.5">
                            <div className="w-full h-full rounded-full overflow-hidden relative">
                              {user.avatarUrl ? (
                                <img 
                                  src={user.avatarUrl} 
                                  alt={user.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-black text-lg">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover/selected:opacity-100 transition-opacity flex items-end justify-center pb-1">
                                    <Trash2 className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        </div>
                        {/* Label */}
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-indigo-600 uppercase tracking-tighter whitespace-nowrap">
                            {user.name.split(' ')[0]}
                        </div>
                    </motion.button>
                ))}
            </div>
        </div>
    );
};

export default CreatorFilter;
