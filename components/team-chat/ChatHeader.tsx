
import React from 'react';
import { Bot, Power } from 'lucide-react';
import { User } from '../../types';

interface ChatHeaderProps {
    isBotEnabled: boolean;
    setIsBotEnabled: (enabled: boolean) => void;
    allUsers: User[];
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ isBotEnabled, setIsBotEnabled, allUsers }) => {
    return (
        <div className="px-6 py-4 border-b border-gray-100 bg-white flex justify-between items-center z-20 shadow-sm shrink-0">
            <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    💬 ห้องแชททีม (Team Space)
                </h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2 h-2 rounded-full ${isBotEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                    <p className="text-xs text-gray-400">
                        {isBotEnabled ? 'Juijui AI กำลังสแตนด์บาย...' : 'Juijui AI ปิดใช้งานอยู่'}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                 <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-200">
                    <button onClick={() => setIsBotEnabled(false)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${!isBotEnabled ? 'bg-white shadow text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}>
                        <Power className="w-3 h-3" /> Off
                    </button>
                    <button onClick={() => setIsBotEnabled(true)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${isBotEnabled ? 'bg-indigo-600 shadow text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                        <Bot className="w-3 h-3" /> On
                    </button>
                </div>
                <div className="flex -space-x-2 hidden sm:flex">
                    {allUsers.slice(0, 5).map(u => (
                        <img key={u.id} src={u.avatarUrl} className="w-8 h-8 rounded-full border-2 border-white object-cover" title={u.name} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ChatHeader;
