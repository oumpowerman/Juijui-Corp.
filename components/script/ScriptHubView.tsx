
import React, { useState, useMemo } from 'react';
import { User, Script, MasterOption } from '../../types';
import { useScripts } from '../../hooks/useScripts';
import { useChannels } from '../../hooks/useChannels';
import { useMasterData } from '../../hooks/useMasterData';
import ScriptHubHeader from './hub/ScriptHubHeader';
import ScriptFilterBar from './hub/ScriptFilterBar';
import ScriptList from './hub/ScriptList';
import CreateScriptModal from './hub/CreateScriptModal';
import ScriptEditor from './ScriptEditor';
import { Clapperboard, FileText, Edit3, CheckCircle2, Layers, ChevronRight } from 'lucide-react';

// --- Sub-components (Moved outside to fix Key prop TS error and improve performance) ---

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
                ? `bg-white border-${color}-400 shadow-xl shadow-${color}-100 ring-1 ring-${color}-200 scale-[1.02]` 
                : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-md'
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
            <span className={`text-4xl font-black ${isActive ? 'text-gray-800' : 'text-gray-600'}`}>{count}</span>
        </div>
    </button>
);

interface CategoryPillProps {
    cat: MasterOption | { key: string, label: string };
    count?: number;
    isActive: boolean;
    onClick: () => void;
}

const CategoryPill: React.FC<CategoryPillProps> = ({ cat, count, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`
            flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold whitespace-nowrap transition-all
            ${isActive 
                ? 'bg-gray-800 text-white border-gray-800 shadow-md' 
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }
        `}
    >
        <span>{cat.label}</span>
        {count !== undefined && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {count}
            </span>
        )}
    </button>
);

// --- Main Component ---

interface ScriptHubViewProps {
    currentUser: User;
    users: User[]; 
}

