
import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { User, Duty } from '../../../../types';

interface DutyGuardiansProps {
    todaysDuties: Duty[];
    users: User[];
}

const DutyGuardians: React.FC<DutyGuardiansProps> = ({ todaysDuties, users }) => {
    if (todaysDuties.length === 0) return null;

    return (
        <div className="flex flex-col items-end gap-2 bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="text-[9px] font-bold text-blue-100 uppercase tracking-widest flex items-center mb-1">
                <ShieldCheck className="w-3 h-3 mr-1" /> Guardians Today
            </div>
            <div className="flex items-center -space-x-2 pl-2">
                {todaysDuties.map((duty) => {
                    const user = users.find(u => u.id === duty.assigneeId);
                    const displayName = user ? user.name.split(' ')[0] : 'Unknown';
                    const displayAvatar = user?.avatarUrl;

                    return (
                        <div key={duty.id} className="relative group/avatar cursor-pointer transition-transform hover:scale-110 hover:z-10" title={`${displayName}: ${duty.title}`}>
                            {displayAvatar ? (
                                <img 
                                    src={displayAvatar} 
                                    alt={displayName} 
                                    className={`w-9 h-9 rounded-full border-2 border-white object-cover shadow-sm ${duty.isDone ? 'grayscale opacity-70' : ''}`} 
                                />
                            ) : (
                                <div className="w-9 h-9 rounded-full border-2 border-white bg-indigo-200 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                                    {displayName.charAt(0)}
                                </div>
                            )}
                            
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center ${duty.isDone ? 'bg-green-500' : 'bg-orange-400'}`}>
                                {duty.isDone && <CheckCircle2 className="w-2 h-2 text-white" />}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DutyGuardians;
