
import React, { useState, useEffect } from 'react';
import { MasterOption, Task, Reward } from '../types';
import { useMasterData } from '../hooks/useMasterData';
import { useRewards } from '../hooks/useRewards';
import { Plus, Edit2, Trash2, Save, X, Layers, Type, Tag, Loader2, Database, Power, Check, Activity, Download, HardDrive, AlertTriangle, Archive, Search, RefreshCw, CheckCircle2, Calendar, FileText, MessageSquare, FileJson, Filter, Gift } from 'lucide-react';
import MentorTip from './MentorTip';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { format, addMonths } from 'date-fns';
import { STATUS_LABELS } from '../constants';

const MasterDataManager: React.FC = () => {
    const { masterOptions, isLoading: masterLoading, addMasterOption, updateMasterOption, deleteMasterOption } = useMasterData();
    const { rewards, isLoading: rewardsLoading, addReward, updateReward, deleteReward } = useRewards(null); // Passing null as we are admin editing
    
    const [activeTab, setActiveTab] = useState<'PILLAR' | 'FORMAT' | 'CATEGORY' | 'STATUS' | 'REWARDS' | 'MAINTENANCE'>('PILLAR');
    const { showToast } = useToast();
    
    // Form State (Master Options)
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        key: '',
        label: '',
        color: 'bg-gray-100 text-gray-700',
        sortOrder: 0,
        isActive: true
    });

    // Form State (Rewards)
    const [rewardFormData, setRewardFormData] = useState<Partial<Reward>>({
        title: '',
        description: '',
        cost: 100,
        icon: '🎁',
        isActive: true
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Maintenance State
    const [isExporting, setIsExporting] = useState(false);
    const [hasBackedUp, setHasBackedUp] = useState(false);
    const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
    const [backupData, setBackupData] = useState<any>(null);
    
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<{chatCount: number, taskCount: number} | null>(null);
    const [isCleaning, setIsCleaning] = useState(false);
    const [cleanupMonths, setCleanupMonths] = useState(6);
    
    // Cleanup Configuration State
    const [cleanupTargetStatuses, setCleanupTargetStatuses] = useState<string[]>(['DONE']);
    const [isStatusSelectorOpen, setIsStatusSelectorOpen] = useState(false);
    
    // Cleanup Modal State
    const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
    const [confirmInput, setConfirmInput] = useState('');
    const [isBackupVerified, setIsBackupVerified] = useState(false);

    const filteredOptions = masterOptions.filter(o => o.type === activeTab);
    
    // Get Status Options for Cleanup
    const statusOptions = masterOptions.filter(o => o.type === 'STATUS');
    const availableStatusKeys = statusOptions.length > 0 
        ? statusOptions.map(o => ({ key: o.key, label: o.label })) 
        : Object.entries(STATUS_LABELS).map(([k, v]) => ({ key: k, label: v }));

    // Color Presets for easy selection
    const COLOR_PRESETS = [
        { name: 'Gray', class: 'bg-gray-100 text-gray-700' },
        { name: 'Red', class: 'bg-red-100 text-red-700' },
        { name: 'Orange', class: 'bg-orange-100 text-orange-700' },
        { name: 'Yellow', class: 'bg-yellow-100 text-yellow-700' },
        { name: 'Green', class: 'bg-green-100 text-green-700' },
        { name: 'Teal', class: 'bg-teal-100 text-teal-700' },
        { name: 'Blue', class: 'bg-blue-100 text-blue-700' },
        { name: 'Indigo', class: 'bg-indigo-100 text-indigo-700' },
        { name: 'Purple', class: 'bg-purple-100 text-purple-700' },
        { name: 'Pink', class: 'bg-pink-100 text-pink-700' },
    ];

    // --- Master Option Handlers ---
    const handleEdit = (option: MasterOption) => {
        setEditingId(option.id);
        setFormData({
            key: option.key,
            label: option.label,
            color: option.color || 'bg-gray-100 text-gray-700',
            sortOrder: option.sortOrder,
            isActive: option.isActive
        });
        setIsEditing(true);
    };

    const handleCreate = () => {
        setEditingId(null);
        setFormData({
            key: '',
            label: '',
            color: 'bg-gray-100 text-gray-700',
            sortOrder: filteredOptions.length + 1,
            isActive: true
        });
        setIsEditing(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (activeTab === 'MAINTENANCE') return;
        if (activeTab === 'REWARDS') {
            await handleRewardSubmit();
            return;
        }
        
        setIsSubmitting(true);

        const payload = {
            type: activeTab as 'PILLAR' | 'FORMAT' | 'CATEGORY' | 'STATUS',
            key: formData.key.toUpperCase().replace(/\s+/g, '_'),
            label: formData.label,
            color: formData.color,
            sortOrder: formData.sortOrder,
            isActive: formData.isActive
        };

        let success = false;
        if (editingId) {
            success = await updateMasterOption({ id: editingId, ...payload });
        } else {
            success = await addMasterOption(payload);
        }

        if (success) {
            setIsEditing(false);
            setEditingId(null);
        }
        setIsSubmitting(false);
    };

    // --- Reward Handlers ---
    const handleCreateReward = () => {
        setEditingId(null);
        setRewardFormData({
            title: '',
            description: '',
            cost: 100,
            icon: '🎁',
            isActive: true
        });
        setIsEditing(true);
    };

    const handleEditReward = (reward: Reward) => {
        setEditingId(reward.id);
        setRewardFormData({
            title: reward.title,
            description: reward.description,
            cost: reward.cost,
            icon: reward.icon,
            isActive: reward.isActive
        });
        setIsEditing(true);
    };

    const handleRewardSubmit = async () => {
        setIsSubmitting(true);
        try {
            if (editingId) {
                await updateReward(editingId, rewardFormData);
            } else {
                await addReward(rewardFormData as any);
            }
            setIsEditing(false);
            setEditingId(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Maintenance Functions ---
    const handlePrepareBackup = async () => {
        setIsExporting(true);
        try {
            const { data: tasks, error: taskError } = await supabase.from('tasks').select('*');
            if (taskError) throw taskError;

            const { data: chats, error: chatError } = await supabase.from('team_messages').select('*');
            if (chatError) throw chatError;

            const dataToBackup = {
                exportedAt: new Date().toISOString(),
                tasks: tasks || [],
                chats: chats || []
            };
            
            setBackupData(dataToBackup);
            setIsBackupModalOpen(true);

        } catch (err: any) {
            console.error(err);
            showToast('เตรียมไฟล์ Backup ล้มเหลว: ' + err.message, 'error');
        } finally {
            setIsExporting(false);
        }
    };

    const handleDownloadBackup = () => {
        if (!backupData) return;

        try {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `juijui_backup_${format(new Date(), 'yyyy-MM-dd')}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();

            setHasBackedUp(true);
            setIsBackupModalOpen(false);
            showToast('ดาวน์โหลด Backup เรียบร้อยครับ 💾', 'success');
        } catch (err: any) {
            showToast('ดาวน์โหลดล้มเหลว', 'error');
        }
    };

    const handleAnalyzeData = async () => {
        if (cleanupTargetStatuses.length === 0) {
            showToast('กรุณาเลือกสถานะงานที่จะลบอย่างน้อย 1 สถานะ', 'warning');
            return;
        }

        setIsAnalyzing(true);
        try {
            const cutoffDate = addMonths(new Date(), -cleanupMonths).toISOString();

            // 1. Count Old Chats
            const { count: chatCount, error: chatError } = await supabase
                .from('team_messages')
                .select('*', { count: 'exact', head: true })
                .lt('created_at', cutoffDate);
            
            if (chatError) throw chatError;

            // 2. Count Old Tasks (Based on Selected Statuses)
            const { count: taskCount, error: taskError } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .lt('end_date', cutoffDate)
                .in('status', cleanupTargetStatuses); 

            if (taskError) throw taskError;

            setAnalysisResult({
                chatCount: chatCount || 0,
                taskCount: taskCount || 0
            });

        } catch (err: any) {
            showToast('ตรวจสอบข้อมูลล้มเหลว: ' + err.message, 'error');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleOpenCleanupModal = () => {
        setConfirmInput('');
        setIsBackupVerified(false);
        setIsCleanupModalOpen(true);
    };

    const handleCleanup = async () => {
        if (confirmInput !== 'DELETE') return;
        
        setIsCleaning(true);
        try {
            const cutoffDate = addMonths(new Date(), -cleanupMonths).toISOString();

            // 1. Clean Chats
            const { error: chatError } = await supabase
                .from('team_messages')
                .delete()
                .lt('created_at', cutoffDate);
            
            if (chatError) throw chatError;

            // 2. Clean Tasks (Dynamic Status)
            const { error: taskError } = await supabase
                .from('tasks')
                .delete()
                .lt('end_date', cutoffDate)
                .in('status', cleanupTargetStatuses);

            if (taskError) throw taskError;

            showToast(`ล้างข้อมูลสำเร็จ! 🧹 พื้นที่กลับมาแล้ว`, 'success');
            setAnalysisResult(null); 
            setIsCleanupModalOpen(false);

        } catch (err: any) {
            console.error(err);
            showToast('ล้างข้อมูลล้มเหลว: ' + err.message, 'error');
        } finally {
            setIsCleaning(false);
        }
    };

    const resetAnalysis = () => {
        setAnalysisResult(null);
    }

    const toggleCleanupStatus = (statusKey: string) => {
        setCleanupTargetStatuses(prev => 
            prev.includes(statusKey) 
            ? prev.filter(s => s !== statusKey) 
            : [...prev, statusKey]
        );
    };

    const cutoffDateDisplay = format(addMonths(new Date(), -cleanupMonths), 'd MMMM yyyy');

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <MentorTip variant="orange" messages={["Maintenance: การลบข้อมูลเก่าช่วยให้แอพเร็วขึ้น แต่ควร Backup เก็บไว้ก่อนเสมอนะครับ", "Status: หากแก้ไข Key อาจกระทบกับการทำงานของระบบ ควรแก้แค่ Label หรือสี"]} />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                        จัดการข้อมูลระบบ ⚙️ (Master Data)
                    </h1>
                    <p className="text-gray-500 mt-1">
                        กำหนดตัวเลือกต่างๆ และดูแลรักษาฐานข้อมูล
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-2xl border border-gray-200 w-fit shadow-sm overflow-x-auto">
                <button 
                    onClick={() => { setActiveTab('PILLAR'); setIsEditing(false); }}
                    className={`flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'PILLAR' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <Layers className="w-4 h-4 mr-2" />
                    Pillars
                </button>
                <button 
                    onClick={() => { setActiveTab('FORMAT'); setIsEditing(false); }}
                    className={`flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'FORMAT' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <Type className="w-4 h-4 mr-2" />
                    Format
                </button>
                <button 
                    onClick={() => { setActiveTab('CATEGORY'); setIsEditing(false); }}
                    className={`flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'CATEGORY' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <Tag className="w-4 h-4 mr-2" />
                    Category
                </button>
                <button 
                    onClick={() => { setActiveTab('STATUS'); setIsEditing(false); }}
                    className={`flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'STATUS' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <Activity className="w-4 h-4 mr-2" />
                    Status
                </button>
                <button 
                    onClick={() => { setActiveTab('REWARDS'); setIsEditing(false); }}
                    className={`flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'REWARDS' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <Gift className="w-4 h-4 mr-2" />
                    Rewards
                </button>
                <div className="w-px h-6 bg-gray-200 mx-1 self-center"></div>
                <button 
                    onClick={() => { setActiveTab('MAINTENANCE'); setIsEditing(false); }}
                    className={`flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'MAINTENANCE' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <HardDrive className="w-4 h-4 mr-2" />
                    Maintenance
                </button>
            </div>

            {/* REWARDS VIEW */}
            {activeTab === 'REWARDS' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
                    {/* List Column */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-purple-50">
                                <h3 className="font-bold text-purple-700 flex items-center">
                                    <Gift className="w-4 h-4 mr-2" /> ของรางวัล (Rewards Shop)
                                </h3>
                                <button 
                                    onClick={handleCreateReward}
                                    className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors flex items-center font-bold"
                                >
                                    <Plus className="w-3 h-3 mr-1" /> เพิ่มรางวัล
                                </button>
                            </div>
                            
                            {rewardsLoading ? (
                                <div className="p-8 flex justify-center text-purple-500">
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {rewards.length === 0 && (
                                        <div className="p-8 text-center text-gray-400">
                                            ยังไม่มีของรางวัล
                                        </div>
                                    )}
                                    {rewards.map(reward => (
                                        <div key={reward.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl shadow-sm border border-gray-200">
                                                    {reward.icon || '🎁'}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-gray-800">{reward.title}</span>
                                                        {!reward.isActive && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 rounded font-bold">Inactive</span>}
                                                    </div>
                                                    <p className="text-xs text-gray-500">{reward.description}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-black text-indigo-600 text-sm bg-indigo-50 px-2 py-1 rounded-lg">{reward.cost} Pts</span>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => handleEditReward(reward)}
                                                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteReward(reward.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reward Form Column */}
                    <div>
                        {isEditing ? (
                            <div className="bg-white rounded-2xl shadow-xl border border-purple-100 overflow-hidden sticky top-6 animate-in slide-in-from-right-4">
                                 <div className="px-5 py-3 bg-purple-600 text-white flex justify-between items-center">
                                    <h3 className="font-bold text-sm">
                                        {editingId ? 'แก้ไขรางวัล' : 'เพิ่มรางวัลใหม่'}
                                    </h3>
                                    <button onClick={() => setIsEditing(false)} className="text-white/70 hover:text-white">
                                        <X className="w-4 h-4" />
                                    </button>
                                 </div>
                                 <form onSubmit={handleSubmit} className="p-5 space-y-4">
                                     <div>
                                         <label className="block text-xs font-bold text-gray-500 mb-1">ชื่อรางวัล</label>
                                         <input 
                                            type="text" 
                                            value={rewardFormData.title}
                                            onChange={e => setRewardFormData({...rewardFormData, title: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-purple-500 outline-none text-sm font-bold"
                                            placeholder="เช่น บัตร Starbucks 100 บาท"
                                            required
                                            autoFocus
                                         />
                                     </div>
                                     
                                     <div className="grid grid-cols-2 gap-3">
                                         <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">ราคา (Points)</label>
                                            <input 
                                                type="number" 
                                                value={rewardFormData.cost}
                                                onChange={e => setRewardFormData({...rewardFormData, cost: Number(e.target.value)})}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-purple-500 outline-none text-sm font-mono"
                                                min={0}
                                            />
                                         </div>
                                         <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">ไอคอน (Emoji)</label>
                                            <input 
                                                type="text" 
                                                value={rewardFormData.icon}
                                                onChange={e => setRewardFormData({...rewardFormData, icon: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-purple-500 outline-none text-sm text-center"
                                                placeholder="🎁"
                                            />
                                         </div>
                                     </div>

                                     <div>
                                         <label className="block text-xs font-bold text-gray-500 mb-1">รายละเอียด</label>
                                         <textarea 
                                            value={rewardFormData.description}
                                            onChange={e => setRewardFormData({...rewardFormData, description: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-purple-500 outline-none text-sm h-20 resize-none"
                                            placeholder="รายละเอียดเงื่อนไข..."
                                         />
                                     </div>

                                     <div className="flex items-center">
                                         <button
                                            type="button"
                                            onClick={() => setRewardFormData({...rewardFormData, isActive: !rewardFormData.isActive})}
                                            className={`w-full py-2 rounded-lg text-sm font-bold flex items-center justify-center border ${rewardFormData.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                                         >
                                             <Power className="w-3 h-3 mr-1" />
                                             {rewardFormData.isActive ? 'Active (เปิดให้แลก)' : 'Inactive (ปิดชั่วคราว)'}
                                         </button>
                                     </div>

                                     <div className="pt-2">
                                         <button 
                                            type="submit" 
                                            disabled={isSubmitting}
                                            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md transition-all active:scale-95 flex justify-center items-center"
                                         >
                                             {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> บันทึก</>}
                                         </button>
                                     </div>
                                 </form>
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center text-gray-400 flex flex-col items-center justify-center h-full min-h-[300px]">
                                <Gift className="w-12 h-12 mb-3 opacity-20" />
                                <p>เลือกรางวัลเพื่อแก้ไข</p>
                                <p className="text-sm">หรือกด "เพิ่มรางวัล"</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : activeTab === 'MAINTENANCE' ? (
                /* EXISTING MAINTENANCE UI */
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4">
                        
                        {/* Card 1: Backup */}
                        <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between transition-all ${hasBackedUp ? 'ring-2 ring-green-400 bg-green-50/30' : ''}`}>
                            <div>
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${hasBackedUp ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {hasBackedUp ? <CheckCircle2 className="w-6 h-6" /> : <Download className="w-6 h-6" />}
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-2">1. Backup ข้อมูล (Download JSON)</h3>
                                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                                    ดาวน์โหลดข้อมูลทั้งหมดในระบบ (งาน, แชท, การตั้งค่า) ออกมาเป็นไฟล์ JSON เพื่อเก็บไว้เป็นสำรองในเครื่องคอมพิวเตอร์ของคุณ
                                </p>
                            </div>
                            <button 
                                onClick={handlePrepareBackup}
                                disabled={isExporting}
                                className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center disabled:opacity-50
                                    ${hasBackedUp ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-200' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'}
                                `}
                            >
                                {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Archive className="w-5 h-5 mr-2" /> {hasBackedUp ? 'ดาวน์โหลดอีกครั้ง' : 'ตรวจสอบ & ดาวน์โหลด Backup'}</>}
                            </button>
                        </div>

                        {/* Card 2: Cleanup (Enhanced) */}
                        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 bg-red-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
                            
                            <div className="mb-4">
                                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4 text-red-600">
                                    <Trash2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-2">2. ล้างข้อมูลเก่า (Delete Old Data)</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    ลบข้อมูลแชทและงานที่เสร็จแล้ว เพื่อลดขนาดฐานข้อมูล
                                </p>
                            </div>

                            {/* Config Area */}
                            {!analysisResult && (
                                <div className="space-y-4 mb-6">
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-3 flex justify-between">
                                            <span>ข้อมูลที่เก่ากว่า (Older than):</span>
                                            <span className="text-red-600 font-black text-sm">{cleanupMonths} เดือน</span>
                                        </label>
                                        <input 
                                            type="range" 
                                            min="1" 
                                            max="12" 
                                            value={cleanupMonths} 
                                            onChange={(e) => setCleanupMonths(parseInt(e.target.value))}
                                            className="w-full accent-red-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <p className="text-right text-[10px] text-gray-400 mt-1 font-medium">
                                            (ตัดรอบ: {format(addMonths(new Date(), -cleanupMonths), 'd MMM yyyy')})
                                        </p>
                                    </div>

                                    {/* Status Selector */}
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 flex justify-between items-center">
                                            <span>เลือกสถานะที่จะลบ (Target Status):</span>
                                            <button 
                                                onClick={() => setIsStatusSelectorOpen(!isStatusSelectorOpen)}
                                                className="text-indigo-600 hover:underline"
                                            >
                                                {isStatusSelectorOpen ? 'ซ่อน' : 'แก้ไข'}
                                            </button>
                                        </label>
                                        
                                        <div className={`flex flex-wrap gap-2 ${isStatusSelectorOpen ? 'max-h-40 overflow-y-auto p-2 border border-indigo-100 rounded-xl bg-indigo-50/50' : ''}`}>
                                            {availableStatusKeys.map(status => (
                                                <button
                                                    key={status.key}
                                                    onClick={() => toggleCleanupStatus(status.key)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${cleanupTargetStatuses.includes(status.key) ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-200 text-gray-400'}`}
                                                >
                                                    {status.label}
                                                    {cleanupTargetStatuses.includes(status.key) && <Check className="w-3 h-3 inline ml-1" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Analysis Result Summary */}
                            {analysisResult && (
                                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-bold text-orange-800 text-sm flex items-center">
                                            <Search className="w-4 h-4 mr-1.5" /> พบข้อมูลเก่า
                                        </h4>
                                        <button onClick={resetAnalysis} className="text-[10px] text-orange-600 underline">สแกนใหม่</button>
                                    </div>
                                    <div className="flex justify-around items-center">
                                        <div className="text-center">
                                            <p className="text-2xl font-black text-orange-600">{analysisResult.chatCount}</p>
                                            <p className="text-[10px] text-orange-800 font-bold uppercase">ข้อความ</p>
                                        </div>
                                        <div className="w-px h-8 bg-orange-200"></div>
                                        <div className="text-center">
                                            <p className="text-2xl font-black text-orange-600">{analysisResult.taskCount}</p>
                                            <p className="text-[10px] text-orange-800 font-bold uppercase">งาน ({cleanupTargetStatuses.length} Status)</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-auto">
                                {!analysisResult ? (
                                    <button 
                                        onClick={handleAnalyzeData}
                                        disabled={isAnalyzing}
                                        className="w-full py-3 bg-white border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center disabled:opacity-50"
                                    >
                                        {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Search className="w-5 h-5 mr-2" /> ตรวจสอบข้อมูล (Scan)</>}
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleOpenCleanupModal}
                                        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center shadow-lg shadow-red-200"
                                    >
                                        <Trash2 className="w-5 h-5 mr-2" /> ดูรายละเอียด & ลบ
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* --- BACKUP MODAL (NEW) --- */}
                    {isBackupModalOpen && backupData && (
                        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-blue-100 scale-100 animate-in zoom-in-95 duration-200">
                                {/* Header */}
                                <div className="bg-blue-50 p-6 border-b border-blue-100 text-center">
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileJson className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <h3 className="text-xl font-black text-blue-800">เตรียมไฟล์ Backup เสร็จแล้ว!</h3>
                                    <p className="text-blue-600 text-sm mt-1">ตรวจสอบรายละเอียดก่อนดาวน์โหลด</p>
                                </div>
                                
                                {/* Body */}
                                <div className="p-6 space-y-4">
                                    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-gray-500 flex items-center"><FileText className="w-4 h-4 mr-2 text-gray-400" /> จำนวนงาน (Tasks)</span>
                                            <span className="text-lg font-black text-gray-800">{backupData.tasks.length}</span>
                                        </div>
                                        <div className="w-full h-px bg-gray-100"></div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-gray-500 flex items-center"><MessageSquare className="w-4 h-4 mr-2 text-gray-400" /> ประวัติแชท (Messages)</span>
                                            <span className="text-lg font-black text-gray-800">{backupData.chats.length}</span>
                                        </div>
                                        <div className="w-full h-px bg-gray-100"></div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-gray-500 flex items-center"><Calendar className="w-4 h-4 mr-2 text-gray-400" /> วันที่ข้อมูล (Date)</span>
                                            <span className="text-sm font-bold text-gray-800">{format(new Date(backupData.exportedAt), 'd MMM yyyy HH:mm')}</span>
                                        </div>
                                    </div>
                                    
                                    <p className="text-xs text-center text-gray-400">
                                        ไฟล์นี้เป็น JSON สามารถนำไปเก็บไว้ในคอมพิวเตอร์เพื่อความปลอดภัยได้เลย
                                    </p>
                                </div>

                                {/* Footer */}
                                <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                                    <button 
                                        onClick={() => setIsBackupModalOpen(false)}
                                        className="flex-1 py-3 text-gray-600 font-bold bg-white border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        ปิด
                                    </button>
                                    <button 
                                        onClick={handleDownloadBackup}
                                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center"
                                    >
                                        <Download className="w-5 h-5 mr-2" /> ดาวน์โหลด
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- CLEANUP CONFIRMATION MODAL --- */}
                    {isCleanupModalOpen && analysisResult && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-red-100 scale-100 animate-in zoom-in-95 duration-200">
                                {/* Header */}
                                <div className="bg-red-50 p-6 border-b border-red-100 text-center">
                                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                        <AlertTriangle className="w-8 h-8 text-red-600" />
                                    </div>
                                    <h3 className="text-xl font-black text-red-700">ยืนยันการลบถาวร?</h3>
                                    <p className="text-red-500 text-sm mt-1">ข้อมูลที่เลือกจะถูกลบและกู้คืนไม่ได้</p>
                                </div>

                                {/* Content */}
                                <div className="p-6 space-y-5">
                                    {/* Stats */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center">
                                            <Calendar className="w-3 h-3 mr-1" /> ข้อมูลก่อนวันที่: <span className="text-gray-800 ml-1">{cutoffDateDisplay}</span>
                                        </h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                                                <div className="flex items-center text-sm font-medium text-gray-700">
                                                    <MessageSquare className="w-4 h-4 mr-2 text-gray-400" /> ประวัติแชท
                                                </div>
                                                <span className="font-bold text-red-600">{analysisResult.chatCount} รายการ</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                                                <div className="flex items-center text-sm font-medium text-gray-700">
                                                    <FileText className="w-4 h-4 mr-2 text-gray-400" /> งาน ({cleanupTargetStatuses.length} Status)
                                                </div>
                                                <span className="font-bold text-red-600">{analysisResult.taskCount} รายการ</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Safety Check with Inline Download */}
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
                                        <div className="flex items-start gap-3">
                                            <input 
                                                type="checkbox" 
                                                id="backupCheck" 
                                                className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                                checked={isBackupVerified}
                                                onChange={e => setIsBackupVerified(e.target.checked)}
                                            />
                                            <label htmlFor="backupCheck" className="text-sm text-blue-800 cursor-pointer">
                                                ฉันได้ดาวน์โหลดไฟล์ <b>Backup JSON</b> และตรวจสอบข้อมูลเรียบร้อยแล้ว
                                            </label>
                                        </div>
                                        
                                        {!hasBackedUp && (
                                            <button 
                                                onClick={handlePrepareBackup}
                                                disabled={isExporting}
                                                className="ml-7 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center w-fit shadow-sm"
                                            >
                                                {isExporting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Download className="w-3 h-3 mr-1" />}
                                                ดาวน์โหลด Backup เดี๋ยวนี้
                                            </button>
                                        )}
                                    </div>

                                    {/* Confirmation Input */}
                                    <div className={`space-y-2 transition-all duration-300 ${!isBackupVerified ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                        <label className="text-xs font-bold text-gray-500 uppercase">พิมพ์คำว่า <span className="text-red-600">DELETE</span> เพื่อยืนยัน</label>
                                        <input 
                                            type="text" 
                                            value={confirmInput}
                                            onChange={(e) => setConfirmInput(e.target.value)}
                                            className="w-full p-3 border-2 border-red-100 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none uppercase font-bold text-center tracking-widest text-red-600 placeholder:text-red-200"
                                            placeholder="DELETE"
                                            disabled={!isBackupVerified}
                                        />
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                                    <button 
                                        onClick={() => setIsCleanupModalOpen(false)}
                                        className="flex-1 py-3 text-gray-600 font-bold bg-white border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button 
                                        onClick={handleCleanup}
                                        disabled={isCleaning || confirmInput !== 'DELETE' || !isBackupVerified}
                                        className={`flex-1 py-3 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center
                                            ${confirmInput === 'DELETE' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-gray-300 cursor-not-allowed'}
                                        `}
                                    >
                                        {isCleaning ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ลบข้อมูลทันที'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                /* EXISTING MASTER DATA UI */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* List Column */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-gray-700 flex items-center">
                                    <Database className="w-4 h-4 mr-2" /> รายการ {activeTab}
                                </h3>
                                <button 
                                    onClick={handleCreate}
                                    className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors flex items-center font-bold"
                                >
                                    <Plus className="w-3 h-3 mr-1" /> เพิ่มใหม่
                                </button>
                            </div>
                            
                            {masterLoading ? (
                                <div className="p-8 flex justify-center text-indigo-500">
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {filteredOptions.length === 0 && (
                                        <div className="p-8 text-center text-gray-400">
                                            ยังไม่มีข้อมูลในหมวดนี้
                                        </div>
                                    )}
                                    {filteredOptions.map(option => (
                                        <div key={option.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-2 h-2 rounded-full ${option.isActive ? 'bg-green-500' : 'bg-gray-300'}`} title={option.isActive ? 'Active' : 'Inactive'} />
                                                <div className={`px-3 py-1 rounded-md text-sm font-bold border border-transparent ${option.color}`}>
                                                    {option.label}
                                                </div>
                                                <span className="text-xs text-gray-400 font-mono hidden md:block">{option.key}</span>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleEdit(option)}
                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => deleteMasterOption(option.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Form Column */}
                    <div>
                        {isEditing ? (
                            <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 overflow-hidden sticky top-6 animate-in slide-in-from-right-4">
                                 <div className="px-5 py-3 bg-indigo-600 text-white flex justify-between items-center">
                                    <h3 className="font-bold text-sm">
                                        {editingId ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูลใหม่'}
                                    </h3>
                                    <button onClick={() => setIsEditing(false)} className="text-white/70 hover:text-white">
                                        <X className="w-4 h-4" />
                                    </button>
                                 </div>
                                 <form onSubmit={handleSubmit} className="p-5 space-y-4">
                                     <div>
                                         <label className="block text-xs font-bold text-gray-500 mb-1">Label (ชื่อที่แสดง)</label>
                                         <input 
                                            type="text" 
                                            value={formData.label}
                                            onChange={e => setFormData({...formData, label: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-indigo-500 outline-none text-sm font-bold"
                                            placeholder="เช่น Comedy, Short Form"
                                            required
                                            autoFocus
                                         />
                                     </div>
                                     
                                     <div>
                                         <label className="block text-xs font-bold text-gray-500 mb-1">Key (รหัสอ้างอิง - ภาษาอังกฤษ)</label>
                                         <input 
                                            type="text" 
                                            value={formData.key}
                                            onChange={e => setFormData({...formData, key: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-indigo-500 outline-none text-sm font-mono uppercase bg-gray-50"
                                            placeholder="เช่น COMEDY, SHORT"
                                            required
                                         />
                                         <p className="text-[10px] text-gray-400 mt-1">ใช้สำหรับอ้างอิงในระบบ (ห้ามซ้ำ)</p>
                                     </div>

                                     <div>
                                         <label className="block text-xs font-bold text-gray-500 mb-2">Color Theme</label>
                                         <div className="grid grid-cols-5 gap-2">
                                             {COLOR_PRESETS.map(c => (
                                                 <button
                                                    key={c.name}
                                                    type="button"
                                                    onClick={() => setFormData({...formData, color: c.class})}
                                                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${c.class.split(' ')[0]} ${formData.color === c.class ? 'border-gray-600 ring-2 ring-gray-200' : 'border-transparent hover:scale-105'}`}
                                                    title={c.name}
                                                 >
                                                    {formData.color === c.class && <Check className="w-4 h-4" />}
                                                 </button>
                                             ))}
                                         </div>
                                     </div>

                                     <div className="flex gap-3">
                                         <div className="flex-1">
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Sort Order</label>
                                            <input 
                                                type="number" 
                                                value={formData.sortOrder}
                                                onChange={e => setFormData({...formData, sortOrder: Number(e.target.value)})}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-indigo-500 outline-none text-sm"
                                            />
                                         </div>
                                         <div className="flex-1 flex items-end">
                                             <button
                                                type="button"
                                                onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                                                className={`w-full py-2 rounded-lg text-sm font-bold flex items-center justify-center border ${formData.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                                             >
                                                 <Power className="w-3 h-3 mr-1" />
                                                 {formData.isActive ? 'Active' : 'Inactive'}
                                             </button>
                                         </div>
                                     </div>

                                     <div className="pt-2">
                                         <button 
                                            type="submit" 
                                            disabled={isSubmitting}
                                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all active:scale-95 flex justify-center items-center"
                                         >
                                             {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> บันทึก</>}
                                         </button>
                                     </div>
                                 </form>
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center text-gray-400 flex flex-col items-center justify-center h-full min-h-[300px]">
                                <Edit2 className="w-12 h-12 mb-3 opacity-20" />
                                <p>เลือกรายการเพื่อแก้ไข</p>
                                <p className="text-sm">หรือกด "เพิ่มใหม่"</p>
                            </div>
                        )}
                    </div>

                </div>
            )}
        </div>
    );
};

export default MasterDataManager;
