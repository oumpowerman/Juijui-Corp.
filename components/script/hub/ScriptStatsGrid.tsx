
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Clapperboard, FileText, Edit3, CheckCircle2 } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';
import { supabase } from '../../../lib/supabase';

interface CounterProps {
    value: number;
}

const Counter: React.FC<CounterProps> = ({ value }) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => Math.round(latest));

    useEffect(() => {
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

const StatCard: React.FC<StatCardProps> = ({ label, count, icon: Icon, color, isActive, onClick }) => (
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
);

interface ScriptStatsGridProps {
    filterOwner: string[];
    filterChannel: string[];
    filterCategory: string;
    viewTab: 'QUEUE' | 'LIBRARY' | 'HISTORY';
    filterStatus: string;
    onTabChange: (tab: 'QUEUE' | 'LIBRARY' | 'HISTORY', status?: string) => void;
}

const ScriptStatsGrid: React.FC<ScriptStatsGridProps> = ({
    filterOwner,
    filterChannel,
    filterCategory,
    viewTab,
    filterStatus,
    onTabChange
}) => {
    const [stats, setStats] = useState({
        queue: 0,
        library: 0,
        drafts: 0,
        history: 0
    });
    const [isLoading, setIsLoading] = useState(false);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        try {
            // Base filter helper
            const applyFilters = (query: any) => {
                let q = query;
                if (filterOwner.length > 0) {
                    q = q.or(`author_id.in.(${filterOwner.join(',')}),idea_owner_id.in.(${filterOwner.join(',')})`);
                }
                if (filterChannel.length > 0) {
                    q = q.in('channel_id', filterChannel);
                }
                if (filterCategory !== 'ALL') {
                    q = q.eq('category', filterCategory);
                }
                return q;
            };

            // 1. Queue: In Queue
            const queueReq = applyFilters(supabase.from('scripts').select('id', { count: 'exact', head: true }).eq('is_in_shoot_queue', true));
            
            // 2. History: Done
            const historyReq = applyFilters(supabase.from('scripts').select('id', { count: 'exact', head: true }).eq('status', 'DONE'));
            
            // 3. Library: Not in Queue AND Not Done
            const libraryReq = applyFilters(supabase.from('scripts').select('id', { count: 'exact', head: true }).eq('is_in_shoot_queue', false).neq('status', 'DONE'));
            
            // 4. Drafts: Not in Queue AND Status is DRAFT
            const draftReq = applyFilters(supabase.from('scripts').select('id', { count: 'exact', head: true }).eq('is_in_shoot_queue', false).eq('status', 'DRAFT'));

            const [q, h, l, d] = await Promise.all([queueReq, historyReq, libraryReq, draftReq]);

            setStats({
                queue: q.count || 0,
                history: h.count || 0,
                library: l.count || 0,
                drafts: d.count || 0
            });
        } catch (error) {
            console.error("Error fetching filtered script stats", error);
        } finally {
            setIsLoading(false);
        }
    }, [filterOwner, filterChannel, filterCategory]);

    // Debounced fetch to prevent excessive API calls during rapid filter changes
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchStats();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchStats]);

    // Real-time subscription for stats
    useEffect(() => {
        const channel = supabase
            .channel('script-stats-grid-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'scripts' }, () => {
                fetchStats();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchStats]);

    return (
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity duration-300 ${isLoading ? 'opacity-60' : 'opacity-100'}`}>
            <StatCard 
                label="ถ่ายวันนี้ (Queue)" 
                count={stats.queue} 
                icon={Clapperboard} 
                color="orange" 
                isActive={viewTab === 'QUEUE'}
                onClick={() => onTabChange('QUEUE', 'ALL')}
            />
            <StatCard 
                label="คลังบท (Library)" 
                count={stats.library} 
                icon={FileText} 
                color="indigo" 
                isActive={viewTab === 'LIBRARY' && filterStatus === 'ALL'}
                onClick={() => onTabChange('LIBRARY', 'ALL')}
            />
            <StatCard 
                label="แบบร่าง (Drafts)" 
                count={stats.drafts} 
                icon={Edit3} 
                color="pink" 
                isActive={viewTab === 'LIBRARY' && filterStatus === 'DRAFT'}
                onClick={() => onTabChange('LIBRARY', 'DRAFT')}
            />
            <StatCard 
                label="เสร็จแล้ว (History)" 
                count={stats.history} 
                icon={CheckCircle2} 
                color="emerald" 
                isActive={viewTab === 'HISTORY'}
                onClick={() => onTabChange('HISTORY', 'ALL')}
            />
        </div>
    );
};

export default ScriptStatsGrid;
