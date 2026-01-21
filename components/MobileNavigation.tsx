
import React, { useState } from 'react';
import { LayoutGrid, Calendar as CalendarIcon, MessageCircle, Menu, Plus, X, Settings2, Database, Film, ClipboardList, BookOpen, ScanEye, Coffee, Target, Users, TrendingUp, Sparkles, Camera, LogOut, CheckSquare, MonitorPlay } from 'lucide-react';
import { User, ViewMode, TaskType } from '../types';
import { MENU_GROUPS } from './Sidebar'; // Re-use config

interface MobileNavigationProps {
    currentUser: User;
    currentView: ViewMode;
    onNavigate: (view: ViewMode) => void;
    onAddTask: (type?: TaskType) => void;
    onLogout: () => void | Promise<void>;
    onEditProfile: () => void;
    unreadChatCount: number;
}

interface NavItemProps {
    view: ViewMode;
    icon: any;
    label: string;
    currentView: ViewMode;
    onNavigate: (view: ViewMode) => void;
    badgeCount?: number;
}

const NavItem: React.FC<NavItemProps> = ({ view, icon: Icon, label, currentView, onNavigate, badgeCount }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => onNavigate(view)}
        className={`flex flex-col items-center justify-center w-full py-1 relative ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
      >
        <div className="relative">
            <Icon className={`w-6 h-6 ${isActive ? 'fill-indigo-100' : ''}`} />
            {badgeCount && badgeCount > 0 ? (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center border border-white">
                    {badgeCount > 99 ? '99+' : badgeCount}
                </div>
            ) : null}
        </div>
        <span className="text-[10px] mt-1 font-medium">{label}</span>
      </button>
    );
};

interface MobileMenuButtonProps {
    view: ViewMode;
    icon: any;
    label: string;
    color: string;
    currentView: ViewMode;
    onNavigate: (view: ViewMode) => void;
}

const MobileMenuButton: React.FC<MobileMenuButtonProps> = ({ view, icon: Icon, label, color, currentView, onNavigate }) => {
     const isActive = currentView === view;
     return (
        <button 
           onClick={() => onNavigate(view)}
           className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-95 ${isActive ? `bg-gray-50 border-indigo-200 ring-1 ring-indigo-200` : 'bg-white border-gray-100'}`}
        >
            <div className={`p-2.5 rounded-xl mb-2 ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-bold text-center leading-tight ${isActive ? 'text-indigo-700' : 'text-gray-600'}`}>{label}</span>
        </button>
     );
};

