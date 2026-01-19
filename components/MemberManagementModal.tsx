
import React, { useState } from 'react';
import { X, Search, Shield, User as UserIcon, Power, MoreHorizontal, UserCheck, UserX, Crown, Edit2, Save, Check } from 'lucide-react';
import { User, Role } from '../types';

interface MemberManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    currentUser: User;
    onToggleStatus: (userId: string, currentStatus: boolean) => void;
    onRemoveMember: (userId: string) => void;
    onUpdateMember: (userId: string, updates: { name?: string, position?: string, role?: Role }) => Promise<boolean>;
}

const MemberManagementModal: React.FC<MemberManagementModalProps> = ({ 
    isOpen, onClose, users, currentUser, onToggleStatus, onRemoveMember, onUpdateMember
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ name: string, position: string, role: Role }>({ name: '', position: '', role: 'MEMBER' });

    if (!isOpen) return null;

    const handleStartEdit = (user: User) => {
        setEditingUserId(user.id);
        setEditForm({ name: user.name, position: user.position, role: user.role });
    };

    const handleCancelEdit = () => {
        setEditingUserId(null);
    };

    const handleSaveEdit = async (userId: string) => {
        const success = await onUpdateMember(userId, editForm);
        if (success) {
            setEditingUserId(null);
        }
    };

    // Filter Logic
    const displayedUsers = users.filter(u => {
        if (!u.isApproved) return false; 
        const matchSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            u.position.toLowerCase().includes(searchTerm.toLowerCase());
        if (filter === 'ACTIVE' && !u.isActive) return false;
        if (filter === 'INACTIVE' && u.isActive) return false;
        return matchSearch;
    }).sort((a, b) => {
        if (a.isActive === b.isActive) return a.name.localeCompare(b.name);
        return a.isActive ? -1 : 1;
    });

    const activeCount = users.filter(u => u.isApproved && u.isActive).length;
    const inactiveCount = users.filter(u => u.isApproved && !u.isActive).length;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-100 scale-100 animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 bg-white flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 flex items-center">
                            <Shield className="w-5 h-5 mr-2 text-indigo-600" />
                            จัดการสมาชิก (Member Management)
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">กำหนดสิทธิ์และข้อมูลสมาชิกในทีม</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Controls */}
                <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="ค้นหาชื่อ, ตำแหน่ง..." 
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm shrink-0">
                        <button onClick={() => setFilter('ALL')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'ALL' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>ทั้งหมด</button>
                        <button onClick={() => setFilter('ACTIVE')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'ACTIVE' ? 'bg-green-50 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Active</button>
                        <button onClick={() => setFilter('INACTIVE')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'INACTIVE' ? 'bg-red-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Inactive</button>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc]">
                    {displayedUsers.map(user => {
                        const isMe = user.id === currentUser.id;
                        const isEditing = editingUserId === user.id;

                        return (
                            <div key={user.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${user.isActive ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-100 border-gray-200 opacity-75 grayscale-[0.5]'}`}>
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="relative shrink-0">
                                        {user.avatarUrl ? (
                                            <img src={user.avatarUrl} className="w-12 h-12 rounded-full object-cover border border-gray-100" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500"><UserIcon className="w-6 h-6" /></div>
                                        )}
                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${user.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0 pr-4">
                                        {isEditing ? (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                                                <input 
                                                    className="w-full px-2 py-1 text-sm font-bold border rounded bg-white focus:ring-1 focus:ring-indigo-500 outline-none" 
                                                    value={editForm.name} 
                                                    onChange={e => setEditForm({...editForm, name: e.target.value})} 
                                                />
                                                <div className="flex gap-2">
                                                    <input 
                                                        className="flex-1 px-2 py-1 text-xs border rounded bg-white outline-none" 
                                                        value={editForm.position} 
                                                        onChange={e => setEditForm({...editForm, position: e.target.value})} 
                                                    />
                                                    <select 
                                                        className="px-2 py-1 text-xs border rounded bg-white outline-none font-bold text-indigo-600"
                                                        value={editForm.role}
                                                        onChange={e => setEditForm({...editForm, role: e.target.value as Role})}
                                                    >
                                                        <option value="MEMBER">Member</option>
                                                        <option value="ADMIN">Admin</option>
                                                    </select>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-gray-800 truncate">{user.name}</h4>
                                                    {user.role === 'ADMIN' && (
                                                        <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center shrink-0">
                                                            <Crown className="w-3 h-3 mr-1" /> Admin
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 truncate">{user.position} • {user.email}</p>
                                                {!user.isActive && <span className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded mt-1 inline-block">Inactive</span>}
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {isEditing ? (
                                        <>
                                            <button onClick={handleCancelEdit} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
                                            <button onClick={() => handleSaveEdit(user.id)} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"><Check className="w-4 h-4" /></button>
                                        </>
                                    ) : isMe ? (
                                        <span className="text-xs text-gray-400 italic pr-2">ตัวคุณเอง</span>
                                    ) : (
                                        <>
                                            <button onClick={() => handleStartEdit(user)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                                            <button 
                                                onClick={() => onToggleStatus(user.id, user.isActive)}
                                                className={`p-2 rounded-lg transition-all border ${user.isActive ? 'bg-white text-gray-400 border-gray-200 hover:text-red-500 hover:border-red-100 hover:bg-red-50' : 'bg-green-600 text-white border-green-600 hover:bg-green-700'}`}
                                                title={user.isActive ? 'สั่งพักงาน' : 'เปิดใช้งาน'}
                                            >
                                                <Power className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => onRemoveMember(user.id)} className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="ลบออกจากทีม"><UserX className="w-4 h-4" /></button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                    <p className="text-[10px] text-gray-400">
                        Admin สามารถเปลี่ยน Role สมาชิกคนอื่นให้เป็น Admin ได้ เพื่อช่วยกันจัดการระบบ
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MemberManagementModal;
