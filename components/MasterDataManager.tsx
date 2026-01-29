
import React, { useState } from 'react';
import { MasterOption, Reward } from '../types';
import { useMasterDataView, MasterTab } from '../hooks/useMasterDataView';
import { Plus, Edit2, Trash2, Save, X, Layers, Type, Tag, Loader2, Power, Check, Activity, HardDrive, Gift, Package, Briefcase, Award, LayoutTemplate, CheckSquare, CornerDownRight, User, Info, MapPin, Flag, AlertTriangle, HeartPulse, ShieldAlert, Monitor, FileText, Calendar, CalendarDays, Smile, Presentation, BookOpen } from 'lucide-react';
import MentorTip from './MentorTip';
import DashboardConfigModal from './DashboardConfigModal';
import MaintenancePanel from './admin/maintenance/MaintenancePanel';
import GeneralMasterList from './admin/GeneralMasterList';
import AnnualHolidayManager from './admin/AnnualHolidayManager';
import { useGreetings } from '../hooks/useGreetings';

// Configuration for Tabs & Info
const MASTER_META: Record<string, { label: string, icon: any, desc: string, group: string }> = {
    // --- WORKFLOW ---
    STATUS: { label: 'Content Status', icon: Activity, desc: 'สถานะของงานวิดีโอ/คอนเทนต์ (เช่น Idea, Script, Shoot)', group: 'WORKFLOW' },
    TASK_STATUS: { label: 'Task Status', icon: CheckSquare, desc: 'สถานะของงานทั่วไป (เช่น To Do, Doing, Done)', group: 'WORKFLOW' },
    PROJECT_TYPE: { label: 'Project Type', icon: Flag, desc: 'ประเภทของโปรเจกต์ (เช่น Internal, Sponsor, Collab) ใช้แยกกลุ่มรายได้', group: 'WORKFLOW' },
    TAG_PRESET: { label: 'Tag Presets', icon: Tag, desc: 'ป้ายกำกับด่วน (เช่น #Urgent, #Rerun) ให้ทีมกดเลือกได้เลยไม่ต้องพิมพ์', group: 'WORKFLOW' },
    EVENT_TYPE: { label: 'Calendar Events', icon: Calendar, desc: 'ประเภทของ Highlight วันที่ในปฏิทิน (เช่น วันหยุด, วันออกกอง)', group: 'WORKFLOW' },
    YEARLY: { label: 'Yearly Holidays', icon: CalendarDays, desc: 'วันหยุดประจำปี (กำหนดครั้งเดียว แสดงทุกปี)', group: 'WORKFLOW' },
    
    // --- CONTENT ---
    FORMAT: { label: 'Formats', icon: Type, desc: 'รูปแบบของงาน (เช่น Short Form, Long Form, Post)', group: 'CONTENT' },
    PILLAR: { label: 'Pillars', icon: Layers, desc: 'แกนเนื้อหา (เช่น Education, Entertainment, Lifestyle)', group: 'CONTENT' },
    CATEGORY: { label: 'Categories', icon: LayoutTemplate, desc: 'หมวดหมู่ย่อย (เช่น Vlog, Review, Interview)', group: 'CONTENT' },
    SCRIPT_CATEGORY: { label: 'Script Categories', icon: FileText, desc: 'หมวดหมู่สคริปต์ (เช่น Vlog, Storytelling, Review)', group: 'CONTENT' },
    SHOOT_LOCATION: { label: 'Locations', icon: MapPin, desc: 'สถานที่ถ่ายทำที่ใช้บ่อย (เช่น Studio A, Outdoor)', group: 'CONTENT' },
    
    // --- PRODUCTION ---
    MEETING_CATEGORY: { label: 'Meeting Topics', icon: Presentation, desc: 'หัวข้อการประชุม (เช่น General, Crisis, Project Update)', group: 'CONTENT' },

    // --- INVENTORY ---
    INVENTORY: { label: 'Equipment Categories', icon: Package, desc: 'หมวดหมู่อุปกรณ์หลักและย่อย (ใช้ในหน้า Checklist)', group: 'INVENTORY' },
    ITEM_CONDITION: { label: 'Item Condition', icon: AlertTriangle, desc: 'สภาพอุปกรณ์ (เช่น Good, Broken, Lost) ใช้แปะป้ายสถานะของ', group: 'INVENTORY' },

    // --- TEAM & HR ---
    POSITION: { label: 'Positions', icon: Briefcase, desc: 'ตำแหน่งงานและหน้าที่ความรับผิดชอบ (ใช้ในหน้าสมัครและหน้าทีม)', group: 'TEAM' },
    LEAVE_TYPE: { label: 'Leave Types', icon: HeartPulse, desc: 'ประเภทการลา (เช่น ลาป่วย, ลากิจ, พักร้อน)', group: 'TEAM' },
    REJECTION_REASON: { label: 'Reject Reasons', icon: ShieldAlert, desc: 'เหตุผลที่ส่งแก้งาน (QC) ใช้เก็บสถิติปัญหาที่พบบ่อย', group: 'TEAM' },

    // --- SYSTEM ---
    REWARDS: { label: 'Rewards', icon: Gift, desc: 'ของรางวัลในร้านค้าสวัสดิการ (ใช้แลกแต้ม JP)', group: 'SYSTEM' },
    GREETINGS: { label: 'Greetings', icon: Smile, desc: 'คำอวยพร/ข้อความต้อนรับที่จะสุ่มแสดงเมื่อเปิดแอป', group: 'SYSTEM' },
    DASHBOARD: { label: 'Dashboard', icon: Monitor, desc: 'ตั้งค่าการ์ดสรุปงานในหน้า Admin Dashboard', group: 'SYSTEM' },
    MAINTENANCE: { label: 'Maintenance', icon: HardDrive, desc: 'ดูแลรักษาระบบ (Backup, Cleanup)', group: 'SYSTEM' },
    WIKI_CATEGORY: { label: 'Wiki Categories', icon: BookOpen, desc: 'หมวดหมู่ของคู่มือการทำงาน (Wiki)', group: 'SYSTEM' },
};

