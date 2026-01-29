
import React, { useState } from 'react';
import { 
    LayoutGrid, Calendar as CalendarIcon, MessageCircle, Menu, X, 
    Film, ClipboardList, BookOpen, ScanEye, Coffee, Target, TrendingUp, 
    LogOut, BarChart3, Megaphone, FileText, Presentation, Settings2, 
    Database, Users, Terminal, User as UserIcon, Shield, Trophy, Heart 
} from 'lucide-react';
import { User, ViewMode, TaskType } from '../types';

interface MobileNavigationProps {
    currentUser: User;
    currentView: ViewMode;
    onNavigate: (view: ViewMode) => void;
    onAddTask: (type?: TaskType) => void;
    onLogout: () => void;
    onEditProfile: () => void;
    unreadChatCount: number;
}

const MobileMenuButton = ({ 
    view, icon: Icon, label, color, currentView, onNavigate, badge 
}: { 
    view: ViewMode, icon: any, label: string, color: string, currentView: ViewMode, onNavigate: (v: ViewMode) => void, badge?: number 
}) => {
    const isActive = currentView === view;
    return (
        <button
            onClick={() => onNavigate(view)}
            className={`
                flex flex-col items-center justify-center p-3 rounded-2xl border transition-all relative group active:scale-95
                ${isActive 
                    ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                    : 'bg-white border-gray-100 hover:border-indigo-100 hover:shadow-md'}
            `}
        >
            <div className={`p-2.5 rounded-xl mb-2 transition-colors ${isActive ? 'bg-white text-indigo-600 shadow-sm' : `${color} bg-opacity-10`}`}>
                <Icon className={`w-6 h-6 ${isActive ? 'text-indigo-600' : color.replace('bg-', 'text-').replace('/10', '')}`} />
            </div>
            <span className={`text-[10px] font-bold text-center leading-tight ${isActive ? 'text-indigo-700' : 'text-gray-600'}`}>{label}</span>
            
            {/* Badge */}
            {badge && badge > 0 && (
                <div className="absolute top-2 right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {badge > 99 ? '99+' : badge}
                </div>
            )}
        </button>
    );
};

