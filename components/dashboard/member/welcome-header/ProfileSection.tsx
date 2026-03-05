
import React from 'react';
import { Edit2, ChevronDown } from 'lucide-react';
import { User, WorkStatus } from '../../../../types';
import { WORK_STATUS_CONFIG } from '../../../../constants';

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
    const currentStatusConfig = WORK_STATUS_CONFIG[user.workStatus || 'ONLINE'];

    return (
        <div className="flex items-start gap-4 sm:gap-5">
            {/* Avatar */}
            <div className="relative group cursor-pointer shrink-0 pt-2" onClick={onEditProfile} title="คลิกเพื่อแก้ไขโปรไฟล์">
                <div className={`w-16 h-16 lg:w-20 lg:h-20  rounded-full p-1 shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl ${isHpLow ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-tr from-indigo-500 to-purple-500'}`}>
                    <img src={user.avatarUrl} className="w-full h-full rounded-full object-cover border-4 border-white" alt={user.name} referrerPolicy="no-referrer" />
                </div>
                
                {/* VISIBLE Edit Button (Top Right) */}
                <div className="absolute -top-1 -right-1 bg-white text-gray-400 hover:text-indigo-600 p-1 sm:p-1.5 rounded-full border border-gray-200 shadow-sm z-20 transition-colors mt-2">
                    <Edit2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </div>

                {/* Level Badge (Bottom Right) */}
                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-white rounded-full p-0.5 sm:p-1 shadow-md z-10 pointer-events-none">
                    <div className="bg-yellow-400 text-white text-[10px] sm:text-xs font-black px-1.5 sm:px-2 py-0.5 rounded-full border-2 border-white flex items-center shadow-sm">
                        Lv.{user.level}
                    </div>
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
                <h1 className="text-xl lg:text-2xl font-black text-gray-800 tracking-tight mt-1 truncate">
                    สวัสดี, {user.name.split(' ')[0]}! 👋
                </h1>
                
                {/* Mobile Only Greeting Text */}
                <p className="text-[11px] sm:text-xs font-medium text-indigo-500 sm:hidden mt-1 italic line-clamp-2">
                    "{randomGreeting || 'Have a nice day!'}"
                </p>
                
                {/* Status Selector Dropdown */}
                <div className="relative group mt-2 inline-block w-fit">
                    <button className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold ${currentStatusConfig.color} bg-opacity-10 hover:bg-opacity-20`}>
                        {currentStatusConfig.icon} {currentStatusConfig.label} <ChevronDown className="w-3 h-3 opacity-50" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute top-full left-0 pt-2 w-48 hidden group-hover:block z-50">
                        <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-2 animate-in fade-in slide-in-from-top-2">
                            <p className="text-[10px] text-gray-400 uppercase font-bold px-2 py-1">เปลี่ยนสถานะ (Set Status)</p>
                            {Object.entries(WORK_STATUS_CONFIG).map(([key, config]) => (
                                <button
                                    key={key}
                                    onClick={() => onUpdateStatus(key as WorkStatus)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors ${user.workStatus === key ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600'}`}
                                >
                                    <span>{(config as any).icon}</span>
                                    {(config as any).label.split('(')[0]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSection;
