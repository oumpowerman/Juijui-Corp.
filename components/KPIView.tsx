
import React, { useState, useMemo, useEffect } from 'react';
import { User, KPIRecord } from '../types';
import { useKPI } from '../hooks/useKPI';
import { format, addMonths } from 'date-fns';
import { BarChart3, Star, CheckCircle2, AlertCircle, Save, User as UserIcon, Calendar, Wallet, Award, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import MentorTip from './MentorTip';

interface KPIViewProps {
    users: User[];
    currentUser: User;
}

const KPIView: React.FC<KPIViewProps> = ({ users, currentUser }) => {
    const { kpiRecords, criteria, saveEvaluation, isLoading } = useKPI();
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [selectedUserId, setSelectedUserId] = useState<string>(users.length > 0 ? users[0].id : '');
    
    // Evaluation Form State
    const [scores, setScores] = useState<Record<string, number>>({});
    const [feedback, setFeedback] = useState('');
    const [isDirty, setIsDirty] = useState(false);

    const activeUsers = users.filter(u => u.isActive);
    const isAdmin = currentUser.role === 'ADMIN';

    // Get current record
    const currentRecord = useMemo(() => {
        return kpiRecords.find(r => r.userId === selectedUserId && r.monthKey === selectedMonth);
    }, [kpiRecords, selectedUserId, selectedMonth]);

    // Initialize/Reset Form
    useEffect(() => {
        if (currentRecord) {
            setScores(currentRecord.scores || {});
            setFeedback(currentRecord.feedback || '');
        } else {
            const defaultScores: Record<string, number> = {};
            // Safely handle criteria if not yet loaded
            if (criteria && criteria.length > 0) {
                criteria.forEach(c => defaultScores[c.key] = 0);
            }
            setScores(defaultScores);
            setFeedback('');
        }
        setIsDirty(false);
    }, [currentRecord, criteria, selectedUserId, selectedMonth]);

    const handleScoreChange = (key: string, value: number) => {
        setScores(prev => ({ ...prev, [key]: value }));
        setIsDirty(true);
    };

    const handleSave = (status: 'DRAFT' | 'FINAL' | 'PAID') => {
        saveEvaluation(selectedUserId, selectedMonth, scores, feedback, status, currentUser.id);
        setIsDirty(false);
    };

    // Robust Calculation: Only sum scores for active criteria
    const calculateTotal = () => {
        if (!criteria || criteria.length === 0) return 0;
        return criteria.reduce((sum, c) => {
            const val = scores[c.key];
            return sum + (Number(val) || 0);
        }, 0);
    };

    const maxTotal = criteria.length * 5;
    const currentTotal = calculateTotal();
    const percentage = maxTotal > 0 ? Math.round((currentTotal / maxTotal) * 100) : 0;
    const isPassed = percentage >= 70;

    const prevMonth = () => {
        const d = new Date(selectedMonth + '-01');
        setSelectedMonth(format(addMonths(d, -1), 'yyyy-MM'));
    };
    const nextMonth = () => {
        const d = new Date(selectedMonth + '-01');
        setSelectedMonth(format(addMonths(d, 1), 'yyyy-MM'));
    };

    const selectedUser = users.find(u => u.id === selectedUserId);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <MentorTip variant="orange" messages={[
                "KPI ช่วยให้เห็นภาพรวมคุณภาพงาน ไม่ใช่แค่จับผิด!",
                "ถ้าคะแนนเกิน 80% ติดกัน 3 เดือน ควรพิจารณาปรับตำแหน่งหรือโบนัสพิเศษนะ",
                "อย่าลืมใส่ Feedback เพื่อให้ทีมงานรู้จุดที่ต้องปรับปรุง"
            ]} />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                        ประเมินผลงาน 📊 (KPI & Performance)
                    </h1>
                    <p className="text-gray-500 mt-1">
                        ติดตามคุณภาพงาน จ่ายเบี้ยเลี้ยง และพัฒนาทีม
                    </p>
                </div>
                
                {/* Month Selector */}
                <div className="flex items-center bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
                    <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                    <div className="px-4 text-center min-w-[140px] font-black text-indigo-600 text-lg">
                        {selectedMonth}
                    </div>
                    <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Left: User List */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 font-bold text-gray-600 flex items-center">
                            <UserIcon className="w-4 h-4 mr-2" /> รายชื่อทีม ({activeUsers.length})
                        </div>
                        <div className="overflow-y-auto max-h-[500px]">
                            {activeUsers.map(u => {
                                const record = kpiRecords.find(r => r.userId === u.id && r.monthKey === selectedMonth);
                                const isSelected = u.id === selectedUserId;
                                const statusColor = record?.status === 'PAID' ? 'bg-green-100 text-green-600' : 
                                                    record?.status === 'FINAL' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400';
                                
                                return (
                                    <div 
                                        key={u.id}
                                        onClick={() => setSelectedUserId(u.id)}
                                        className={`p-3 flex items-center gap-3 cursor-pointer transition-colors border-l-4 ${isSelected ? 'bg-indigo-50 border-indigo-500' : 'bg-white hover:bg-gray-50 border-transparent'}`}
                                    >
                                        <img src={u.avatarUrl} className="w-10 h-10 rounded-full bg-gray-200 object-cover" />
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-bold truncate ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>{u.name}</p>
                                            <p className="text-xs text-gray-400">{u.position}</p>
                                        </div>
                                        {record && (
                                            <div className="text-right">
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${statusColor}`}>{record.totalScore}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right: Evaluation Form */}
                <div className="lg:col-span-3">
                    {selectedUser ? (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Card Header */}
                            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <img src={selectedUser.avatarUrl} className="w-16 h-16 rounded-2xl object-cover shadow-sm border-2 border-white" />
                                        <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white text-xs font-bold text-white shadow-sm ${isPassed ? 'bg-green-500' : 'bg-red-500'}`}>
                                            {percentage}%
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-gray-800">{selectedUser.name}</h2>
                                        <p className="text-sm text-gray-500">{selectedUser.position}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {currentRecord?.status === 'PAID' && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded font-bold flex items-center"><Wallet className="w-3 h-3 mr-1" /> จ่ายแล้ว</span>}
                                            {currentRecord?.status === 'FINAL' && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-bold flex items-center"><CheckCircle2 className="w-3 h-3 mr-1" /> อนุมัติแล้ว</span>}
                                            {(!currentRecord || currentRecord.status === 'DRAFT') && <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded font-bold">Draft / Pending</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end">
                                    <div className="text-right">
                                        <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Score</span>
                                        <div className={`text-4xl font-black ${isPassed ? 'text-green-500' : 'text-red-500'}`}>
                                            {currentTotal}<span className="text-lg text-gray-300">/{maxTotal}</span>
                                        </div>
                                    </div>
                                    {isPassed ? (
                                        <div className="flex items-center text-green-600 text-xs font-bold mt-1 bg-green-50 px-2 py-1 rounded-lg">
                                            <Trophy className="w-3 h-3 mr-1" /> ผ่านเกณฑ์ (Passed)
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-red-500 text-xs font-bold mt-1 bg-red-50 px-2 py-1 rounded-lg">
                                            <AlertCircle className="w-3 h-3 mr-1" /> ต้องปรับปรุง (Failed)
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Criteria Form */}
                            <div className="p-6">
                                {isLoading ? (
                                    <div className="py-12 text-center text-gray-400">กำลังโหลด...</div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {criteria.map((c) => (
                                                <div key={c.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-indigo-100 transition-colors">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <label className="font-bold text-gray-700 text-sm">{c.label}</label>
                                                        <span className={`text-xl font-black ${scores[c.key] >= 4 ? 'text-green-500' : scores[c.key] <= 2 ? 'text-red-500' : 'text-indigo-500'}`}>
                                                            {scores[c.key] || 0}
                                                        </span>
                                                    </div>
                                                    <input 
                                                        type="range" 
                                                        min="0" max="5" step="1"
                                                        value={scores[c.key] || 0}
                                                        onChange={(e) => handleScoreChange(c.key, parseInt(e.target.value))}
                                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-50"
                                                        disabled={!isAdmin && currentUser.id !== selectedUserId} // Only admin can edit others
                                                    />
                                                    <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-medium uppercase tracking-wide">
                                                        <span>ปรับปรุง</span>
                                                        <span>ดีเยี่ยม</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700">Feedback / ความคิดเห็นเพิ่มเติม</label>
                                            <textarea 
                                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm"
                                                rows={3}
                                                placeholder="สิ่งที่ทำได้ดี, สิ่งที่ควรปรับปรุง..."
                                                value={feedback}
                                                onChange={(e) => { setFeedback(e.target.value); setIsDirty(true); }}
                                                disabled={!isAdmin && currentUser.id !== selectedUserId}
                                            />
                                        </div>

                                        {/* Actions */}
                                        {isAdmin && (
                                            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                                                <button 
                                                    onClick={() => handleSave('DRAFT')}
                                                    className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center"
                                                >
                                                    <Save className="w-4 h-4 mr-2" /> บันทึกร่าง (Draft)
                                                </button>
                                                
                                                <button 
                                                    onClick={() => { if(confirm('ยืนยันผลประเมิน?')) handleSave('FINAL'); }}
                                                    className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center"
                                                >
                                                    <Award className="w-4 h-4 mr-2" /> อนุมัติผล (Approve)
                                                </button>

                                                {currentRecord?.status === 'FINAL' && isPassed && (
                                                    <button 
                                                        onClick={() => { if(confirm('ยืนยันจ่ายเบี้ยเลี้ยง?')) handleSave('PAID'); }}
                                                        className="px-5 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition-all active:scale-95 flex items-center ml-auto"
                                                    >
                                                        <Wallet className="w-4 h-4 mr-2" /> จ่ายเบี้ยเลี้ยง (Pay)
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {!isAdmin && (
                                            <div className="text-center text-gray-400 text-sm italic py-4">
                                                * เฉพาะ Admin เท่านั้นที่สามารถแก้ไขผลประเมินได้
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-white rounded-3xl border-2 border-dashed border-gray-200 min-h-[400px]">
                            <UserIcon className="w-16 h-16 mb-4 opacity-20" />
                            <p>เลือกพนักงานเพื่อเริ่มประเมิน</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KPIView;
