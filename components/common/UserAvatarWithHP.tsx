
import React from 'react';
import { User } from '../../types';
import { Crown, AlertTriangle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserAvatarWithHPProps {
    user: User;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    className?: string;
    showLevel?: boolean;
    showStatus?: boolean;
    showAdminBadge?: boolean;
    isFocused?: boolean;
}

const UserAvatarWithHP: React.FC<UserAvatarWithHPProps> = ({ 
    user, 
    size = 'md', 
    className = '', 
    showLevel = true, 
    showStatus = true,
    showAdminBadge = true,
    isFocused = false
}) => {
    const hpPercent = Math.max(0, Math.min(100, (user.hp / (user.maxHp || 100)) * 100));
    const circumference = 2 * Math.PI * 46;
    const offset = circumference - (hpPercent / 100) * circumference;
    
    const isFullHP = hpPercent >= 100;
    const isLowHP = hpPercent < 25;
    const isCriticalHP = hpPercent < 10;

    const hpColor = hpPercent > 70 ? 'text-emerald-500' : hpPercent > 30 ? 'text-amber-500' : 'text-red-500';
    const glowColor = hpPercent > 70 ? 'rgba(16, 185, 129, 0.5)' : hpPercent > 30 ? 'rgba(245, 158, 11, 0.5)' : 'rgba(239, 68, 68, 0.5)';

    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
        xl: 'w-24 h-24',
        '2xl': 'w-32 h-32'
    };

    const ringInset = {
        sm: '-inset-1',
        md: '-inset-1.5',
        lg: '-inset-2',
        xl: '-inset-3',
        '2xl': '-inset-4'
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'ONLINE': return 'bg-green-500 ring-green-200';
            case 'BUSY': return 'bg-red-500 ring-red-200';
            case 'SICK': return 'bg-orange-500 ring-orange-200';
            case 'VACATION': return 'bg-blue-500 ring-blue-200';
            case 'MEETING': return 'bg-purple-500 ring-purple-200';
            default: return 'bg-gray-400 ring-gray-200';
        }
    };

    return (
        <motion.div 
            className={`relative ${className}`}
            animate={
                isCriticalHP ? {
                    x: [0, -1, 1, -1, 1, 0],
                    transition: { repeat: Infinity, duration: 0.2 }
                } : isFullHP ? {
                    y: [0, -2, 0],
                    transition: { repeat: Infinity, duration: 2, ease: "easeInOut" }
                } : {}
            }
        >
            {/* HP Ring SVG */}
            <div className={`absolute ${ringInset[size]} transition-transform duration-300 ${isFocused ? 'scale-110' : 'group-hover:scale-105'}`}>
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Background Ring */}
                    <circle
                        cx="50"
                        cy="50"
                        r="46"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="4"
                        className="text-gray-100"
                    />
                    
                    {/* Glow Effect for Full HP */}
                    {isFullHP && (
                        <motion.circle
                            cx="50"
                            cy="50"
                            r="46"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-emerald-400/30"
                            animate={{
                                opacity: [0.2, 0.5, 0.2],
                                scale: [1, 1.05, 1],
                            }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        />
                    )}

                    {/* Main HP Ring */}
                    <motion.circle
                        cx="50"
                        cy="50"
                        r="46"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="5"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        strokeLinecap="round"
                        className={`${hpColor} transition-colors duration-500`}
                        style={{ filter: `drop-shadow(0 0 4px ${glowColor})` }}
                        transition={{ type: "spring", stiffness: 50, damping: 20 }}
                    />
                </svg>
            </div>

            {/* Avatar Image */}
            <motion.div 
                className={`rounded-full relative z-10 p-1 bg-white shadow-sm`}
                animate={
                    isFocused ? { scale: 1.1 } : { scale: 1 }
                }
                whileHover={{ scale: 1.05 }}
            >
                <div className="relative rounded-full overflow-hidden">
                    <img 
                        src={user.avatarUrl} 
                        className={`${sizeClasses[size]} rounded-full object-cover shadow-inner transition-all duration-500 ${isCriticalHP ? 'grayscale contrast-125' : ''}`} 
                        alt={user.name} 
                    />
                    
                    {/* Low HP Red Overlay Pulse */}
                    <AnimatePresence>
                        {isLowHP && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 0.3, 0] }}
                                exit={{ opacity: 0 }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="absolute inset-0 bg-red-500 pointer-events-none"
                            />
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Status Dot */}
            {showStatus && (
                <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`absolute -top-0.5 -left-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ring-1 ${getStatusColor(user.workStatus || 'ONLINE')} shadow-sm z-20`}
                />
            )}

            {/* Admin Badge */}
            {showAdminBadge && user.role === 'ADMIN' && (
                <motion.span 
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-white p-0.5 rounded-full border-2 border-white shadow-sm z-20"
                >
                    <Crown className="w-2.5 h-2.5 fill-white" />
                </motion.span>
            )}

            {/* Level Badge */}
            {showLevel && (
                <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[7px] px-1.5 py-0.5 rounded-full border-2 border-white font-black shadow-sm z-20"
                >
                    Lv.{user.level}
                </motion.div>
            )}

            {/* Full HP Sparkles */}
            <AnimatePresence>
                {isFullHP && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute -top-2 -right-2 z-30 pointer-events-none"
                    >
                        <motion.div
                            animate={{ 
                                rotate: [0, 15, -15, 0],
                                scale: [1, 1.2, 1]
                            }}
                            transition={{ repeat: Infinity, duration: 3 }}
                        >
                            <Sparkles className="w-4 h-4 text-yellow-400 fill-yellow-400 drop-shadow-sm" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Critical HP Warning */}
            <AnimatePresence>
                {isCriticalHP && (
                    <motion.div 
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-3 -right-3 z-30 pointer-events-none"
                    >
                        <div className="bg-red-500 text-white p-1 rounded-full shadow-lg animate-bounce">
                            <AlertTriangle className="w-3 h-3" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default UserAvatarWithHP;
