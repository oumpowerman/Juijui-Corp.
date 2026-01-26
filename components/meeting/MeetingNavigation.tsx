import React from 'react';
import { BookOpen, CheckSquare, Share2 } from 'lucide-react';
import MeetingTimer from './MeetingTimer';

type MeetingTab = 'NOTES' | 'ACTIONS' | 'DECISIONS';

interface MeetingNavigationProps {
    activeTab: MeetingTab;
    setActiveTab: (tab: MeetingTab) => void;
}

const MeetingNavigation: React.FC<MeetingNavigationProps> = ({ activeTab, setActiveTab }) => {
    return (
        <div className="px-6 pt-2 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
            <div className="flex gap-4">
                {[
                    { id: 'NOTES', label: 'สมุดจด (Notes)', icon: BookOpen, color: 'indigo' },
                    { id: 'ACTIONS', label: 'สั่งงาน (Actions)', icon: CheckSquare, color: 'orange' },
                    { id: 'DECISIONS', label: 'มติ (Decisions)', icon: Share2, color: 'green' }
                ].map((tab) => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as MeetingTab)}
                        className={`
                            pb-3 pt-1 px-2 text-sm font-bold border-b-[3px] transition-all flex items-center gap-2 rounded-t-lg
                            ${activeTab === tab.id 
                                ? `border-${tab.color}-500 text-${tab.color}-600 bg-${tab.color}-50/30` 
                                : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'}
                        `}
                    >
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'stroke-[2.5px]' : ''}`} /> 
                        {tab.label}
                    </button>
                ))}
            </div>
            
            <MeetingTimer />
        </div>
    );
};

export default MeetingNavigation;