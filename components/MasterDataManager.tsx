
import React, { useState } from 'react';
import { useMasterDataView, MasterTab } from '../hooks/useMasterDataView';
import { Info, Loader2, Smile, Gift, Trash2, Power, Plus, Edit2, LayoutTemplate, RefreshCcw } from 'lucide-react';
import MentorTip from './MentorTip';
import DashboardConfigModal from './DashboardConfigModal';
import MaintenancePanel from './admin/maintenance/MaintenancePanel';
import GeneralMasterList from './admin/GeneralMasterList';
import AnnualHolidayManager from './admin/AnnualHolidayManager';
import { useGreetings } from '../hooks/useGreetings';
import { useMasterData } from '../hooks/useMasterData';

// Import New Refactored Components
import MasterTabNavigation, { MASTER_META } from './admin/master/MasterTabNavigation';
import MasterFormModal from './admin/master/MasterFormModal';
import AttendanceRulesView from './admin/master/views/AttendanceRulesView';
import InventoryMasterView from './admin/master/views/InventoryMasterView';
import PositionMasterView from './admin/master/views/PositionMasterView';
import LocationMasterView from './admin/master/views/LocationMasterView'; // New Import
import GameConfigManager from './admin/GameConfigManager'; 

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
        addMasterOption, updateMasterOption, 
        editingDashboardConfig, isDashboardModalOpen, setIsDashboardModalOpen,
        filteredOptions
    } = useMasterDataView();

    const { seedDefaults } = useMasterData(); // Hook specifically for seeding

    // Hook for Greetings (Used only when tab is active really)
    const { greetings, isLoading: greetingLoading, addGreeting, deleteGreeting, toggleGreeting } = useGreetings();
    const [newGreetingText, setNewGreetingText] = useState('');

    // Local state for parent selection in nested views
    const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

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

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <MentorTip variant="orange" messages={["Maintenance Menu ใหม่! เช็คพื้นที่ Storage ได้แล้วนะ", "Game Balancing! ปรับค่า XP/HP ได้โดยไม่ต้องแก้โค้ดแล้ว"]} />

            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                        จัดการข้อมูลระบบ ⚙️ (Master Data)
                    </h1>
                    <p className="text-gray-500 mt-1">กำหนดตัวเลือก, Dashboard และดูแลรักษาฐานข้อมูล</p>
                </div>
                <button 
                    onClick={seedDefaults}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors text-xs font-bold"
                    title="หากมีข้อมูลใหม่ๆ ที่ระบบเพิ่มมา (เช่น No Show) ให้กดปุ่มนี้เพื่อซิงค์"
                >
                    <RefreshCcw className="w-4 h-4" /> ซิงค์ค่าเริ่มต้น (Sync Defaults)
                </button>
            </div>

            {/* Main Layout */}
            <div className="flex flex-col xl:flex-row gap-4">
                
                {/* 1. Sidebar Navigation */}
                <MasterTabNavigation 
                    activeTab={activeTab} 
                    onTabChange={handleSwitchTab} 
                />

                {/* 2. Main Content Area */}
                <div className="flex-1 min-w-0">
                    
                    {/* Active Tab Info */}
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

                    {/* View Switcher */}
                    <div className="min-h-[400px]">
                        {activeTab === 'MAINTENANCE' ? (
                            <MaintenancePanel />
                        ) : activeTab === 'GAME_TUNING' ? (
                            <GameConfigManager />
                        ) : activeTab === 'YEARLY' ? (
                            <AnnualHolidayManager masterOptions={masterOptions} />
                        ) : activeTab === 'INVENTORY' ? (
                            <InventoryMasterView 
                                masterOptions={masterOptions} 
                                onEdit={handleEdit} 
                                onCreate={(type, parent) => { setSelectedParentId(parent || null); handleCreate(type, parent); }}
                                onDelete={deleteMasterOption}
                                setSelectedParentId={setSelectedParentId}
                                selectedParentId={selectedParentId}
                                setIsEditing={setIsEditing}
                            />
                        ) : activeTab === 'POSITION' ? (
                            <PositionMasterView 
                                masterOptions={masterOptions}
                                onEdit={handleEdit}
                                onCreate={(type, parent) => { setSelectedParentId(parent || null); handleCreate(type, parent); }}
                                onDelete={deleteMasterOption}
                                setSelectedParentId={setSelectedParentId}
                            />
                        ) : activeTab === 'LOCATIONS' ? (
                            <LocationMasterView 
                                masterOptions={masterOptions}
                                onAdd={addMasterOption}
                                onUpdate={updateMasterOption}
                                onDelete={deleteMasterOption}
                            />
                        ) : activeTab === 'ATTENDANCE_RULES' ? (
                            <AttendanceRulesView 
                                masterOptions={masterOptions}
                                onUpdate={updateMasterOption}
                                onCreate={handleCreate}
                                onEdit={handleEdit}
                                onDelete={deleteMasterOption}
                            />
                        ) : activeTab === 'GREETINGS' ? (
                            <div className="animate-in slide-in-from-bottom-2 space-y-6">
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
                                <div className="space-y-3">
                                    {greetingLoading ? <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500"/></div> : (
                                        greetings.map(g => (
                                            <div key={g.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm">
                                                <span className={`text-sm font-medium ${g.isActive ? 'text-gray-800' : 'text-gray-400 line-through'}`}>"{g.text}"</span>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => toggleGreeting(g.id, g.isActive)} className={`p-2 rounded-lg transition-colors ${g.isActive ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-gray-400 bg-gray-100 hover:bg-gray-200'}`}><Power className="w-4 h-4" /></button>
                                                    <button onClick={() => deleteGreeting(g.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
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

            {/* Shared Edit Modal */}
            <MasterFormModal 
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                onSubmit={handleFormSubmit}
                isSubmitting={isSubmitting}
                isEditing={!!editingId}
                formData={formData}
                setFormData={setFormData}
                rewardFormData={rewardFormData}
                setRewardFormData={setRewardFormData}
                activeTab={activeTab}
            />

            {/* Dashboard Config Modal */}
            {isDashboardModalOpen && (
                <DashboardConfigModal 
                    isOpen={isDashboardModalOpen} 
                    onClose={() => setIsDashboardModalOpen(false)} 
                    config={editingDashboardConfig} 
                    masterOptions={masterOptions} 
                    onSave={handleSaveDashboardConfig} 
                />
            )}
        </div>
    );
};

export default MasterDataManager;
