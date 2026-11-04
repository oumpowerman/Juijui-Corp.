import { type Variants } from 'framer-motion';
import { Goal, Channel, Platform } from '../../../types';
import { GoalLiveSyncResult } from '../../../hooks/useGoals';

export interface GoalFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Goal | null;
    channels: Channel[];
    onSave: (data: any) => void;
}

export interface UpdateProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    goal: Goal;
    channels: Channel[];
    onSyncLive: (goal: Goal) => Promise<GoalLiveSyncResult>;
}

export interface PlatformBreakdownItem {
    platform: Platform;
    count: number;
    diff: number;
    error?: string;
}

export const ALL_PLATFORMS: {
    id: Platform | 'ALL';
    label: string;
    shortLabel: string;
    iconColor: string;
    activeBg: string;
}[] = [
    {
        id: 'ALL',
        label: 'รวมทุกแพลตฟอร์ม',
        shortLabel: 'ALL',
        iconColor: 'text-indigo-600',
        activeBg: 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-200',
    },
    {
        id: 'YOUTUBE',
        label: 'YouTube',
        shortLabel: 'YT',
        iconColor: 'text-red-600',
        activeBg: 'bg-red-600 border-red-600 text-white shadow-red-200',
    },
    {
        id: 'FACEBOOK',
        label: 'Facebook',
        shortLabel: 'FB',
        iconColor: 'text-blue-600',
        activeBg: 'bg-blue-600 border-blue-600 text-white shadow-blue-200',
    },
    {
        id: 'TIKTOK',
        label: 'TikTok',
        shortLabel: 'TT',
        iconColor: 'text-slate-900',
        activeBg: 'bg-slate-900 border-slate-900 text-white shadow-slate-300',
    },
    {
        id: 'INSTAGRAM',
        label: 'Instagram',
        shortLabel: 'IG',
        iconColor: 'text-pink-600',
        activeBg: 'bg-pink-600 border-pink-600 text-white shadow-pink-200',
    },
];

export const QUICK_TARGET_INCREMENTS = [1000, 5000, 10000, 50000, 100000];

export const modalBackdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const },
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] as const },
    },
};

export const modalContainerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: 'spring', damping: 26, stiffness: 300 },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 20,
        transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] as const },
    },
};

export const dropdownPopoverVariants: Variants = {
    hidden: { opacity: 0, scale: 0.96, y: -6 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: 'spring', damping: 25, stiffness: 340 },
    },
    exit: {
        opacity: 0,
        scale: 0.96,
        y: -6,
        transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] as const },
    },
};

export const staggerListVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 },
    },
};

export const staggerItemVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', damping: 24, stiffness: 280 },
    },
};
