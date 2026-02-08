
import React, { useState, useMemo, useEffect } from 'react';
import { User, Role, MasterOption, Task } from '../types';
import { X, Search, Briefcase, Phone, Trash2, Power, Check, Edit2, Loader2, Users, Shield, UserX, Ban, Trophy, Heart, Coins, Gavel, DollarSign, CreditCard, Layers, AlertCircle } from 'lucide-react';
import { useGamification } from '../hooks/useGamification';

interface MemberManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    currentUser: User;
    masterOptions: MasterOption[]; 
    tasks?: Task[]; // Added tasks prop for Workload visibility
    onToggleStatus: (userId: string, currentStatus: boolean) => Promise<void>;
    onRemoveMember: (userId: string) => Promise<void>;
    onUpdateMember: (userId: string, updates: any) => Promise<boolean>;
}

type TabType = 'ACTIVE' | 'INACTIVE' | 'GAME_MASTER';

const MemberManagementModal: React.FC<MemberManagementModalProps> = ({ 
    isOpen, onClose, users, currentUser, masterOptions, tasks = [], onToggleStatus, onRemoveMember, onUpdateMember 
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentTab, setCurrentTab] = useState<TabType>('ACTIVE');
    const [editingUser, setEditingUser] = useState<string | null>(null);
    
    // Extended Form State
    const [editForm, setEditForm] = useState({ 
        name: '', 
        position: '', 
        role: 'MEMBER' as Role,
        // Payroll
        baseSalary: 0,
        bankAccount: '',
        bankName: '',
        ssoIncluded: true,
        taxType: 'WHT_3'
    });

    const [isSaving, setIsSaving] = useState(false);
    
    // Game Master State
    const [adjustForm, setAdjustForm] = useState<{ hp: number, xp: number, points: number, reason: string }>({ hp: 0, xp: 0, points: 0, reason: '' });
    const [selectedGmUser, setSelectedGmUser] = useState<User | null>(null);
    
    const { adminAdjustStats } = useGamification(currentUser);

    // Get Positions from Master Options
    const positionOptions = masterOptions
        .filter(o => o.type === 'POSITION' && o.isActive)
        .sort((a,b) => a.sortOrder - b.sortOrder);

    // Stats
    const activeCount = users.filter(u => u.isActive).length;
    const inactiveCount = users.filter(u => !u.isActive).length;
    const adminCount = users.filter(u => u.role === 'ADMIN').length;

    // Filter Logic
    const filteredUsers = useMemo(() => {
        return users
            .filter(u => {
                if (currentTab === 'GAME_MASTER') return u.isActive;
                const statusMatch = currentTab === 'ACTIVE' ? u.isActive : !u.isActive;
                const searchLower = searchQuery.toLowerCase();
                const searchMatch = u.name.toLowerCase().includes(searchLower) || 
                                    u.email.toLowerCase().includes(searchLower) ||
                                    (u.position || '').toLowerCase().includes(searchLower);
                return statusMatch && searchMatch;
            })
            .sort((a, b) => {
                if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1;
                if (a.role !== 'ADMIN' && b.role === 'ADMIN') return 1;
                return a.name.localeCompare(b.name);
            });
    }, [users, currentTab, searchQuery]);

    // Helper: Count Active Tasks
    const getActiveTaskCount = (userId: string) => {
        return tasks.filter(t => 
            (t.assigneeIds.includes(userId) || t.ideaOwnerIds?.includes(userId) || t.editorIds?.includes(userId)) &&
            t.status !== 'DONE' && t.status !== 'CANCELLED'
        ).length;
    };

    const handleEditClick = (user: User) => {
        setEditingUser(user.id);
        setEditForm({ 
            name: user.name, 
            position: user.position, 
            role: user.role,
            baseSalary: user.baseSalary || 0,
            bankAccount: user.bankAccount || '',
            bankName: user.bankName || '',
            ssoIncluded: user.ssoIncluded ?? true,
            taxType: user.taxType || 'WHT_3'
        });
    };

    const handleSave = async (userId: string) => {
        setIsSaving(true);
        await onUpdateMember(userId, editForm);
        setIsSaving(false);
        setEditingUser(null);
    };

    const handleGmSave = async () => {
        if (!selectedGmUser) return;
        if (!adjustForm.reason.trim()) {
            alert("กรุณาระบุเหตุผลในการปรับค่าด้วยครับ (เพื่อบันทึก Log)");
            return;
        }
        setIsSaving(true);
        const success = await adminAdjustStats(selectedGmUser.id, {
            hp: Number(adjustForm.hp),
            xp: Number(adjustForm.xp),
            points: Number(adjustForm.points)
        }, adjustForm.reason);
        setIsSaving(false);
        if (success) {
            setSelectedGmUser(null);
            setAdjustForm({ hp: 0, xp: 0, points: 0, reason: '' });
        }
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
                        <p className="text-sm text-gray-500 mt-1 ml-1">จัดการสิทธิ์ บทบาท ข้อมูลเงินเดือน และดูภาระงาน</p>
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

                {/* Controls */}
                <div className="px-8 py-4 flex flex-col md:flex-row gap-4 items-center justify-between bg-white shrink-0 border-b border-gray-100">
                    <div className="flex p-1 bg-gray-100 rounded-xl w-full md:w-auto">
                        <button 
                            onClick={() => { setCurrentTab('ACTIVE'); setSelectedGmUser(null); }}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${currentTab === 'ACTIVE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Users className="w-4 h-4" /> Active ({activeCount})
                        </button>
                        <button 
                            onClick={() => { setCurrentTab('INACTIVE'); setSelectedGmUser(null); }}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${currentTab === 'INACTIVE' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <UserX className="w-4 h-4" /> Inactive ({inactiveCount})
                        </button>
                        {currentUser.role === 'ADMIN' && (
                            <button 
                                onClick={() => { setCurrentTab('GAME_MASTER'); setSelectedGmUser(null); }}
                                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${currentTab === 'GAME_MASTER' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Gavel className="w-4 h-4" /> Game Master
                            </button>
                        )}
                    </div>

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
                            filteredUsers.map(user => {
                                const taskCount = getActiveTaskCount(user.id);
                                const isPayrollReady = user.baseSalary > 0 && user.bankAccount;

                                return (
                                <div key={user.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start gap-5 transition-all hover:border-indigo-200 hover:shadow-md group">
                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        <img src={user.avatarUrl} className={`w-14 h-14 rounded-full object-cover border-4 ${user.isActive ? 'border-green-100' : 'border-gray-100 grayscale'}`} alt={user.name} />
                                    </div>

                                    {/* Info & Form */}
                                    <div className="flex-1 w-full">
                                        {/* EDIT MODE */}
                                        {editingUser === user.id && currentTab !== 'GAME_MASTER' ? (
                                            <div className="grid grid-cols-1 gap-4 animate-in fade-in">
                                                {/* Basic Info */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">ชื่อเรียก</label>
                                                        <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:border-indigo-500 outline-none font-bold" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">ตำแหน่ง</label>
                                                        <select 
                                                            value={editForm.position} 
                                                            onChange={e => setEditForm({...editForm, position: e.target.value})} 
                                                            className="w-full px-3 py-2 border rounded-lg text-sm focus:border-indigo-500 outline-none cursor-pointer"
                                                        >
                                                            {positionOptions.map(p => (
                                                                <option key={p.key} value={p.label}>{p.label}</option>
                                                            ))}
                                                            {/* Fallback if current position not in options */}
                                                            {!positionOptions.find(p => p.label === editForm.position) && editForm.position && (
                                                                <option value={editForm.position}>{editForm.position}</option>
                                                            )}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">สิทธิ์ (Role)</label>
                                                        <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value as Role})} className="w-full px-3 py-2 border rounded-lg text-sm focus:border-indigo-500 outline-none bg-white font-bold">
                                                            <option value="MEMBER">Member</option>
                                                            <option value="ADMIN">Admin</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                
                                                {/* Payroll Info (New) */}
                                                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                                    <h5 className="text-xs font-bold text-indigo-700 uppercase mb-3 flex items-center">
                                                        <DollarSign className="w-3 h-3 mr-1" /> ข้อมูลการเงิน (Payroll Info)
                                                    </h5>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                        <div className="col-span-2 md:col-span-1">
                                                            <label className="text-[9px] font-bold text-indigo-400 block mb-1">ฐานเงินเดือน</label>
                                                            <input type="number" value={editForm.baseSalary} onChange={e => setEditForm({...editForm, baseSalary: Number(e.target.value)})} className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm font-bold text-indigo-900" />
                                                        </div>
                                                        <div className="col-span-2 md:col-span-1">
                                                            <label className="text-[9px] font-bold text-indigo-400 block mb-1">ธนาคาร</label>
                                                            <input type="text" value={editForm.bankName} onChange={e => setEditForm({...editForm, bankName: e.target.value})} className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm" placeholder="KBank, SCB" />
                                                        </div>
                                                        <div className="col-span-2 md:col-span-1">
                                                            <label className="text-[9px] font-bold text-indigo-400 block mb-1">เลขบัญชี</label>
                                                            <input type="text" value={editForm.bankAccount} onChange={e => setEditForm({...editForm, bankAccount: e.target.value})} className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm font-mono" placeholder="xxx-x-xxxxx-x" />
                                                        </div>
                                                        <div className="col-span-2 md:col-span-1 flex flex-col justify-end">
                                                             <label className="flex items-center gap-2 cursor-pointer mb-2">
                                                                <input type="checkbox" checked={editForm.ssoIncluded} onChange={e => setEditForm({...editForm, ssoIncluded: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                                                <span className="text-xs text-gray-600">หักประกันสังคม (750)</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-end gap-2 mt-2">
                                                    <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl text-xs font-bold transition-colors">ยกเลิก</button>
                                                    <button onClick={() => handleSave(user.id)} disabled={isSaving} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 flex items-center shadow-lg shadow-indigo-200 transition-all active:scale-95">
                                                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />} บันทึก
                                                    </button>
                                                </div>
                                            </div>
                                        ) : selectedGmUser?.id === user.id && currentTab === 'GAME_MASTER' ? (
                                            // GM EDIT MODE
                                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 animate-in fade-in zoom-in-95">
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-xs font-bold text-purple-700 flex items-center gap-2">
                                                        <Gavel className="w-4 h-4"/> ปรับค่า Stats ของ {user.name}
                                                    </span>
                                                    <button onClick={() => setSelectedGmUser(null)} className="text-gray-400 hover:text-gray-600 bg-white rounded-full p-1"><X className="w-4 h-4"/></button>
                                                </div>
                                                <div className="grid grid-cols-3 gap-3 mb-3">
                                                    <div><label className="text-[9px] font-bold text-gray-500 flex items-center mb-1"><Heart className="w-3 h-3 mr-1 text-red-400"/> HP (+/-)</label><input type="number" className="w-full text-xs p-2 rounded-lg border border-purple-200 bg-white font-bold" value={adjustForm.hp} onChange={e => setAdjustForm({...adjustForm, hp: Number(e.target.value)})} /></div>
                                                    <div><label className="text-[9px] font-bold text-gray-500 flex items-center mb-1"><Trophy className="w-3 h-3 mr-1 text-yellow-400"/> XP (+/-)</label><input type="number" className="w-full text-xs p-2 rounded-lg border border-purple-200 bg-white font-bold" value={adjustForm.xp} onChange={e => setAdjustForm({...adjustForm, xp: Number(e.target.value)})} /></div>
                                                    <div><label className="text-[9px] font-bold text-gray-500 flex items-center mb-1"><Coins className="w-3 h-3 mr-1 text-yellow-600"/> Coin (+/-)</label><input type="number" className="w-full text-xs p-2 rounded-lg border border-purple-200 bg-white font-bold" value={adjustForm.points} onChange={e => setAdjustForm({...adjustForm, points: Number(e.target.value)})} /></div>
                                                </div>
                                                <div className="mb-3"><label className="text-[9px] font-bold text-gray-500 mb-1 block">เหตุผล</label><input type="text" className="w-full text-xs p-2 rounded-lg border border-purple-200 bg-white" placeholder="เช่น ชดเชยระบบรวน..." value={adjustForm.reason} onChange={e => setAdjustForm({...adjustForm, reason: e.target.value})} /></div>
                                                <button onClick={handleGmSave} disabled={isSaving} className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center shadow-md transition-all active:scale-95 disabled:opacity-70">{isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4 mr-1"/>} ยืนยันการปรับค่า</button>
                                            </div>
                                        ) : (
                                            // VIEW MODE
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className={`text-base font-bold ${user.isActive ? 'text-gray-800' : 'text-gray-500'}`}>{user.name}</h4>
                                                        {user.role === 'ADMIN' && <span className="bg-yellow-100 text-yellow-700 text-[9px] px-2 py-0.5 rounded-full font-bold border border-yellow-200 uppercase">ADMIN</span>}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                                        <span className="flex items-center bg-gray-50 px-2 py-1 rounded-lg border border-gray-100"><Briefcase className="w-3 h-3 mr-1.5"/> {user.position || 'No Position'}</span>
                                                        
                                                        {/* Salary Check & Workload (New) */}
                                                        {user.baseSalary > 0 ? (
                                                            <span className="flex items-center text-green-600" title="ข้อมูลเงินเดือนพร้อม"><Check className="w-3 h-3 mr-1"/> Payroll Ready</span>
                                                        ) : (
                                                            <span className="flex items-center text-orange-400" title="ยังไม่ระบุเงินเดือน"><AlertCircle className="w-3 h-3 mr-1"/> No Salary</span>
                                                        )}
                                                        
                                                        {/* Workload Badge (New) */}
                                                        <span className={`flex items-center px-2 py-1 rounded-lg border ${taskCount > 5 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                            <Layers className="w-3 h-3 mr-1.5" />
                                                            {taskCount} Active Tasks
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2">
                                                    {currentTab === 'GAME_MASTER' ? (
                                                         selectedGmUser?.id !== user.id && (
                                                             <button onClick={() => { setSelectedGmUser(user); setAdjustForm({ hp: 0, xp: 0, points: 0, reason: '' }); }} className="px-4 py-2 bg-purple-50 text-purple-600 rounded-xl text-xs font-bold hover:bg-purple-100 transition-all flex items-center"><Gavel className="w-4 h-4 mr-1.5"/> Adjust</button>
                                                         )
                                                    ) : (
                                                        <>
                                                            <button onClick={() => handleEditClick(user)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="แก้ไขข้อมูล"><Edit2 className="w-4 h-4" /></button>
                                                            <button onClick={() => onToggleStatus(user.id, user.isActive)} className={`p-2 rounded-xl transition-all ${user.isActive ? 'text-gray-400 hover:text-orange-500 hover:bg-orange-50' : 'text-green-600 bg-green-50 hover:bg-green-100'}`}><Power className="w-4 h-4" /></button>
                                                            {currentUser.id !== user.id && <button onClick={() => onRemoveMember(user.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )})
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemberManagementModal;
