import { type Variants } from 'framer-motion';

export const WORKSPACE_COLOR_PRESETS = [
    { label: 'Indigo', value: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-600' },
    { label: 'Emerald', value: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-600' },
    { label: 'Rose', value: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-600' },
    { label: 'Amber', value: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-600' },
    { label: 'Sky', value: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-600' },
    { label: 'Violet', value: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-600' }
];

export const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const }
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] as const }
    }
};

export const modalVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 20,
        scale: 0.97
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: 'spring',
            damping: 28,
            stiffness: 340,
            mass: 0.85
        }
    },
    exit: {
        opacity: 0,
        y: 16,
        scale: 0.97,
        transition: {
            duration: 0.18,
            ease: [0.16, 1, 0.3, 1] as const
        }
    }
};

export const tabContentVariants: Variants = {
    initial: {
        opacity: 0,
        y: 8,
        filter: 'blur(2px)'
    },
    animate: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: {
            duration: 0.2,
            ease: [0.16, 1, 0.3, 1] as const
        }
    },
    exit: {
        opacity: 0,
        y: -6,
        filter: 'blur(2px)',
        transition: {
            duration: 0.14,
            ease: [0.16, 1, 0.3, 1] as const
        }
    }
};

