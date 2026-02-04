
import React from 'react';
import { Bot, MessageSquare, Zap } from 'lucide-react';
import { User } from '../../types';

interface ChatSidebarProps {
    isBotEnabled: boolean;
    allUsers: User[];
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ isBotEnabled, allUsers }) => {
    return (
        <div className="w-72 hidden lg:flex flex-col gap-4 overflow-y-auto">
            <div className={`rounded-2xl shadow-sm border p-4 transition-all duration-300 ${isBotEnabled ? 'bg-white border-indigo-100 shadow-indigo-100' : 'bg-gray-50 border-gray-200 opacity-70'}`}>
                <div className="flex items-center gap-2 mb-3">
                    <div className={`p-2 rounded-lg ${isBotEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-500'}`}>
                        <Bot className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-sm">Juijui Bot 🤖</h3>
                        <p className="text-[10px] text-gray-500">{isBotEnabled ? 'สถานะ: พร้อมทำงาน' : 'สถานะ: พักผ่อน'}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-600 mb-2 flex items-center"><MessageSquare className="w-3 h-3 mr-1"/> เรียกคุยเล่น</h4>
                        <p className="text-[10px] text-gray-500 leading-relaxed">
                            พิมพ์คำว่า <span className="font-mono bg-white px-1 rounded border">บอท</span>, <span className="font-mono bg-white px-1 rounded border">Juijui</span>
                        </p>
                    </div>
                    
                    <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                        <h4 className="text-xs font-bold text-indigo-700 mb-2 flex items-center"><Zap className="w-3 h-3 mr-1"/> สั่งสร้างงาน (Task)</h4>
                        <p className="text-[10px] text-indigo-600 leading-relaxed">
                            พิมพ์คำว่า <span className="font-mono bg-white px-1 rounded border text-indigo-500">สร้างงาน</span> <br/>
                            <i>"ฝากสร้างงาน ตัดต่อ Vlog ให้หน่อย"</i>
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex-1 overflow-y-auto">
                <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wider flex justify-between items-center">
                    สมาชิกทีม <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{allUsers.length}</span>
                </h3>
                <div className="space-y-3 pr-2">
                    {allUsers.map(u => (
                        <div key={u.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group">
                            <div className="relative">
                                <img src={u.avatarUrl} className="w-8 h-8 rounded-full object-cover border border-gray-100" />
                                <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-white rounded-full"></div>
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-800 truncate">{u.name}</p>
                                <p className="text-[10px] text-gray-400 truncate">{u.position}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ChatSidebar;
