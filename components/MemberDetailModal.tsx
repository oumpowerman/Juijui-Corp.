
import React from 'react';
import { User } from '../types';
import { X, Quote, Mail, Phone, Briefcase, Trophy, Star, Shield, Sparkles, MapPin } from 'lucide-react';

interface MemberDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}

const MemberDetailModal: React.FC<MemberDetailModalProps> = ({ isOpen, onClose, user }) => {
    if (!isOpen || !user) return null;

    // Calculate Level Progress (Example: 1000 XP per level)
    const levelProgress = ((user.xp % 1000) / 1000) * 100;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300 font-sans">
            {/* Main Card Container */}
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300 border-4 border-white ring-1 ring-gray-100 flex flex-col max-h-[85vh]">
                
                {/* Floating Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full transition-all hover:rotate-90 shadow-sm"
                >
                    <X className="w-6 h-6 drop-shadow-md" />
                </button>

                {/* Scrollable Content */}
                <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                    
                    {/* 1. Header Background */}
                    <div className="h-40 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 relative shrink-0">
                        {/* Decorative Pattern */}
                        <div className="absolute inset-0 opacity-20" 
                             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 2px, transparent 0)', backgroundSize: '24px 24px' }}>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-black/10 to-transparent"></div>
                    </div>

                    {/* 2. Content Body */}
                    <div className="px-6 pb-8 bg-white relative">
                        
                        {/* Avatar & Feeling Section (Overlapping Header) */}
                        <div className="flex justify-center -mt-20 relative mb-4">
                            <div className="relative group">
                                {/* Profile Image */}
                                <div className="w-40 h-40 rounded-full p-1 bg-white shadow-xl relative z-10">
                                    <div className="w-full h-full rounded-full overflow-hidden border-4 border-white bg-gray-100 relative">
                                        <img 
                                            src={user.avatarUrl} 
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            alt={user.name} 
                                        />
                                    </div>
                                </div>

                                {/* Admin Crown/Badge */}
                                {user.role === 'ADMIN' && (
                                    <div className="absolute top-2 right-2 z-20 bg-yellow-400 text-white p-1.5 rounded-full border-4 border-white shadow-sm" title="Admin">
                                        <Shield className="w-5 h-5 fill-white" />
                                    </div>
                                )}
                                
                                {/* Feeling Bubble */}
                                {user.feeling && (
                                    <div className="absolute -top-8 -right-12 z-30 animate-bounce-slow origin-bottom-left">
                                        <div className="bg-white text-gray-800 text-xs font-bold px-3 py-2 rounded-2xl rounded-bl-none shadow-lg border-2 border-pink-100 max-w-[120px] text-center relative">
                                            {user.feeling}
                                            {/* Triangle */}
                                            <div className="absolute -bottom-1.5 left-0 w-3 h-3 bg-white border-b-2 border-l-2 border-pink-100 transform -skew-x-12"></div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Level Badge */}
                                <div className="absolute bottom-1 right-1/2 translate-x-1/2 z-20 bg-indigo-600 text-white text-xs font-black px-3 py-1 rounded-full border-4 border-white shadow-md flex items-center gap-1 min-w-[60px] justify-center">
                                    Lv.{user.level || 1}
                                </div>
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="text-center space-y-2 mb-6">
                            <h2 className="text-3xl font-black text-gray-800 flex items-center justify-center gap-2 tracking-tight">
                                {user.name}
                            </h2>
                            <div className="flex justify-center flex-wrap gap-2">
                                <span className="text-gray-500 font-bold bg-gray-100 px-3 py-1 rounded-full text-xs flex items-center shadow-sm">
                                    <Briefcase className="w-3 h-3 mr-1.5" /> {user.position || 'Member'}
                                </span>
                                {user.role === 'ADMIN' && (
                                    <span className="text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full text-xs flex items-center shadow-sm border border-indigo-100">
                                        <Sparkles className="w-3 h-3 mr-1.5" /> Admin
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-2xl border border-orange-100 flex flex-col items-center justify-center shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 bg-orange-100 rounded-bl-full opacity-20 transition-transform group-hover:scale-150"></div>
                                <div className="bg-white p-2 rounded-full mb-2 shadow-sm text-yellow-500">
                                    <Trophy className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">Experience</span>
                                <span className="text-xl font-black text-orange-900">{user.xp?.toLocaleString() || 0} XP</span>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-100 flex flex-col items-center justify-center shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 bg-green-100 rounded-bl-full opacity-20 transition-transform group-hover:scale-150"></div>
                                <div className="bg-white p-2 rounded-full mb-2 shadow-sm text-green-500">
                                    <Star className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Points</span>
                                <span className="text-xl font-black text-green-900">{user.availablePoints?.toLocaleString() || 0}</span>
                            </div>
                        </div>

                        {/* Level Progress Bar */}
                        <div className="mb-8">
                            <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 px-1">
                                <span>Progress to Lv.{ (user.level || 1) + 1 }</span>
                                <span className="text-indigo-500">{levelProgress.toFixed(0)}%</span>
                            </div>
                            <div className="h-4 w-full bg-gray-100 rounded-full p-1 shadow-inner">
                                <div 
                                    className="h-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-full transition-all duration-1000 relative overflow-hidden" 
                                    style={{ width: `${levelProgress}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                                </div>
                            </div>
                        </div>

                        {/* Bio Section */}
                        <div className="relative mb-6 group">
                            <div className="absolute inset-0 bg-indigo-50 rounded-2xl transform rotate-1 transition-transform group-hover:rotate-2"></div>
                            <div className="bg-white border-2 border-indigo-50 p-6 rounded-2xl relative shadow-sm">
                                <Quote className="w-8 h-8 text-indigo-100 absolute -top-3 -left-2 fill-indigo-50" />
                                <p className="text-gray-600 text-sm font-medium leading-relaxed text-center italic relative z-10">
                                    "{user.bio || 'ยังไม่มีคำแนะนำตัว... (แต่เป็นคนน่ารักนะ)'}"
                                </p>
                                <Quote className="w-8 h-8 text-indigo-100 absolute -bottom-3 -right-2 fill-indigo-50 transform rotate-180" />
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Contact Info</h3>
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                                <div className="flex items-center text-sm text-gray-600 group cursor-pointer hover:text-indigo-600 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mr-3 shadow-sm text-gray-400 group-hover:text-indigo-500 group-hover:shadow-md transition-all">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <span className="truncate font-medium">{user.email}</span>
                                </div>
                                <div className="w-full h-px bg-gray-200/50"></div>
                                <div className="flex items-center text-sm text-gray-600 group cursor-pointer hover:text-green-600 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mr-3 shadow-sm text-gray-400 group-hover:text-green-500 group-hover:shadow-md transition-all">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <span className="font-medium">{user.phoneNumber || '-'}</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemberDetailModal;
