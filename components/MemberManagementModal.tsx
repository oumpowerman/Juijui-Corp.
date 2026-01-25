
import React, { useState, useMemo } from 'react';
import { User, Role } from '../types';
import { X, Search, Briefcase, Phone, Trash2, Power, Check, Edit2, Loader2, Users, Shield, UserX, Ban } from 'lucide-react';

interface MemberManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    currentUser: User;
    onToggleStatus: (userId: string, currentStatus: boolean) => Promise<void>;
    onRemoveMember: (userId: string) => Promise<void>;
    onUpdateMember: (userId: string, updates: { name?: string, position?: string, role?: Role }) => Promise<boolean>;
}

type TabType = 'ACTIVE' | 'INACTIVE';

const MemberManagementModal: React.FC<MemberManagementModalProps> = ({ 
    isOpen, onClose, users, currentUser, onToggleStatus, onRemoveMember, onUpdateMember 
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentTab, setCurrentTab] = useState<TabType>('ACTIVE');
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ name: string, position: string, role: Role }>({ name: '', position: '', role: 'MEMBER' });
    const [isSaving, setIsSaving] = useState(false);

    // --- Stats Calculation ---
    const activeCount = users.filter(u => u.isActive).length;
    const inactiveCount = users.filter(u => !u.isActive).length;
    const adminCount = users.filter(u => u.role === 'ADMIN').length;

    // --- Filter Logic ---
    const filteredUsers = useMemo(() => {
        return users
            .filter(u => {
                // 1. Tab Filter
                const statusMatch = currentTab === 'ACTIVE' ? u.isActive : !u.isActive;
                // 2. Search Filter
                const searchLower = searchQuery.toLowerCase();
                const searchMatch = u.name.toLowerCase().includes(searchLower) || 
                                    u.email.toLowerCase().includes(searchLower) ||
                                    (u.position || '').toLowerCase().includes(searchLower);
                return statusMatch && searchMatch;
            })
            .sort((a, b) => {
                // Sort Admins first, then Alphabetical
                if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1;
                if (a.role !== 'ADMIN' && b.role === 'ADMIN') return 1;
                return a.name.localeCompare(b.name);
            });
    }, [users, currentTab, searchQuery]);

    const handleEditClick = (user: User) => {
        setEditingUser(user.id);
        setEditForm({ name: user.name, position: user.position, role: user.role });
    };

    const handleSave = async (userId: string) => {
        setIsSaving(true);
        await onUpdateMember(userId, editForm);
        setIsSaving(false);
        setEditingUser(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-[85vh] animate-in zoom-in-95 border-4 border-indigo-50">
                
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 bg-white shrink-0 flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                            <Users className="w-8 h-8 text-indigo-600 bg-indigo-50 p-1.5 rounded-xl" /> 
                            ศูนย์บัญชาการบุคคล (Personnel)
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 ml-1">จัดการสิทธิ์ บทบาท และสถานะของสมาชิกในทีม</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Dashboard Stats */}
                <div className="px-8 py-4 bg-gray-50/50 border-b border-gray-100 grid grid-cols-3 gap-4 shrink-0">
                    <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">{users.length}</div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Total Members</p>
                            <p className="text-sm font-bold text-gray-700">สมาชิกทั้งหมด</p>
                        </div>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-black">{activeCount}</div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Active</p>
                            <p className="text-sm font-bold text-gray-700">พร้อมทำงาน</p>
                        </div>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center font-black">{adminCount}</div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Admins</p>
                            <p className="text-sm font-bold text-gray-700">ผู้ดูแลระบบ</p>
                        </div>
                    </div>
                </div>

                {/* Controls: Search & Tabs */}
                <div className="px-8 py-4 flex flex-col md:flex-row gap-4 items-center justify-between bg-white shrink-0 border-b border-gray-100">
                    {/* Tab Switcher */}
                    <div className="flex p-1 bg-gray-100 rounded-xl w-full md:w-auto">
                        <button 
                            onClick={() => setCurrentTab('ACTIVE')}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${currentTab === 'ACTIVE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Users className="w-4 h-4" /> Active ({activeCount})
                        </button>
                        <button 
                            onClick={() => setCurrentTab('INACTIVE')}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${currentTab === 'INACTIVE' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <UserX className="w-4 h-4" /> Inactive ({inactiveCount})
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-72 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="ค้นหาชื่อ, อีเมล, ตำแหน่ง..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:bg-white focus:border-indigo-400 outline-none transition-all"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Users List */}
                <div className="overflow-y-auto flex-1 p-6 bg-gray-50/50">
                    <div className="space-y-3">
                        {filteredUsers.length === 0 ? (
                            <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl">
                                <Ban className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p className="font-bold">ไม่พบรายชื่อในหมวดนี้</p>
                                <p className="text-xs">ลองเปลี่ยนคำค้นหา หรือสลับ Tab ดูนะครับ</p>
                            </div>
                        ) : (
                            filteredUsers.map(user => (
                                <div key={user.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-5 transition-all hover:border-indigo-200 hover:shadow-md group">
                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        <img src={user.avatarUrl} className={`w-14 h-14 rounded-full object-cover border-4 ${user.isActive ? 'border-green-100' : 'border-gray-100 grayscale'}`} alt={user.name} />
                                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white flex items-center justify-center ${user.isActive ? 'bg-green-500' : 'bg-gray-400'}`}>
                                            {user.role === 'ADMIN' && <Shield className="w-3 h-3 text-white fill-white" />}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 text-center md:text-left w-full">
                                        {editingUser === user.id ? (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-in fade-in">
                                                <div>
                                                    <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">ชื่อเรียก</label>
                                                    <input 
                                                        value={editForm.name} 
                                                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                                                        className="w-full px-3 py-2 border rounded-lg text-sm focus:border-indigo-500 outline-none font-bold"
                                                        placeholder="ชื่อ"
                                                        autoFocus
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">ตำแหน่ง</label>
                                                    <input 
                                                        value={editForm.position} 
                                                        onChange={e => setEditForm({...editForm, position: e.target.value})}
                                                        className="w-full px-3 py-2 border rounded-lg text-sm focus:border-indigo-500 outline-none"
                                                        placeholder="ตำแหน่ง"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">สิทธิ์ (Role)</label>
                                                    <select 
                                                        value={editForm.role}
                                                        onChange={e => setEditForm({...editForm, role: e.target.value as Role})}
                                                        className="w-full px-3 py-2 border rounded-lg text-sm focus:border-indigo-500 outline-none bg-white font-bold"
                                                    >
                                                        <option value="MEMBER">Member</option>
                                                        <option value="ADMIN">Admin</option>
                                                    </select>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                                    <h4 className={`text-base font-bold ${user.isActive ? 'text-gray-800' : 'text-gray-500'}`}>{user.name}</h4>
                                                    {user.role === 'ADMIN' && (
                                                        <span className="bg-yellow-100 text-yellow-700 text-[9px] px-2 py-0.5 rounded-full font-bold border border-yellow-200 uppercase tracking-wide">ADMIN</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-gray-500">
                                                    <span className="flex items-center bg-gray-50 px-2 py-1 rounded-lg border border-gray-100"><Briefcase className="w-3 h-3 mr-1.5"/> {user.position || 'No Position'}</span>
                                                    <span className="flex items-center"><Phone className="w-3 h-3 mr-1.5"/> {user.phoneNumber || '-'}</span>
                                                    <span className="hidden md:inline text-gray-300">|</span>
                                                    <span>{user.email}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 border-gray-100 pt-3 md:pt-0 w-full md:w-auto justify-end">
                                        {editingUser === user.id ? (
                                            <>
                                                <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl text-xs font-bold transition-colors">ยกเลิก</button>
                                                <button onClick={() => handleSave(user.id)} disabled={isSaving} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 flex items-center shadow-lg shadow-indigo-200 transition-all active:scale-95">
                                                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />} บันทึก
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => handleEditClick(user)} className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="แก้ไขข้อมูล">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                
                                                <button 
                                                    onClick={() => onToggleStatus(user.id, user.isActive)} 
                                                    className={`p-2.5 rounded-xl transition-all ${user.isActive ? 'text-gray-400 hover:text-orange-500 hover:bg-orange-50' : 'text-green-600 bg-green-50 hover:bg-green-100 shadow-sm'}`}
                                                    title={user.isActive ? 'พักงาน (Suspend)' : 'เปิดใช้งาน (Activate)'}
                                                >
                                                    <Power className="w-4 h-4" />
                                                </button>

                                                {currentUser.id !== user.id && (
                                                    <button 
                                                        onClick={() => onRemoveMember(user.id)} 
                                                        className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100" 
                                                        title="ลบออกจากทีมถาวร"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemberManagementModal;
