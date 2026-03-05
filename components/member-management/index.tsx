import React, { useState, useMemo } from 'react';
import { User, Role, MasterOption, Task } from '../../types';
import { X, Users, Loader2, Briefcase } from 'lucide-react';
import { useGamification } from '../../hooks/useGamification';
import { useToast } from '../../context/ToastContext';
import { useGlobalDialog } from '../../context/GlobalDialogContext';

// Sub-components
import { MemberStats } from './MemberStats';
import { MemberFilters } from './MemberFilters';
import { MemberItemContainer } from './MemberItem/MemberItemContainer';
import { MemberViewMode } from './MemberItem/MemberViewMode';
import { MemberEditForm } from './MemberItem/MemberEditForm';
import { GameMasterForm } from './MemberItem/GameMasterForm';
import { TabType } from './constants';

interface MemberManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    currentUser: User;
    masterOptions: MasterOption[]; 
    tasks?: Task[];
    onToggleStatus: (userId: string, currentStatus: boolean) => Promise<void>;
    onRemoveMember: (userId: string) => Promise<void>;
    onUpdateMember: (userId: string, updates: any) => Promise<boolean>;
    onAdjustStats?: (userId: string, adjustments: { hp?: number, xp?: number, points?: number }) => void;
}

const MemberManagementModal: React.FC<MemberManagementModalProps> = ({ 
    isOpen, onClose, users, currentUser, masterOptions, tasks = [], onToggleStatus, onRemoveMember, onUpdateMember, onAdjustStats 
}) => {
    const { showAlert } = useGlobalDialog();
    const { showToast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentTab, setCurrentTab] = useState<TabType>('ACTIVE');
    const [editingUser, setEditingUser] = useState<string | null>(null);
    
    // Advanced Filter States
    const [selectedPosition, setSelectedPosition] = useState('ALL');
    const [selectedRole, setSelectedRole] = useState<Role | 'ALL'>('ALL');
    const [payrollFilter, setPayrollFilter] = useState<'ALL' | 'READY' | 'NOT_READY'>('ALL');
    const [workloadFilter, setWorkloadFilter] = useState<'ALL' | 'HIGH' | 'LOW'>('ALL');

    // Form States
    const [editForm, setEditForm] = useState({ 
        name: '', 
        position: '', 
        role: 'MEMBER' as Role,
        baseSalary: 0,
        bankAccount: '',
        bankName: '',
        ssoIncluded: true,
        taxType: 'WHT_3',
        workDays: [1, 2, 3, 4, 5] as number[]
    });

    const [isSaving, setIsSaving] = useState(false);
    const [adjustForm, setAdjustForm] = useState({ hp: 0, xp: 0, points: 0, reason: '' });
    const [selectedGmUser, setSelectedGmUser] = useState<User | null>(null);
    
    const { adminAdjustStats } = useGamification(currentUser);

    // Derived Data
    const positionOptions = useMemo(() => 
        masterOptions
            .filter(o => o.type === 'POSITION' && o.isActive)
            .sort((a,b) => a.sortOrder - b.sortOrder)
    , [masterOptions]);

    const stats = useMemo(() => ({
        active: users.filter(u => u.isActive).length,
        inactive: users.filter(u => !u.isActive).length,
        admin: users.filter(u => u.role === 'ADMIN').length
    }), [users]);

    const getActiveTaskCount = (userId: string) => {
        return tasks.filter(t => 
            (t.assigneeIds.includes(userId) || t.ideaOwnerIds?.includes(userId) || t.editorIds?.includes(userId)) &&
            t.status !== 'DONE' && t.status !== 'CANCELLED'
        ).length;
    };

    const filteredUsers = useMemo(() => {
        return users
            .filter(u => {
                // 1. Tab Match
                if (currentTab === 'GAME_MASTER') {
                    if (!u.isActive) return false;
                } else {
                    const statusMatch = currentTab === 'ACTIVE' ? u.isActive : !u.isActive;
                    if (!statusMatch) return false;
                }

                // 2. Search Match
                const searchLower = searchQuery.toLowerCase();
                const searchMatch = u.name.toLowerCase().includes(searchLower) || 
                                    u.email.toLowerCase().includes(searchLower) ||
                                    (u.position || '').toLowerCase().includes(searchLower);
                if (!searchMatch) return false;

                // 3. Position Match
                if (selectedPosition !== 'ALL' && u.position !== selectedPosition) return false;

                // 4. Role Match
                if (selectedRole !== 'ALL' && u.role !== selectedRole) return false;

                // 5. Payroll Match
                if (payrollFilter !== 'ALL') {
                    const isReady = !!(u.bankAccount && u.bankName && u.baseSalary);
                    if (payrollFilter === 'READY' && !isReady) return false;
                    if (payrollFilter === 'NOT_READY' && isReady) return false;
                }

                // 6. Workload Match
                if (workloadFilter !== 'ALL') {
                    const taskCount = getActiveTaskCount(u.id);
                    if (workloadFilter === 'HIGH' && taskCount < 3) return false;
                    if (workloadFilter === 'LOW' && taskCount >= 3) return false;
                }

                return true;
            })
            .sort((a, b) => {
                if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1;
                if (a.role !== 'ADMIN' && b.role === 'ADMIN') return 1;
                return a.name.localeCompare(b.name);
            });
    }, [users, currentTab, searchQuery, selectedPosition, selectedRole, payrollFilter, workloadFilter, tasks]);

    const groupedUsers = useMemo(() => {
        const groups: Record<string, User[]> = {};
        
        filteredUsers.forEach(user => {
            const pos = user.position || 'ไม่มีตำแหน่ง';
            if (!groups[pos]) groups[pos] = [];
            groups[pos].push(user);
        });

        // Sort groups by positionOptions order if possible
        const sortedGroups: Record<string, User[]> = {};
        
        // Add positions from options first to maintain order
        positionOptions.forEach(opt => {
            if (groups[opt.label]) {
                sortedGroups[opt.label] = groups[opt.label];
                delete groups[opt.label];
            }
        });

        // Add remaining groups (like 'ไม่มีตำแหน่ง')
        Object.assign(sortedGroups, groups);

        return sortedGroups;
    }, [filteredUsers, positionOptions]);

    // Handlers
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
            taxType: user.taxType || 'WHT_3',
            workDays: user.workDays || [1, 2, 3, 4, 5]
        });
    };
    
    const toggleWorkDay = (dayNum: number) => {
        setEditForm(prev => {
            const currentDays = prev.workDays;
            if (currentDays.includes(dayNum)) {
                return { ...prev, workDays: currentDays.filter(d => d !== dayNum) };
            } else {
                return { ...prev, workDays: [...currentDays, dayNum] };
            }
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
            showAlert("กรุณาระบุเหตุผลในการปรับค่าด้วยครับ (เพื่อบันทึก Log)", "ต้องการเหตุผล");
            return;
        }

        const hp = Number(adjustForm.hp);
        const xp = Number(adjustForm.xp);
        const points = Number(adjustForm.points);

        // 1. Optimistic UI Update (Immediate feedback for GM)
        if (onAdjustStats) {
            onAdjustStats(selectedGmUser.id, { hp, xp, points });
        }

        setIsSaving(true);
        try {
            const promises = [];
            if (hp !== 0) promises.push(adminAdjustStats(selectedGmUser.id, 'HP', hp, adjustForm.reason));
            if (xp !== 0) promises.push(adminAdjustStats(selectedGmUser.id, 'XP', xp, adjustForm.reason));
            if (points !== 0) promises.push(adminAdjustStats(selectedGmUser.id, 'COINS', points, adjustForm.reason));
            
            const results = await Promise.all(promises);
            const failed = results.find(r => !r?.success);
            
            if (failed) {
                showToast('การปรับค่าบางรายการล้มเหลว กรุณาลองใหม่', 'error');
            } else {
                showToast('ปรับค่า Stats สำเร็จ! ข้อมูลจะซิงค์ไปยังทุกคนในทีม', 'success');
            }
        } catch (error) {
            console.error("GM Save Error:", error);
            showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
        } finally {
            setIsSaving(false);
            setSelectedGmUser(null);
            setAdjustForm({ hp: 0, xp: 0, points: 0, reason: '' });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-7xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-[85vh] animate-in zoom-in-95 border-4 border-indigo-50">
                
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

                <MemberStats 
                    users={users} 
                    activeCount={stats.active} 
                    adminCount={stats.admin} 
                />

                <MemberFilters 
                    currentTab={currentTab}
                    setCurrentTab={setCurrentTab}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    activeCount={stats.active}
                    inactiveCount={stats.inactive}
                    currentUser={currentUser}
                    onTabChange={() => setSelectedGmUser(null)}
                    // Advanced Filters
                    positionOptions={positionOptions}
                    selectedPosition={selectedPosition}
                    setSelectedPosition={setSelectedPosition}
                    selectedRole={selectedRole}
                    setSelectedRole={setSelectedRole}
                    payrollFilter={payrollFilter}
                    setPayrollFilter={setPayrollFilter}
                    workloadFilter={workloadFilter}
                    setWorkloadFilter={setWorkloadFilter}
                />

                {/* Users List */}
                <div className="overflow-y-auto flex-1 p-6 bg-gray-50/50">
                    <div className="space-y-10">
                        {Object.keys(groupedUsers).length === 0 ? (
                            <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl">
                                <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p className="font-bold">ไม่พบรายชื่อในหมวดนี้</p>
                                <p className="text-xs">ลองเปลี่ยนคำค้นหา หรือสลับ Tab ดูนะครับ</p>
                            </div>
                        ) : (
                            Object.entries(groupedUsers).map(([position, groupUsers]) => (
                                <div key={position} className="space-y-5">
                                    {currentTab !== 'GAME_MASTER' && (
                                        <div className="flex items-center justify-between px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-gray-100">
                                                    <Briefcase className="w-5 h-5 text-indigo-500" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-gray-800 tracking-tight">
                                                        {position}
                                                    </h4>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                        {groupUsers.length} {groupUsers.length > 1 ? 'Members' : 'Member'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent ml-6"></div>
                                        </div>
                                    )}
                                    
                                    <div className="grid grid-cols-1 gap-4">
                                        {groupUsers.map(user => (
                                            <MemberItemContainer key={user.id} user={user}>
                                                {editingUser === user.id && currentTab !== 'GAME_MASTER' ? (
                                                    <MemberEditForm 
                                                        user={user}
                                                        editForm={editForm}
                                                        setEditForm={setEditForm}
                                                        positionOptions={positionOptions}
                                                        isSaving={isSaving}
                                                        onCancel={() => setEditingUser(null)}
                                                        onSave={handleSave}
                                                        toggleWorkDay={toggleWorkDay}
                                                    />
                                                ) : selectedGmUser?.id === user.id && currentTab === 'GAME_MASTER' ? (
                                                    <GameMasterForm 
                                                        user={user}
                                                        adjustForm={adjustForm}
                                                        setAdjustForm={setAdjustForm}
                                                        isSaving={isSaving}
                                                        onCancel={() => setSelectedGmUser(null)}
                                                        onSave={handleGmSave}
                                                    />
                                                ) : (
                                                    <MemberViewMode 
                                                        user={user}
                                                        currentTab={currentTab}
                                                        taskCount={getActiveTaskCount(user.id)}
                                                        currentUser={currentUser}
                                                        onEditClick={handleEditClick}
                                                        onToggleStatus={onToggleStatus}
                                                        onRemoveMember={onRemoveMember}
                                                        onGmAdjustClick={(u) => {
                                                            setSelectedGmUser(u);
                                                            setAdjustForm({ hp: 0, xp: 0, points: 0, reason: '' });
                                                        }}
                                                    />
                                                )}
                                            </MemberItemContainer>
                                        ))}
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
