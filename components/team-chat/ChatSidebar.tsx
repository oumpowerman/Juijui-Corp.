
import React from 'react';
import { Bot, MessageSquare, Zap, X } from 'lucide-react';
import { User } from '../../types';

interface ChatSidebarProps {
    isBotEnabled: boolean;
    allUsers: User[];
    isOpenMobile?: boolean;
    onCloseMobile?: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
    isBotEnabled, 
    allUsers, 
    isOpenMobile = false, 
    onCloseMobile 
}) => {
    
    const renderContent = (isDrawer = false) => (
        <div className={`flex flex-col gap-4 ${isDrawer ? 'h-full overflow-y-auto pb-6' : ''}`}>
            {/* Bot manual info */}
            <div className={`rounded-2xl shadow-sm border p-4 transition-all duration-300 shrink-0 ${isBotEnabled ? 'bg-white border-indigo-100 shadow-indigo-100' : 'bg-gray-50 border-gray-200 opacity-70'}`}>
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
                        <h4 className="text-xs font-bold text-gray-600 mb-1.5 flex items-center"><MessageSquare className="w-3 h-3 mr-1"/> เรียกคุยเล่น</h4>
                        <p className="text-[10px] text-gray-500 leading-relaxed">
                            พิมพ์คำว่า <span className="font-mono bg-white px-1 rounded border">บอท</span>, <span className="font-mono bg-white px-1 rounded border">Juijui</span>
                        </p>
                    </div>
                    
                    <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                        <h4 className="text-xs font-bold text-indigo-700 mb-1.5 flex items-center"><Zap className="w-3 h-3 mr-1"/> สั่งสร้างงาน (Task)</h4>
                        <p className="text-[10px] text-indigo-600 leading-relaxed">
                            พิมพ์คำว่า <span className="font-mono bg-white px-1 rounded border text-indigo-500">สร้างงาน</span> <br/>
                            <i>"ฝากสร้างงาน ตัดต่อ Vlog ให้หน่อย"</i>
                        </p>
                    </div>
                </div>
            </div>

            {/* Members Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex-1 overflow-y-auto min-h-[220px]">
                <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wider flex justify-between items-center shrink-0">
                    สมาชิกทีม <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{allUsers.length}</span>
                </h3>
                <div className="space-y-3 pr-2 overflow-y-auto">
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

    return (
        <>
            {/* Desktop View */}
            <div className="w-72 hidden lg:flex flex-col gap-4 overflow-y-auto shrink-0">
                {renderContent(false)}
            </div>

            {/* Mobile Drawer Slide-in View */}
            {isOpenMobile && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden animate-in fade-in duration-200"
                        onClick={onCloseMobile}
                    />
                    {/* Sliding panel */}
                    <div className="fixed right-0 top-0 bottom-0 w-80 max-w-[85%] bg-[#f8fafc] shadow-2xl z-50 p-4 pb-12 flex flex-col gap-4 border-l border-gray-100 lg:hidden animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100 shrink-0">
                            <h3 className="font-extrabold text-gray-800 text-sm">ข้อมูลห้องแชท</h3>
                            <button 
                                onClick={onCloseMobile}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden mt-2">
                            {renderContent(true)}
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default ChatSidebar;