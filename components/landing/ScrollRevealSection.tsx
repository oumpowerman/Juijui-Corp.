import React from 'react';
import { motion, type Variants } from 'framer-motion';

const headerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.02,
    },
  },
};

const headerChildVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 26,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

interface SectionAuraHeaderProps {
  badge?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  as?: 'h1' | 'h2';
  titleClassName?: string;
  subtitleClassName?: string;
  className?: string;
  once?: boolean;
}

/**
 * Reusable Foreground Section Header with:
 * 1. Multi-layer soft white radial aura shield behind the text so background cards/ribbons never reduce legibility.
 * 2. Crisp white + depth drop-shadow on display titles & subtitles.
 * 3. Smooth bidirectional scroll reveal (Slide Up/Down + Fade In/Out when scrolling down or up).
 */
export const SectionAuraHeader: React.FC<SectionAuraHeaderProps> = ({
  badge,
  title,
  subtitle,
  children,
  as = 'h2',
  titleClassName = 'text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-5 tracking-tight',
  subtitleClassName = 'text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed',
  className = 'text-center mb-14 sm:mb-16',
  once = false,
}) => {
  const HeadingTag = as === 'h1' ? motion.h1 : motion.h2;

  return (
    <motion.div
      variants={headerContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.25, margin: '-30px 0px -30px 0px' }}
      className={`relative z-20 ${className}`}
    >
      {/* Soft Radial White Aura Halo Shield behind the heading & subtitle */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute -inset-x-6 sm:-inset-x-12 -inset-y-6 sm:-inset-y-8 -z-10 rounded-[3rem]"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.78) 44%, rgba(255,255,255,0.28) 72%, rgba(255,255,255,0) 100%)',
          filter: 'blur(12px)',
        }}
      />

      {badge && (
        <motion.div variants={headerChildVariants} className="mb-4">
          {badge}
        </motion.div>
      )}

      <HeadingTag
        variants={headerChildVariants}
        className={`${titleClassName} drop-shadow-[0_2px_10px_rgba(255,255,255,0.98)] [filter:drop-shadow(0_2px_12px_rgba(255,255,255,0.95))_drop-shadow(0_8px_22px_rgba(15,23,42,0.09))]`}
      >
        {title}
      </HeadingTag>

      {subtitle && (
        <motion.p
          variants={headerChildVariants}
          className={`${subtitleClassName} [text-shadow:0_1px_12px_rgba(255,255,255,0.98),0_0_24px_rgba(255,255,255,0.92)]`}
        >
          {subtitle}
        </motion.p>
      )}

      {children && (
        <motion.div variants={headerChildVariants}>
          {children}
        </motion.div>
      )}
    </motion.div>
  );
};

interface ScrollRevealItemProps {
  children: React.ReactNode;
  index?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale';
  amount?: number;
  className?: string;
  once?: boolean;
}

/**
 * Reusable Bidirectional Scroll Reveal Wrapper for cards, grid items, and banners.
 * Animates smoothly both when scrolling down and when scrolling back up.
 */
export const ScrollRevealItem: React.FC<ScrollRevealItemProps> = ({
  children,
  index = 0,
  direction = 'up',
  amount = 0.18,
  className = '',
  once = false,
}) => {
  const offsetMap = {
    up: { x: 0, y: 30, scale: 0.96 },
    down: { x: 0, y: -30, scale: 0.96 },
    left: { x: -28, y: 12, scale: 0.97 },
    right: { x: 28, y: 12, scale: 0.97 },
    scale: { x: 0, y: 18, scale: 0.93 },
  }[direction];

  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      x: offsetMap.x,
      y: offsetMap.y,
      scale: offsetMap.scale,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.52,
        delay: (index % 6) * 0.06,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  };

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount, margin: '-20px 0px -20px 0px' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