const MobileNavigation: React.FC<MobileNavigationProps> = ({ currentUser, currentView, onNavigate, onAddTask, onLogout, onEditProfile, unreadChatCount }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleNavigateAndClose = (view: ViewMode) => {
        onNavigate(view);
        setIsMenuOpen(false);
    };

    // Calculate Level Progress
    const nextLevelXP = currentUser.level * 1000;
    const progressPercent = Math.min((currentUser.xp / nextLevelXP) * 100, 100);

    return (
        <>
            {/* --- BOTTOM DOCK (Floating Glass) --- */}
            <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none flex justify-center pb-safe-area">
                <div className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-[2rem] px-2 py-2 flex items-center justify-between pointer-events-auto gap-1 w-full max-w-md ring-1 ring-gray-200/50">
                    {[
                        { view: 'DASHBOARD', icon: LayoutGrid, label: 'Home' },
                        { view: 'CALENDAR', icon: CalendarIcon, label: 'Calendar' },
                        { view: 'CHAT', icon: MessageCircle, label: 'Chat', badge: unreadChatCount },
                        { view: 'TEAM', icon: Users, label: 'Team' }, // Added Team to Dock
                    ].map((item) => {
                        const Icon = item.icon;
                        const isActive = currentView === item.view;
                        // @ts-ignore
                        const badge = item.badge;

                        return (
                            <button
                                key={item.view}
                                onClick={() => onNavigate(item.view as ViewMode)}
                                className={`
                                    relative flex-1 flex flex-col items-center justify-center h-[60px] rounded-[1.5rem] transition-all duration-300
                                    ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}
                                `}
                            >
                                <Icon className={`w-6 h-6 mb-0.5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                                <span className="text-[9px] font-bold">{item.label}</span>
                                {badge > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                                )}
                            </button>
                        );
                    })}
                    
                    <div className="w-px h-8 bg-gray-200 mx-1"></div>

                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className={`
                            relative flex-1 flex flex-col items-center justify-center h-[60px] rounded-[1.5rem] transition-all duration-300
                            ${isMenuOpen ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}
                        `}
                    >
                        <Menu className="w-6 h-6 mb-0.5" />
                        <span className="text-[9px] font-bold">Menu</span>
                    </button>
                </div>
            </div>

            {/* --- FULL SCREEN DRAWER --- */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[60] bg-white lg:hidden animate-in slide-in-from-bottom-10 duration-300 flex flex-col">
                    
                    {/* Header: User Profile & Stats */}
                    <div className="bg-slate-900 text-white p-6 pb-8 rounded-b-[2.5rem] shadow-xl relative overflow-hidden shrink-0">
                        {/* Background Effects */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4" onClick={onEditProfile}>
                                    <div className="relative">
                                        <img src={currentUser.avatarUrl} className="w-14 h-14 rounded-full border-2 border-white/20 shadow-md object-cover" />
                                        <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-slate-900"></div>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black">{currentUser.name}</h2>
                                        <p className="text-xs text-slate-400 font-medium bg-white/10 px-2 py-0.5 rounded-lg w-fit mt-1 backdrop-blur-sm">
                                            {currentUser.position}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white/70 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Mini Stats Bar */}
                            <div className="flex gap-3">
                                <div className="flex-1 bg-white/10 rounded-2xl p-3 backdrop-blur-md border border-white/5">
                                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-300 mb-1">
                                        <span className="flex items-center"><Heart className="w-3 h-3 mr-1 text-red-400 fill-red-400"/> HP</span>
                                        <span>{currentUser.hp}/{currentUser.maxHp}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${(currentUser.hp/currentUser.maxHp)*100}%` }}></div>
                                    </div>
                                </div>
                                <div className="flex-1 bg-white/10 rounded-2xl p-3 backdrop-blur-md border border-white/5">
                                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-300 mb-1">
                                        <span className="flex items-center"><Trophy className="w-3 h-3 mr-1 text-yellow-400 fill-yellow-400"/> Lv.{currentUser.level}</span>
                                        <span>{progressPercent.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Menu Grid */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide pb-32">
                        
                        {/* 1. Workspace */}
                        <div>
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 pl-1 flex items-center">
                                Workspace <div className="h-px bg-gray-200 flex-1 ml-3"></div>
                            </h4>
                            <div className="grid grid-cols-3 gap-3">
                                <MobileMenuButton view="WEEKLY" icon={Target} label="ภารกิจ" color="bg-orange-500" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                <MobileMenuButton view="GOALS" icon={TrendingUp} label="เป้าหมาย" color="bg-green-500" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                <MobileMenuButton view="TEAM" icon={Users} label="ทีมงาน" color="bg-blue-500" currentView={currentView} onNavigate={handleNavigateAndClose} />
                            </div>
                        </div>

                        {/* 2. Production */}
                        <div>
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 pl-1 flex items-center">
                                Production <div className="h-px bg-gray-200 flex-1 ml-3"></div>
                            </h4>
                            <div className="grid grid-cols-3 gap-3">
                                <MobileMenuButton view="SCRIPT_HUB" icon={FileText} label="เขียนบท" color="bg-rose-500" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                <MobileMenuButton view="MEETINGS" icon={Presentation} label="ห้องประชุม" color="bg-indigo-500" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                <MobileMenuButton view="STOCK" icon={Film} label="คลังคลิป" color="bg-violet-500" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                <MobileMenuButton view="CHECKLIST" icon={ClipboardList} label="จัดเป๋า" color="bg-teal-500" currentView={currentView} onNavigate={handleNavigateAndClose} />
                            </div>
                        </div>

                        {/* 3. Office */}
                        <div>
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 pl-1 flex items-center">
                                Office <div className="h-px bg-gray-200 flex-1 ml-3"></div>
                            </h4>
                            <div className="grid grid-cols-3 gap-3">
                                <MobileMenuButton view="DUTY" icon={Coffee} label="ตารางเวร" color="bg-amber-500" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                <MobileMenuButton view="QUALITY_GATE" icon={ScanEye} label="ตรวจงาน" color="bg-purple-500" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                <MobileMenuButton view="KPI" icon={BarChart3} label="KPI" color="bg-lime-500" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                <MobileMenuButton view="FEEDBACK" icon={Megaphone} label="Feedback" color="bg-pink-500" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                <MobileMenuButton view="WIKI" icon={BookOpen} label="คู่มือ" color="bg-sky-500" currentView={currentView} onNavigate={handleNavigateAndClose} />
                            </div>
                        </div>

                        {/* 4. Admin (Conditional) */}
                        {currentUser.role === 'ADMIN' && (
                            <div>
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 pl-1 flex items-center">
                                    <Shield className="w-3 h-3 mr-1" /> Admin Only <div className="h-px bg-gray-200 flex-1 ml-3"></div>
                                </h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <MobileMenuButton view="CHANNELS" icon={Settings2} label="จัดการช่อง" color="bg-slate-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                    <MobileMenuButton view="MASTER_DATA" icon={Database} label="ตั้งค่าระบบ" color="bg-slate-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                    <MobileMenuButton view="SYSTEM_GUIDE" icon={Terminal} label="Logic Guide" color="bg-slate-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 bg-white border-t border-gray-100">
                        <button 
                            onClick={onLogout}
                            className="w-full py-3.5 bg-red-50 text-red-500 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                            <LogOut className="w-5 h-5" /> ลงชื่อออก (Logout)
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default MobileNavigation;
