import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Skull, Zap, BarChart3 } from 'lucide-react';

interface StatSummaryGridProps {
    summary: {
        total: number;
        completed: number;
        failed: number;
        ongoing: number;
    };
    activeTab: 'ALL' | 'COMPLETED' | 'FAILED' | 'ONGOING';
    setActiveTab: (tab: 'ALL' | 'COMPLETED' | 'FAILED' | 'ONGOING') => void;
}

const StatCard = ({ 
    label, value, icon: Icon, color, isActive, onClick, index 
}: { 
    label: string, value: number, icon: any, color: string, isActive: boolean, onClick: () => void, index: number 
}) => (
    <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
            opacity: 1, 
            y: 0,
            transition: { delay: index * 0.1, duration: 1, ease: "easeOut" }
        }}
        whileHover={{ 
            y: -4, 
            scale: 1.02,
            boxShadow: "0 15px 30px -10px rgba(0, 0, 0, 0.2)"
        }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`relative overflow-hidden p-4 rounded-[2rem] border transition-all duration-500 flex flex-col items-center justify-center gap-2 group
            ${isActive 
                ? `${color} border-white/60 shadow-lg ring-1 ring-white/20` 
                : 'bg-white/30 border-white/30 text-slate-500 hover:bg-white/50 shadow-sm'
            } backdrop-blur-2xl`}
    >
        {/* Floating Animation Wrapper */}
        <motion.div style={{ willChange: "transform" }}
            animate={{ 
                y: [0, -3, 0],
            }}
            transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: index * 0.5
            }}
            className="flex flex-col items-center gap-1.5"
        >
            <div className={`p-2.5 rounded-xl ${isActive ? 'bg-white/30 shadow-inner' : 'bg-slate-100/50'} transition-all duration-500 group-hover:rotate-12`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
            </div>
            
            <span className={`text-[14px] font-black uppercase tracking-[0.15em] ${isActive ? 'text-white/90' : 'text-slate-600'}`}>
                {label}
            </span>
            
            <span className={`text-4xl font-bold tracking-tighter ${isActive ? 'text-white' : 'text-slate-800'}`}>
                {value}
            </span>
        </motion.div>

        {/* Pulsing Glow for Active State */}
        {isActive && (
            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-white/20 blur-3xl rounded-full pointer-events-none" 
            />
        )}
        
        {/* Decorative Light Streak */}
        <div className="absolute -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/10 opacity-40 group-hover:animate-shine" />
    </motion.button>
);

export const StatSummaryGrid: React.FC<StatSummaryGridProps> = ({ summary, activeTab, setActiveTab }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard 
                index={0}
                label="ทั้งหมด" value={summary.total} icon={BarChart3} 
                color="bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600" 
                isActive={activeTab === 'ALL'} onClick={() => setActiveTab('ALL')} 
            />
            <StatCard 
                index={1}
                label="สำเร็จ 🎉" value={summary.completed} icon={Trophy} 
                color="bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600" 
                isActive={activeTab === 'COMPLETED'} onClick={() => setActiveTab('COMPLETED')} 
            />
            <StatCard 
                index={2}
                label="ล้มเหลว 💀" value={summary.failed} icon={Skull} 
                color="bg-gradient-to-br from-rose-400 via-pink-500 to-rose-600" 
                isActive={activeTab === 'FAILED'} onClick={() => setActiveTab('FAILED')} 
            />
            <StatCard 
                index={3}
                label="กำลังลุย 🔥" value={summary.ongoing} icon={Zap} 
                color="bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600" 
                isActive={activeTab === 'ONGOING'} onClick={() => setActiveTab('ONGOING')} 
            />
        </div>
    );
};
