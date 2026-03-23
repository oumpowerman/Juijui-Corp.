import React, { useState , useEffect} from 'react';
import { motion } from 'framer-motion';
import { User } from '../../../types';

interface RandomizerSpinningProps {
    activeUsers: User[];
    numWinners: number;
}

const RandomizerSpinning: React.FC<RandomizerSpinningProps> = ({ activeUsers, numWinners }) => {
    // Generate random indices for each slot independently
    const [indices, setIndices] = useState<number[]>(new Array(numWinners).fill(0));

    useEffect(() => {
        const interval = setInterval(() => {
            setIndices(new Array(numWinners).fill(0).map(() => 
                Math.floor(Math.random() * activeUsers.length)
            ));
        }, 80); // Fast update for "spinning" effect

        return () => clearInterval(interval);
    }, [activeUsers, numWinners]);

    return (
        <motion.div 
            key="spinning"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="w-full flex flex-col items-center justify-center p-12"
        >
            <motion.div 
                animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-12 text-center"
            >
                กำลังค้นหาผู้โชคดี... 🎲✨
            </motion.div>
            
            <div className="flex flex-wrap justify-center gap-10">
                {indices.map((idx, i) => {
                    const user = activeUsers[idx];
                    return (
                        <motion.div 
                            key={i} 
                            animate={{ 
                                y: [0, -20, 0],
                                scale: [1, 1.05, 1]
                            }}
                            transition={{ 
                                duration: 0.3, 
                                repeat: Infinity,
                                delay: i * 0.1
                            }}
                            className="flex flex-col items-center relative"
                        >
                            <div className="absolute -inset-4 bg-indigo-500/20 rounded-full blur-xl animate-pulse" />
                            <img 
                                src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`}
                                alt="Spinning"
                                className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-white shadow-2xl scale-110 blur-[1px] transition-all duration-75 relative z-10"
                                referrerPolicy="no-referrer"
                            />
                            <div className="mt-6 text-xl font-black text-slate-400 blur-[1px] transition-all duration-75">
                                {user?.name}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
};

export default RandomizerSpinning;