const ScriptHubView: React.FC<ScriptHubViewProps> = ({ currentUser, users }) => {
    // Hooks
    const { scripts, isLoading, createScript, updateScript, deleteScript, toggleShootQueue, generateScriptWithAI } = useScripts(currentUser);
    const { channels } = useChannels();
    const { masterOptions } = useMasterData();

    // UI State
    const [activeScript, setActiveScript] = useState<Script | null>(null);
    const [viewTab, setViewTab] = useState<'QUEUE' | 'LIBRARY' | 'HISTORY'>('QUEUE');
    const [layoutMode, setLayoutMode] = useState<'GRID' | 'LIST'>('LIST'); 
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOwner, setFilterOwner] = useState<string>('ALL');
    const [filterStatus, setFilterStatus] = useState<string>('ALL'); // For detailed filter
    const [filterChannel, setFilterChannel] = useState<string>('ALL');
    const [filterCategory, setFilterCategory] = useState<string>('ALL');

    // --- Statistics & Derived Data ---
    const stats = useMemo(() => {
        return {
            queue: scripts.filter(s => s.isInShootQueue).length,
            library: scripts.filter(s => !s.isInShootQueue && s.status !== 'DONE').length,
            draft: scripts.filter(s => s.status === 'DRAFT').length,
            done: scripts.filter(s => s.status === 'DONE').length,
            total: scripts.length
        };
    }, [scripts]);

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        const categories = masterOptions.filter(o => o.type === 'SCRIPT_CATEGORY');
        categories.forEach(c => counts[c.key] = 0); // Init
        
        scripts.forEach(s => {
            // Count based on current viewTab logic to be consistent? 
            // Or count ALL active scripts? Let's count ALL active (not Done) for utility.
            if (s.status !== 'DONE' && s.category && counts[s.category] !== undefined) {
                counts[s.category]++;
            }
        });
        return counts;
    }, [scripts, masterOptions]);

    const scriptCategories = masterOptions.filter(o => o.type === 'SCRIPT_CATEGORY' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);

    // --- Filtering Logic ---
    const { filteredScripts } = useMemo(() => {
        let result = scripts;

        // 1. Tab Filter
        if (viewTab === 'QUEUE') {
            result = result.filter(s => s.isInShootQueue);
        } else if (viewTab === 'HISTORY') {
            result = result.filter(s => s.status === 'DONE');
        } else {
            // LIBRARY: All active scripts NOT in queue
            result = result.filter(s => !s.isInShootQueue && s.status !== 'DONE');
        }

        // 2. Specific Filter (e.g. clicking "Drafts" card sets filterStatus to DRAFT)
        if (filterStatus !== 'ALL') {
            result = result.filter(s => s.status === filterStatus);
        }

        // 3. Category Filter (Clicking Category Card)
        if (filterCategory !== 'ALL') {
            result = result.filter(s => s.category === filterCategory);
        }

        // 4. Common Filters
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            result = result.filter(s => 
                s.title.toLowerCase().includes(lowerQ) || 
                s.tags?.some(t => t.toLowerCase().includes(lowerQ))
            );
        }
        if (filterOwner !== 'ALL') {
            result = result.filter(s => s.ideaOwnerId === filterOwner || s.authorId === filterOwner);
        }
        if (filterChannel !== 'ALL') {
            result = result.filter(s => s.channelId === filterChannel);
        }

        return { filteredScripts: result };
    }, [scripts, viewTab, searchQuery, filterOwner, filterStatus, filterChannel, filterCategory]);


    const handleCreateSubmit = async (data: any) => {
        await createScript(data);
    };

    // If Editor is open, show full screen editor
    if (activeScript) {
        return (
            <ScriptEditor 
                script={activeScript} 
                users={users}
                onClose={() => setActiveScript(null)} 
                onSave={updateScript} 
                onGenerateAI={generateScriptWithAI}
            />
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-24">
            <div className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
                
                {/* 1. Header */}
                <ScriptHubHeader onCreateClick={() => setIsCreateModalOpen(true)} />

                {/* 2. Dashboard Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard 
                        label="ถ่ายวันนี้ (Queue)" 
                        count={stats.queue} 
                        icon={Clapperboard} 
                        color="orange" 
                        isActive={viewTab === 'QUEUE'}
                        onClick={() => { setViewTab('QUEUE'); setFilterStatus('ALL'); setFilterCategory('ALL'); }}
                    />
                    <StatCard 
                        label="คลังบท (Library)" 
                        count={stats.library} 
                        icon={FileText} 
                        color="indigo" 
                        isActive={viewTab === 'LIBRARY' && filterStatus === 'ALL'}
                        onClick={() => { setViewTab('LIBRARY'); setFilterStatus('ALL'); setFilterCategory('ALL'); }}
                    />
                    <StatCard 
                        label="แบบร่าง (Drafts)" 
                        count={stats.draft} 
                        icon={Edit3} 
                        color="pink" 
                        isActive={viewTab === 'LIBRARY' && filterStatus === 'DRAFT'}
                        onClick={() => { setViewTab('LIBRARY'); setFilterStatus('DRAFT'); setFilterCategory('ALL'); }}
                    />
                    <StatCard 
                        label="เสร็จแล้ว (History)" 
                        count={stats.done} 
                        icon={CheckCircle2} 
                        color="emerald" 
                        isActive={viewTab === 'HISTORY'}
                        onClick={() => { setViewTab('HISTORY'); setFilterStatus('ALL'); setFilterCategory('ALL'); }}
                    />
                </div>

                {/* 3. Category Deck (Horizontal Scroll) */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider px-1">
                        <Layers className="w-4 h-4" /> เลือกดูตามประเภท (Categories)
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        <CategoryPill 
                            cat={{ key: 'ALL', label: 'ทั้งหมด (All)' }} 
                            isActive={filterCategory === 'ALL'} 
                            onClick={() => setFilterCategory('ALL')} 
                        />
                        {scriptCategories.map(cat => (
                            <CategoryPill 
                                key={cat.key} 
                                cat={cat} 
                                count={categoryCounts[cat.key] || 0}
                                isActive={filterCategory === cat.key} 
                                onClick={() => setFilterCategory(cat.key)} 
                            />
                        ))}
                    </div>
                </div>

                {/* 4. Filter Bar & List */}
                <div className="space-y-4">
                     <ScriptFilterBar 
                        layoutMode={layoutMode} setLayoutMode={setLayoutMode}
                        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                        filterOwner={filterOwner} setFilterOwner={setFilterOwner}
                        filterChannel={filterChannel} setFilterChannel={setFilterChannel}
                        // Note: Category and Status are primarily handled by dashboard cards now, 
                        // but we still pass them if user wants to fine-tune via bar
                        users={users} channels={channels}
                        // We removed the View Tabs from FilterBar to reduce clutter
                    />

                    <ScriptList 
                        scripts={filteredScripts}
                        layoutMode={layoutMode}
                        viewTab={viewTab}
                        isLoading={isLoading}
                        channels={channels}
                        masterOptions={masterOptions}
                        onOpen={setActiveScript}
                        onToggleQueue={toggleShootQueue}
                        onDelete={deleteScript}
                        onRestore={(id) => updateScript(id, { status: 'DRAFT' })}
                        onDone={(id) => {
                             if(confirm('ถ่ายเสร็จแล้ว? (ย้ายไปประวัติ)')) updateScript(id, { status: 'DONE', isInShootQueue: false });
                        }}
                    />
                </div>
            </div>

            <CreateScriptModal 
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateSubmit}
                channels={channels}
                masterOptions={masterOptions}
            />
        </div>
    );
};

export default ScriptHubView;
