import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import FilterDropdown from '../../../../common/FilterDropdown';
import { MasterOption, User, EmploymentType } from '../../../../../types';
import { useTeam } from '../../../../../hooks/useTeam';
import { 
    Users, 
    Search, 
    Filter, 
    UserCheck, 
    Briefcase, 
    ChevronDown, 
    ShieldAlert, 
    Edit3, 
    Check, 
    X,
    UserPlus,
    Building2,
    Sparkles,
    SlidersHorizontal,
    GraduationCap,
    Clock,
    Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PositionFamilyTreeTabProps {
    masterOptions: MasterOption[];
}

const EMPLOYMENT_TYPE_CONFIG: Record<string, { label: string; color: string; badgeBg: string; textHex: string; icon: any }> = {
    FULL_TIME: {
        label: 'พนักงานประจำ',
        color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
        badgeBg: 'bg-emerald-500',
        textHex: '#059669',
        icon: Briefcase
    },
    PROBATION: {
        label: 'ทดลองงาน',
        color: 'bg-amber-500/10 text-amber-700 border-amber-200',
        badgeBg: 'bg-amber-500',
        textHex: '#d97706',
        icon: Clock
    },
    INTERN: {
        label: 'นักศึกษาฝึกงาน',
        color: 'bg-indigo-500/10 text-indigo-700 border-indigo-200',
        badgeBg: 'bg-indigo-500',
        textHex: '#4f46e5',
        icon: GraduationCap
    },
    FREELANCE: {
        label: 'ฟรีแลนซ์ / ชั่วคราว',
        color: 'bg-purple-500/10 text-purple-700 border-purple-200',
        badgeBg: 'bg-purple-500',
        textHex: '#9333ea',
        icon: Sparkles
    },
    PART_TIME: {
        label: 'พาร์ทไทม์',
        color: 'bg-sky-500/10 text-sky-700 border-sky-200',
        badgeBg: 'bg-sky-500',
        textHex: '#0284c7',
        icon: Clock
    },
    CONTRACT: {
        label: 'สัญญาจ้างพิเศษ',
        color: 'bg-rose-500/10 text-rose-700 border-rose-200',
        badgeBg: 'bg-rose-500',
        textHex: '#e11d48',
        icon: Award
    }
};

export const PositionFamilyTreeTab: React.FC<PositionFamilyTreeTabProps> = ({ masterOptions }) => {
    const { allUsers, updateMember } = useTeam();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEmploymentFilter, setSelectedEmploymentFilter] = useState<string>('ALL');
    const [editingMember, setEditingMember] = useState<User | null>(null);
    const [selectedPosKey, setSelectedPosKey] = useState<string>('');
    const [selectedEmpType, setSelectedEmpType] = useState<EmploymentType | ''>('');
    const [isSaving, setIsSaving] = useState(false);

    // List of standard positions from Master Data
    const positionOptions = useMemo(() => {
        return masterOptions
            .filter(o => o.type === 'POSITION')
            .sort((a, b) => a.sortOrder - b.sortOrder);
    }, [masterOptions]);

    const dropdownOptions = useMemo(() => {
        const list = [
            { key: '', label: '-- ยังไม่เลือกตำแหน่ง --' },
            ...positionOptions.map((pos) => ({
                key: pos.label,
                label: `${pos.label} (${pos.key})`
            }))
        ];

        // หากสมาชิกมีตำแหน่งเดิมอยู่แล้วแต่ไม่อยู่ในระบบ Position Options ให้เพิ่มตัวเลือกนั้นเข้าไปด้วย
        if (selectedPosKey && !positionOptions.some(pos => pos.label === selectedPosKey)) {
            list.push({
                key: selectedPosKey,
                label: `${selectedPosKey} (ตำแหน่งเดิม/กำหนดเอง)`
            });
        }

        return list;
    }, [positionOptions, selectedPosKey]);

    // Group members by position
    const groupedData = useMemo(() => {
        // Collect all distinct position labels
        const groups: Record<string, { label: string; key: string; color?: string; members: User[] }> = {};

        // Initialize groups from master position options
        positionOptions.forEach(pos => {
            groups[pos.key] = {
                label: pos.label,
                key: pos.key,
                color: pos.color,
                members: []
            };
        });

        // Add 'UNASSIGNED' group
        groups['UNASSIGNED'] = {
            label: 'ยังไม่กำหนดตำแหน่ง',
            key: 'UNASSIGNED',
            color: 'bg-slate-200 text-slate-600',
            members: []
        };

        // Populate users into corresponding groups
        allUsers.forEach(user => {
            // Match search
            const matchesSearch = searchQuery.trim() === '' ||
                user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.position?.toLowerCase().includes(searchQuery.toLowerCase());

            // Match employment type
            const matchesEmp = selectedEmploymentFilter === 'ALL' ||
                (user.employmentType || 'FULL_TIME') === selectedEmploymentFilter;

            if (!matchesSearch || !matchesEmp) return;

            const userPosKey = user.position?.trim();
            if (!userPosKey) {
                groups['UNASSIGNED'].members.push(user);
            } else {
                // Find if matches a key or label in master
                const matchedPos = positionOptions.find(p => p.key === userPosKey || p.label === userPosKey);
                if (matchedPos) {
                    groups[matchedPos.key].members.push(user);
                } else {
                    // Custom position
                    if (!groups[userPosKey]) {
                        groups[userPosKey] = {
                            label: userPosKey,
                            key: userPosKey,
                            color: 'bg-teal-100 text-teal-700',
                            members: []
                        };
                    }
                    groups[userPosKey].members.push(user);
                }
            }
        });

        return groups;
    }, [positionOptions, allUsers, searchQuery, selectedEmploymentFilter]);

    // Overall team statistics
    const stats = useMemo(() => {
        const total = allUsers.length;
        const counts: Record<string, number> = {
            FULL_TIME: 0,
            PROBATION: 0,
            INTERN: 0,
            FREELANCE: 0,
            PART_TIME: 0,
            CONTRACT: 0
        };

        allUsers.forEach(u => {
            const emp = u.employmentType || 'FULL_TIME';
            if (counts[emp] !== undefined) {
                counts[emp]++;
            } else {
                counts['FULL_TIME']++;
            }
        });

        return { total, counts };
    }, [allUsers]);

    const handleOpenEdit = (user: User) => {
        setEditingMember(user);
        const matched = positionOptions.find(p => p.key === user.position || p.label === user.position);
        setSelectedPosKey(matched ? matched.label : user.position || '');
        setSelectedEmpType(user.employmentType || 'FULL_TIME');
    };

    const handleSaveEdit = async () => {
        if (!editingMember) return;
        setIsSaving(true);
        try {
            await updateMember(editingMember.id, {
                position: selectedPosKey,
                employmentType: selectedEmpType
            });
            setEditingMember(null);
        } catch (error) {
            console.error('Failed to update member position:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Top Banner & Quick Stats */}
            <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-900 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-teal-300 mb-3 border border-white/10">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Organizational Structure & Members</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                            ผังตำแหน่งและสถานะบุคลากร
                        </h2>
                        <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                            ตรวจสอบรายชื่อพนักงานในแต่ละตำแหน่ง สถานะการจ้างงาน (ประจำ, ทดลองงาน, ฝึกงาน, ฟรีแลนซ์) และปรับเปลี่ยนตำแหน่งได้ทันที
                        </p>
                    </div>

                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                        <Users className="w-8 h-8 text-teal-400" />
                        <div>
                            <div className="text-xs text-slate-300 font-medium">สมาชิกทั้งหมดในทีม</div>
                            <div className="text-2xl font-black text-white">{stats.total} <span className="text-sm font-normal text-slate-300">คน</span></div>
                        </div>
                    </div>
                </div>

                {/* Employment Type Stat Chips */}
                <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {Object.entries(EMPLOYMENT_TYPE_CONFIG).map(([key, config]) => {
                        const count = stats.counts[key] || 0;
                        const Icon = config.icon;
                        return (
                            <button
                                key={key}
                                onClick={() => setSelectedEmploymentFilter(selectedEmploymentFilter === key ? 'ALL' : key)}
                                className={`p-3 rounded-xl transition-all border text-left flex flex-col justify-between ${
                                    selectedEmploymentFilter === key
                                        ? 'bg-white text-slate-900 border-white shadow-lg scale-105'
                                        : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                                }`}
                            >
                                <div className="flex items-center justify-between text-xs font-medium opacity-80">
                                    <span className="truncate">{config.label}</span>
                                    <Icon className="w-3.5 h-3.5" />
                                </div>
                                <div className="text-xl font-bold mt-2">
                                    {count} <span className="text-xs font-normal">คน</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อ, ชื่อเล่น, หรืออีเมล..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                        <Filter className="w-3.5 h-3.5" /> กรองสถานะ:
                    </span>
                    <button
                        onClick={() => setSelectedEmploymentFilter('ALL')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            selectedEmploymentFilter === 'ALL'
                                ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                    >
                        ทั้งหมด
                    </button>
                    {Object.entries(EMPLOYMENT_TYPE_CONFIG).map(([key, config]) => (
                        <button
                            key={key}
                            onClick={() => setSelectedEmploymentFilter(key)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
                                selectedEmploymentFilter === key
                                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            }`}
                        >
                            {config.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Position Groups Listing */}
            <div className="space-y-6">
                {Object.values(groupedData).map((group) => {
                    if (group.members.length === 0 && (group.key === 'UNASSIGNED' || searchQuery || selectedEmploymentFilter !== 'ALL')) {
                        return null; // Skip empty unassigned or empty filtered groups
                    }

                    return (
                        <motion.div
                            key={group.key}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/70 shadow-lg overflow-hidden"
                        >
                            {/* Position Header */}
                            <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-teal-600/20">
                                        <Briefcase className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-lg text-slate-800">{group.label}</h3>
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
                                                {group.members.length} คน
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-mono">Code: {group.key}</p>
                                    </div>
                                </div>

                                {/* Mini Employment Breakdown Badges */}
                                <div className="flex flex-wrap items-center gap-2">
                                    {Object.keys(EMPLOYMENT_TYPE_CONFIG).map((empKey) => {
                                        const count = group.members.filter(m => (m.employmentType || 'FULL_TIME') === empKey).length;
                                        if (count === 0) return null;
                                        const cfg = EMPLOYMENT_TYPE_CONFIG[empKey];
                                        return (
                                            <span
                                                key={empKey}
                                                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${cfg.color}`}
                                            >
                                                {cfg.label}: {count}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Position Members Grid */}
                            <div className="p-6">
                                {group.members.length === 0 ? (
                                    <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                        <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                        <p className="text-sm font-semibold text-slate-500">ยังไม่มีพนักงานในตำแหน่งนี้</p>
                                        <p className="text-xs text-slate-400 mt-1">สามารถกำหนดตำแหน่งให้พนักงานจากการแก้ไขรายชื่อได้เลย</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {group.members.map((member) => {
                                            const empType = member.employmentType || 'FULL_TIME';
                                            const empConfig = EMPLOYMENT_TYPE_CONFIG[empType] || EMPLOYMENT_TYPE_CONFIG.FULL_TIME;
                                            const EmpIcon = empConfig.icon;

                                            return (
                                                <div
                                                    key={member.id}
                                                    className="group relative bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-teal-300 transition-all flex flex-col justify-between"
                                                >
                                                    <div>
                                                        {/* Top Row: Avatar + Name + Quick Actions */}
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="relative">
                                                                    <img
                                                                        src={member.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                                                                        alt={member.name}
                                                                        className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm"
                                                                    />
                                                                    <span
                                                                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                                                            member.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                                                                        }`}
                                                                    />
                                                                </div>

                                                                <div className="min-w-0">
                                                                    <div className="font-bold text-slate-800 text-sm truncate flex items-center gap-1.5">
                                                                        <span>{member.name}</span>
                                                                        {member.nickname && (
                                                                            <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-1.5 py-0.2 rounded">
                                                                                ({member.nickname})
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-xs text-slate-400 truncate">{member.email}</div>
                                                                </div>
                                                            </div>

                                                            <button
                                                                onClick={() => handleOpenEdit(member)}
                                                                className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                                                                title="ปรับตำแหน่ง / สถานะการจ้างงาน"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                        </div>

                                                        {/* Middle Info: Badges */}
                                                        <div className="mt-4 flex flex-wrap items-center gap-2">
                                                            {/* Role Badge */}
                                                            <span
                                                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                                    member.role === 'ADMIN'
                                                                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                                                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                                                                }`}
                                                            >
                                                                {member.role}
                                                            </span>

                                                            {/* Employment Status Badge */}
                                                            <span
                                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${empConfig.color}`}
                                                            >
                                                                <EmpIcon className="w-3 h-3" />
                                                                <span>{empConfig.label}</span>
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Footer Info */}
                                                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                                                        <span>ตำแหน่ง: <strong className="text-slate-600">{member.position || 'ยังไม่กำหนด'}</strong></span>
                                                        <button
                                                            onClick={() => handleOpenEdit(member)}
                                                            className="text-teal-600 hover:underline font-semibold"
                                                        >
                                                            ย้าย/เปลี่ยนตำแหน่ง
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Quick Edit Modal */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {editingMember && (
                        <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 relative flex flex-col overflow-visible my-auto"
                            >
                                <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={editingMember.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                                            alt={editingMember.name}
                                            className="w-10 h-10 rounded-xl object-cover"
                                        />
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-base">ปรับตำแหน่ง & สถานะงาน</h3>
                                            <p className="text-xs text-slate-500">{editingMember.name} {editingMember.nickname ? `(${editingMember.nickname})` : ''}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setEditingMember(null)}
                                        className="p-2 rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="py-6 space-y-5 flex-1 overflow-visible">
                                    {/* Position Selector */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">
                                            ตำแหน่งงาน (Position)
                                        </label>
                                        <FilterDropdown
                                            label="เลือกตำแหน่งงาน"
                                            placeholder="-- ยังไม่เลือกตำแหน่ง --"
                                            options={dropdownOptions}
                                            value={selectedPosKey}
                                            onChange={(val) => setSelectedPosKey(val)}
                                            showAllOption={false}
                                            clearable={false}
                                            activeColorClass="bg-teal-50 border-teal-200 text-teal-700 shadow-[0_0_15px_rgba(13,148,136,0.15)]"
                                        />
                                        <p className="text-[11px] text-slate-400 mt-1">
                                            * คุณสามารถค้นหาและเลือกตำแหน่งจาก Master Data ที่กำหนดไว้ได้ทันที
                                        </p>
                                    </div>

                                    {/* Employment Type Selector */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">
                                            สถานะการทำงาน (Employment Status)
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(EMPLOYMENT_TYPE_CONFIG).map(([key, cfg]) => {
                                                const isSelected = selectedEmpType === key;
                                                const Icon = cfg.icon;
                                                return (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => setSelectedEmpType(key as EmploymentType)}
                                                        className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                                                            isSelected
                                                                ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-sm ring-1 ring-teal-500'
                                                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        <div
                                                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold ${cfg.badgeBg}`}
                                                        >
                                                            <Icon className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold">{cfg.label}</div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Buttons */}
                                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                                    <button
                                        onClick={() => setEditingMember(null)}
                                        className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        onClick={handleSaveEdit}
                                        disabled={isSaving}
                                        className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-600/30 transition-all flex items-center gap-2"
                                    >
                                        {isSaving ? (
                                            <span>บันทึก...</span>
                                        ) : (
                                            <>
                                                <Check className="w-4 h-4" />
                                                <span>บันทึกการเปลี่ยนแปลง</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};
