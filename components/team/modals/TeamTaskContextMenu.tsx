import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Edit3, Copy, Trash2 } from 'lucide-react';
import { Task } from '../../../types';

export interface TeamTaskContextMenuState {
    x: number;
    y: number;
    task: Task;
    userId: string;
    date: Date;
}

interface TeamTaskContextMenuProps {
    menuState: TeamTaskContextMenuState | null;
    onClose: () => void;
    onEdit: (task: Task) => void;
    onDuplicate: (task: Task, userId: string, date: Date) => void;
    onDelete: (task: Task) => void;
}

const menuVariants: Variants = {
    hidden: {
        opacity: 0,
        scale: 0.94,
        y: -4,
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.16,
            ease: [0.16, 1, 0.3, 1] as const,
        },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: -4,
        transition: {
            duration: 0.12,
            ease: [0.4, 0, 1, 1] as const,
        },
    },
};

export const TeamTaskContextMenu: React.FC<TeamTaskContextMenuProps> = ({
    menuState,
    onClose,
    onEdit,
    onDuplicate,
    onDelete,
}) => {
    const [coords, setCoords] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

    useEffect(() => {
        if (!menuState) return;

        const menuWidth = 220;
        const menuHeight = 175;
        const padding = 12;

        const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1024;
        const viewportH = typeof window !== 'undefined' ? window.innerHeight : 768;

        const clampedLeft = Math.min(
            Math.max(padding, menuState.x),
            viewportW - menuWidth - padding
        );
        const clampedTop = Math.min(
            Math.max(padding, menuState.y),
            viewportH - menuHeight - padding
        );

        setCoords({ left: clampedLeft, top: clampedTop });
    }, [menuState]);

    useEffect(() => {
        if (!menuState) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        const handleScrollOrResize = () => {
            onClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [menuState, onClose]);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {menuState && (
                <div
                    className="fixed inset-0 z-[10040]"
                    onClick={onClose}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        onClose();
                    }}
                >
                    <motion.div
                        key="team-task-context-menu"
                        variants={menuVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        style={{ left: coords.left, top: coords.top }}
                        onClick={(e) => e.stopPropagation()}
                        onContextMenu={(e) => e.preventDefault()}
                        className="fixed w-[216px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-100/90 overflow-hidden p-1.5 select-none"
                    >
                        {/* Task Header Preview */}
                        <div className="px-3 py-2 border-b border-slate-100 mb-1 bg-gradient-to-r from-indigo-50/60 via-purple-50/40 to-pink-50/50 rounded-xl">
                            <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">
                                จัดการงาน
                            </p>
                            <p className="text-xs font-bold text-slate-700 truncate mt-0.5" title={menuState.task.title}>
                                {menuState.task.title}
                            </p>
                        </div>

                        {/* Menu Actions */}
                        <div className="space-y-0.5">
                            <button
                                type="button"
                                onClick={() => {
                                    const targetTask = menuState.task;
                                    onClose();
                                    onEdit(targetTask);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-700 hover:bg-indigo-50/80 rounded-xl transition-colors text-left"
                            >
                                <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-500 border border-indigo-100 flex items-center justify-center shrink-0">
                                    <Edit3 className="w-3.5 h-3.5" />
                                </span>
                                <span>แก้ไขงาน (Edit)</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    const { task, userId, date } = menuState;
                                    onClose();
                                    onDuplicate(task, userId, date);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/80 rounded-xl transition-colors text-left"
                            >
                                <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                                    <Copy className="w-3.5 h-3.5" />
                                </span>
                                <span>คัดลอกงาน (Duplicate)</span>
                            </button>

                            <div className="my-1 border-t border-slate-100" />

                            <button
                                type="button"
                                onClick={() => {
                                    const targetTask = menuState.task;
                                    onClose();
                                    onDelete(targetTask);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50/90 rounded-xl transition-colors text-left"
                            >
                                <span className="w-6 h-6 rounded-lg bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center shrink-0">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </span>
                                <span>ลบงาน (Delete)</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default TeamTaskContextMenu;
