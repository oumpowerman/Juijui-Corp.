
import React from 'react';
import { Clapperboard, FileText, Edit3, CheckCircle2 } from 'lucide-react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useScriptStats } from '../../../hooks/useScripts';

interface CounterProps {
    value: number;
}

const Counter: React.FC<CounterProps> = ({ value }) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => Math.round(latest));

    React.useEffect(() => {
        const controls = animate(count, value, { duration: 0.8, ease: "easeOut" });
        return controls.stop;
    }, [value, count]);

    return <motion.span>{rounded}</motion.span>;
};

interface StatCardProps {
    label: string;
    count: number;
    icon: React.ElementType;
    color: string;
    isActive: boolean;
    onClick: () => void;
}

const StatCard: React.FC<StatCardProps> = React.memo(({ label, count, icon: Icon, color, isActive, onClick }) => (
    <button 
        onClick={onClick}
        className={`
            relative overflow-hidden p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between h-32 group text-left
            ${isActive 
                ? `bg-white/90 backdrop-blur-md border-${color}-400 shadow-xl shadow-${color}-100 ring-1 ring-${color}-200 scale-[1.02]` 
                : 'bg-white/60 backdrop-blur-sm border-gray-100 hover:border-gray-300 hover:shadow-md'
            }
        `}
    >
        <div className={`
            absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10 pointer-events-none transition-transform group-hover:scale-110
            bg-${color}-500
        `}></div>
        
        <div className="flex justify-between items-start relative z-10">
            <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? `text-${color}-600` : 'text-gray-400'}`}>{label}</span>
            <div className={`p-2 rounded-xl ${isActive ? `bg-${color}-100 text-${color}-600` : 'bg-gray-50 text-gray-400'}`}>
                <Icon className="w-5 h-5" />
            </div>
        </div>
        
        <div className="relative z-10">
            <span className={`text-4xl font-black ${isActive ? 'text-gray-800' : 'text-gray-600'}`}>
                <Counter value={count} />
            </span>
        </div>
    </button>
));

interface ScriptStatsGridProps {
    filterOwner: string[];
    filterChannel: string[];
    filterCategory: string;
    filterTags: string[];
    searchQuery: string;
    viewTab: 'QUEUE' | 'LIBRARY' | 'HISTORY';
    filterStatus: string[];
    isDeepSearch?: boolean;
    onTabChange: (tab: 'QUEUE' | 'LIBRARY' | 'HISTORY', status?: string) => void;
    isPersonal?: boolean;
    currentUser: { id: string };
}

const ScriptStatsGrid: React.FC<ScriptStatsGridProps> = React.memo(({
    filterOwner,
    filterChannel,
    filterCategory,
    filterTags,
    searchQuery,
    viewTab,
    filterStatus,
    isDeepSearch,
    onTabChange,
    isPersonal,
    currentUser
}) => {
    const { data: stats, isLoading } = useScriptStats(currentUser as any, {
        filterOwner,
        filterChannel,
        filterCategory,
        filterTags,
        searchQuery,
        isDeepSearch,
        isPersonal
    });

    const currentStats = stats || { queue: 0, library: 0, drafts: 0, history: 0 };

    return (
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity duration-300 ${isLoading ? 'opacity-60' : 'opacity-100'}`}>
            <StatCard 
                label="ถ่ายวันนี้ (Queue)" 
                count={currentStats.queue} 
                icon={Clapperboard} 
                color={isPersonal ? "violet" : "orange"} 
                isActive={viewTab === 'QUEUE'}
                onClick={() => onTabChange('QUEUE', 'ALL')}
            />
            <StatCard 
                label="คลังบท (Library)" 
                count={currentStats.library} 
                icon={FileText} 
                color={isPersonal ? "blue" : "indigo"} 
                isActive={viewTab === 'LIBRARY' && (filterStatus.includes('ALL') || filterStatus.length === 0)}
                onClick={() => onTabChange('LIBRARY', 'ALL')}
            />
            <StatCard 
                label="แบบร่าง (Drafts)" 
                count={currentStats.drafts} 
                icon={Edit3} 
                color={isPersonal ? "sky" : "pink"} 
                isActive={viewTab === 'LIBRARY' && filterStatus.includes('DRAFT')}
                onClick={() => onTabChange('LIBRARY', 'DRAFT')}
            />
            <StatCard 
                label="เสร็จแล้ว (History)" 
                count={currentStats.history} 
                icon={CheckCircle2} 
                color={isPersonal ? "indigo" : "emerald"} 
                isActive={viewTab === 'HISTORY'}
                onClick={() => onTabChange('HISTORY', 'ALL')}
            />
        </div>
    );
});

export default ScriptStatsGrid;
