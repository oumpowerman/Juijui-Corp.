
import React, { useMemo } from 'react';
import { User } from '../../types';
import { User as UserIcon } from 'lucide-react';

interface KPISidebarProps {
    users: User[];
    selectedUserId: string;
    onSelectUser: (id: string) => void;
}

const KPISidebar: React.FC<KPISidebarProps> = ({ users, selectedUserId, onSelectUser }) => {
    const activeUsers = users.filter(u => u.isActive);

    const groupedUsers = useMemo(() => {
        const groups: Record<string, { fullTime: User[], intern: User[] }> = {};
        
        activeUsers.forEach(u => {
            const pos = u.position || 'อื่นๆ';
            if (!groups[pos]) {
                groups[pos] = { fullTime: [], intern: [] };
            }
            
            if (u.employmentType === 'INTERN') {
                groups[pos].intern.push(u);
            } else {
                groups[pos].fullTime.push(u);
            }
        });

        return Object.keys(groups).sort().reduce((acc, key) => {
            acc[key] = groups[key];
            return acc;
        }, {} as Record<string, { fullTime: User[], intern: User[] }>);
    }, [activeUsers]);

    return (
        <div className="lg:col-span-1 bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-xl border border-white/50 overflow-hidden h-fit sticky top-6">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 font-bold text-gray-600 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-indigo-500" /> 
                    <span className="text-lg tracking-tight">รายชื่อทีม</span>
                </div>
                <span className="text-xs bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full font-bold">{activeUsers.length}</span>
            </div>
            <div className="max-h-[700px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                {Object.entries(groupedUsers).map(([position, types]) => (
                    <div key={position} className="mb-4 last:mb-0">
                        <div className="px-4 py-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex justify-between items-center mb-1">
                            <span>{position}</span>
                        </div>
                        
                        {types.fullTime.map(u => (
                            <button 
                                key={u.id} 
                                onClick={() => onSelectUser(u.id)} 
                                className={`w-full p-3 flex items-center gap-3 text-left rounded-2xl transition-all duration-300 group ${u.id === selectedUserId ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-[1.02]' : 'bg-transparent text-gray-700 hover:bg-indigo-50'}`}
                            >
                                <div className="relative">
                                    <img src={u.avatarUrl} className={`w-10 h-10 rounded-2xl object-cover ring-2 ${u.id === selectedUserId ? 'ring-indigo-400' : 'ring-white'} shadow-md transition-all`} referrerPolicy="no-referrer" />
                                    {u.employmentType === 'PROBATION' && (
                                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-400 border-2 border-white rounded-full shadow-sm" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className={`text-sm font-bold truncate ${u.id === selectedUserId ? 'text-white' : 'text-gray-800'}`}>{u.name}</p>
                                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${u.id === selectedUserId ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-400'}`}>FT</span>
                                    </div>
                                    <p className={`text-[10px] font-bold italic ${u.id === selectedUserId ? 'text-indigo-100' : 'text-gray-400'}`}>พนักงานประจำ</p>
                                </div>
                            </button>
                        ))}

                        {types.intern.map(u => (
                            <button 
                                key={u.id} 
                                onClick={() => onSelectUser(u.id)} 
                                className={`w-full p-3 flex items-center gap-3 text-left rounded-2xl transition-all duration-300 group ${u.id === selectedUserId ? 'bg-orange-500 text-white shadow-lg shadow-orange-200 scale-[1.02]' : 'bg-transparent text-gray-700 hover:bg-indigo-50'}`}
                            >
                                <div className="relative">
                                    <img src={u.avatarUrl} className={`w-10 h-10 rounded-2xl object-cover ring-2 ${u.id === selectedUserId ? 'ring-orange-400' : 'ring-white'} shadow-md transition-all grayscale-[0.2]`} referrerPolicy="no-referrer" />
                                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-orange-400 border-2 border-white rounded-full shadow-sm" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className={`text-sm font-bold truncate ${u.id === selectedUserId ? 'text-white' : 'text-gray-800'}`}>{u.name}</p>
                                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${u.id === selectedUserId ? 'bg-white/20 text-white' : 'bg-orange-50 text-orange-400'}`}>IN</span>
                                    </div>
                                    <p className={`text-[10px] font-bold italic ${u.id === selectedUserId ? 'text-orange-100' : 'text-gray-400'}`}>นักศึกษาฝึกงาน</p>
                                </div>
                            </button>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default KPISidebar;
