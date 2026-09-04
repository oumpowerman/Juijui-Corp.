import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../../../../../types';
import { MemberControlCard } from './MemberControlCard';

interface MemberPositionSectionProps {
    positionName: string;
    members: User[];
    activeAdjustUserId: string | null;
    onToggleAdjust: (user: User) => void;
    onSaveAdjustment: (user: User, amount: number, reason: string) => Promise<boolean>;
    onToggleStatus: (user: User) => void;
    onDeleteMember: (userId: string) => void;
    onViewHistory: (user: User) => void;
    togglingUserId: string | null;
}

export const MemberPositionSection: React.FC<MemberPositionSectionProps> = ({
    positionName,
    members,
    activeAdjustUserId,
    onToggleAdjust,
    onSaveAdjustment,
    onToggleStatus,
    onDeleteMember,
    onViewHistory,
    togglingUserId
}) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(true);

    const activeInPosition = members.filter(m => m.isActive).length;

    return (
        <div className="bg-gray-50/70 border border-gray-200/80 rounded-3xl p-3.5 sm:p-4 space-y-3">
            {/* Section Header */}
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between text-left cursor-pointer group select-none"
            >
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center shrink-0 shadow-2xs">
                        <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
                                {positionName}
                            </h4>
                            <span className="px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-700 text-[10px] font-black shadow-2xs">
                                {members.length} คน
                            </span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                            ใช้งานอยู่ {activeInPosition} คน • พักงาน {members.length - activeInPosition} คน
                        </p>
                    </div>
                </div>

                <div className="p-1 rounded-lg text-gray-400 group-hover:text-gray-600 group-hover:bg-gray-200/60 transition-colors">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
            </button>

            {/* Members in Position with Smooth Accordion Expand/Collapse */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ 
                            height: { duration: 0.28, ease: [0.33, 1, 0.68, 1] },
                            opacity: { duration: 0.2 }
                        }}
                        className="space-y-2.5 pt-1 overflow-hidden"
                    >
                        {members.map(user => (
                            <MemberControlCard
                                key={user.id}
                                user={user}
                                isAdjusting={activeAdjustUserId === user.id}
                                onToggleAdjust={() => onToggleAdjust(user)}
                                onSaveAdjustment={onSaveAdjustment}
                                onToggleStatus={onToggleStatus}
                                onDeleteMember={onDeleteMember}
                                onViewHistory={onViewHistory}
                                isTogglingStatus={togglingUserId === user.id}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
