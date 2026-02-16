
import React, { useState, useEffect } from 'react';
import { 
    LayoutGrid, Calendar as CalendarIcon, MessageCircle, Menu, X, 
    Film, ClipboardList, BookOpen, ScanEye, Coffee, Target, TrendingUp, 
    LogOut, BarChart3, Megaphone, FileText, Presentation, Settings2, 
    Database, Users, Terminal, User as UserIcon, Shield, Trophy, Heart, Crown, Clock,
    Maximize2, Minimize2, Monitor, DollarSign, Briefcase, Clapperboard, Building2, ShieldCheck
} from 'lucide-react';
import { User, ViewMode, TaskType, MenuGroup } from '../types';
import { useMobileBackHandler } from '../hooks/useMobileBackHandler';
import { useSidebarBadges } from '../hooks/useSidebarBadges'; // Import Badge Hook

interface MobileNavigationProps {
    currentUser: User;
    currentView: ViewMode;
    onNavigate: (view: ViewMode) => void;
    onAddTask: (type?: TaskType) => void;
    onLogout: () => void;
    onEditProfile: () => void;
    unreadChatCount: number;
}

// --- Menu Configuration (Synced with Sidebar) ---
const MOBILE_MENU_GROUPS: MenuGroup[] = [
  {
    id: 'WORKSPACE',
    title: 'Workspace',
    icon: Briefcase,
    items: [
      { view: 'DASHBOARD', label: 'ภาพรวม', icon: LayoutGrid },
      { view: 'CALENDAR', label: 'ปฏิทิน', icon: CalendarIcon },
      { view: 'CHAT', label: 'แชททีม', icon: MessageCircle },
      { view: 'TEAM', label: 'ทีมงาน', icon: Users },
      { view: 'WEEKLY', label: 'ภารกิจ', icon: Target },
      { view: 'GOALS', label: 'เป้าหมาย', icon: TrendingUp },
    ]
  },
  {
    id: 'PRODUCTION',
    title: 'Production',
    icon: Clapperboard,
    items: [
      { view: 'SCRIPT_HUB', label: 'เขียนบท', icon: FileText },
      { view: 'MEETINGS', label: 'ประชุม', icon: Presentation },
      { view: 'STOCK', label: 'คลังคลิป', icon: Film },
      { view: 'CHECKLIST', label: 'จัดเป๋า', icon: ClipboardList },
    ]
  },
  {
    id: 'OFFICE',
    title: 'Office',
    icon: Building2,
    items: [
      { view: 'ATTENDANCE', label: 'ลงเวลา', icon: Clock },
      { view: 'LEADERBOARD', label: 'Hall of Fame', icon: Crown },
      { view: 'DUTY', label: 'เวรวันนี้', icon: Coffee },
      { view: 'KPI', label: 'ประเมินผล', icon: BarChart3 },
      { view: 'FEEDBACK', label: 'Voice', icon: Megaphone },
      { view: 'WIKI', label: 'คู่มือ', icon: BookOpen },
      { view: 'ASSETS', label: 'ทรัพย์สิน', icon: Monitor }, // Added
      { view: 'FINANCE', label: 'บัญชี', icon: DollarSign }, // Added
    ]
  },
  {
    id: 'ADMIN',
    title: 'Admin Zone',
    icon: ShieldCheck,
    adminOnly: true,
    items: [
      { view: 'QUALITY_GATE', label: 'ห้องตรวจ', icon: ScanEye },
      { view: 'CHANNELS', label: 'ช่องทาง', icon: Settings2 },
      { view: 'MASTER_DATA', label: 'ตั้งค่าระบบ', icon: Database },
      { view: 'SYSTEM_GUIDE', label: 'Logic', icon: Terminal },
    ]
  }
];

interface MobileMenuButtonProps {
    view: ViewMode;
    icon: any;
    label: string;
    color: string;
    currentView: ViewMode;
    onNavigate: (v: ViewMode) => void;
    badge?: number;
}

