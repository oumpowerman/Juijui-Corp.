
import React, { useState, useEffect } from 'react';
import { User, Users, Beaker, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';

export type ScriptHubMode = 'HUB' | 'STUDIO' | 'LAB';

interface ScriptModeSwitcherProps {
    mode: ScriptHubMode;
    onChange: (mode: ScriptHubMode) => void;
    className?: string;
}

const ScriptModeSwitcher: React.FC<ScriptModeSwitcherProps> = ({ mode, onChange, className = '' }) => {
    const { showAlert } = useGlobalDialog();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const getModeIndex = (m: ScriptHubMode) => {
        if (m === 'HUB') return 0;
        if (m === 'STUDIO') return 1;
        return 2;
    };

    const handleModeChange = (newMode: ScriptHubMode) => {
        if (newMode === 'LAB' && isMobile) {
            showAlert(
                "โหมด Lab (ห้องทดลอง) จำเป็นต้องใช้พื้นที่หน้าจอขนาดใหญ่เพื่อประสิทธิภาพสูงสุด จึงรองรับการใช้งานบน Desktop เท่านั้นครับ",
                "🖥️ เฉพาะ Desktop เท่านั้น"
            );
            return;
        }
        onChange(newMode);
    };

    return (
        <div className={`
            inline-flex bg-white/40 backdrop-blur-md p-1 rounded-2xl border border-white/40 shadow-sm
            md:rounded-full md:p-1.5
            ${isMobile ? 'w-full max-w-[320px]' : ''}
            ${className}
        `}>
            <div className="relative flex items-center w-full">
                {/* Sliding Background Indicator */}
                <motion.div
                    className={`absolute h-full rounded-xl md:rounded-full shadow-md z-0 ${
                        mode === 'HUB' 
                            ? 'bg-gradient-to-br from-rose-500 to-pink-600' 
                            : mode === 'STUDIO'
                                ? 'bg-gradient-to-br from-indigo-500 to-violet-600'
                                : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                    }`}
                    initial={false}
                    animate={{
                        x: `${getModeIndex(mode) * 100}%`,
                        width: '33.33%'
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />

                <button
                    onClick={() => handleModeChange('HUB')}
                    className={`
                        relative z-10 flex flex-col md:flex-row items-center gap-1 md:gap-1.5 px-2 py-2 md:px-4 md:py-2 rounded-xl md:rounded-full text-[10px] md:text-xs font-black transition-all duration-300 flex-1 md:w-[100px] justify-center
                        ${mode === 'HUB' ? 'text-white scale-105' : 'text-gray-500 hover:text-gray-700'}
                    `}
                >
                    <motion.div
                        whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.4 } }}
                    >
                        <Users className="w-4 h-4 md:w-4 md:h-4" />
                    </motion.div>
                    <span className="">HUB</span>
                </button>
                
                <button
                    onClick={() => handleModeChange('STUDIO')}
                    className={`
                        relative z-10 flex flex-col md:flex-row items-center gap-1 md:gap-1.5 px-2 py-2 md:px-4 md:py-2 rounded-xl md:rounded-full text-[10px] md:text-xs font-black transition-all duration-300 flex-1 md:w-[100px] justify-center
                        ${mode === 'STUDIO' ? 'text-white scale-105' : 'text-gray-500 hover:text-gray-700'}
                    `}
                >
                    <motion.div
                        whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.4 } }}
                    >
                        <User className="w-4 h-4 md:w-4 md:h-4" />
                    </motion.div>
                    <span className="">STUDIO</span>
                </button>

                <button
                    onClick={() => handleModeChange('LAB')}
                    className={`
                        relative z-10 flex flex-col md:flex-row items-center gap-1 md:gap-1.5 px-2 py-2 md:px-4 md:py-2 rounded-xl md:rounded-full text-[10px] md:text-xs font-black transition-all duration-300 flex-1 md:w-[100px] justify-center
                        ${mode === 'LAB' ? 'text-white scale-105' : 'text-gray-400 hover:text-gray-600'}
                        ${isMobile ? 'opacity-60' : ''}
                    `}
                >
                    <motion.div
                        whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.4 } }}
                        className="relative"
                    >
                        <Beaker className="w-4 h-4 md:w-4 md:h-4" />
                        {isMobile && (
                            <div className="absolute -top-1 -right-1 bg-gray-800 text-white rounded-full p-0.5">
                                <Lock className="w-2 h-2" />
                            </div>
                        )}
                    </motion.div>
                    <span className="">LAB</span>
                </button>
            </div>
        </div>
    );
};

export default ScriptModeSwitcher;
