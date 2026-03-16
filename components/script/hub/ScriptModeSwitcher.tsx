
import React from 'react';
import { User, Users, Beaker } from 'lucide-react';
import { motion } from 'framer-motion';

export type ScriptHubMode = 'HUB' | 'STUDIO' | 'LAB';

interface ScriptModeSwitcherProps {
    mode: ScriptHubMode;
    onChange: (mode: ScriptHubMode) => void;
    className?: string;
}

const ScriptModeSwitcher: React.FC<ScriptModeSwitcherProps> = ({ mode, onChange, className = '' }) => {
    const getModeIndex = (m: ScriptHubMode) => {
        if (m === 'HUB') return 0;
        if (m === 'STUDIO') return 1;
        return 2;
    };

    return (
        <div className={`inline-flex bg-gray-100/50 backdrop-blur-sm p-1 rounded-full border border-gray-200/50 shadow-inner ${className}`}>
            <div className="relative flex items-center">
                {/* Sliding Background Indicator */}
                <motion.div
                    className={`absolute h-full rounded-full shadow-sm z-0 ${
                        mode === 'HUB' 
                            ? 'bg-gradient-to-r from-rose-500 to-pink-500' 
                            : mode === 'STUDIO'
                                ? 'bg-gradient-to-r from-indigo-500 to-violet-500'
                                : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    }`}
                    initial={false}
                    animate={{
                        x: `${getModeIndex(mode) * 100}%`,
                        width: '33.33%'
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />

                <button
                    onClick={() => onChange('HUB')}
                    className={`
                        relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black transition-colors duration-300 w-[70px] justify-center
                        ${mode === 'HUB' ? 'text-white' : 'text-gray-500 hover:text-gray-700'}
                    `}
                >
                    <motion.div
                        whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.4 } }}
                    >
                        <Users className="w-3.5 h-3.5" />
                    </motion.div>
                    <span className="hidden sm:inline">HUB</span>
                </button>
                
                <button
                    onClick={() => onChange('STUDIO')}
                    className={`
                        relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black transition-colors duration-300 w-[70px] justify-center
                        ${mode === 'STUDIO' ? 'text-white' : 'text-gray-500 hover:text-gray-700'}
                    `}
                >
                    <motion.div
                        whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.4 } }}
                    >
                        <User className="w-3.5 h-3.5" />
                    </motion.div>
                    <span className="hidden sm:inline">STUDIO</span>
                </button>

                <button
                    onClick={() => onChange('LAB')}
                    className={`
                        relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black transition-colors duration-300 w-[70px] justify-center
                        ${mode === 'LAB' ? 'text-white' : 'text-gray-500 hover:text-gray-700'}
                    `}
                >
                    <motion.div
                        whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.4 } }}
                    >
                        <Beaker className="w-3.5 h-3.5" />
                    </motion.div>
                    <span className="hidden sm:inline">LAB</span>
                </button>
            </div>
        </div>
    );
};

export default ScriptModeSwitcher;
