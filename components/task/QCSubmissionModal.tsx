import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, FileText, CheckCircle, AlertCircle, User, Paperclip, ShieldCheck, CornerDownRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, User as AppUser, MasterOption } from '../../types';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import { supabase } from '../../lib/supabase';

interface QCSubmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (submissionNotes: string, reviewerId: string) => Promise<void>;
    task: Task;
    users: AppUser[];
    masterOptions: MasterOption[];
    currentUser: AppUser;
    assets: Array<{ name: string; url: string; [key: string]: any }>;
}

const QCSubmissionModal: React.FC<QCSubmissionModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    task,
    users,
    masterOptions,
    currentUser,
    assets
}) => {
    const [submissionNotes, setSubmissionNotes] = useState('');
    const [selectedReviewerId, setSelectedReviewerId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const { showAlert } = useGlobalDialog();

    // QC Resolver Logic
    const [resolvedLevel, setResolvedLevel] = useState<1 | 2 | 3>(3);
    const [resolverReason, setResolverReason] = useState('');

    // Find candidates and determine default selected reviewer
    const [candidates, setCandidates] = useState<AppUser[]>([]);

    useEffect(() => {
        if (!isOpen) return;

        // 1. Identify current user's position Master Option
        const userPos = currentUser?.position || '';
        const userPosOpt = masterOptions.find(o => 
            o.type === 'POSITION' && 
            (o.label.toLowerCase().trim() === userPos.toLowerCase().trim() || 
             o.key.toLowerCase().trim() === userPos.toLowerCase().trim())
        );

        let parentPosOpt: MasterOption | undefined;
        let parentUsers: AppUser[] = [];

        if (userPosOpt && userPosOpt.parentKey) {
            parentPosOpt = masterOptions.find(o => 
                o.type === 'POSITION' && 
                o.key === userPosOpt.parentKey
            );
            if (parentPosOpt) {
                parentUsers = users.filter(u => 
                    u.isActive && 
                    (u.position?.toLowerCase().trim() === parentPosOpt?.label.toLowerCase().trim() || 
                     u.position?.toLowerCase().trim() === parentPosOpt?.key.toLowerCase().trim())
                );
            }
        }

        // 2. Build candidate lists:
        // - Specific parent position users (Level 2)
        // - Fallbacks (Admins, Managers, QC members) (Level 3)
        const adminsAndManagers = users.filter(u => 
            u.isActive && 
            u.id !== currentUser.id && (
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

        // Combine candidates (remove duplicate IDs)
        const combinedMap = new Map<string, AppUser>();
        parentUsers.forEach(u => combinedMap.set(u.id, u));
        adminsAndManagers.forEach(u => combinedMap.set(u.id, u));
        const finalCandidates = Array.from(combinedMap.values());
        setCandidates(finalCandidates);

        // 3. Set Auto-Select Default Reviewer & Logic explanation
        let defaultReviewerId = '';
        let initialLevel: 1 | 2 | 3 = 3;
        let initialReason = '';

        if (parentUsers.length > 0) {
            defaultReviewerId = parentUsers[0].id;
            initialLevel = 2;
            initialReason = `วิเคราะห์ตำแหน่งพนักงาน [${userPos}] ➔ ค้นพบผู้ตรวจในตำแหน่งหัวหน้าสายงาน [${parentPosOpt?.label || parentPosOpt?.key}] (${parentUsers.length} ท่าน)`;
        } else {
            // Fallback to first active admin
            const firstAdmin = adminsAndManagers.find(u => u.role === 'ADMIN');
            if (firstAdmin) {
                defaultReviewerId = firstAdmin.id;
                initialLevel = 3;
                if (userPosOpt && userPosOpt.parentKey) {
                    initialReason = `ระบุตำแหน่งหัวหน้าเป็น [${userPosOpt.parentKey}] แต่ยังไม่มีพนักงานในระบบที่ได้รับแต่งตั้งตำแหน่งนี้ จึงใช้ระบบตรวจสำรอง (Admin)`;
                } else {
                    initialReason = `ตำแหน่งปัจจุบันของคุณ [${userPos || 'ไม่มีระบุ'}] ยังไม่ได้ผูกสายงานหัวหน้าใน Master Data จึงใช้ระบบตรวจสำรอง (Admin)`;
                }
            } else if (finalCandidates.length > 0) {
                defaultReviewerId = finalCandidates[0].id;
                initialLevel = 3;
                initialReason = 'ใช้พนักงานระบบตรวจสอบที่มีสิทธิ์เพื่อรับงานตรวจ';
            } else {
                defaultReviewerId = '';
                initialLevel = 3;
                initialReason = 'ไม่พบรายชื่อผู้ตรวจสำรองที่เปิดใช้งานอยู่ในระบบ';
            }
        }

        setSelectedReviewerId(defaultReviewerId);
        setResolvedLevel(initialLevel);
        setResolverReason(initialReason);

        // 4. Smart Default (Majority Vote & Recency Fallback of Last 5 Reviews)
        const loadSmartDefault = async () => {
            try {
                // Fetch tasks and contents assigned to the current user
                const [tasksRes, contentsRes] = await Promise.all([
                    supabase
                        .from('tasks')
                        .select('id')
                        .contains('assignee_ids', [currentUser.id]),
                    supabase
                        .from('contents')
                        .select('id')
                        .contains('assignee_ids', [currentUser.id])
                ]);

                const myTaskIds = (tasksRes.data || []).map((t: any) => t.id);
                const myContentIds = (contentsRes.data || []).map((c: any) => c.id);

                if (myTaskIds.length === 0 && myContentIds.length === 0) {
                    return;
                }

                let reviewQuery = supabase
                    .from('task_reviews')
                    .select('reviewer_id, scheduled_at')
                    .not('reviewer_id', 'is', null)
                    .order('scheduled_at', { ascending: false });

                if (myTaskIds.length > 0 && myContentIds.length > 0) {
                    reviewQuery = reviewQuery.or(`task_id.in.(${myTaskIds.join(',')}),content_id.in.(${myContentIds.join(',')})`);
                } else if (myTaskIds.length > 0) {
                    reviewQuery = reviewQuery.in('task_id', myTaskIds);
                } else {
                    reviewQuery = reviewQuery.in('content_id', myContentIds);
                }

                // Query last 5 reviews
                const { data: pastReviews } = await reviewQuery.limit(5);

                if (pastReviews && pastReviews.length > 0) {
                    // Filter reviews to only count those whose reviewer is in our available candidates list
                    const validPastReviews = pastReviews.filter((r: any) => 
                        r.reviewer_id && finalCandidates.some(c => c.id === r.reviewer_id)
                    );

                    if (validPastReviews.length > 0) {
                        // Count occurrences of each reviewer_id
                        const counts: Record<string, number> = {};
                        validPastReviews.forEach((r: any) => {
                            counts[r.reviewer_id] = (counts[r.reviewer_id] || 0) + 1;
                        });

                        // Find the highest frequency (maxCount)
                        let maxCount = 0;
                        Object.values(counts).forEach((count) => {
                            if (count > maxCount) maxCount = count;
                        });

                        // Get all candidates that share this maxCount
                        const candidatesWithMaxCount = Object.keys(counts).filter(
                            (revId) => counts[revId] === maxCount
                        );

                        let winnerId = '';
                        let isTieBreakerUsed = false;

                        if (candidatesWithMaxCount.length === 1) {
                            winnerId = candidatesWithMaxCount[0];
                        } else if (candidatesWithMaxCount.length > 1) {
                            // Tie-breaker: find the reviewer from candidatesWithMaxCount who appeared most recently in validPastReviews
                            const mostRecentTie = validPastReviews.find((r: any) => 
                                candidatesWithMaxCount.includes(r.reviewer_id)
                            );
                            if (mostRecentTie) {
                                winnerId = mostRecentTie.reviewer_id;
                                isTieBreakerUsed = true;
                            }
                        }

                        if (winnerId) {
                            const winnerUser = finalCandidates.find(c => c.id === winnerId);
                            if (winnerUser) {
                                setSelectedReviewerId(winnerId);
                                setResolvedLevel(1);
                                if (isTieBreakerUsed) {
                                    setResolverReason(`⚡ ระบบจดจำผู้ตรวจล่าสุด (Smart Default): ตรวจพบว่าคุณส่งงานให้ ${winnerUser.name} บ่อยที่สุดใน 5 ครั้งล่าสุด (${maxCount} ครั้ง - ชนะคะแนนเท่าด้วยความล่าสุด)`);
                                } else {
                                    setResolverReason(`⚡ ระบบจดจำผู้ตรวจล่าสุด (Smart Default): ตรวจพบว่าคุณส่งงานให้ ${winnerUser.name} บ่อยที่สุดใน 5 ครั้งล่าสุด (${maxCount} ครั้ง)`);
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Error loading smart default history:", err);
            }
        };

        loadSmartDefault();

    }, [isOpen, task, users, masterOptions, currentUser]);

    const handleSubmitClick = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Ensure submissionNotes is filled in
        if (!submissionNotes.trim()) {
            await showAlert('กรุณากรอกหมายเหตุ/เหตุผลประกอบการส่งตรวจงานให้ครบถ้วนก่อนส่งตรวจครับ', 'ข้อมูลไม่ครบถ้วน');
            return;
        }

        if (!selectedReviewerId) {
            setErrorMsg('กรุณาเลือกผู้ตรวจงานเพื่อดำเนินการต่อ');
            return;
        }
        setErrorMsg('');
        setIsSubmitting(true);
        try {
            await onSubmit(submissionNotes, selectedReviewerId);
            onClose();
        } catch (err: any) {
            setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการส่งงาน');
        } finally {
            setIsSubmitting(false);
        }
    };

    const latestAsset = assets.length > 0 ? assets[assets.length - 1] : null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    id="qc-modal-overlay"
                    className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                        className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
                    >
                        {/* Header Banner */}
                        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 px-6 py-6 text-white relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl shadow-inner text-white">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-xl tracking-tight">ส่งงานตรวจคุณภาพ (QC)</h3>
                                        <p className="text-xs text-indigo-100 mt-0.5">ระบบจะปรับสถานะงานเป็น "รอตรวจ (Waiting)" และแจ้งเตือนหัวหน้าสายงาน</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="relative z-10 p-1.5 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Body / Form */}
                        <form onSubmit={handleSubmitClick} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                            
                            {/* Task Overview Mini Card */}
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ชื่อภาพ / งานหลัก</p>
                                    <p className="text-sm font-bold text-slate-700 truncate">{task.title}</p>
                                </div>
                            </div>

                            {/* QC Resolver Routing Notification Box */}
                            <div className={`p-4 rounded-2xl border ${
                                resolvedLevel === 1
                                    ? 'bg-indigo-50/70 border-indigo-100 text-indigo-900'
                                    : resolvedLevel === 2 
                                        ? 'bg-emerald-50/70 border-emerald-100 text-emerald-800' 
                                        : 'bg-amber-50/70 border-amber-100 text-amber-800'
                            } text-xs space-y-2`}>
                                <div className="flex items-center gap-2 font-bold">
                                    {resolvedLevel === 1 ? (
                                        <ShieldCheck className="w-4 h-4 text-indigo-500" />
                                    ) : resolvedLevel === 2 ? (
                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 text-amber-500" />
                                    )}
                                    <span>
                                        {resolvedLevel === 1 
                                            ? '⚡ ระบบจดจำผู้ตรวจล่าสุด (Level 1: Smart Default)'
                                            : resolvedLevel === 2 
                                                ? '✅ ระบบจับคู่สายงานสำเร็จ (Level 2: Position Auto-Routing)' 
                                                : '⚠️ ใช้ระบบผู้ตรวจสำรอง (Level 3: Custom Override Fallback)'}
                                    </span>
                                </div>
                                <div className="flex items-start gap-1 font-medium pl-6 text-slate-600/90 leading-relaxed">
                                    <CornerDownRight className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                                    <p>{resolverReason}</p>
                                </div>
                            </div>

                            {/* Reviewer Select Dropdown */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                                    ผู้ตรวจทานงาน (Reviewer Target)
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <select
                                        value={selectedReviewerId}
                                        onChange={e => setSelectedReviewerId(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-slate-700 text-sm transition-all"
                                        required
                                    >
                                        <option value="">-- เลือกผู้ตรวจทานงาน --</option>
                                        {candidates.map(candidate => (
                                            <option key={candidate.id} value={candidate.id}>
                                                {candidate.name} {candidate.position ? `(${candidate.position})` : ''} {candidate.role === 'ADMIN' ? '🛡️ Admin' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <p className="text-[10px] text-slate-400 italic pl-1">
                                    * คุณสามารถเปลี่ยนตัวเลือกผู้ตรวจคนอื่นได้ด้วยตนเอง หากหัวหน้าติดภารกิจอื่น
                                </p>
                            </div>

                            {/* Reference Asset Confirmation */}
                            {latestAsset && (
                                <div className="p-3.5 bg-indigo-50/40 border border-indigo-100/50 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                            <Paperclip className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">แนบไฟล์อ้างอิงล่าสุด</p>
                                            <p className="text-xs font-bold text-indigo-700 truncate">{latestAsset.name}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg shrink-0">
                                        Auto-Attached
                                    </span>
                                </div>
                            )}

                            {/* Submission Notes */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                                    หมายเหตุถึงผู้ตรวจ (Submission Notes) <span className="text-rose-500 font-black">*จำเป็น</span>
                                </label>
                                <textarea
                                    value={submissionNotes}
                                    onChange={e => setSubmissionNotes(e.target.value)}
                                    rows={3}
                                    placeholder="พิมพ์ข้อความชี้แจง รายละเอียดเพิ่ม หรือคำอธิบายถึงผู้ตรวจที่นี่..."
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm resize-none placeholder:text-slate-300 text-slate-600 transition-all border-indigo-100 focus:border-indigo-600"
                                    required
                                />
                            </div>

                            {/* Error Message */}
                            {errorMsg && (
                                <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-800 text-xs font-bold rounded-2xl flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            {/* Submission Button */}
                            <div className="pt-2">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={isSubmitting || !selectedReviewerId}
                                    className={`
                                        w-full py-4 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/20 flex justify-center items-center gap-2 transition-all
                                        ${isSubmitting || !selectedReviewerId ? 'bg-indigo-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-indigo-500/40'}
                                    `}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>กำลังดำเนินการส่งงาน...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            <span>ยืนยันส่งตรวจ QC 🚀</span>
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default QCSubmissionModal;
