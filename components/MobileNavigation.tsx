
import React, { useState } from 'react';
import { LayoutGrid, Calendar as CalendarIcon, MessageCircle, Menu, Plus, X, Film, ClipboardList, BookOpen, ScanEye, Coffee, Target, TrendingUp, LogOut, BarChart3, Megaphone, FileText, Presentation, Settings2, Database } from 'lucide-react';
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

    const mainNavItems = [
        { view: 'DASHBOARD' as ViewMode, icon: LayoutGrid, label: 'Home' },
        { view: 'CALENDAR' as ViewMode, icon: CalendarIcon, label: 'Calendar' },
        { view: 'CHAT' as ViewMode, icon: MessageCircle, label: 'Chat' },
    ];

    return (
        <>
            {/* FAB (Floating Action Button) */}
            <button
                onClick={() => onAddTask()}
                className="fixed bottom-24 left-1/2 -translate-x-1/2 w-14 h-14 bg-indigo-600 rounded-full shadow-2xl shadow-indigo-400 flex items-center justify-center text-white z-50 active:scale-95 transition-transform lg:hidden"
            >
                <Plus className="w-8 h-8 stroke-[3px]" />
            </button>

            {/* Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 flex justify-between items-center z-50 lg:hidden pb-safe-area h-[80px]">
                {mainNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.view;
                    return (
                        <button
                            key={item.view}
                            onClick={() => onNavigate(item.view)}
                            className={`flex flex-col items-center gap-1 w-16 transition-all ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}
                        >
                            <div className={`relative p-1.5 rounded-xl transition-all ${isActive ? 'bg-indigo-50' : 'bg-transparent'}`}>
                                <Icon className={`w-6 h-6 ${isActive ? 'fill-indigo-600' : ''}`} />
                                {item.view === 'CHAT' && unreadChatCount > 0 && (
                                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
                                )}
                            </div>
                            <span className="text-[10px] font-bold">{item.label}</span>
                        </button>
                    );
                })}
                
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className={`flex flex-col items-center gap-1 w-16 transition-all ${isMenuOpen ? 'text-indigo-600' : 'text-gray-400'}`}
                >
                    <div className={`p-1.5 rounded-xl transition-all ${isMenuOpen ? 'bg-indigo-50' : 'bg-transparent'}`}>
                        <Menu className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold">Menu</span>
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200" onClick={() => setIsMenuOpen(false)}>
                    <div 
                        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2rem] p-6 animate-in slide-in-from-bottom-full duration-300 shadow-2xl h-[85vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-gray-800">เมนูทั้งหมด</h3>
                            <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-6 pb-6 scrollbar-hide">
                            
                            {/* Production Grid */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 pl-1">ผลิตงาน (Production)</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <MobileMenuButton view="SCRIPT_HUB" icon={FileText} label="เขียนบท" color="bg-rose-100 text-rose-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                    <MobileMenuButton view="MEETINGS" icon={Presentation} label="ห้องประชุม" color="bg-blue-100 text-blue-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                    <MobileMenuButton view="STOCK" icon={Film} label="คลังคลิป" color="bg-indigo-100 text-indigo-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                    <MobileMenuButton view="CHECKLIST" icon={ClipboardList} label="จัดเป๋า" color="bg-teal-100 text-teal-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                </div>
                            </div>

                            {/* Office Grid */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 pl-1">จัดการภายใน (Office)</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <MobileMenuButton view="DUTY" icon={Coffee} label="ตารางเวร" color="bg-amber-100 text-amber-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                    <MobileMenuButton view="QUALITY_GATE" icon={ScanEye} label="ตรวจงาน" color="bg-purple-100 text-purple-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                    <MobileMenuButton view="KPI" icon={BarChart3} label="KPI" color="bg-lime-100 text-lime-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                    <MobileMenuButton view="FEEDBACK" icon={Megaphone} label="Feedback" color="bg-pink-100 text-pink-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                    <MobileMenuButton view="WIKI" icon={BookOpen} label="คู่มือ" color="bg-sky-100 text-sky-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                </div>
                            </div>

                            {/* Workspace Grid */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 pl-1">Workspace</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <MobileMenuButton view="WEEKLY" icon={Target} label="ภารกิจ (Quests)" color="bg-orange-100 text-orange-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                    <MobileMenuButton view="GOALS" icon={TrendingUp} label="เป้าหมาย (Goals)" color="bg-green-100 text-green-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                </div>
                            </div>

                            {/* Admin Link (If Admin) */}
                            {currentUser.role === 'ADMIN' && (
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 pl-1">Admin</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => handleNavigateAndClose('CHANNELS')}
                                            className="py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center justify-center gap-2"
                                        >
                                            <Settings2 className="w-4 h-4" /> จัดการช่อง
                                        </button>
                                        <button 
                                            onClick={() => handleNavigateAndClose('MASTER_DATA')}
                                            className="py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center justify-center gap-2"
                                        >
                                            <Database className="w-4 h-4" /> ตั้งค่าระบบ
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User Profile Footer */}
                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3" onClick={() => { onEditProfile(); setIsMenuOpen(false); }}>
                                <img src={currentUser.avatarUrl} alt="User" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                                <div>
                                    <p className="text-sm font-bold text-gray-800">{currentUser.name}</p>
                                    <p className="text-xs text-gray-500">{currentUser.position}</p>
                                </div>
                            </div>
                            <button 
                                onClick={onLogout}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MobileNavigation;
