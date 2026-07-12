import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

interface TaskAnimateWrapperProps {
    index: number;
    isMobileDot: boolean;
    isExpanded: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onClick: (e: React.MouseEvent) => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    rootStyle: React.CSSProperties;
    rootClassName: string;
    children: React.ReactNode;
}

const TaskAnimateWrapper = React.forwardRef<HTMLDivElement, TaskAnimateWrapperProps>(({
    index,
    isMobileDot,
    isExpanded,
    onDragStart,
    onClick,
    onMouseEnter,
    onMouseLeave,
    rootStyle,
    rootClassName,
    children,
}, ref) => {
    const animVariants = useMemo(() => {
        if (isMobileDot) {
            return {
                initial: { opacity: 0, scale: 0.8 },
                animate: { opacity: 1, scale: 1 },
                exit: { 
                    opacity: 0, 
                    scale: 0.8,
                    transition: {
                        type: "spring" as const,
                        stiffness: 500,
                        damping: 35,
                        mass: 0.8,
                        delay: 0,
                    }
                }
            };
        }
        return {
            initial: { opacity: 0, scale: 0.85, height: 0, overflow: 'hidden' },
            animate: { 
                opacity: 1, 
                scale: 1, 
                height: isExpanded ? "auto" : 24,
                transitionEnd: {
                    overflow: 'visible'
                }
            },
            exit: { 
                opacity: 0, 
                scale: 0.85, 
                height: 0, 
                overflow: 'hidden',
                transition: {
                    type: "spring" as const,
                    stiffness: 500,
                    damping: 35,
                    mass: 0.8,
                    delay: 0,
                }
            }
        };
    }, [isMobileDot, isExpanded]);

    return (
        <motion.div 
            ref={ref}
            layout="position"
            draggable
            onDragStart={onDragStart as any}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            initial={animVariants.initial}
            animate={animVariants.animate}
            exit={animVariants.exit}
            whileHover={isMobileDot ? undefined : { 
                scale: isExpanded ? 1.05 : 1.08, 
                y: -1.5,
                boxShadow: "0 12px 24px rgba(0,0,0,0.12)",
                zIndex: 50,
            }}
            transition={{
                default: {
                    type: "spring",
                    stiffness: 400,
                    damping: 35,
                    mass: 0.8,
                    delay: index * 0.02, // Staggered delay for sleek entry effect
                },
                layout: {
                    type: "spring",
                    stiffness: 400,
                    damping: 35,
                    mass: 0.8,
                    delay: 0, // Instant layout shift without delay
                },
                opacity: {
                    type: "spring",
                    stiffness: 400,
                    damping: 35,
                    mass: 0.8,
                    delay: index * 0.02,
                },
                scale: {
                    type: "spring",
                    stiffness: 400,
                    damping: 35,
                    mass: 0.8,
                    delay: index * 0.02,
                },
                height: {
                    type: "spring",
                    stiffness: 400,
                    damping: 35,
                    mass: 0.8,
                }
            }}
            style={rootStyle}
            className={rootClassName}
        >
            {children}
        </motion.div>
    );
});

export default memo(TaskAnimateWrapper);
