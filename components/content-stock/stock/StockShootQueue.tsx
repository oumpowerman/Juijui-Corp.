import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Task, Channel, User, MasterOption } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { 
    Loader2, 
    Video, 
    Film, 
    Clapperboard, 
    Sparkles, 
    Trash2, 
    CheckCircle2, 
    X, 
    CheckSquare, 
    RotateCcw,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../../context/ToastContext';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';
import { useShootQueueContext } from '../../../context/ShootQueueContext';

// Sub-components
import { MergedQueueItem, QueueViewMode } from './queue/types';
import QueueHeader from './queue/QueueHeader';
import QueueGridView from './queue/QueueGridView';
import QueueTableView from './queue/QueueTableView';
import ShootPlanningModal from './queue/ShootPlanningModal';

interface StockShootQueueProps {
    channels: Channel[];
    users: User[];
    masterOptions: MasterOption[];
    onEditContent: (task: Task) => void;
    onEditScript?: (scriptId: string) => void;
}

const StockShootQueue: React.FC<StockShootQueueProps> = ({ 
    channels, 
    users, 
    masterOptions, 
    onEditContent, 
    onEditScript 
}) => {
    const { showToast } = useToast();
    const { showConfirm, showLoading, hideLoading } = useGlobalDialog();
    const { 
        queueItems, 
        setQueueItems, 
        isLoading: isContextLoading, 
        refreshQueue, 
        checkAndRefreshIfNeeded,
        updateLocalItem,
        removeItemLocally,
        batchRemoveFromQueue,
        injectSingleItem
    } = useShootQueueContext();

    const [includeScripts, setIncludeScripts] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [isBatchProcessing, setIsBatchProcessing] = useState(false);
    const [viewMode, setViewMode] = useState<QueueViewMode>('TABLE');
    const [planningItem, setPlanningItem] = useState<MergedQueueItem | null>(null);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Filter queue items on the UI level rather than refetching to save network egress
    const filteredItems = useMemo(() => {
        if (includeScripts) return queueItems;
        return queueItems.filter(item => item.type !== 'SCRIPT');
    }, [queueItems, includeScripts]);

    // Ensure selectedIds only contains items currently existing in the view
    const selectedIdsInView = useMemo(() => {
        const itemIdsSet = new Set(filteredItems.map(i => i.id));
        return selectedIds.filter(id => itemIdsSet.has(id));
    }, [selectedIds, filteredItems]);

    const finishedCount = useMemo(() => 
        filteredItems.filter(i => i.isSoftFinished).length
    , [filteredItems]);

    const unfinishedCount = useMemo(() => 
        filteredItems.filter(i => !i.isSoftFinished).length
    , [filteredItems]);

    // Keep a stable ref of queue items to avoid real-time connection teardowns on state edits
    const queueItemsRef = useRef(queueItems);
    useEffect(() => {
        queueItemsRef.current = queueItems;
    }, [queueItems]);

    useEffect(() => {
        // Smart fingerprinted background check on mount
        checkAndRefreshIfNeeded(true);

        const channel = supabase.channel('shoot-queue-lazy-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'contents' }, (payload) => {
                const eventType = payload.eventType;
                const oldRec = payload.old as any;
                const newRec = payload.new as any;

                if (eventType === 'DELETE') {
                    removeItemLocally(oldRec.id);
                    setSelectedIds(prev => prev.filter(id => id !== oldRec.id));
                    return;
                }

                // --- 1. LOCAL GUARD FILTER ---
                const isNowInQueue = !!newRec.is_in_shoot_queue;
                const wasInQueueLocal = queueItemsRef.current.some(item => item.id === newRec.id);

                if (!isNowInQueue && !wasInQueueLocal) {
                    return;
                }

                if (!isNowInQueue) {
                    removeItemLocally(newRec.id);
                    setSelectedIds(prev => prev.filter(id => id !== newRec.id));
                } else if (!wasInQueueLocal) {
                    injectSingleItem(newRec.id, 'CONTENT');
                } else {
                    updateLocalItem(newRec.id, {
                        title: newRec.title,
                        status: newRec.status,
                        isSoftFinished: !!newRec.is_soft_finished,
                        shootLocation: newRec.shoot_location,
                        shootTimeStart: newRec.shoot_time_start,
                        shootTimeEnd: newRec.shoot_time_end,
                        shootNotes: newRec.shoot_notes,
                        channelId: newRec.channel_id
                    });
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'scripts' }, (payload) => {
                const eventType = payload.eventType;
                const oldRec = payload.old as any;
                const newRec = payload.new as any;

                if (eventType === 'DELETE') {
                    removeItemLocally(oldRec.id);
                    setSelectedIds(prev => prev.filter(id => id !== oldRec.id));
                    return;
                }

                const isNowInQueue = !!newRec.is_in_shoot_queue;
                const wasInQueueLocal = queueItemsRef.current.some(item => item.id === newRec.id || item.scriptId === newRec.id);

                if (!isNowInQueue && !wasInQueueLocal) {
                    return;
                }

                if (!isNowInQueue) {
                    removeItemLocally(newRec.id);
                    setSelectedIds(prev => prev.filter(id => id !== newRec.id));
                } else if (!wasInQueueLocal) {
                    injectSingleItem(newRec.id, 'SCRIPT');
                } else {
                    updateLocalItem(newRec.id, {
                        title: newRec.title,
                        status: newRec.status,
                        isSoftFinished: !!newRec.is_soft_finished,
                        shootLocation: newRec.shoot_location,
                        shootTimeStart: newRec.shoot_time_start,
                        shootTimeEnd: newRec.shoot_time_end,
                        shootNotes: newRec.shoot_notes,
                        channelId: newRec.channel_id
                    });
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [checkAndRefreshIfNeeded, injectSingleItem, updateLocalItem, removeItemLocally]);

    // Selection Handlers
    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedIdsInView.length === filteredItems.length && filteredItems.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredItems.map(i => i.id));
        }
    };

    const handleClearSelection = () => {
        setSelectedIds([]);
    };

    // Reorder Handlers
    const handleReorder = async (newItems: MergedQueueItem[]) => {
        setQueueItems(newItems.map((item, index) => ({ ...item, sort_order: index })));

        try {
            const updates = newItems.map((item, index) => {
                const table = item.type === 'CONTENT' ? 'contents' : 'scripts';
                return supabase
                    .from(table)
                    .update({ sort_order: index })
                    .eq('id', item.id);
            });

            await Promise.all(updates);
        } catch (err) {
            console.error('Reorder update failed:', err);
            showToast('จัดลำดับไม่สำเร็จ', 'error');
            refreshQueue(true);
        }
    };

    // Single item removal
    const handleRemoveFromQueue = async (item: MergedQueueItem) => {
        const confirmed = await showConfirm(
            `คุณต้องการนำรายการ "${item.title}" ออกจากคิวถ่ายทำใช่หรือไม่?`,
            'ยืนยันการนำออก'
        );

        if (confirmed) {
            removeItemLocally(item.id);
            setSelectedIds(prev => prev.filter(id => id !== item.id));

            try {
                const table = item.type === 'CONTENT' ? 'contents' : 'scripts';
                const { error } = await supabase
                    .from(table)
                    .update({ is_in_shoot_queue: false })
                    .eq('id', item.id);

                if (error) throw error;
                showToast('นำออกจากคิวเรียบร้อย', 'success');
            } catch (err) {
                console.error('Remove from queue failed:', err);
                showToast('นำออกจากคิวไม่สำเร็จ', 'error');
                refreshQueue(true);
            }
        }
    };

    // Mechanism 1: Quick Action - Clear Unfinished items in one click
    const handleClearUnfinished = async () => {
        const unfinished = filteredItems.filter(i => !i.isSoftFinished);
        if (unfinished.length === 0) {
            showToast('ไม่มีรายการที่ยังไม่เสร็จในคิวถ่ายทำ', 'info');
            return;
        }

        const confirmed = await showConfirm(
            `คุณต้องการนำรายการที่ยังถ่ายไม่เสร็จทั้งหมด (${unfinished.length} รายการ) ออกจากคิวถ่ายทำใช่หรือไม่?`,
            'ยืนยันล้างรายการที่ยังไม่เสร็จ'
        );

        if (confirmed) {
            showLoading('กำลังนำรายการที่ยังไม่เสร็จออกจากคิว...');
            try {
                const idsToRemove = unfinished.map(i => i.id);
                await batchRemoveFromQueue(idsToRemove);
                setSelectedIds(prev => prev.filter(id => !idsToRemove.includes(id)));
                showToast(`นำรายการที่ยังไม่เสร็จ ${unfinished.length} รายการออกจากคิวเรียบร้อย ✨`, 'success');
            } catch (err) {
                console.error('Clear unfinished queue failed:', err);
                showToast('เกิดข้อผิดพลาดในการล้างรายการที่ยังไม่เสร็จ', 'error');
            } finally {
                hideLoading();
            }
        }
    };

    // Mechanism 1: Quick Action - Clear All items in queue
    const handleClearAll = async () => {
        if (filteredItems.length === 0) return;

        const confirmed = await showConfirm(
            `คุณต้องการนำรายการทั้งหมดในคิว (${filteredItems.length} รายการ) ออกจากคิวถ่ายทำใช่หรือไม่?`,
            'ยืนยันล้างคิวถ่ายทำทั้งหมด'
        );

        if (confirmed) {
            showLoading('กำลังล้างคิวถ่ายทำทั้งหมด...');
            try {
                const idsToRemove = filteredItems.map(i => i.id);
                await batchRemoveFromQueue(idsToRemove);
                setSelectedIds([]);
                showToast('ล้างคิวถ่ายทำทั้งหมดเรียบร้อย ✨', 'success');
            } catch (err) {
                console.error('Clear all queue failed:', err);
                showToast('เกิดข้อผิดพลาดในการล้างคิว', 'error');
            } finally {
                hideLoading();
            }
        }
    };

    // Mechanism 2: Batch Remove Selected items
    const handleBatchRemoveSelected = async () => {
        if (selectedIdsInView.length === 0) return;

        const confirmed = await showConfirm(
            `คุณต้องการนำรายการที่เลือก (${selectedIdsInView.length} รายการ) ออกจากคิวถ่ายทำใช่หรือไม่?`,
            'ยืนยันการนำออกที่เลือก'
        );

        if (confirmed) {
            showLoading('กำลังนำรายการที่เลือกออกจากคิว...');
            try {
                await batchRemoveFromQueue(selectedIdsInView);
                setSelectedIds(prev => prev.filter(id => !selectedIdsInView.includes(id)));
                showToast(`นำรายการที่เลือก ${selectedIdsInView.length} รายการออกจากคิวเรียบร้อย ✨`, 'success');
            } catch (err) {
                console.error('Batch remove selected failed:', err);
                showToast('เกิดข้อผิดพลาดในการนำรายการออก', 'error');
            } finally {
                hideLoading();
            }
        }
    };

    // Mechanism 2: Batch Mark Finished / Unfinished for selected items
    const handleBatchToggleFinishSelected = async (markFinished: boolean) => {
        if (selectedIdsInView.length === 0) return;

        showLoading(markFinished ? 'กำลังทำเครื่องหมายว่าถ่ายเสร็จ...' : 'กำลังยกเลิกสถานะถ่ายเสร็จ...');
        try {
            const itemsToUpdate = filteredItems.filter(i => selectedIdsInView.includes(i.id));
            const contentIds = itemsToUpdate.filter(i => i.type === 'CONTENT').map(i => i.id);
            const scriptIds = itemsToUpdate.filter(i => i.type === 'SCRIPT').map(i => i.id);

            // Optimistic update
            itemsToUpdate.forEach(item => {
                updateLocalItem(item.id, { isSoftFinished: markFinished });
            });

            if (contentIds.length > 0) {
                const { error: contentErr } = await supabase
                    .from('contents')
                    .update({ is_soft_finished: markFinished })
                    .in('id', contentIds);
                if (contentErr) throw contentErr;
            }
            if (scriptIds.length > 0) {
                const { error: scriptErr } = await supabase
                    .from('scripts')
                    .update({ is_soft_finished: markFinished })
                    .in('id', scriptIds);
                if (scriptErr) throw scriptErr;
            }
            showToast(`อัปเดตสถานะ ${selectedIdsInView.length} รายการเรียบร้อย ✨`, 'success');
        } catch (err) {
            console.error('Batch toggle finish failed:', err);
            showToast('อัปเดตสถานะไม่สำเร็จ', 'error');
            refreshQueue(true);
        } finally {
            hideLoading();
        }
    };

    const toggleFinished = async (item: MergedQueueItem) => {
        const newStatus = !item.isSoftFinished;
        updateLocalItem(item.id, { isSoftFinished: newStatus });

        try {
            const table = item.type === 'CONTENT' ? 'contents' : 'scripts';
            const { error } = await supabase
                .from(table)
                .update({ is_soft_finished: newStatus })
                .eq('id', item.id);
            
            if (error) throw error;
        } catch (err) {
            console.error('Toggle soft finish failed:', err);
            updateLocalItem(item.id, { isSoftFinished: !newStatus });
            showToast('อัปเดตสถานะไม่สำเร็จ', 'error');
        }
    };

    const handleMarkAsDone = async (item: MergedQueueItem) => {
        const confirmed = await showConfirm(
            `คุณถ่ายทำรายการ "${item.title}" เสร็จแล้วใช่หรือไม่?`,
            'ยืนยันการถ่ายทำเสร็จสิ้น'
        );

        if (confirmed) {
            toggleFinished(item);
        }
    };

    // Batch Process Completed items into Next Pipeline Stage
    const handleBatchProcess = async () => {
        if (finishedCount === 0 || isBatchProcessing) return;
        
        const confirmed = await showConfirm(
            `คุณต้องการประมวลผลรายการที่ถ่ายเสร็จแล้วทั้งหมด ${finishedCount} รายการ ใช่หรือไม่?`,
            'ยืนยันการประมวลผลทั้งหมด'
        );
        
        if (!confirmed) return;

        setIsBatchProcessing(true);
        showLoading('กำลังอัปเดตสถานะรายการทั้งหมด...');

        try {
            const itemsToProcess = filteredItems.filter(i => i.isSoftFinished);
            const contentIds = itemsToProcess.filter(i => i.type === 'CONTENT').map(i => i.id);
            const scriptIds = itemsToProcess.filter(i => i.type === 'SCRIPT').map(i => i.id);

            const linkedScriptIds = itemsToProcess
                .filter(i => i.type === 'CONTENT' && i.scriptId)
                .map(i => i.scriptId as string);
            
            const linkedContentIds = itemsToProcess
                .filter(i => i.type === 'SCRIPT' && i.contentId)
                .map(i => i.contentId as string);

            const allContentIds = Array.from(new Set([...contentIds, ...linkedContentIds]));
            const allScriptIds = Array.from(new Set([...scriptIds, ...linkedScriptIds]));

            if (allContentIds.length > 0) {
                const { error: contentError } = await supabase
                    .from('contents')
                    .update({ 
                        status: 'EDIT_CLIP', 
                        is_in_shoot_queue: false,
                        is_soft_finished: false
                    })
                    .in('id', allContentIds);
                if (contentError) throw contentError;
            }

            if (allScriptIds.length > 0) {
                const { error: scriptError } = await supabase
                    .from('scripts')
                    .update({ 
                        status: 'DONE', 
                        is_in_shoot_queue: false,
                        is_soft_finished: false
                    })
                    .in('id', allScriptIds);
                if (scriptError) throw scriptError;
            }

            // Local update to remove processed items
            setQueueItems(queueItems.filter(i => !itemsToProcess.some(p => p.id === i.id)));
            setSelectedIds(prev => prev.filter(id => !itemsToProcess.some(p => p.id === id)));
            showToast(`ประมวลผลสำเร็จ ${itemsToProcess.length} รายการ! 🎬`, 'success');
        } catch (err) {
            console.error('Batch process failed:', err);
            showToast('เกิดข้อผิดพลาดในการประมวลผลบางรายการ', 'error');
            refreshQueue(true);
        } finally {
            setIsBatchProcessing(false);
            hideLoading();
        }
    };

    const handleSavePlanning = async (id: string, type: 'CONTENT' | 'SCRIPT', data: Partial<MergedQueueItem>) => {
        try {
            const table = type === 'CONTENT' ? 'contents' : 'scripts';
            const payload = {
                shoot_location: data.shootLocation,
                shoot_time_start: data.shootTimeStart,
                shoot_time_end: data.shootTimeEnd,
                shoot_notes: data.shootNotes
            };

            const { error } = await supabase.from(table).update(payload).eq('id', id);
            if (error) throw error;

            updateLocalItem(id, data);
            showToast('บันทึกแผนเรียบร้อย ✨', 'success');
        } catch (err) {
            console.error('Save planning failed:', err);
            showToast('บันทึกไม่สำเร็จ', 'error');
            throw err;
        }
    };

    const handleSortByTime = async () => {
        const sorted = [...queueItems].sort((a, b) => {
            const timeA = a.shootTimeStart || '99:99';
            const timeB = b.shootTimeStart || '99:99';
            return timeA.localeCompare(timeB);
        });

        const updates = sorted.map((item, index) => {
            const table = item.type === 'CONTENT' ? 'contents' : 'scripts';
            return supabase.from(table).update({ sort_order: index }).eq('id', item.id);
        });

        try {
            showLoading('กำลังจัดเรียงตามเวลา...');
            await Promise.all(updates);
            setQueueItems(sorted);
            showToast('จัดเรียงตามเวลาเรียบร้อย ⏳', 'success');
        } catch (err) {
            console.error('Sort by time failed:', err);
            showToast('จัดเรียงไม่สำเร็จ', 'error');
        } finally {
            hideLoading();
        }
    };

    const handleEditScript = (scriptId: string) => {
        if (!onEditScript || !scriptId) return;
        setIsRedirecting(true);
        setTimeout(() => {
            onEditScript(scriptId);
        }, 1200);
    };

    if (isContextLoading && queueItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
                <p className="font-medium animate-pulse">กำลังเตรียมคิวถ่ายทำ...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header with Quick Actions & Filters */}
            <QueueHeader 
                includeScripts={includeScripts}
                setIncludeScripts={setIncludeScripts}
                viewMode={viewMode}
                setViewMode={setViewMode}
                totalCount={filteredItems.length}
                finishedCount={finishedCount}
                unfinishedCount={unfinishedCount}
                selectedCount={selectedIdsInView.length}
                isBatchProcessing={isBatchProcessing}
                onBatchProcess={handleBatchProcess}
                onSortByTime={handleSortByTime}
                onClearUnfinished={handleClearUnfinished}
                onClearAll={handleClearAll}
                onSelectAll={handleSelectAll}
                isAllSelected={filteredItems.length > 0 && selectedIdsInView.length === filteredItems.length}
            />

            {/* Empty State */}
            {filteredItems.length === 0 ? (
                <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-16 text-center flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                        <Video className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">ยังไม่มีรายการในคิวถ่าย 🎬</h3>
                    <p className="text-gray-500 max-w-xs mx-auto">
                        เลือกคอนเทนต์จากหน้าคลัง หรือสคริปต์จากหน้า Hub เพื่อเพิ่มเข้าคิวถ่ายทำวันนี้
                    </p>
                </div>
            ) : (
                viewMode === 'GRID' ? (
                    <QueueGridView 
                        items={filteredItems}
                        channels={channels}
                        masterOptions={masterOptions}
                        isProcessing={isProcessing}
                        selectedIds={selectedIdsInView}
                        onToggleSelect={handleToggleSelect}
                        onEditContent={onEditContent}
                        onEditScript={handleEditScript}
                        onToggleFinished={toggleFinished}
                        onMarkAsDone={handleMarkAsDone}
                        onRemove={handleRemoveFromQueue}
                        onOpenPlanning={(item) => setPlanningItem(item)}
                    />
                ) : (
                    <QueueTableView 
                        items={filteredItems}
                        channels={channels}
                        masterOptions={masterOptions}
                        isProcessing={isProcessing}
                        selectedIds={selectedIdsInView}
                        onToggleSelect={handleToggleSelect}
                        onSelectAll={handleSelectAll}
                        onEditContent={onEditContent}
                        onEditScript={handleEditScript}
                        onToggleFinished={toggleFinished}
                        onMarkAsDone={handleMarkAsDone}
                        onReorder={handleReorder}
                        onRemove={handleRemoveFromQueue}
                        onOpenPlanning={(item) => setPlanningItem(item)}
                    />
                )
            )}

            {/* Floating Multi-Select Batch Action Bar */}
            <AnimatePresence>
                {selectedIdsInView.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        className="fixed bottom-6 inset-x-4 max-w-2xl mx-auto z-40"
                    >
                        <div className="bg-slate-900/95 backdrop-blur-xl text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-white/20 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-xs text-white">
                                    {selectedIdsInView.length}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-200">
                                        เลือกอยู่ {selectedIdsInView.length} จาก {filteredItems.length} รายการ
                                    </p>
                                    <button
                                        onClick={handleSelectAll}
                                        className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-medium"
                                    >
                                        {selectedIdsInView.length === filteredItems.length ? 'ยกเลิกเลือกทั้งหมด' : 'เลือกทั้งหมดในคิว'}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Mark Finished / Unfinished */}
                                <button
                                    onClick={() => handleBatchToggleFinishSelected(true)}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all active:scale-95"
                                    title="ทำเครื่องหมายว่าถ่ายเสร็จแล้วทั้งหมดที่เลือก"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>ถ่ายเสร็จแล้ว</span>
                                </button>

                                {/* Batch Remove Button */}
                                <button
                                    onClick={handleBatchRemoveSelected}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-lg shadow-rose-950/40"
                                    title="นำรายการที่เลือกออกจากคิวถ่ายทำทั้งหมด"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>นำออกจากคิว ({selectedIdsInView.length})</span>
                                </button>

                                {/* Close / Deselect */}
                                <button
                                    onClick={handleClearSelection}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                                    title="ยกเลิกการเลือก"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Shoot Planning Modal */}
            {planningItem && (
                <ShootPlanningModal 
                    isOpen={!!planningItem}
                    item={planningItem}
                    onClose={() => setPlanningItem(null)}
                    onSave={handleSavePlanning}
                    masterOptions={masterOptions}
                />
            )}

            {/* Redirection Loading Modal */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isRedirecting && (
                        <motion.div
                            key="redirect-modal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[10000] flex items-center justify-center bg-white"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: -20 }}
                                className="flex flex-col items-center max-w-sm w-full mx-4"
                            >
                                <div className="relative mb-10">
                                    <motion.div 
                                        animate={{ 
                                            rotate: [0, -15, 0],
                                            scale: [1, 1.1, 1]
                                        }}
                                        transition={{ 
                                            duration: 2.5, 
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                        className="w-28 h-28 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-200"
                                    >
                                        <Clapperboard className="w-14 h-14 text-white" />
                                    </motion.div>
                                    <motion.div
                                        animate={{ scale: [1, 1.3, 1], rotate: [0, 90, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute -top-3 -right-3 w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg transform rotate-12"
                                    >
                                        <Sparkles className="w-6 h-6 text-white" />
                                    </motion.div>
                                </div>

                                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Preparing Script...</h3>
                                <p className="text-slate-400 text-sm font-bold text-center mb-10 leading-relaxed px-6">
                                    กำลังพาคุณไปยังหน้า Script Hub<br/>เพื่อเริ่มอ่านบทสำหรับการถ่ายทำวันนี้
                                </p>

                                <div className="flex items-center gap-2.5">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div 
                                            key={i}
                                            animate={{ 
                                                scale: [1, 1.6, 1],
                                                opacity: [0.3, 1, 0.3]
                                            }}
                                            transition={{ 
                                                duration: 1, 
                                                repeat: Infinity, 
                                                delay: i * 0.2 
                                            }}
                                            className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-sm shadow-indigo-100" 
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default StockShootQueue;
