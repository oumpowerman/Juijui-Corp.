
import React, { memo, useState, useEffect } from 'react';
import { Send, ShoppingBag, Wallet, Settings, Sparkles } from 'lucide-react';
import { User } from '../../types';
import { motion } from 'framer-motion';

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
        <div className="relative p-6 rounded-[2.5rem] bg-white/40 backdrop-blur-xl border border-white/80 shadow-2xl shadow-indigo-500/10 overflow-hidden group">
            {/* Decorative Floating Elements */}
            <motion.div 
                animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, 0]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 w-24 h-24 bg-white/40 rounded-full blur-2xl"
            />
            <motion.div 
                animate={{ 
                    y: [0, 10, 0],
                    rotate: [0, -5, 0]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-8 -left-8 w-32 h-32 bg-indigo-200/30 rounded-full blur-3xl"
            />

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <motion.div 
                        whileHover={{ scale: 1.2, rotate: [0, -15, 15, 0] }}
                        transition={{ 
                            scale: { type: "spring", stiffness: 300 },
                            rotate: { duration: 0.5, ease: "easeInOut" }
                        }}
                        className="text-5xl drop-shadow-2xl filter brightness-110 cursor-default"
                    >
                        👨‍👦‍👦
                    </motion.div>
                    <div>
                        <div className="relative inline-block">
                            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-gray-900 via-gray-800 to-gray-600 tracking-tighter flex items-center gap-2">
                                Squad Tasks
                                <span className="text-indigo-500/80 font-medium text-xl md:text-2xl">(ภารกิจแก๊ง)</span>
                            </h1>
                        </div>
                        <p className="text-gray-500/80 text-sm mt-1 font-bold flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                            เช็คงานเบี้ยบ้ายรายทาง งานด่วน งานงอกที่ใครบ้าง
                        </p>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Admin Manage Button */}
                    {isAdmin && onManageClick && (
                        <motion.button 
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onManageClick}
                            className="p-3.5 bg-white/60 backdrop-blur-md border border-white/80 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 rounded-2xl shadow-sm transition-all"
                            title="จัดการสมาชิก"
                        >
                            <Settings className="w-5 h-5" />
                        </motion.button>
                    )}

                    {/* Distribute Task Button */}
                    {onAddTask && (
                        <motion.button 
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onAddTask('TASK')} 
                            className="group flex items-center px-6 py-3.5 bg-gradient-to-br from-emerald-400 to-teal-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all border border-white/20"
                        >
                            <Send className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                            สั่งงานด่วน
                        </motion.button>
                    )}

                    {/* Wallet & Shop */}
                    {currentUser && (
                        <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white p-1 pr-5 pl-3.5 rounded-2xl flex items-center shadow-xl shadow-indigo-500/20 cursor-default border border-white/20 relative overflow-hidden group/wallet"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/wallet:translate-x-full transition-transform duration-1000" />
                            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mr-3 backdrop-blur-md border border-white/10">
                                <Wallet className="w-4.5 h-4.5 text-yellow-300 drop-shadow-sm" />
                            </div>
                            <div>
                                <p className="text-[10px] text-indigo-100 font-black uppercase tracking-widest leading-none mb-1">My Points</p>
                                <p className="text-xl font-black leading-none tabular-nums">{currentUser.availablePoints || 0}</p>
                            </div>
                        </motion.div>
                    )}
                    
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleShop} 
                        className={`flex items-center px-5 py-3.5 rounded-2xl text-sm font-black shadow-lg transition-all border ${isShopOpen ? 'bg-indigo-50/80 backdrop-blur-md border-indigo-200 text-indigo-700' : 'bg-white/60 backdrop-blur-md border-white/80 text-gray-600 hover:text-indigo-600 hover:border-indigo-200'}`}
                    >
                        <ShoppingBag className={`w-4 h-4 mr-2 transition-transform ${isShopOpen ? 'scale-110' : ''}`} /> 
                        {isShopOpen ? 'ปิดร้าน' : 'ร้านค้า'}
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

export default memo(TeamHeader);

