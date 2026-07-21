
import React from 'react';
import { createPortal } from 'react-dom';
import { Edit2, ChevronDown } from 'lucide-react';
import { User, WorkStatus } from '../../../../types';
import { WORK_STATUS_CONFIG } from '../../../../constants';
import SkinManager from './SkinManager';

interface ProfileSectionProps {
    user: User;
    randomGreeting: string;
    isHpLow: boolean;
    onEditProfile: () => void;
    onUpdateStatus: (status: WorkStatus) => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ 
    user, 
    randomGreeting, 
    isHpLow, 
    onEditProfile, 
    onUpdateStatus 
}) => {
    const currentStatusConfig = WORK_STATUS_CONFIG[user.workStatus as WorkStatus] || WORK_STATUS_CONFIG['ONLINE'];
    const [isOpen, setIsOpen] = React.useState(false);
    const [coords, setCoords] = React.useState({ top: 0, left: 0, width: 0 });
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    const updateCoords = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    const toggleDropdown = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isOpen) {
            // Measure position immediately before displaying
            const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
        setIsOpen(!isOpen);
    };

    React.useEffect(() => {
        if (!isOpen) return;
        const handleScrollOrResize = () => {
            updateCoords();
        };
        // Listen to capture scroll to adjust position on absolute parents
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);
        return () => {
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [isOpen]);

    React.useEffect(() => {
        if (!isOpen) return;
        const handleOutsideClick = (e: MouseEvent) => {
            // Close if clicked outside
            const portalMenu = document.getElementById('status-portal-menu');
            if (
                buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
                (!portalMenu || !portalMenu.contains(e.target as Node))
            ) {
                setIsOpen(false);
            }
        };
        const timer = setTimeout(() => {
            document.addEventListener('click', handleOutsideClick);
        }, 0);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('click', handleOutsideClick);
        };
    }, [isOpen]);

    return (
        <div className="flex items-start gap-4 sm:gap-5">
            {/* Avatar with Frame Manager */}
            <div className="relative group cursor-pointer shrink-0 pt-2" onClick={onEditProfile} title="คลิกเพื่อแก้ไขโปรไฟล์">
                <SkinManager user={user}>
                    <img src={user.avatarUrl} className="w-full h-full object-cover" alt={user.name} referrerPolicy="no-referrer" />
                </SkinManager>
                
                {/* VISIBLE Edit Button (Top Right) */}
                <div className="absolute -top-1 -right-1 bg-white text-gray-400 hover:text-indigo-600 p-1 sm:p-1.5 rounded-full border border-gray-200 shadow-sm z-[45] transition-colors mt-2">
                    <Edit2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </div>
            </div>
            
            <div className="flex flex-col relative min-w-0">
                {/* Greeting Bubble */}
                <div className="relative -ml-2 mb-2 z-20 animate-float-gentle hidden sm:block origin-bottom-left">
                    <div className="
                        bg-gradient-to-br from-white via-indigo-50/50 to-purple-50/50
                        border-2 border-indigo-200
                        px-5 py-3 
                        rounded-2xl rounded-tl-none
                        pop-shadow
                        flex items-center gap-3
                        w-fit max-w-[300px]
                        transition-all duration-300
                        cursor-default
                    ">
                        <div className="bg-white p-1.5 rounded-full shadow-sm border border-indigo-100 shrink-0">
                            <span className="text-xl leading-none">✨</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-0.5 leading-none">TODAY'S VIBE</p>
                            <p className="text-sm font-bold text-slate-700 leading-tight line-clamp-2">
                                "{randomGreeting || 'ขอให้เป็นวันที่ดีนะ!'}"
                            </p>
                        </div>
                    </div>
                    
                    {/* Triangle Tail */}
                    <div className="absolute top-[0px] -left-[9px] w-0 h-0 
                        border-t-[14px] border-t-indigo-200 
                        border-l-[14px] border-l-transparent">
                    </div>
                    <div className="absolute top-[2px] -left-[5px] w-0 h-0 
                        border-t-[11px] border-t-white 
                        border-l-[11px] border-l-transparent">
                    </div>
                </div>

                {/* Name & Mobile Greeting */}
                <div className="flex items-center gap-2 mt-1 shrink-0 flex-wrap">
                    <h2 className="text-xl lg:text-2xl font-bold text-gray-800 tracking-tight truncate">
                        สวัสดี, {user.name.split(' ')[0]}! 👋
                    </h2>
                    <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full border-2 border-white shadow-[0_3px_10px_rgba(234,179,8,0.3)] flex items-center gap-0.5 whitespace-nowrap animate-float-gentle shrink-0 cursor-default select-none">
                        Lv.{user.level}
                    </div>
                </div>
                
                {/* Mobile Only Greeting Text */}
                <p className="text-[11px] sm:text-xs font-medium text-indigo-500 sm:hidden mt-1 italic line-clamp-2">
                    "{randomGreeting || 'Have a nice day!'}"
                </p>
                
                {/* Status Selector Dropdown */}
                <div className="mt-2 inline-block relative">
                    <button
                        ref={buttonRef}
                        onClick={toggleDropdown}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold ${currentStatusConfig.color} bg-opacity-10 hover:bg-opacity-20 select-none cursor-pointer z-30`}
                    >
                        {currentStatusConfig.icon} {currentStatusConfig.label} <ChevronDown className={`w-3 h-3 opacity-50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Dropdown Menu rendered via React Portal so it bypasses all overflow constraints */}
                    {isOpen && createPortal(
                        <div 
                            id="status-portal-menu"
                            style={{
                                position: 'absolute',
                                top: `${coords.top}px`,
                                left: `${coords.left}px`,
                                minWidth: '12rem',
                                zIndex: 100000,
                            }}
                            className="pt-2 animate-in fade-in slide-in-from-top-2 duration-150"
                        >
                            <div className="bg-white rounded-xl shadow-2xl border border-gray-100 p-2 max-w-xs ring-1 ring-black/5">
                                <p className="text-[10px] text-gray-400 uppercase font-bold px-2 py-1 border-b border-gray-100 mb-1">เปลี่ยนสถานะ</p>
                                {Object.entries(WORK_STATUS_CONFIG).map(([key, config]) => (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            onUpdateStatus(key as WorkStatus);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer ${user.workStatus === key ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600'}`}
                                    >
                                        <span className="text-xs">{(config as any).icon}</span>
                                        {(config as any).label.split('(')[0]}
                                    </button>
                                ))}
                            </div>
                        </div>,
                        document.body
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileSection;
