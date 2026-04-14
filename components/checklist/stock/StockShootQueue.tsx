
import React, { useState, useEffect, useMemo } from 'react';
import { Task, ScriptSummary, Channel, User, MasterOption } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { Loader2, CheckCircle2, Video, FileText, ArrowRight, Info, Filter, LayoutGrid, ListChecks } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../../context/ToastContext';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';

interface StockShootQueueProps {
    channels: Channel[];
    users: User[];
    masterOptions: MasterOption[];
    onEditContent: (task: Task) => void;
    onEditScript?: (scriptId: string) => void;
}

interface MergedQueueItem {
    id: string;
    type: 'CONTENT' | 'SCRIPT';
    title: string;
    status: string;
    channelId?: string;
    contentId?: string; // For scripts
    scriptId?: string;  // For contents that have a linked script
    item: Task | ScriptSummary;
}

const StockShootQueue: React.FC<StockShootQueueProps> = ({ channels, users, masterOptions, onEditContent, onEditScript }) => {
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [includeScripts, setIncludeScripts] = useState(true);
    const [queueItems, setQueueItems] = useState<MergedQueueItem[]>([]);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const fetchQueue = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Contents in Queue
            const { data: contents, error: contentError } = await supabase
                .from('contents')
                .select('*')
                .eq('is_in_shoot_queue', true);

            if (contentError) throw contentError;

            let merged: MergedQueueItem[] = (contents || []).map(c => ({
                id: c.id,
                type: 'CONTENT',
                title: c.title,
                status: c.status,
                channelId: c.channel_id,
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
                    // ... other fields as needed or just cast
                } as any
            }));

            // 2. Fetch Scripts in Queue if enabled
            if (includeScripts) {
                const { data: scripts, error: scriptError } = await supabase
                    .from('scripts')
                    .select('*, contents(title)')
                    .eq('is_in_shoot_queue', true);

                if (scriptError) throw scriptError;

                (scripts || []).forEach(s => {
                    // Check if this script is already linked to a content in the merged list
                    const existingContentIndex = merged.findIndex(m => m.id === s.content_id);
                    
                    if (existingContentIndex !== -1) {
                        // Link script to existing content item
                        merged[existingContentIndex].scriptId = s.id;
                    } else {
                        // Add as standalone script item
                        merged.push({
                            id: s.id,
                            type: 'SCRIPT',
                            title: s.title,
                            status: s.status,
                            channelId: s.channel_id,
                            contentId: s.content_id,
                            item: {
                                id: s.id,
                                title: s.title,
                                status: s.status,
                                contentId: s.content_id,
                                isInShootQueue: true,
                                // ... other fields
                            } as any
                        });
                    }
                });
            }

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
    }, [includeScripts]);

    const handleMarkAsDone = async (item: MergedQueueItem) => {
        if (isProcessing) return;
        setIsProcessing(item.id);

        try {
            if (item.type === 'CONTENT') {
                // Update Content
                const { error: contentError } = await supabase
                    .from('contents')
                    .update({ 
                        status: 'EDIT_CLIP', 
                        is_in_shoot_queue: false 
                    })
                    .eq('id', item.id);

                if (contentError) throw contentError;

                // If it has a linked script, update that too
                if (item.scriptId) {
                    await supabase
                        .from('scripts')
                        .update({ 
                            status: 'DONE', 
                            is_in_shoot_queue: false 
                        })
                        .eq('id', item.scriptId);
                }
            } else {
                // Update Script
                const { error: scriptError } = await supabase
                    .from('scripts')
                    .update({ 
                        status: 'DONE', 
                        is_in_shoot_queue: false 
                    })
                    .eq('id', item.id);

                if (scriptError) throw scriptError;

                // If it has a linked content, update that too
                if (item.contentId) {
                    await supabase
                        .from('contents')
                        .update({ 
                            status: 'EDIT_CLIP', 
                            is_in_shoot_queue: false 
                        })
                        .eq('id', item.contentId);
                }
            }

            showToast('ถ่ายทำเสร็จสิ้น! ส่งต่อไปยังขั้นตอนตัดต่อแล้ว 🎬', 'success');
            // Remove from local list
            setQueueItems(prev => prev.filter(i => i.id !== item.id));
        } catch (err) {
            console.error('Mark as done failed:', err);
            showToast('อัปเดตสถานะไม่สำเร็จ', 'error');
        } finally {
            setIsProcessing(null);
        }
    };

    const getChannel = (channelId?: string) => {
        return channels.find(c => c.id === channelId);
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
            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/60">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                        <ListChecks className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Checklist ถ่ายทำวันนี้</h2>
                        <p className="text-xs text-gray-500">จัดการรายการที่ต้องถ่ายทำในวันนี้ให้เสร็จสิ้น</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-gray-100/50 p-1 rounded-xl border border-gray-200">
                    <button 
                        onClick={() => setIncludeScripts(true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${includeScripts ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        รวมสคริปต์จาก Hub
                    </button>
                    <button 
                        onClick={() => setIncludeScripts(false)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!includeScripts ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        เฉพาะ Content Stock
                    </button>
                </div>
            </div>

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode='popLayout'>
                        {queueItems.map((item) => {
                            const channel = getChannel(item.channelId);
                            const isProcessingThis = isProcessing === item.id;

                            return (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                    className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
                                >
                                    <div className="p-5 flex-1">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                {item.type === 'CONTENT' ? (
                                                    <div className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-bold border border-amber-100 flex items-center gap-1">
                                                        <LayoutGrid className="w-3 h-3" />
                                                        CONTENT
                                                    </div>
                                                ) : (
                                                    <div className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold border border-blue-100 flex items-center gap-1">
                                                        <FileText className="w-3 h-3" />
                                                        SCRIPT
                                                    </div>
                                                )}
                                                {item.scriptId && (
                                                    <div className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-bold border border-green-100 flex items-center gap-1" title="มีสคริปต์ผูกอยู่">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        LINKED
                                                    </div>
                                                )}
                                            </div>
                                            {channel && (
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-full border border-gray-100">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: channel.color.split(' ')[0].replace('bg-', '') }} />
                                                    <span className="text-[10px] font-bold text-gray-600">{channel.name}</span>
                                                </div>
                                            )}
                                        </div>

                                        <h4 className="text-md font-bold text-gray-800 line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">
                                            {item.title}
                                        </h4>
                                        
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <span className="px-2 py-0.5 bg-gray-100 rounded-md">{item.status}</span>
                                            {item.type === 'SCRIPT' && (item.item as ScriptSummary).estimatedDuration > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <Info className="w-3 h-3" />
                                                    ~{(item.item as ScriptSummary).estimatedDuration} นาที
                                                </span>
                                            )}
                                            {item.type === 'CONTENT' && (item.item as Task).estimatedHours && (item.item as Task).estimatedHours! > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <Info className="w-3 h-3" />
                                                    ~{(item.item as Task).estimatedHours} ชม.
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="px-5 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between gap-3">
                                        <button 
                                            onClick={() => {
                                                if (item.type === 'CONTENT') onEditContent(item.item as Task);
                                                else if (onEditScript) onEditScript(item.id);
                                            }}
                                            className="text-xs font-bold text-gray-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                                        >
                                            ดูรายละเอียด <ArrowRight className="w-3 h-3" />
                                        </button>

                                        <button
                                            onClick={() => handleMarkAsDone(item)}
                                            disabled={isProcessingThis}
                                            className={`
                                                flex items-center gap-2 px-4 py-2 rounded-xl
                                                font-bold text-xs transition-all
                                                ${isProcessingThis 
                                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                                    : 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 active:scale-95'}
                                            `}
                                        >
                                            {isProcessingThis ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                            )}
                                            ถ่ายเสร็จแล้ว
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default StockShootQueue;
