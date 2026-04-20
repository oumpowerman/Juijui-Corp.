import React, { useState, useEffect, useMemo } from 'react';
import { Task, ScriptSummary, Channel, User, MasterOption } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { Loader2, Video } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';

// Sub-components
import { MergedQueueItem, QueueViewMode } from './queue/types';
import QueueHeader from './queue/QueueHeader';
import QueueGridView from './queue/QueueGridView';
import QueueTableView from './queue/QueueTableView';

interface StockShootQueueProps {
    channels: Channel[];
    users: User[];
    masterOptions: MasterOption[];
    onEditContent: (task: Task) => void;
    onEditScript?: (scriptId: string) => void;
}

const StockShootQueue: React.FC<StockShootQueueProps> = ({ channels, users, masterOptions, onEditContent, onEditScript }) => {
    const { showToast } = useToast();
    const { showConfirm, showLoading, hideLoading } = useGlobalDialog();
    const [isLoading, setIsLoading] = useState(true);
    const [includeScripts, setIncludeScripts] = useState(true);
    const [queueItems, setQueueItems] = useState<MergedQueueItem[]>([]);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [isBatchProcessing, setIsBatchProcessing] = useState(false);
    const [viewMode, setViewMode] = useState<QueueViewMode>('TABLE');

    const finishedCount = useMemo(() => 
        queueItems.filter(i => i.isSoftFinished).map(i => i.id).length
    , [queueItems]);

    const fetchQueue = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Contents in Queue
            const { data: contents, error: contentError } = await supabase
                .from('contents')
                .select('*')
                .eq('is_in_shoot_queue', true)
                .order('sort_order', { ascending: true });

            if (contentError) throw contentError;

            let merged: MergedQueueItem[] = (contents || []).map(c => ({
                id: c.id,
                type: 'CONTENT',
                title: c.title,
                status: c.status,
                isSoftFinished: !!c.is_soft_finished,
                channelId: c.channel_id,
                sort_order: c.sort_order || 0,
                item: {
                    id: c.id,
                    type: 'CONTENT',
                    title: c.title,
                    description: c.description || '',
                    status: c.status,
                    priority: c.priority,
                    startDate: new Date(c.start_date),
                    endDate: new Date(c.end_date),
                    channelId: c.channel_id,
                    isInShootQueue: true,
                    isSoftFinished: !!c.is_soft_finished,
                } as any
            }));

            // 2. Fetch Scripts in Queue if enabled
            if (includeScripts) {
                const { data: scripts, error: scriptError } = await supabase
                    .from('scripts')
                    .select('*, contents(title)')
                    .eq('is_in_shoot_queue', true)
                    .order('sort_order', { ascending: true });

                if (scriptError) throw scriptError;

                (scripts || []).forEach(s => {
                    const existingContentIndex = merged.findIndex(m => m.id === s.content_id);
                    
                    if (existingContentIndex !== -1) {
                        merged[existingContentIndex].scriptId = s.id;
                    } else {
                        merged.push({
                            id: s.id,
                            type: 'SCRIPT',
                            title: s.title,
                            status: s.status,
                            isSoftFinished: !!s.is_soft_finished,
                            channelId: s.channel_id,
                            contentId: s.content_id,
                            sort_order: s.sort_order || 0,
                            item: {
                                id: s.id,
                                title: s.title,
                                status: s.status,
                                contentId: s.content_id,
                                isInShootQueue: true,
                                isSoftFinished: !!s.is_soft_finished,
                            } as any
                        });
                    }
                });
            }

            // Final sort after merging
            merged.sort((a, b) => a.sort_order - b.sort_order);
            setQueueItems(merged);
        } catch (err) {
            console.error('Fetch queue failed:', err);
            showToast('โหลดคิวถ่ายไม่สำเร็จ', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();

        // Realtime Subscription
        const channel = supabase.channel('shoot-queue-realtime')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'contents' }, (payload) => {
                const updated = payload.new as any;
                setQueueItems(prev => {
                    if (!updated.is_in_shoot_queue) {
                        return prev.filter(i => i.id !== updated.id);
                    }
                    return prev.map(i => i.id === updated.id ? {
                        ...i,
                        title: updated.title,
                        status: updated.status,
                        isSoftFinished: !!updated.is_soft_finished,
                        channelId: updated.channel_id
                    } : i);
                });
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'scripts' }, (payload) => {
                const updated = payload.new as any;
                setQueueItems(prev => {
                    if (!updated.is_in_shoot_queue) {
                        return prev.filter(i => i.id !== updated.id);
                    }
                    return prev.map(i => i.id === updated.id ? {
                        ...i,
                        title: updated.title,
                        status: updated.status,
                        isSoftFinished: !!updated.is_soft_finished,
                        channelId: updated.channel_id
                    } : i);
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [includeScripts]);

    const handleReorder = async (newItems: MergedQueueItem[]) => {
        // Optimistic update
        setQueueItems(newItems.map((item, index) => ({ ...item, sort_order: index })));

        try {
            // Save new order to database
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
            // We could fetch queue again to revert, but usually DnD is fine locally
        }
    };

    const handleRemoveFromQueue = async (item: MergedQueueItem) => {
        const confirmed = await showConfirm(
            `คุณต้องการนำรายการ "${item.title}" ออกจากคิวถ่ายทำใช่หรือไม่?`,
            'ยืนยันการนำออก'
        );

        if (confirmed) {
            // Optimistic update
            setQueueItems(prev => prev.filter(i => i.id !== item.id));

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
                fetchQueue(); // Revert
            }
        }
    };

    const handleMarkAsDone = async (item: MergedQueueItem) => {
        const confirmed = await showConfirm(
            `คุณถ่ายทำรายการ "${item.title}" เสร็จแล้วใช่หรือไม่?`,
            'ยืนยันการถ่ายทำเสร็จสิ้น'
        );

        if (confirmed) {
            // Optimistic UI Update
            setQueueItems(prev => prev.map(i => i.id === item.id ? { ...i, isSoftFinished: true } : i));
            
            try {
                const table = item.type === 'CONTENT' ? 'contents' : 'scripts';
                const { error } = await supabase
                    .from(table)
                    .update({ is_soft_finished: true })
                    .eq('id', item.id);
                
                if (error) throw error;
                showToast('ทำเครื่องหมายว่าถ่ายเสร็จแล้ว', 'success');
            } catch (err) {
                console.error('Update soft finish failed:', err);
                // Revert on error
                setQueueItems(prev => prev.map(i => i.id === item.id ? { ...i, isSoftFinished: false } : i));
                showToast('อัปเดตสถานะไม่สำเร็จ', 'error');
            }
        }
    };

    const toggleFinished = async (item: MergedQueueItem) => {
        const newStatus = !item.isSoftFinished;
        
        // Optimistic UI Update
        setQueueItems(prev => prev.map(i => i.id === item.id ? { ...i, isSoftFinished: newStatus } : i));

        try {
            const table = item.type === 'CONTENT' ? 'contents' : 'scripts';
            const { error } = await supabase
                .from(table)
                .update({ is_soft_finished: newStatus })
                .eq('id', item.id);
            
            if (error) throw error;
        } catch (err) {
            console.error('Toggle soft finish failed:', err);
            // Revert on error
            setQueueItems(prev => prev.map(i => i.id === item.id ? { ...i, isSoftFinished: !newStatus } : i));
            showToast('อัปเดตสถานะไม่สำเร็จ', 'error');
        }
    };

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
            const itemsToProcess = queueItems.filter(i => i.isSoftFinished);
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

            // Bulk Update Contents
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

            // Bulk Update Scripts
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
            setQueueItems(prev => prev.filter(i => !i.isSoftFinished));
            showToast(`ประมวลผลสำเร็จ ${itemsToProcess.length} รายการ! 🎬`, 'success');
        } catch (err) {
            console.error('Batch process failed:', err);
            showToast('เกิดข้อผิดพลาดในการประมวลผลบางรายการ', 'error');
        } finally {
            setIsBatchProcessing(false);
            hideLoading();
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
                <p className="font-medium animate-pulse">กำลังเตรียมคิวถ่ายทำ...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <QueueHeader 
                includeScripts={includeScripts}
                setIncludeScripts={setIncludeScripts}
                viewMode={viewMode}
                setViewMode={setViewMode}
                finishedCount={finishedCount}
                isBatchProcessing={isBatchProcessing}
                onBatchProcess={handleBatchProcess}
            />

            {queueItems.length === 0 ? (
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
                        items={queueItems}
                        channels={channels}
                        masterOptions={masterOptions}
                        isProcessing={isProcessing}
                        onEditContent={onEditContent}
                        onEditScript={onEditScript}
                        onToggleFinished={toggleFinished}
                        onMarkAsDone={handleMarkAsDone}
                        onRemove={handleRemoveFromQueue}
                    />
                ) : (
                    <QueueTableView 
                        items={queueItems}
                        channels={channels}
                        masterOptions={masterOptions}
                        isProcessing={isProcessing}
                        onEditContent={onEditContent}
                        onEditScript={onEditScript}
                        onToggleFinished={toggleFinished}
                        onMarkAsDone={handleMarkAsDone}
                        onReorder={handleReorder}
                        onRemove={handleRemoveFromQueue}
                    />
                )
            )}
        </div>
    );
};

export default StockShootQueue;