const MobileMenuButton: React.FC<MobileMenuButtonProps> = ({ 
    view, icon: Icon, label, color, currentView, onNavigate, badge 
}) => {
    const isActive = currentView === view;
    return (
        <button
            onClick={() => onNavigate(view)}
            className={`
                flex flex-col items-center justify-center p-2 rounded-2xl border transition-all relative group active:scale-95 h-20
                ${isActive 
                    ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                    : 'bg-white border-gray-100 hover:border-indigo-100 hover:shadow-md'}
            `}
        >
            <div className={`p-2 rounded-xl mb-1.5 transition-colors ${isActive ? 'bg-white text-indigo-600 shadow-sm' : `${color} bg-opacity-10`}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : color.replace('bg-', 'text-').replace('/10', '')}`} />
            </div>
            <span className={`text-[10px] font-bold text-center leading-tight truncate w-full ${isActive ? 'text-indigo-700' : 'text-gray-500'}`}>{label}</span>
            
            {/* Badge - Fixed Logic: Check explicit greater than 0 with fallback */}
            {(badge || 0) > 0 && (
                <div className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                    {badge! > 99 ? '99+' : badge}
                </div>
            )}
        </button>
    );
};

const MobileNavigation: React.FC<MobileNavigationProps> = ({ currentUser, currentView, onNavigate, onAddTask, onLogout, onEditProfile, unreadChatCount }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    
    // Hooks
    const { badges } = useSidebarBadges(currentUser);
    useMobileBackHandler(isMenuOpen, () => setIsMenuOpen(false));

    useEffect(() => {
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        const handleFullscreenChange = () => {
            const isFull = !!document.fullscreenElement || 
                           !!(document as any).webkitFullscreenElement || 
                           !!(document as any).mozFullScreenElement;
            setIsFullscreen(isFull);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
        };
    }, []);

    const handleNavigateAndClose = (view: ViewMode) => {
        onNavigate(view);
        setIsMenuOpen(false);
    };

    const toggleFullScreen = async () => {
        const doc = window.document as any;
        const docEl = doc.documentElement as any;

        try {
            const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
            const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

            if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
                if (requestFullScreen) {
                    await requestFullScreen.call(docEl);
                    setIsFullscreen(true);
                }
            } else {
                if (cancelFullScreen) {
                    await cancelFullScreen.call(doc);
                    setIsFullscreen(false);
                }
            }
        } catch (err) {
            console.warn("Fullscreen toggle error:", err);
            if (isIOS) alert("บน iOS กรุณาใช้เมนู Share > 'Add to Home Screen' เพื่อใช้งานเต็มจอครับ");
        }
    };

    // Calculate Level Progress
    const nextLevelXP = currentUser.level * 1000;
    const progressPercent = Math.min(((currentUser.xp % 1000) / 1000) * 100, 100);

    // Helper to map badge count
    const getBadgeCount = (view: ViewMode) => {
        if (view === 'CHAT') return unreadChatCount;
        if (view === 'QUALITY_GATE') return badges.qualityGate;
        if (view === 'FEEDBACK') return badges.feedback;
        if (view === 'DUTY') return badges.myDuty;
        if (view === 'ATTENDANCE' && currentUser.role === 'ADMIN') return badges.attendanceApproval;
        if (view === 'TEAM' && currentUser.role === 'ADMIN') return badges.memberApproval;
        return 0;
    };

    return (
        <>
            {/* --- BOTTOM DOCK (Floating) --- */}
            <div className="fixed bottom-0 left-0 right-0 z-50 p-3 pb-safe-area lg:hidden pointer-events-none">
                <div className="bg-white/95 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.15)] rounded-[2rem] p-1.5 flex items-center justify-between pointer-events-auto gap-1 max-w-sm mx-auto ring-1 ring-black/5">
                    {[
                        { view: 'DASHBOARD', icon: LayoutGrid, label: 'Home' },
                        { view: 'CALENDAR', icon: CalendarIcon, label: 'Plan' },
                        { view: 'CHAT', icon: MessageCircle, label: 'Chat', badge: unreadChatCount },
                        { view: 'TEAM', icon: Users, label: 'Team', badge: currentUser.role === 'ADMIN' ? badges.memberApproval : 0 },
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
                                    relative flex-1 flex flex-col items-center justify-center h-[56px] rounded-[1.5rem] transition-all duration-300
                                    ${isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}
                                `}
                            >
                                <Icon className={`w-6 h-6 mb-0.5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                                <span className="text-[9px] font-bold tracking-tight">{item.label}</span>
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
                            relative flex-1 flex flex-col items-center justify-center h-[56px] rounded-[1.5rem] transition-all duration-300
                            ${isMenuOpen ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}
                        `}
                    >
                        <Menu className="w-6 h-6 mb-0.5" />
                        <span className="text-[9px] font-bold">Menu</span>
                        
                        {/* Summary Badge for other menu items */}
                        {(badges.qualityGate + badges.feedback + badges.myDuty + badges.attendanceApproval) > 0 && (
                             <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white"></span>
                        )}
                    </button>
                </div>
            </div>

            {/* --- FULL SCREEN MENU DRAWER --- */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[9999] bg-[#f8fafc] lg:hidden animate-in slide-in-from-bottom-10 duration-300 flex flex-col h-[100dvh]">
                    
                    {/* Header: User Profile & Stats */}
                    <div className="bg-slate-900 text-white p-6 pb-8 rounded-b-[3rem] shadow-2xl relative overflow-hidden shrink-0">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4 active:opacity-80 transition-opacity" onClick={onEditProfile}>
                                    <div className="relative">
                                        <img src={currentUser.avatarUrl} className="w-14 h-14 rounded-full border-2 border-white/20 shadow-md object-cover" />
                                        <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-slate-900"></div>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black tracking-tight">{currentUser.name}</h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-slate-300 font-bold bg-white/10 px-2 py-0.5 rounded-lg backdrop-blur-sm border border-white/5">
                                                {currentUser.position}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={toggleFullScreen}
                                        className={`p-2 rounded-full transition-colors text-white/70 hover:text-white ${isIOS ? 'bg-white/5 opacity-30 cursor-not-allowed' : 'bg-white/10'}`}
                                    >
                                        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                                    </button>
                                    <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white/70 hover:text-white">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Mini Stats Bar */}
                            <div className="flex gap-3">
                                <div className="flex-1 bg-white/10 rounded-2xl p-3 backdrop-blur-md border border-white/5 shadow-inner">
                                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-300 mb-1">
                                        <span className="flex items-center"><Heart className="w-3 h-3 mr-1 text-red-400 fill-red-400"/> HP</span>
                                        <span>{currentUser.hp}/{currentUser.maxHp}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: `${(currentUser.hp/currentUser.maxHp)*100}%` }}></div>
                                    </div>
                                </div>
                                <div className="flex-1 bg-white/10 rounded-2xl p-3 backdrop-blur-md border border-white/5 shadow-inner">
                                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-300 mb-1">
                                        <span className="flex items-center"><Trophy className="w-3 h-3 mr-1 text-yellow-400 fill-yellow-400"/> Lv.{currentUser.level}</span>
                                        <span>{progressPercent.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Menu Grid */}
                    <div className="flex-1 overflow-y-auto p-5 pb-32 space-y-8 scrollbar-hide">
                        {MOBILE_MENU_GROUPS.map((group) => {
                            if (group.adminOnly && currentUser.role !== 'ADMIN') return null;

                            return (
                                <div key={group.id} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                                        {React.createElement(group.icon, { className: "w-3.5 h-3.5" })}
                                        {group.title}
                                        <div className="h-px bg-gray-200 flex-1 ml-2"></div>
                                    </h4>
                                    <div className="grid grid-cols-4 gap-3">
                                        {group.items.map((item) => {
                                            // Assign Colors based on Group ID
                                            let color = 'bg-gray-200';
                                            if (group.id === 'WORKSPACE') color = 'bg-blue-500';
                                            if (group.id === 'PRODUCTION') color = 'bg-pink-500';
                                            if (group.id === 'OFFICE') color = 'bg-emerald-500';
                                            if (group.id === 'ADMIN') color = 'bg-slate-600';

                                            return (
                                                <MobileMenuButton 
                                                    key={item.view}
                                                    view={item.view} 
                                                    icon={item.icon} 
                                                    label={item.label} 
                                                    color={color}
                                                    currentView={currentView} 
                                                    onNavigate={handleNavigateAndClose}
                                                    badge={getBadgeCount(item.view)}
                                                />
                                            )
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-center pb-safe-area">
                        <button 
                            onClick={onLogout}
                            className="w-full py-4 bg-red-50 text-red-500 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm border border-red-100"
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