const MobileNavigation: React.FC<MobileNavigationProps> = ({ currentUser, currentView, onNavigate, onAddTask, onLogout, onEditProfile, unreadChatCount }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const isAdmin = currentUser.role === 'ADMIN';

    const handleNavigateAndClose = (view: ViewMode) => {
        onNavigate(view);
        setIsMenuOpen(false);
        setShowAddMenu(false);
    };

    const handleAddTaskType = (type: TaskType) => {
        onAddTask(type);
        setShowAddMenu(false);
    };

    return (
        <>
            {/* FAB Selection Menu Overlay */}
            {showAddMenu && (
                <div 
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden animate-in fade-in duration-200" 
                    onClick={() => setShowAddMenu(false)}
                >
                    <div className="absolute bottom-[90px] left-0 right-0 flex justify-center items-end px-4 pointer-events-none">
                        <div className="bg-white rounded-2xl shadow-xl p-2 flex flex-col gap-2 w-full max-w-xs pointer-events-auto border border-gray-100 animate-in slide-in-from-bottom-4 zoom-in-95">
                            <button 
                                onClick={() => handleAddTaskType('CONTENT')}
                                className="flex items-center p-3 rounded-xl hover:bg-indigo-50 active:bg-indigo-100 transition-colors group"
                            >
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg mr-3 group-hover:bg-indigo-200">
                                    <MonitorPlay className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <span className="block text-sm font-bold text-gray-800">สร้าง Content</span>
                                    <span className="text-xs text-gray-500">คลิป, โพสต์, รายการ</span>
                                </div>
                            </button>
                            <button 
                                onClick={() => handleAddTaskType('TASK')}
                                className="flex items-center p-3 rounded-xl hover:bg-emerald-50 active:bg-emerald-100 transition-colors group"
                            >
                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg mr-3 group-hover:bg-emerald-200">
                                    <CheckSquare className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <span className="block text-sm font-bold text-gray-800">สร้าง Task</span>
                                    <span className="text-xs text-gray-500">งานทั่วไป, ธุระ, สิ่งที่ต้องทำ</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 pb-safe-area pt-2 flex justify-between items-center z-50 h-[80px] pb-5">
                <NavItem view="DASHBOARD" icon={LayoutGrid} label="ภาพรวม" currentView={currentView} onNavigate={onNavigate} />
                <NavItem view="CALENDAR" icon={CalendarIcon} label="ปฏิทิน" currentView={currentView} onNavigate={onNavigate} />
                
                {/* Center FAB */}
                <div className="relative -top-5">
                    <button 
                        onClick={() => setShowAddMenu(!showAddMenu)}
                        className={`w-16 h-16 rounded-full text-white shadow-lg shadow-indigo-400/50 flex items-center justify-center active:scale-95 transition-transform border-4 border-[#f8fafc] ring-2 ring-indigo-100 ${showAddMenu ? 'bg-gray-800 rotate-45' : 'bg-gradient-to-tr from-indigo-600 to-purple-600'}`}
                    >
                        <Plus className="w-8 h-8 stroke-[3px]" />
                    </button>
                </div>
                
                <NavItem view="CHAT" icon={MessageCircle} label="แชท" currentView={currentView} onNavigate={onNavigate} badgeCount={unreadChatCount} />
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className={`flex flex-col items-center justify-center w-full py-1 ${isMenuOpen ? 'text-indigo-600' : 'text-slate-400'}`}
                >
                    <Menu className={`w-6 h-6 ${isMenuOpen ? 'text-indigo-600' : ''}`} />
                    <span className="text-[10px] mt-1 font-medium">เมนู</span>
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200" onClick={() => setIsMenuOpen(false)}>
                <div 
                    className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2rem] p-6 animate-in slide-in-from-bottom-full duration-300 shadow-2xl h-[85vh] flex flex-col"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-6 px-2 shrink-0">
                        <div>
                            <h3 className="text-xl font-black text-gray-800">เมนูทั้งหมด 📱</h3>
                            <p className="text-xs text-gray-500">เลือกฟังก์ชันที่คุณต้องการ</p>
                        </div>
                        <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                            <X className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-6 pb-6">
                        
                        {/* WORKSPACE */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 pl-1">Workspace</h4>
                            <div className="grid grid-cols-3 gap-3">
                                <MobileMenuButton view="CALENDAR" icon={CalendarIcon} label="ปฏิทิน & บอร์ด" color="bg-blue-100 text-blue-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                <MobileMenuButton view="CHAT" icon={MessageCircle} label="Team Chat" color="bg-indigo-100 text-indigo-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                <MobileMenuButton view="GOALS" icon={TrendingUp} label="เป้าหมาย" color="bg-green-100 text-green-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                <MobileMenuButton view="TEAM" icon={Users} label="ทีมงาน" color="bg-cyan-100 text-cyan-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                <MobileMenuButton view="WEEKLY" icon={Target} label="Quest" color="bg-orange-100 text-orange-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                            </div>
                        </div>

                        {/* TOOLS */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 pl-1">Tools & Content</h4>
                            <div className="grid grid-cols-3 gap-3">
                                <MobileMenuButton view="DUTY" icon={Coffee} label="ตารางเวร" color="bg-amber-100 text-amber-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                <MobileMenuButton view="QUALITY_GATE" icon={ScanEye} label="ตรวจงาน" color="bg-purple-100 text-purple-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                <MobileMenuButton view="WIKI" icon={BookOpen} label="คู่มือ (Wiki)" color="bg-sky-100 text-sky-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                <MobileMenuButton view="CHECKLIST" icon={ClipboardList} label="Checklist" color="bg-teal-100 text-teal-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                <MobileMenuButton view="STOCK" icon={Film} label="คลังคลิป" color="bg-pink-100 text-pink-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                            </div>
                        </div>

                        {/* ADMIN */}
                        {isAdmin && (
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 pl-1">Admin Only</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <MobileMenuButton view="CHANNELS" icon={Settings2} label="ช่องทาง" color="bg-slate-100 text-slate-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                    <MobileMenuButton view="MASTER_DATA" icon={Database} label="ตั้งค่าระบบ" color="bg-slate-100 text-slate-600" currentView={currentView} onNavigate={handleNavigateAndClose} />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-gray-100 pt-4 flex items-center justify-between shrink-0">
                        <div className="flex items-center space-x-3" onClick={() => { onEditProfile(); setIsMenuOpen(false); }}>
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 overflow-hidden relative">
                                {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} className="w-full h-full object-cover" /> : currentUser.name.charAt(0).toUpperCase()}
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                    <Camera className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            <div className="text-sm">
                                <p className="font-bold text-gray-800">{currentUser.name}</p>
                                <p className="text-xs text-gray-400">แตะเพื่อแก้ไขโปรไฟล์</p>
                            </div>
                        </div>
                        <button onClick={onLogout} className="px-4 py-2 bg-red-50 text-red-500 rounded-xl font-bold text-sm flex items-center">
                            <LogOut className="w-4 h-4 mr-2" />
                            ออก
                        </button>
                    </div>
                </div>
                </div>
            )}
        </>
    );
};

export default MobileNavigation;
