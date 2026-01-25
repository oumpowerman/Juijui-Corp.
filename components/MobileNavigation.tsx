
import React, { useState } from 'react';
import { LayoutGrid, Calendar as CalendarIcon, MessageCircle, Menu, X, Film, ClipboardList, BookOpen, ScanEye, Coffee, Target, TrendingUp, LogOut, BarChart3, Megaphone, FileText, Presentation, Settings2, Database } from 'lucide-react';
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

const MobileMenuButton = ({ view, icon: Icon, label, color, currentView, onNavigate }: { view: ViewMode, icon: any, label: string, color: string, currentView: ViewMode, onNavigate: (v: ViewMode) => void }) => (
    <button
        onClick={() => onNavigate(view)}
        className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${currentView === view ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
    >
        <div className={`p-2 rounded-xl mb-1 ${color}`}>
            <Icon className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-bold text-gray-600 text-center leading-tight">{label}</span>
    </button>
);

const MobileNavigation: React.FC<MobileNavigationProps> = ({ currentUser, currentView, onNavigate, onAddTask, onLogout, onEditProfile, unreadChatCount }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleNavigateAndClose = (view: ViewMode) => {
        onNavigate(view);
        setIsMenuOpen(false);
    };

    // Updated Bottom Nav Items (Added Script and Meeting)
    const mainNavItems = [
        { view: 'DASHBOARD' as ViewMode, icon: LayoutGrid, label: 'Home' },
        { view: 'SCRIPT_HUB' as ViewMode, icon: FileText, label: 'Script' },
        { view: 'MEETINGS' as ViewMode, icon: Presentation, label: 'Meeting' },
        { view: 'CHAT' as ViewMode, icon: MessageCircle, label: 'Chat' },
    ];

    return (
        <>
            {/* Bottom Bar (5-item layout) */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-2 py-2 flex justify-around items-center z-50 lg:hidden pb-safe-area h-[75px] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                {mainNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.view;
                    return (
                        <button
                            key={item.view}
                            onClick={() => onNavigate(item.view)}
                            className={`flex flex-col items-center gap-1 w-14 transition-all ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}
                        >
                            <div className={`relative p-1.5 rounded-xl transition-all ${isActive ? 'bg-indigo-50 shadow-inner' : 'bg-transparent'}`}>
                                <Icon className={`w-5 h-5 ${isActive ? 'fill-indigo-600' : ''}`} />
                                {item.view === 'CHAT' && unreadChatCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
                                )}
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
                        </button>
                    );
                })}
                
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className={`flex flex-col items-center gap-1 w-14 transition-all ${isMenuOpen ? 'text-indigo-600' : 'text-gray-400'}`}
                >
                    <div className={`p-1.5 rounded-xl transition-all ${isMenuOpen ? 'bg-indigo-50 shadow-inner' : 'bg-transparent'}`}>
                        <Menu className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-tighter">Menu</span>
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200" onClick={() => setIsMenuOpen(false)}>
                    <div 
                        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] p-6 animate-in slide-in-from-bottom-full duration-300 shadow-2xl h-[85vh] flex flex-col border-t-4 border-indigo-50"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Pull Bar */}
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>

                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-gray-800 tracking-tight">เมนูทั้งหมด</h3>
                            <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-8 pb-10 scrollbar-hide">
                            
                            {/* General/Workspace */}
                            <div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 pl-1">Workspace</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <MobileMenuButton view="CALENDAR" icon={CalendarIcon} label="ปฏิทิน" color="bg-indigo-100 text-indigo-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                    <MobileMenuButton view="WEEKLY" icon={Target} label="ภารกิจ" color="bg-orange-100 text-orange-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                    <MobileMenuButton view="GOALS" icon={TrendingUp} label="เป้าหมาย" color="bg-green-100 text-green-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                </div>
                            </div>

                            {/* Production Grid */}
                            <div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 pl-1">งานผลิต (Production)</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <MobileMenuButton view="SCRIPT_HUB" icon={FileText} label="เขียนบท" color="bg-rose-100 text-rose-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                    <MobileMenuButton view="MEETINGS" icon={Presentation} label="ห้องประชุม" color="bg-blue-100 text-blue-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                    <MobileMenuButton view="STOCK" icon={Film} label="คลังคลิป" color="bg-indigo-100 text-indigo-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                    <MobileMenuButton view="CHECKLIST" icon={ClipboardList} label="จัดเป๋า" color="bg-teal-100 text-teal-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                </div>
                            </div>

                            {/* Office Grid */}
                            <div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 pl-1">จัดการภายใน (Office)</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <MobileMenuButton view="DUTY" icon={Coffee} label="ตารางเวร" color="bg-amber-100 text-amber-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                    <MobileMenuButton view="QUALITY_GATE" icon={ScanEye} label="ตรวจงาน" color="bg-purple-100 text-purple-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                    <MobileMenuButton view="KPI" icon={BarChart3} label="KPI" color="bg-lime-100 text-lime-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                    <MobileMenuButton view="FEEDBACK" icon={Megaphone} label="Feedback" color="bg-pink-100 text-pink-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                    <MobileMenuButton view="WIKI" icon={BookOpen} label="คู่มือ" color="bg-sky-100 text-sky-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                </div>
                            </div>

                            {/* Admin Link (If Admin) */}
                            {currentUser.role === 'ADMIN' && (
                                <div className="pb-4">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 pl-1">Admin Settings</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => handleNavigateAndClose('CHANNELS')}
                                            className="py-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 flex items-center justify-center gap-2"
                                        >
                                            <Settings2 className="w-4 h-4" /> จัดการช่อง
                                        </button>
                                        <button 
                                            onClick={() => handleNavigateAndClose('MASTER_DATA')}
                                            className="py-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 flex items-center justify-center gap-2"
                                        >
                                            <Database className="w-4 h-4" /> ตั้งค่าระบบ
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User Profile Footer */}
                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-3" onClick={() => { onEditProfile(); setIsMenuOpen(false); }}>
                                <img src={currentUser.avatarUrl} alt="User" className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100 shadow-sm" />
                                <div>
                                    <p className="text-sm font-black text-gray-800">{currentUser.name}</p>
                                    <p className="text-[10px] font-bold text-indigo-500 uppercase">{currentUser.position}</p>
                                </div>
                            </div>
                            <button 
                                onClick={onLogout}
                                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-bold border border-red-100 active:scale-95 transition-all"
                            >
                                <LogOut className="w-4 h-4" /> ลงชื่อออก
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MobileNavigation;