const MasterDataManager: React.FC = () => {
    const { 
        masterOptions, masterLoading, deleteMasterOption, 
        rewards, rewardsLoading, deleteReward,
        dashboardConfigs, dashboardLoading,
        activeTab, setActiveTab,
        isEditing, setIsEditing, editingId, setEditingId,
        formData, setFormData,
        rewardFormData, setRewardFormData,
        isSubmitting,
        handleEdit, handleCreate, handleSubmit,
        handleCreateReward, handleEditReward,
        handleEditDashboardConfig, handleSaveDashboardConfig,
        editingDashboardConfig, isDashboardModalOpen, setIsDashboardModalOpen,
        filteredOptions
    } = useMasterDataView();

    // Hook for Greetings (Used only when tab is active really)
    const { greetings, isLoading: greetingLoading, addGreeting, deleteGreeting, toggleGreeting } = useGreetings();
    const [newGreetingText, setNewGreetingText] = useState('');

    const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

    // Color Presets
    const COLOR_PRESETS = [
        { name: 'Gray', class: 'bg-gray-100 text-gray-700 border-gray-200' },
        { name: 'Red', class: 'bg-red-50 text-red-700 border-red-200' },
        { name: 'Orange', class: 'bg-orange-50 text-orange-700 border-orange-200' },
        { name: 'Yellow', class: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
        { name: 'Green', class: 'bg-green-50 text-green-700 border-green-200' },
        { name: 'Teal', class: 'bg-teal-50 text-teal-700 border-teal-200' },
        { name: 'Blue', class: 'bg-blue-50 text-blue-700 border-blue-200' },
        { name: 'Indigo', class: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
        { name: 'Purple', class: 'bg-purple-50 text-purple-700 border-purple-200' },
        { name: 'Pink', class: 'bg-pink-50 text-pink-700 border-pink-200' },
    ];

    const handleSwitchTab = (tab: MasterTab) => {
        setActiveTab(tab);
        setIsEditing(false);
        setSelectedParentId(null);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        let typeOverride = undefined;
        if (activeTab === 'INVENTORY') {
            typeOverride = selectedParentId ? 'INV_CAT_L2' : 'INV_CAT_L1';
        } else if (activeTab === 'POSITION') {
            typeOverride = selectedParentId ? 'RESPONSIBILITY' : 'POSITION';
        }
        handleSubmit(e, typeOverride);
    };

    const handleAddGreeting = async () => {
        if (!newGreetingText.trim()) return;
        await addGreeting(newGreetingText);
        setNewGreetingText('');
    };

    // --- TAB RENDERERS ---
    const renderTabButton = (key: string) => {
        const meta = MASTER_META[key];
        if (!meta) return null;
        const Icon = meta.icon;
        const isActive = activeTab === key;
        
        return (
            <button 
                key={key}
                onClick={() => handleSwitchTab(key as MasterTab)} 
                className={`flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap mb-1 ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <Icon className="w-4 h-4 mr-2" /> {meta.label}
            </button>
        );
    };

    // --- SUB-RENDERERS ---
    const renderInventorySection = () => {
        const l1Options = masterOptions.filter(o => o.type === 'INV_CAT_L1').sort((a,b) => a.sortOrder - b.sortOrder);
        const l2Options = selectedParentId 
            ? masterOptions.filter(o => o.type === 'INV_CAT_L2' && o.parentKey === selectedParentId).sort((a,b) => a.sortOrder - b.sortOrder)
            : [];

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[500px]">
                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-700 flex items-center"><Package className="w-4 h-4 mr-2" /> หมวดหมู่หลัก (Main)</h3>
                        <button onClick={() => { setSelectedParentId(null); handleCreate('INV_CAT_L1'); }} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 font-bold flex items-center"><Plus className="w-3 h-3 mr-1" /> เพิ่มหมวด</button>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-1">
                        {l1Options.map(l1 => (
                            <div key={l1.id} onClick={() => { setSelectedParentId(l1.key); setIsEditing(false); }} className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer transition-all ${selectedParentId === l1.key ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'bg-white border-gray-100 hover:border-gray-300'}`}>
                                <div className="flex items-center gap-3"><div className={`w-3 h-3 rounded-full ${l1.color?.split(' ')[0] || 'bg-gray-300'}`}></div><span className={`text-sm font-bold ${selectedParentId === l1.key ? 'text-indigo-800' : 'text-gray-700'}`}>{l1.label}</span></div>
                                <div className="flex items-center gap-1"><button onClick={(e) => { e.stopPropagation(); handleEdit(l1); }} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg"><Edit2 className="w-3 h-3" /></button><button onClick={(e) => { e.stopPropagation(); if(confirm('ลบ?')) deleteMasterOption(l1.id); }} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"><Trash2 className="w-3 h-3" /></button></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[500px]">
                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-700 flex items-center"><CornerDownRight className="w-4 h-4 mr-2" /> ชนิดย่อย (Sub)</h3>
                        <button onClick={() => selectedParentId ? handleCreate('INV_CAT_L2', selectedParentId) : alert('กรุณาเลือกหมวดหมู่หลักก่อน')} className={`text-xs px-3 py-1.5 rounded-lg font-bold flex items-center ${selectedParentId ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-400'}`}><Plus className="w-3 h-3 mr-1" /> เพิ่มชนิด</button>
                    </div>
                    <div className="overflow-y-auto flex-1 p-4 relative">
                        {!selectedParentId ? <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-6 text-center"><Package className="w-12 h-12 mb-3 opacity-20" /><p>เลือกหมวดหมู่หลักทางซ้าย<br/>เพื่อจัดการชนิดย่อย</p></div> : 
                        l2Options.length === 0 ? <div className="text-center py-10 text-gray-400 text-sm">ยังไม่มีข้อมูลในหมวดนี้</div> : 
                        <div className="space-y-2">{l2Options.map(l2 => <div key={l2.id} className="p-3 rounded-xl border border-gray-100 bg-white flex justify-between items-center group"><span className="text-sm font-medium text-gray-700 pl-2 border-l-4 border-gray-200 group-hover:border-indigo-400 transition-colors">{l2.label}</span><div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleEdit(l2)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg"><Edit2 className="w-3 h-3" /></button><button onClick={() => { if(confirm('ลบ?')) deleteMasterOption(l2.id); }} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"><Trash2 className="w-3 h-3" /></button></div></div>)}</div>}
                    </div>
                </div>
            </div>
        );
    };

    const renderPositionSection = () => {
        const positions = masterOptions.filter(o => o.type === 'POSITION').sort((a,b) => a.sortOrder - b.sortOrder);
        const responsibilities = masterOptions.filter(o => o.type === 'RESPONSIBILITY').sort((a,b) => a.sortOrder - b.sortOrder);

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="col-span-full mb-2 flex justify-between items-center bg-teal-50 p-4 rounded-xl border border-teal-100">
                    <div><h3 className="text-lg font-black text-teal-800 flex items-center"><Briefcase className="w-6 h-6 mr-2" /> ผังตำแหน่ง & หน้าที่</h3><p className="text-xs text-teal-600 mt-1">กำหนดตำแหน่งและหน้าที่ (Responsibility)</p></div>
                    <button onClick={() => { setSelectedParentId(null); handleCreate('POSITION'); }} className="text-sm bg-teal-600 text-white px-4 py-2.5 rounded-xl hover:bg-teal-700 transition-colors font-bold flex items-center shadow-md active:scale-95"><Plus className="w-4 h-4 mr-2" /> สร้างตำแหน่งใหม่</button>
                </div>
                {positions.map(pos => {
                    const tasks = responsibilities.filter(r => r.parentKey === pos.key);
                    return (
                        <div key={pos.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden group">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-start bg-gray-50/20">
                                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm bg-white"><User className="w-6 h-6 text-gray-600" /></div><div><h4 className="font-black text-lg text-gray-800">{pos.label}</h4><span className="text-[10px] uppercase font-bold text-gray-400">{pos.key}</span></div></div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleEdit(pos)} className="p-1.5 text-gray-500 hover:text-indigo-600 rounded"><Edit2 className="w-4 h-4" /></button><button onClick={() => { if(confirm('ลบ?')) deleteMasterOption(pos.id); }} className="p-1.5 text-gray-500 hover:text-red-600 rounded"><Trash2 className="w-4 h-4" /></button></div>
                            </div>
                            <div className="p-4 flex-1 bg-gray-50/30">
                                <div className="flex justify-between items-center mb-3"><span className="text-xs font-bold text-gray-400 uppercase flex items-center"><Award className="w-3 h-3 mr-1" /> หน้าที่ ({tasks.length})</span><button onClick={() => { setSelectedParentId(pos.key); handleCreate('RESPONSIBILITY', pos.key); }} className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg font-bold flex items-center"><Plus className="w-3 h-3 mr-1" /> เพิ่ม</button></div>
                                {tasks.length === 0 ? <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl"><p className="text-xs text-gray-400">ว่างเปล่า</p></div> : <div className="space-y-2">{tasks.map(task => (<div key={task.id} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-all group/item"><div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div><span className="text-sm font-medium text-gray-700">{task.label}</span></div><div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity"><button onClick={() => handleEdit(task)} className="text-gray-400 hover:text-indigo-600 p-1"><Edit2 className="w-3 h-3" /></button><button onClick={() => deleteMasterOption(task.id)} className="text-gray-400 hover:text-red-600 p-1"><X className="w-3 h-3" /></button></div></div>))}</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <MentorTip variant="orange" messages={["Maintenance Menu ใหม่! เช็คพื้นที่ Storage ได้แล้วนะ", "Dashboard Config ช่วยให้ปรับแต่งการ์ดในหน้า Admin Dashboard ได้ตามใจชอบ"]} />

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    จัดการข้อมูลระบบ ⚙️ (Master Data)
                </h1>
                <p className="text-gray-500 mt-1">กำหนดตัวเลือก, Dashboard และดูแลรักษาฐานข้อมูล</p>
            </div>

            {/* Tabs */}
            <div className="flex flex-col xl:flex-row gap-4">
                
                {/* TAB BAR (Scrollable) */}
                <div className="flex xl:flex-col gap-2 overflow-x-auto xl:w-64 pb-2 xl:pb-0 shrink-0">
                    
                    {/* GROUP: WORKFLOW */}
                    <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm min-w-max">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Production & Workflow</div>
                        {['STATUS', 'TASK_STATUS', 'PROJECT_TYPE', 'TAG_PRESET', 'EVENT_TYPE', 'YEARLY'].map(key => renderTabButton(key))}
                    </div>

                    {/* GROUP: CONTENT */}
                    <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm min-w-max">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Content Metadata</div>
                        {['FORMAT', 'PILLAR', 'CATEGORY', 'SCRIPT_CATEGORY', 'SHOOT_LOCATION', 'MEETING_CATEGORY'].map(key => renderTabButton(key))}
                    </div>

                    {/* GROUP: INVENTORY & HR */}
                    <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm min-w-max">
                         <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Resources</div>
                         {['INVENTORY', 'ITEM_CONDITION', 'POSITION', 'LEAVE_TYPE', 'REJECTION_REASON'].map(key => renderTabButton(key))}
                    </div>

                     {/* GROUP: SYSTEM */}
                     <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm min-w-max">
                         <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">System Config</div>
                         {['REWARDS', 'GREETINGS', 'DASHBOARD', 'MAINTENANCE', 'WIKI_CATEGORY'].map(key => renderTabButton(key))}
                    </div>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="flex-1 min-w-0">
                    {/* Info Card */}
                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl mb-6 flex items-start gap-3">
                        <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                            <Info className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-indigo-800 text-sm flex items-center">
                                {MASTER_META[activeTab]?.label}
                            </h3>
                            <p className="text-xs text-indigo-600 leading-relaxed mt-1">
                                {MASTER_META[activeTab]?.desc}
                            </p>
                        </div>
                    </div>

                    {/* Content Switcher */}
                    <div className="min-h-[400px]">
                        {activeTab === 'MAINTENANCE' ? (
                            <MaintenancePanel />
                        ) : activeTab === 'YEARLY' ? (
                            <AnnualHolidayManager masterOptions={masterOptions} />
                        ) : activeTab === 'INVENTORY' ? (
                            renderInventorySection()
                        ) : activeTab === 'POSITION' ? (
                            renderPositionSection()
                        ) : activeTab === 'GREETINGS' ? (
                            <div className="animate-in slide-in-from-bottom-2 space-y-6">
                                {/* Create Box */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                    <h3 className="font-bold text-gray-700 mb-4 flex items-center"><Smile className="w-5 h-5 mr-2 text-indigo-600"/> เพิ่มข้อความต้อนรับใหม่</h3>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                            placeholder="ใส่คำอวยพรหรือกำลังใจที่นี่..."
                                            value={newGreetingText}
                                            onChange={e => setNewGreetingText(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAddGreeting()}
                                        />
                                        <button onClick={handleAddGreeting} disabled={!newGreetingText.trim()} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50">
                                            เพิ่ม
                                        </button>
                                    </div>
                                </div>
                                
                                {/* List */}
                                <div className="space-y-3">
                                    {greetingLoading ? <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500"/></div> : (
                                        greetings.map(g => (
                                            <div key={g.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm">
                                                <span className={`text-sm font-medium ${g.isActive ? 'text-gray-800' : 'text-gray-400 line-through'}`}>"{g.text}"</span>
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={() => toggleGreeting(g.id, g.isActive)} 
                                                        className={`p-2 rounded-lg transition-colors ${g.isActive ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-gray-400 bg-gray-100 hover:bg-gray-200'}`}
                                                    >
                                                        <Power className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteGreeting(g.id)} 
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    {!greetingLoading && greetings.length === 0 && <div className="text-center py-10 text-gray-400">ยังไม่มีคำอวยพร</div>}
                                </div>
                            </div>
                        ) : activeTab === 'REWARDS' ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
                                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-purple-50">
                                        <h3 className="font-bold text-purple-700 flex items-center"><Gift className="w-4 h-4 mr-2" /> ของรางวัล</h3>
                                        <button onClick={handleCreateReward} className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 font-bold flex items-center"><Plus className="w-3 h-3 mr-1" /> เพิ่มรางวัล</button>
                                    </div>
                                    {rewardsLoading ? <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div> : (
                                        <div className="divide-y divide-gray-100">
                                            {rewards.map(r => (
                                                <div key={r.id} className="p-4 flex items-center justify-between hover:bg-gray-50 group">
                                                    <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl border">{r.icon || '🎁'}</div><div><div className="flex items-center gap-2"><span className="font-bold text-gray-800">{r.title}</span>{!r.isActive && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 rounded">Inactive</span>}</div><p className="text-xs text-gray-500">{r.description}</p></div></div>
                                                    <div className="flex items-center gap-4"><span className="font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg text-sm">{r.cost} Pts</span><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleEditReward(r)} className="p-1.5 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-white rounded-lg"><Edit2 className="w-4 h-4" /></button><button onClick={() => deleteReward(r.id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-white rounded-lg"><Trash2 className="w-4 h-4" /></button></div></div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : activeTab === 'DASHBOARD' ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4">
                                {dashboardLoading ? <div className="col-span-full flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div> : dashboardConfigs.map(config => (
                                    <div key={config.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex items-center justify-between hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gray-100 text-gray-500"><LayoutTemplate className="w-6 h-6" /></div><div><h4 className="font-bold text-gray-800 text-lg">{config.label}</h4><div className="flex items-center gap-2 mt-1"><span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100 font-bold">Filter: {config.filterType || 'STATUS'}</span><span className="text-xs text-gray-400">{config.statusKeys?.length || 0} เงื่อนไข</span></div></div></div>
                                        <button onClick={() => handleEditDashboardConfig(config)} className="p-2 bg-gray-50 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 rounded-xl transition-colors"><Edit2 className="w-5 h-5" /></button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <GeneralMasterList 
                                typeLabel={activeTab}
                                options={filteredOptions}
                                loading={masterLoading}
                                onAdd={() => handleCreate()}
                                onEdit={handleEdit}
                                onDelete={(id) => deleteMasterOption(id)}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Common Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95">
                        <div className="px-5 py-3 bg-indigo-600 text-white flex justify-between items-center">
                            <h3 className="font-bold text-sm">{editingId ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูลใหม่'}</h3>
                            <button onClick={() => setIsEditing(false)} className="text-white/70 hover:text-white"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                            {activeTab === 'REWARDS' ? (
                                <>
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">ชื่อรางวัล</label><input type="text" value={rewardFormData.title || ''} onChange={e => setRewardFormData({...rewardFormData, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm font-bold" required /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">รายละเอียด</label><textarea rows={2} value={rewardFormData.description || ''} onChange={e => setRewardFormData({...rewardFormData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm resize-none" /></div>
                                    <div className="flex gap-4"><div className="flex-1"><label className="block text-xs font-bold text-gray-500 mb-1">แต้ม</label><input type="number" value={rewardFormData.cost || 0} onChange={e => setRewardFormData({...rewardFormData, cost: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm font-bold" /></div><div className="w-24"><label className="block text-xs font-bold text-gray-500 mb-1">ไอคอน</label><input type="text" value={rewardFormData.icon || ''} onChange={e => setRewardFormData({...rewardFormData, icon: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm text-center" /></div></div>
                                </>
                            ) : (
                                <>
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">Label (ชื่อที่แสดง)</label><input type="text" value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm font-bold" required autoFocus /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">Key (รหัสอ้างอิง - ENG)</label><input type="text" value={formData.key} onChange={e => setFormData({...formData, key: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm font-mono uppercase bg-gray-50" required disabled={!!editingId} /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 mb-2">Color Theme</label><div className="grid grid-cols-5 gap-2">{COLOR_PRESETS.map(c => (<button key={c.name} type="button" onClick={() => setFormData({...formData, color: c.class})} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${c.class.split(' ')[0]} ${formData.color === c.class ? 'border-gray-600 ring-2 ring-gray-200' : 'border-transparent hover:scale-105'}`}>{formData.color === c.class && <Check className="w-4 h-4" />}</button>))}</div></div>
                                </>
                            )}
                            <button type="submit" disabled={isSubmitting} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all flex justify-center items-center mt-2">{isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> บันทึก</>}</button>
                        </form>
                    </div>
                </div>
            )}

            {isDashboardModalOpen && <DashboardConfigModal isOpen={isDashboardModalOpen} onClose={() => setIsDashboardModalOpen(false)} config={editingDashboardConfig} masterOptions={masterOptions} onSave={handleSaveDashboardConfig} />}
        </div>
    );
};

export default MasterDataManager;
