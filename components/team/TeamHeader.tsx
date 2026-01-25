
import React, { memo } from 'react';
import { Send, ShoppingBag, Wallet, Settings } from 'lucide-react';
import { User } from '../../types';

interface TeamHeaderProps {
    onAddTask?: (type?: any) => void;
    onManageClick?: () => void;
    currentUser: User | null;
    isShopOpen: boolean;
    toggleShop: () => void;
}

const TeamHeader: React.FC<TeamHeaderProps> = ({ 
    onAddTask, 
    onManageClick,
    currentUser, 
    isShopOpen, 
    toggleShop 
}) => {
    const isAdmin = currentUser?.role === 'ADMIN';

    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
                <h1 className="text-3xl font-black text-gray-800 flex items-center tracking-tight">
                    <span className="text-4xl mr-2">🤜🤛</span>
                    Squad Tasks (ภารกิจแก๊ง)
                </h1>
                <p className="text-gray-500 text-sm mt-1 font-medium">เช็คงานเบี้ยบ้ายรายทาง งานด่วน งานงอกที่ใครบ้าง</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* Admin Manage Button */}
                {isAdmin && onManageClick && (
                    <button 
                        onClick={onManageClick}
                        className="p-3 bg-white border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 rounded-2xl shadow-sm transition-all"
                        title="จัดการสมาชิก"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                )}

                {/* Distribute Task Button */}
                {onAddTask && (
                    <button 
                        onClick={() => onAddTask('TASK')} 
                        className="flex items-center px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:-translate-y-0.5 transition-all active:scale-95"
                    >
                        <Send className="w-4 h-4 mr-2" /> สั่งงานด่วน
                    </button>
                )}

                {/* Wallet & Shop */}
                {currentUser && (
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-1 pr-4 pl-3 rounded-2xl flex items-center shadow-lg cursor-default border border-white/20">
                        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center mr-2 backdrop-blur-sm">
                            <Wallet className="w-4 h-4 text-yellow-300" />
                        </div>
                        <div>
                            <p className="text-[9px] text-purple-100 font-bold uppercase tracking-wider">My Points</p>
                            <p className="text-lg font-black leading-none">{currentUser.availablePoints || 0}</p>
                        </div>
                    </div>
                )}
                
                <button 
                    onClick={toggleShop} 
                    className={`flex items-center px-4 py-3 rounded-2xl text-sm font-bold shadow-sm border transition-all ${isShopOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:text-indigo-600'}`}
                >
                    <ShoppingBag className="w-4 h-4 mr-2" /> {isShopOpen ? 'ปิดร้าน' : 'ร้านค้า'}
                </button>
            </div>
        </div>
    );
};

export default memo(TeamHeader);
