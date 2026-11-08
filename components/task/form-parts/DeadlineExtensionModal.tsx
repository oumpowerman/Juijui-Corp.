import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar as CalendarIcon, Send, UserCheck, ShieldCheck, ChevronDown, Check } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import DatePickerModal, { formatDisplayDate } from '../../ui/DatePickerModal';
import { User, MasterOption } from '../../../types';

interface DeadlineExtensionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (newDate: string, reason: string, approverId?: string) => void;
    currentEndDate: string;
    users?: User[];
    masterOptions?: MasterOption[];
    currentUser?: User;
}

const DeadlineExtensionModal: React.FC<DeadlineExtensionModalProps> = ({ 
    isOpen, 
    onClose, 
    onSubmit, 
    currentEndDate,
    users = [],
    masterOptions = [],
    currentUser
}) => {
    const [newDate, setNewDate] = useState(currentEndDate);
    const [reason, setReason] = useState('');
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [selectedApproverId, setSelectedApproverId] = useState<string>('');
    const [isApproverDropdownOpen, setIsApproverDropdownOpen] = useState(false);

    // Candidates calculation following QC resolver rules
    const candidates = useMemo(() => {
        if (!users || users.length === 0) return [];
        const userPos = currentUser?.position || '';
        const userPosOpt = masterOptions.find(o => 
            o.type === 'POSITION' && 
            (o.label.toLowerCase().trim() === userPos.toLowerCase().trim() || 
             o.key.toLowerCase().trim() === userPos.toLowerCase().trim())
        );

        let parentUsers: User[] = [];
        if (userPosOpt && userPosOpt.parentKey) {
            const parentPosOpt = masterOptions.find(o => 
                o.type === 'POSITION' && 
                o.key === userPosOpt.parentKey
            );
            if (parentPosOpt) {
                parentUsers = users.filter(u => 
                    u.isActive && 
                    u.id !== currentUser?.id &&
                    (u.position?.toLowerCase().trim() === parentPosOpt?.label.toLowerCase().trim() || 
                     u.position?.toLowerCase().trim() === parentPosOpt?.key.toLowerCase().trim())
                );
            }
        }

        const adminsAndManagers = users.filter(u => 
            u.isActive && 
            u.id !== currentUser?.id && (
                u.role === 'ADMIN' || 
                u.position?.toLowerCase().includes('qc') || 
                u.position?.toLowerCase().includes('manager') || 
                u.position?.toLowerCase().includes('director') || 
                u.position?.toLowerCase().includes('head') || 
                u.position?.toLowerCase().includes('senior') ||
                u.position?.toLowerCase().includes('หัวหน้า') ||
                u.position?.toLowerCase().includes('ผู้ตรวจ')
            )
        );

        const combinedMap = new Map<string, User>();
        parentUsers.forEach(u => combinedMap.set(u.id, u));
        adminsAndManagers.forEach(u => combinedMap.set(u.id, u));
        return Array.from(combinedMap.values());
    }, [users, masterOptions, currentUser]);

    useEffect(() => {
        if (isOpen && candidates.length > 0 && !selectedApproverId) {
            setSelectedApproverId(candidates[0].id);
        }
    }, [isOpen, candidates, selectedApproverId]);

    if (!isOpen) return null;

    const selectedApprover = users.find(u => u.id === selectedApproverId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDate || !reason.trim()) return;
        onSubmit(newDate, reason, selectedApproverId || undefined);
    };

    return (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-indigo-900">ขอเลื่อน Deadline</h3>
                        <p className="text-xs text-indigo-600/70">ระบุวันที่ต้องการ เหตุผล และหัวหน้าที่ต้องการขออนุมัติ</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-gray-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
                    {/* Approver Selection */}
                    {candidates.length > 0 && (
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                                <span>หัวหน้า/ผู้อนุมัติ (Approver)</span>
                                <span className="text-[10px] text-indigo-600 font-bold lowercase">ส่งคำขอถึงเฉพาะท่านนี้</span>
                            </label>
                            
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsApproverDropdownOpen(!isApproverDropdownOpen)}
                                    className="w-full p-2.5 bg-indigo-50/40 border border-indigo-200/80 rounded-2xl flex items-center justify-between hover:bg-indigo-50/70 transition-all text-left"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        {selectedApprover?.avatarUrl ? (
                                            <img 
                                                src={selectedApprover.avatarUrl} 
                                                alt={selectedApprover.name}
                                                className="w-8 h-8 rounded-full object-cover border border-indigo-200 shrink-0" 
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                                                {selectedApprover?.name?.charAt(0) || 'ผ'}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-800 truncate">
                                                {selectedApprover?.name || 'เลือกหัวหน้าผู้อนุมัติ'}
                                            </p>
                                            <p className="text-[10px] text-indigo-600 truncate">
                                                {selectedApprover?.position || (selectedApprover?.role === 'ADMIN' ? 'Admin' : 'หัวหน้าสายงาน')}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-indigo-400 transition-transform shrink-0 ${isApproverDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isApproverDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl z-30 max-h-48 overflow-y-auto p-1.5 space-y-1">
                                        {candidates.map((cand) => (
                                            <button
                                                key={cand.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedApproverId(cand.id);
                                                    setIsApproverDropdownOpen(false);
                                                }}
                                                className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-colors ${
                                                    selectedApproverId === cand.id ? 'bg-indigo-50 text-indigo-900 font-bold' : 'hover:bg-gray-50 text-slate-700'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {cand.avatarUrl ? (
                                                        <img src={cand.avatarUrl} alt={cand.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                                                            {cand.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <span className="text-xs truncate">{cand.name}</span>
                                                    <span className="text-[10px] text-gray-400">({cand.position || cand.role})</span>
                                                </div>
                                                {selectedApproverId === cand.id && (
                                                    <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">วันที่ต้องการเลื่อนไป (New Date)</label>
                        <div className="relative">
                            <button 
                                type="button" 
                                onClick={() => setIsDatePickerOpen(true)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 outline-none transition-all text-left flex items-center justify-between"
                            >
                                <span>{formatDisplayDate(newDate)}</span>
                                <CalendarIcon className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">เหตุผล (Reason)</label>
                        <textarea 
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="อธิบายเหตุผลที่ทำให้งานล่าช้า..."
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none h-24"
                            required
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold rounded-xl transition-colors"
                        >
                            ยกเลิก
                        </button>
                        <button 
                            type="submit"
                            disabled={!newDate || !reason.trim() || newDate <= currentEndDate}
                            className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                            <Send className="w-4 h-4" />
                            ส่งคำขอ
                        </button>
                    </div>
                </form>
            </div>

            <DatePickerModal
                isOpen={isDatePickerOpen}
                onClose={() => setIsDatePickerOpen(false)}
                selectedDate={newDate ? new Date(newDate) : undefined}
                minDate={currentEndDate ? new Date(currentEndDate) : undefined}
                onSelect={(date) => {
                    if (date) {
                        setNewDate(date.toISOString().split('T')[0]);
                    }
                }}
            />
        </div>
    );
};

export default DeadlineExtensionModal;
