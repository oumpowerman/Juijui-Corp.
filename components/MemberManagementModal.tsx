
import React, { useState } from 'react';
import { User, Role } from '../types';
import { X, Search, Briefcase, Phone, Trash2, Power, Check, Edit2, Loader2 } from 'lucide-react';

interface MemberManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    currentUser: User;
    onToggleStatus: (userId: string, currentStatus: boolean) => Promise<void>;
    onRemoveMember: (userId: string) => Promise<void>;
    onUpdateMember: (userId: string, updates: { name?: string, position?: string, role?: Role }) => Promise<boolean>;
}

const MemberManagementModal: React.FC<MemberManagementModalProps> = ({ 
    isOpen, onClose, users, currentUser, onToggleStatus, onRemoveMember, onUpdateMember 
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ name: string, position: string, role: Role }>({ name: '', position: '', role: 'MEMBER' });
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">จัดการสมาชิกทีม (Members)</h3>
                        <p className="text-xs text-gray-500">จัดการบทบาทและสิทธิ์การเข้าใช้งาน</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 bg-white border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="ค้นหาสมาชิก..." 
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-y-auto flex-1 p-4 space-y-3 bg-gray-50">
                    {filteredUsers.map(user => (
                        <div key={user.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-4 transition-all hover:border-indigo-200">
                            <div className="relative shrink-0">
                                <img src={user.avatarUrl} className={`w-12 h-12 rounded-full object-cover border-2 ${user.isActive ? 'border-green-400' : 'border-gray-300 grayscale'}`} alt={user.name} />
                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${user.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            </div>

                            <div className="flex-1 w-full">
                                {editingUser === user.id ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                                        <input 
                                            value={editForm.name} 
                                            onChange={e => setEditForm({...editForm, name: e.target.value})}
                                            className="px-3 py-2 border rounded-lg text-sm"
                                            placeholder="ชื่อ"
                                        />
                                        <input 
                                            value={editForm.position} 
                                            onChange={e => setEditForm({...editForm, position: e.target.value})}
                                            className="px-3 py-2 border rounded-lg text-sm"
                                            placeholder="ตำแหน่ง"
                                        />
                                        <select 
                                            value={editForm.role}
                                            onChange={e => setEditForm({...editForm, role: e.target.value as Role})}
                                            className="px-3 py-2 border rounded-lg text-sm"
                                        >
                                            <option value="MEMBER">Member</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                    </div>
                                ) : (
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <h4 className={`font-bold ${user.isActive ? 'text-gray-800' : 'text-gray-400'}`}>{user.name}</h4>
                                            {user.role === 'ADMIN' && <span className="bg-yellow-100 text-yellow-700 text-[10px] px-1.5 py-0.5 rounded font-bold border border-yellow-200">ADMIN</span>}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                            <span className="flex items-center"><Briefcase className="w-3 h-3 mr-1"/> {user.position}</span>
                                            <span className="flex items-center"><Phone className="w-3 h-3 mr-1"/> {user.phoneNumber || '-'}</span>
                                        </div>
                                        <div className="text-[10px] text-gray-400 mt-1">{user.email}</div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 border-gray-100 pt-3 md:pt-0 mt-2 md:mt-0">
                                {editingUser === user.id ? (
                                    <>
                                        <button onClick={() => setEditingUser(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg text-xs">ยกเลิก</button>
                                        <button onClick={() => handleSave(user.id)} disabled={isSaving} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center">
                                            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Check className="w-3 h-3 mr-1" /> บันทึก</>}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => handleEditClick(user)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="แก้ไข">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        
                                        <button 
                                            onClick={() => onToggleStatus(user.id, user.isActive)} 
                                            className={`p-2 rounded-lg transition-colors ${user.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                                            title={user.isActive ? 'Suspend User' : 'Activate User'}
                                        >
                                            <Power className="w-4 h-4" />
                                        </button>

                                        {currentUser.id !== user.id && (
                                            <button onClick={() => onRemoveMember(user.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="ลบสมาชิก">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MemberManagementModal;
