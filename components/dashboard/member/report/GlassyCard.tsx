import React from 'react';
import { motion } from "framer-motion";

interface GlassyCardProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}

const GlassyCard: React.FC<GlassyCardProps> = ({ children, className = "", delay = 0 }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className={`
                bg-white/40 backdrop-blur-xl border border-white/40 
                rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] 
                hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]
                hover:scale-[1.01] transition-all duration-300
                overflow-hidden ${className}
            `}
        >
            {children}
        </motion.div>
    );
};

export default GlassyCard;
