import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Check, Users, Briefcase, Building2 } from 'lucide-react';
import { User, Company } from '../../types';

export interface AttendeeSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    selectedIds: string[];
    onConfirm: (newSelectedIds: string[]) => void;
    // Optional Customization Props
    title?: string;
    subtitle?: string;
    icon?: React.ReactNode;
    themeColor?: 'indigo' | 'amber';
    groupBy?: 'position' | 'company' | 'none';
    companies?: Company[];
}

export const AttendeeSelectorModal: React.FC<AttendeeSelectorModalProps> = ({ 
    isOpen, 
    onClose, 
    users, 
    selectedIds, 
    onConfirm,
    title = 'เลือกผู้เข้าร่วมประชุม',
    subtitle = 'ระบุสมาชิกที่ต้องการเชิญเข้าร่วมการประชุม',
    icon,
    themeColor = 'indigo',
    groupBy = 'position',
    companies = []
}) => {
    const [localSelected, setLocalSelected] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Sync state when opening
    useEffect(() => {
        if (isOpen) {
            setLocalSelected([...selectedIds]);
            setSearchQuery('');
        }
    }, [isOpen, selectedIds]);

    // Handle Escape key and body scroll lock
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    // Group Users Logic
    const groupedUsers = useMemo(() => {
        const groups: Record<string, User[]> = {};
        
        // Filter active users (or all users if they are already filtered by caller)
        const activeUsers = users.filter(u => u.isActive !== false);
        
        // Filter by search
        const filtered = activeUsers.filter(u => {
            const matchName = u.name?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchPos = u.position?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchEmail = u.email?.toLowerCase().includes(searchQuery.toLowerCase());
            
            // Search by company if available
            let matchComp = false;
            if (u.companyId && companies.length > 0) {
                const comp = companies.find(c => c.id === u.companyId);
                if (comp) {
                    matchComp = comp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                (comp.shortName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
                }
            }

            return matchName || matchPos || matchEmail || matchComp;
        });

        if (groupBy === 'company') {
            filtered.forEach(user => {
                let groupKey = 'สำนักงานใหญ่ / ส่วนกลาง';
                if (user.companyId && companies.length > 0) {
                    const comp = companies.find(c => c.id === user.companyId);
                    if (comp) {
                        groupKey = comp.shortName ? `${comp.shortName} - ${comp.name}` : comp.name;
                    }
                }
                if (!groups[groupKey]) groups[groupKey] = [];
                groups[groupKey].push(user);
            });
        } else if (groupBy === 'none') {
            groups['รายชื่อทั้งหมด'] = filtered;
        } else {
            // Default: groupBy === 'position'
            filtered.forEach(user => {
                const pos = user.position || 'General Member';
                if (!groups[pos]) groups[pos] = [];
                groups[pos].push(user);
            });
        }

        // Sort keys to keep order consistent
        return Object.keys(groups).sort().reduce((obj, key) => {
            obj[key] = groups[key];
            return obj;
        }, {} as Record<string, User[]>);
    }, [users, searchQuery, groupBy, companies]);

    const toggleSelection = (userId: string) => {
        setLocalSelected(prev => 
            prev.includes(userId) 
            ? prev.filter(id => id !== userId) 
            : [...prev, userId]
        );
    };

    const toggleGroupSelection = (usersInGroup: User[]) => {
        const groupIds = usersInGroup.map(u => u.id);
        const allSelected = groupIds.every(id => localSelected.includes(id));

        if (allSelected) {
            // Deselect all in group
            setLocalSelected(prev => prev.filter(id => !groupIds.includes(id)));
        } else {
            // Select all in group (keeping others)
            const newSelection = new Set([...localSelected, ...groupIds]);
            setLocalSelected(Array.from(newSelection));
        }
    };

    const visibleUsers = useMemo(() => {
        const list: User[] = [];
        Object.values(groupedUsers).forEach((group: User[]) => {
            group.forEach(u => list.push(u));
        });
        return list;
    }, [groupedUsers]);

    const isAllVisibleSelected = visibleUsers.length > 0 && visibleUsers.every(u => localSelected.includes(u.id));

    const handleToggleAllVisible = () => {
        const visibleIds = visibleUsers.map(u => u.id);
        if (isAllVisibleSelected) {
            // Deselect all visible
            setLocalSelected(prev => prev.filter(id => !visibleIds.includes(id)));
        } else {
            // Select all visible
            const newSelection = new Set([...localSelected, ...visibleIds]);
            setLocalSelected(Array.from(newSelection));
        }
    };

    const handleClearSelection = () => {
        setLocalSelected([]);
    };

    const handleSave = () => {
        onConfirm(localSelected);
        onClose();
    };

    if (typeof document === 'undefined') return null;

    // Theme styles configuration
    const isAmber = themeColor === 'amber';
    const iconHeaderBg = isAmber ? 'bg-amber-600 shadow-amber-200' : 'bg-indigo-600 shadow-indigo-200';
    const activeCardClass = isAmber 
        ? 'bg-amber-600 border-amber-600 text-white shadow-xl shadow-amber-100 ring-2 ring-amber-50 ring-offset-2' 
        : 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100 ring-2 ring-indigo-50 ring-offset-2';
    const activeCheckBadgeClass = isAmber ? 'text-amber-600 border-amber-100' : 'text-indigo-600 border-indigo-100';
    const activeTextClass = isAmber ? 'text-amber-100' : 'text-indigo-100';
    const confirmBtnClass = isAmber
        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xl shadow-amber-100 hover:shadow-amber-300'
        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-100 hover:shadow-indigo-300';
    const totalCountBadgeClass = isAmber ? 'bg-amber-600 text-white' : 'bg-indigo-600 text-white';
    const selectAllBtnActiveClass = isAmber ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-100/50' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100/50';

    const modalContent = (
        <AnimatePresence mode="wait">
            {isOpen && (
                <div 
                    className="fixed inset-0 z-[11000] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
                    id="attendee-selector-modal-root"
                >
                    {/* Backdrop */}
                    <motion.div
                        key="modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
                    />

                    {/* Modal Window */}
                    <motion.div 
                        key="modal-window"
                        initial={{ opacity: 0, scale: 0.95, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 16 }}
                        transition={{ 
                            type: 'spring',
                            damping: 25,
                            stiffness: 320,
                            duration: 0.25
                        }}
                        onClick={e => e.stopPropagation()}
                        className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border-4 border-white ring-1 ring-gray-100 overflow-hidden flex flex-col max-h-[90vh] relative z-10 my-auto"
                    >
                        {/* Header */}
                        <div className="px-8 py-7 border-b border-gray-100 bg-white relative shrink-0">
                            {/* Background decoration */}
                            <div className={`absolute top-0 right-0 w-32 h-32 ${isAmber ? 'bg-amber-50/50' : 'bg-indigo-50/50'} rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none overflow-hidden`} />
                            
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                                        <span className={`p-3 rounded-2xl shadow-lg ${iconHeaderBg}`}>
                                            {icon || <Users className="w-6 h-6 text-white" />}
                                        </span>
                                        {title}
                                    </h3>
                                    <p className="text-sm font-medium text-gray-400 mt-2 ml-14">{subtitle}</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={onClose} 
                                    className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-all active:scale-90 cursor-pointer"
                                    title="ปิดหน้าต่าง (Esc)"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Search & Actions */}
                            <div className="flex flex-col sm:flex-row gap-4 mt-8 relative z-20">
                                <div className="relative flex-1 group">
                                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 ${isAmber ? 'group-focus-within:text-amber-500' : 'group-focus-within:text-indigo-500'} transition-colors`} />
                                    <input 
                                        type="text" 
                                        placeholder="ค้นหาชื่อ, ตำแหน่ง, อีเมล หรือบริษัท..." 
                                        className={`w-full pl-12 pr-4 py-4 bg-gray-50/50 border-2 border-transparent rounded-[1.5rem] text-sm font-medium ${isAmber ? 'focus:border-amber-200 focus:ring-amber-50/40' : 'focus:border-indigo-100 focus:ring-indigo-50/30'} focus:bg-white focus:ring-4 outline-none transition-all placeholder:text-gray-300 shadow-xs`}
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                {visibleUsers.length > 0 && (
                                    <button 
                                        type="button"
                                        onClick={handleToggleAllVisible}
                                        className={`
                                            px-8 py-4 rounded-[1.5rem] text-sm font-medium transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap min-w-[140px] cursor-pointer
                                            ${isAllVisibleSelected 
                                                ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white shadow-rose-100/50' 
                                                : selectAllBtnActiveClass
                                            }
                                        `}
                                    >
                                        {isAllVisibleSelected ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                        {isAllVisibleSelected ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Body: Grouped List */}
                        <div className="flex-1 overflow-y-auto px-8 py-6 bg-white space-y-8 scrollbar-hide">
                            {Object.keys(groupedUsers).length === 0 ? (
                                <div className="text-center py-20 text-gray-300">
                                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Users className="w-10 h-10 opacity-30" />
                                    </div>
                                    <p className="font-medium">ไม่พบรายชื่อสมาชิก</p>
                                </div>
                            ) : (
                                Object.entries(groupedUsers).map(([groupName, groupUsers]) => {
                                    const usersList = groupUsers as User[];
                                    const allSelectedInGroup = usersList.every(u => localSelected.includes(u.id));
                                    const someSelectedInGroup = usersList.some(u => localSelected.includes(u.id));
                                    
                                    return (
                                        <div key={groupName} className="space-y-4">
                                            <button 
                                                type="button"
                                                onClick={() => toggleGroupSelection(usersList)}
                                                className="w-full flex items-center justify-between group/header p-2 -mx-2 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`
                                                        p-2 rounded-xl border-2 transition-all
                                                        ${allSelectedInGroup 
                                                            ? (isAmber ? 'bg-amber-600 border-amber-600 text-white' : 'bg-indigo-600 border-indigo-600 text-white')
                                                            : someSelectedInGroup
                                                                ? (isAmber ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-indigo-50 border-indigo-200 text-indigo-600')
                                                                : (isAmber ? 'bg-white border-gray-100 text-gray-400 group-hover/header:border-amber-200' : 'bg-white border-gray-100 text-gray-400 group-hover/header:border-indigo-200')
                                                        }
                                                    `}>
                                                        {groupBy === 'company' ? <Building2 className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                                                    </div>
                                                    <h4 className="text-sm font-black text-gray-700 uppercase tracking-widest">{groupName}</h4>
                                                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full">{usersList.length}</span>
                                                </div>
                                                
                                                <div className={`
                                                    flex items-center gap-2 text-xs font-bold transition-all
                                                    ${allSelectedInGroup 
                                                        ? (isAmber ? 'text-amber-600' : 'text-indigo-600') 
                                                        : (isAmber ? 'text-gray-300 group-hover/header:text-amber-500' : 'text-gray-300 group-hover/header:text-indigo-400')
                                                    }
                                                `}>
                                                    <span className="hidden sm:inline uppercase tracking-tighter">
                                                        {allSelectedInGroup ? 'Deselect Group' : 'Select Group'}
                                                    </span>
                                                    <div className={`
                                                        w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
                                                        ${allSelectedInGroup 
                                                            ? (isAmber ? 'bg-amber-600 border-amber-600' : 'bg-indigo-600 border-indigo-600') 
                                                            : 'bg-white border-gray-200'
                                                        }
                                                    `}>
                                                        {allSelectedInGroup && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                                                        {!allSelectedInGroup && someSelectedInGroup && (
                                                            <div className={`w-2 h-0.5 ${isAmber ? 'bg-amber-500' : 'bg-indigo-400'} rounded-full`} />
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                                                {usersList.map(user => {
                                                    const isSelected = localSelected.includes(user.id);
                                                    const userComp = companies.find(c => c.id === user.companyId);

                                                    return (
                                                        <div 
                                                            key={user.id}
                                                            onClick={() => toggleSelection(user.id)}
                                                            className={`
                                                                flex items-center gap-4 p-4 rounded-[1.5rem] border-2 cursor-pointer transition-all duration-300 relative overflow-hidden
                                                                ${isSelected 
                                                                    ? activeCardClass 
                                                                    : 'bg-white border-gray-50 hover:border-indigo-100 hover:shadow-lg hover:shadow-gray-100/50'
                                                                }
                                                            `}
                                                        >
                                                            {/* Background Glow for Selected */}
                                                            {isSelected && (
                                                                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                                                            )}

                                                            <div className="relative shrink-0">
                                                                {user.avatarUrl ? (
                                                                    <img 
                                                                        src={user.avatarUrl} 
                                                                        alt={user.name}
                                                                        className={`w-12 h-12 rounded-2xl object-cover border-2 shadow-sm transition-all duration-300 ${isSelected ? 'border-white/40 scale-105' : 'border-white'}`} 
                                                                        referrerPolicy="no-referrer"
                                                                    />
                                                                ) : (
                                                                    <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center font-bold text-base shadow-sm ${isSelected ? 'bg-white/20 text-white border-white/40' : 'bg-gray-100 text-gray-600 border-white'}`}>
                                                                        {user.name ? user.name.charAt(0) : '?'}
                                                                    </div>
                                                                )}
                                                                {isSelected && (
                                                                    <div className={`absolute -top-2 -right-2 bg-white rounded-full p-1 border shadow-md ${activeCheckBadgeClass}`}>
                                                                        <Check className="w-3 h-3 stroke-[3px]" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            
                                                            <div className="flex-1 min-w-0 z-10">
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <h5 className={`font-bold text-base truncate tracking-tight transition-colors ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                                                                        {user.name}
                                                                    </h5>
                                                                    {userComp && (
                                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                                                            {userComp.shortName || userComp.name}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className={`text-xs truncate transition-colors mt-0.5 ${isSelected ? activeTextClass : 'text-gray-400'}`}>
                                                                    {user.position || user.email || 'Member'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 z-20">
                            <div className="flex items-center gap-3">
                                 <div className="flex -space-x-2 mr-2">
                                     {users.filter(u => localSelected.includes(u.id)).slice(0, 3).map(u => (
                                         u.avatarUrl ? (
                                             <img key={u.id} src={u.avatarUrl} alt={u.name} className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover" referrerPolicy="no-referrer" />
                                         ) : (
                                             <div key={u.id} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-700">
                                                 {u.name?.charAt(0) || '?'}
                                             </div>
                                         )
                                     ))}
                                     {localSelected.length > 3 && (
                                         <div className={`w-8 h-8 rounded-full ${isAmber ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'} border-2 border-white flex items-center justify-center text-[10px] font-bold`}>
                                             +{localSelected.length - 3}
                                         </div>
                                     )}
                                 </div>
                                 <div className="flex flex-col">
                                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Total Selection</span>
                                     <div className="flex items-center gap-2">
                                         <span className={`px-3 py-0.5 rounded-full text-xs font-bold ${totalCountBadgeClass}`}>
                                             {localSelected.length} ท่าน
                                         </span>
                                         {localSelected.length > 0 && (
                                             <button 
                                                 type="button"
                                                 onClick={handleClearSelection} 
                                                 className="text-[10px] font-bold text-rose-400 hover:text-rose-600 transition-colors uppercase tracking-wider underline border-none bg-transparent cursor-pointer"
                                             >
                                                 Clear All
                                             </button>
                                         )}
                                     </div>
                                 </div>
                            </div>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <button 
                                    type="button"
                                    onClick={onClose} 
                                    className="flex-1 sm:flex-none px-8 py-3.5 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all border-2 border-transparent cursor-pointer"
                                >
                                    ยกเลิก
                                </button>
                                <button 
                                    type="button"
                                    onClick={handleSave}
                                    className={`flex-1 sm:flex-none px-12 py-3.5 rounded-2xl text-sm font-bold hover:-translate-y-0.5 transition-all active:scale-95 cursor-pointer ${confirmBtnClass}`}
                                >
                                    ยืนยันเลือก ({localSelected.length})
                                </button>
                            </div>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default AttendeeSelectorModal;
