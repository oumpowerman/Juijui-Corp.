import { type Variants, type Transition } from 'framer-motion';

export type MetricoolTabType = 'EXPORT' | 'IMPORT';
export type ExportRangeMode = 'CURRENT_MONTH' | 'NEXT_7_DAYS' | 'CUSTOM';
export type ExportStatusScope = 'ALL' | 'FINAL_ONLY';
export type ImportDraftMode = 'AUTO' | 'ALWAYS_SCHEDULED' | 'ALWAYS_DRAFT';
export type YoutubePrivacyMode = 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
export type ImportStatusFilter = 'ALL' | 'UPDATE' | 'CREATE' | 'SKIP';

export const PREVIEW_PAGE_SIZE = 50;

export const PLATFORM_BADGE_STYLE: Record<string, { label: string; bg: string; text: string }> = {
    FACEBOOK: { label: 'FB', bg: 'bg-[#E9F1F6] border-[#C9DDE9]', text: 'text-[#3B6B8C]' },
    INSTAGRAM: { label: 'IG', bg: 'bg-[#F9EAE6] border-[#ECCBC2]', text: 'text-[#9E5240]' },
    TIKTOK: { label: 'TT', bg: 'bg-[#EFECE6] border-[#D8D0C3]', text: 'text-[#5A5246]' },
    YOUTUBE: { label: 'YT', bg: 'bg-[#FAE6E3] border-[#EBC0B8]', text: 'text-[#A64438]' }
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
 * Strictly typed Variants for collapsible drawers & guide banner (Zero-Jitter Rulebook #7)
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
