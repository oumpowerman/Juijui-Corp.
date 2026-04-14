
import React from 'react';
import { LayoutDashboard, Target, TrendingUp } from 'lucide-react';

interface KPITabNavigationProps {
    activeTab: 'overview' | 'evaluation' | 'growth';
    onTabChange: (tab: 'overview' | 'evaluation' | 'growth') => void;
    canSeePrivate: boolean;
}

const KPITabNavigation: React.FC<KPITabNavigationProps> = ({ activeTab, onTabChange, canSeePrivate }) => {
    return (
        <div className="flex p-1.5 bg-gray-200/50 backdrop-blur-md rounded-2xl w-fit shadow-inner border border-white/50">
            {canSeePrivate && (
                <>
                    <button 
                        onClick={() => onTabChange('overview')}
                        className={`flex items-center gap-2 px-8 py-3 rounded-xl text-base font-bold transition-all duration-300 ${activeTab === 'overview' ? 'bg-white text-indigo-600 shadow-lg scale-105' : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'}`}
                    >
                        <LayoutDashboard className={`w-5 h-5 ${activeTab === 'overview' ? 'animate-pulse' : ''}`} /> ภาพรวม
                    </button>
                    <button 
                        onClick={() => onTabChange('evaluation')}
                        className={`flex items-center gap-2 px-8 py-3 rounded-xl text-base font-bold transition-all duration-300 ${activeTab === 'evaluation' ? 'bg-white text-pink-600 shadow-lg scale-105' : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'}`}
                    >
                        <Target className={`w-5 h-5 ${activeTab === 'evaluation' ? 'animate-bounce' : ''}`} /> การประเมิน
                    </button>
                </>
            )}
            <button 
                onClick={() => onTabChange('growth')}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl text-base font-bold transition-all duration-300 ${activeTab === 'growth' ? 'bg-white text-emerald-600 shadow-lg scale-105' : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'}`}
            >
                <TrendingUp className={`w-5 h-5 ${activeTab === 'growth' ? 'animate-pulse' : ''}`} /> การเติบโต & พัฒนา
            </button>
        </div>
    );
};

export default KPITabNavigation;
