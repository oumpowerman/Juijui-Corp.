import { type Variants } from 'framer-motion';

export const WORKSPACE_COLOR_PRESETS = [
    { label: 'Indigo', value: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-600', ring: 'ring-indigo-500/30' },
    { label: 'Emerald', value: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-600', ring: 'ring-emerald-500/30' },
    { label: 'Rose', value: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-600', ring: 'ring-rose-500/30' },
    { label: 'Amber', value: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-600', ring: 'ring-amber-500/30' },
    { label: 'Sky', value: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-600', ring: 'ring-sky-500/30' },
    { label: 'Violet', value: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-600', ring: 'ring-violet-500/30' }
];

export const overlayContainerVariants: Variants = {
    hidden: {},
    visible: {},
    exit: {}
};

export const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.26,
            ease: [0.22, 1, 0.36, 1] as const
        }
    },
    exit: {
        opacity: 0,
        transition: {
            duration: 0.28,
            ease: [0.4, 0, 0.2, 1] as const
        }
    }
};

export const modalVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 28,
        scale: 0.94,
        filter: 'blur(8px)'
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        transition: {
            type: 'spring',
            damping: 26,
            stiffness: 320,
            mass: 0.85
        }
    },
    exit: {
        opacity: 0,
        y: 22,
        scale: 0.94,
        filter: 'blur(6px)',
        transition: {
            duration: 0.25,
            ease: [0.4, 0, 0.2, 1] as const
        }
    }
};

export const tabContentVariants: Variants = {
    initial: {
        opacity: 0,
        y: 10,
        scale: 0.99,
        filter: 'blur(3px)'
    },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        transition: {
            duration: 0.22,
            ease: [0.22, 1, 0.36, 1] as const,
            staggerChildren: 0.045
        }
    },
    exit: {
        opacity: 0,
        y: -8,
        scale: 0.99,
        filter: 'blur(3px)',
        transition: {
            duration: 0.15,
            ease: [0.4, 0, 0.2, 1] as const
        }
    }
};

export const staggerContainerVariants: Variants = {
    initial: { opacity: 0 },
    animate: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.02
        }
    },
    exit: {
        opacity: 0,
        transition: {
            duration: 0.12
        }
    }
};

export const staggerItemVariants: Variants = {
    initial: {
        opacity: 0,
        y: 12,
        scale: 0.985
    },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: 'spring',
            damping: 26,
            stiffness: 340
        }
    },
    exit: {
        opacity: 0,
        y: -6,
        scale: 0.985,
        transition: {
            duration: 0.14,
            ease: [0.4, 0, 0.2, 1] as const
        }
    }
};


