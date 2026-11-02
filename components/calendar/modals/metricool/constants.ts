import { type Variants, type Transition } from 'framer-motion';

export type MetricoolTabType = 'EXPORT' | 'IMPORT';
export type ExportRangeMode = 'CURRENT_MONTH' | 'NEXT_7_DAYS' | 'CUSTOM';
export type ExportStatusScope = 'ALL' | 'FINAL_ONLY';
export type ImportDraftMode = 'AUTO' | 'ALWAYS_SCHEDULED' | 'ALWAYS_DRAFT';
export type YoutubePrivacyMode = 'PUBLIC' | 'UNLISTED' | 'PRIVATE';

export const PLATFORM_BADGE_STYLE: Record<string, { label: string; bg: string; text: string }> = {
    FACEBOOK: { label: 'FB', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
    INSTAGRAM: { label: 'IG', bg: 'bg-pink-50 border-pink-200', text: 'text-pink-700' },
    TIKTOK: { label: 'TT', bg: 'bg-slate-100 border-slate-300', text: 'text-slate-800' },
    YOUTUBE: { label: 'YT', bg: 'bg-red-50 border-red-200', text: 'text-red-700' }
};

/**
 * Shared spring transition for coordinated layout elements (Zero-Jitter Rulebook #5)
 */
export const springTabIndicatorTransition: Transition = {
    type: 'spring',
    stiffness: 380,
    damping: 32,
    mass: 0.8
};

/**
 * Strictly typed Variants for switching between EXPORT and IMPORT tabs (Zero-Jitter Rulebook #7)
 */
export const tabContentVariants: Variants = {
    initial: {
        opacity: 0,
        y: 8
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.2,
            ease: [0.16, 1, 0.3, 1] as const
        }
    },
    exit: {
        opacity: 0,
        y: -8,
        transition: {
            duration: 0.14,
            ease: [0.4, 0, 1, 1] as const
        }
    }
};

/**
 * Strictly typed Variants for collapsible paste drawer inside the Import tab
 */
export const collapsibleDrawerVariants: Variants = {
    initial: {
        height: 0,
        opacity: 0
    },
    animate: {
        height: 'auto',
        opacity: 1,
        transition: {
            height: {
                duration: 0.22,
                ease: [0.16, 1, 0.3, 1] as const
            },
            opacity: {
                duration: 0.18,
                ease: 'easeOut'
            }
        }
    },
    exit: {
        height: 0,
        opacity: 0,
        transition: {
            height: {
                duration: 0.18,
                ease: [0.4, 0, 0.2, 1] as const
            },
            opacity: {
                duration: 0.12,
                ease: 'easeIn'
            }
        }
    }
};
