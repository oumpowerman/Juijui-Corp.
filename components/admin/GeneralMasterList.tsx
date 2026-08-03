import React, { useEffect, useState } from 'react';
import { MasterOption } from '../../types';
import { 
    Edit2, Trash2, Database, Plus, Loader2, 
    ArrowUp, ArrowDown, Check, X, ClipboardCheck, 
    AlertCircle, ChevronDown, ChevronUp, Save 
} from 'lucide-react';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import { useChannels } from '../../hooks/useChannels';
import { useMasterData } from '../../hooks/useMasterData';
import { useToast } from '../../context/ToastContext';

interface GeneralMasterListProps {
    typeLabel: string;
    options: MasterOption[];
    loading: boolean;
    onAdd: () => void;
    onEdit: (option: MasterOption) => void;
    onDelete: (id: string) => void;
}

const GeneralMasterList: React.FC<GeneralMasterListProps> = ({ typeLabel, options, loading, onAdd, onEdit, onDelete }) => {
    const { showConfirm } = useGlobalDialog();
    const { channels, fetchChannels } = useChannels();
    const { masterOptions, addMasterOption, updateMasterOption, deleteMasterOption: deleteOptionDirect } = useMasterData();
    const { showToast } = useToast();

    // Local state to track which status is expanded to show its checklist builder
    const [expandedStatusId, setExpandedStatusId] = useState<string | null>(null);

    // Form state for adding new sub-step
    const [newStepLabel, setNewStepLabel] = useState('');
    const [newStepKey, setNewStepKey] = useState('');
    const [newStepWeight, setNewStepWeight] = useState<number | ''>('');
    const [isSubmittingSubStep, setIsSubmittingSubStep] = useState(false);

    // Inline edit state for existing sub-step
    const [editingSubStepId, setEditingSubStepId] = useState<string | null>(null);
    const [editStepLabel, setEditStepLabel] = useState('');
    const [editStepWeight, setEditStepWeight] = useState<number | ''>('');

    useEffect(() => {
        if (channels.length === 0) {
            fetchChannels();
        }
    }, [fetchChannels, channels.length]);

    // Auto-populate slug key based on label (replace space, non-alphanumeric, uppercase)
    useEffect(() => {
        if (newStepLabel && !newStepKey) {
            const tempKey = newStepLabel
                .replace(/\s+/g, '_')
                .replace(/[^a-zA-Z0-9_]/g, '')
                .toUpperCase();
            if (tempKey) {
                setNewStepKey(`STEP_${tempKey}`);
            }
        }
    }, [newStepLabel, newStepKey]);

    const isStatusTab = typeLabel === 'STATUS';

    // Handler to toggle status expansion
    const toggleExpandStatus = (optionId: string) => {
        if (expandedStatusId === optionId) {
            setExpandedStatusId(null);
        } else {
            setExpandedStatusId(optionId);
            setNewStepLabel('');
            setNewStepKey('');
            setNewStepWeight('');
            setEditingSubStepId(null);
        }
    };

    // Helper to extract weight from description JSON
    const getStepWeight = (step: MasterOption): number | null => {
        try {
            const desc = JSON.parse(step.description || '{}');
            if (typeof desc.weight === 'number') {
                return desc.weight;
            }
        } catch (e) {}
        return null;
    };

    // Helper to calculate total weight and show warning/info
    const calculateWeightSummary = (subSteps: MasterOption[]) => {
        const activeSteps = subSteps.filter(s => s.isActive);
        const count = activeSteps.length;
        if (count === 0) return { count: 0, sum: 0, isBalanced: true, average: 0 };

        let sum = 0;
        let definedCount = 0;
        activeSteps.forEach(s => {
            const w = getStepWeight(s);
            if (w !== null) {
                sum += w;
                definedCount++;
            }
        });

        const isBalanced = sum === 100 && definedCount === count;
        const average = Math.round(100 / count);

        return {
            count,
            sum,
            isBalanced,
            average,
            hasUndefined: definedCount < count
        };
    };

    // Add new sub-step
    const handleAddSubStep = async (parentStatusKey: string, subSteps: MasterOption[]) => {
        if (!newStepLabel.trim() || !newStepKey.trim()) {
            showToast('กรุณากรอกข้อมูลขั้นตอนย่อยให้ครบถ้วน', 'warning');
            return;
        }

        setIsSubmittingSubStep(true);
        try {
            const maxSortOrder = subSteps.reduce((max, s) => Math.max(max, s.sortOrder || 0), 0);
            const weightPayload = newStepWeight !== '' ? { weight: Number(newStepWeight) } : {};

            const success = await addMasterOption({
                type: 'STATUS_CHECKLIST',
                key: newStepKey.trim().toUpperCase(),
                label: newStepLabel.trim(),
                color: 'text-gray-700 bg-gray-50 border-gray-200',
                sortOrder: maxSortOrder + 1,
                isActive: true,
                isDefault: false,
                parentKey: parentStatusKey,
                description: JSON.stringify(weightPayload),
                progressValue: 0
            });

            if (success) {
                setNewStepLabel('');
                setNewStepKey('');
                setNewStepWeight('');
                showToast('เพิ่มขั้นตอนย่อยสำเร็จแล้ว 🎉', 'success');
            }
        } catch (error: any) {
            console.error(error);
            showToast('เกิดข้อผิดพลาด: ' + error.message, 'error');
        } finally {
            setIsSubmittingSubStep(false);
        }
    };

    // Toggle sub-step active state
    const handleToggleSubStepActive = async (step: MasterOption) => {
        try {
            const success = await updateMasterOption({
                ...step,
                isActive: !step.isActive
            });
            if (success) {
                showToast(`เปลี่ยนสถานะขั้นตอนย่อยสำเร็จ`, 'success');
            }
        } catch (error: any) {
            console.error(error);
        }
    };

    // Save sub-step edit
    const handleSaveSubStepEdit = async (step: MasterOption) => {
        if (!editStepLabel.trim()) {
            showToast('ชื่อขั้นตอนห้ามว่าง', 'warning');
            return;
        }

        try {
            const weightPayload = editStepWeight !== '' ? { weight: Number(editStepWeight) } : {};
            const success = await updateMasterOption({
                ...step,
                label: editStepLabel.trim(),
                description: JSON.stringify(weightPayload)
            });

            if (success) {
                setEditingSubStepId(null);
                showToast('อัปเดตขั้นตอนย่อยสำเร็จแล้ว', 'success');
            }
        } catch (error: any) {
            console.error(error);
        }
    };

    // Delete sub-step
    const handleConfirmDeleteSubStep = async (step: MasterOption) => {
        const confirmed = await showConfirm(`ยืนยันการลบขั้นตอนย่อย "${step.label}"? การลบจะทำให้ประวัติการติ๊กในงานเก่าหายไป`, 'ลบขั้นตอนย่อย');
        if (!confirmed) return;

        try {
            const success = await deleteOptionDirect(step.id);
            if (success) {
                showToast('ลบขั้นตอนย่อยสำเร็จ', 'info');
            }
        } catch (error: any) {
            console.error(error);
        }
    };

    // Reorder sub-steps
    const handleMoveSubStep = async (step: MasterOption, subSteps: MasterOption[], direction: 'up' | 'down') => {
        const index = subSteps.findIndex(s => s.id === step.id);
        if (index === -1) return;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= subSteps.length) return;

        const targetStep = subSteps[targetIndex];
        
        // Swap sortOrder
        const originalSort = step.sortOrder || 0;
        const targetSort = targetStep.sortOrder || 0;

        try {
            await Promise.all([
                updateMasterOption({ ...step, sortOrder: targetSort }),
                updateMasterOption({ ...targetStep, sortOrder: originalSort })
            ]);
            showToast('จัดลำดับเรียบร้อย', 'success');
        } catch (error) {
            console.error(error);
            showToast('ไม่สามารถจัดลำดับได้', 'error');
        }
    };

    return (
        <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-2">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-700 flex items-center"><Database className="w-4 h-4 mr-2" /> รายการ {typeLabel}</h3>
                <button onClick={onAdd} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors font-bold flex items-center"><Plus className="w-3 h-3 mr-1" /> เพิ่มใหม่</button>
            </div>
            {loading ? (
                <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
            ) : (
                <div className="divide-y divide-gray-100">
                    {options.length === 0 && <div className="p-8 text-center text-gray-400">ยังไม่มีข้อมูล</div>}
                    {options.map(option => {
                        const relatedChannel = option.parentKey ? channels.find(c => c.id === option.parentKey) : null;
                        const isPillarOrCategory = option.type === 'PILLAR' || option.type === 'CATEGORY' || option.type === 'SCRIPT_CATEGORY';
                        const isExpanded = expandedStatusId === option.id;

                        // Retrieve checklists under this status
                        const subSteps = masterOptions
                            .filter(s => s.type === 'STATUS_CHECKLIST' && s.parentKey === option.key)
                            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

                        const weightSum = calculateWeightSummary(subSteps);

                        return (
                            <div key={option.id} className="transition-colors">
                                {/* Row element */}
                                <div className={`p-4 flex items-center justify-between hover:bg-gray-50 group ${isExpanded ? 'bg-indigo-50/40 hover:bg-indigo-50/60' : ''}`}>
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className={`w-2 h-2 rounded-full ${option.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        <div className="flex items-center gap-2">
                                            <div className={`px-3 py-1 rounded-md text-sm font-bold border border-transparent ${option.color}`}>{option.label}</div>
                                            {isPillarOrCategory && (
                                                relatedChannel ? (
                                                    <span className="text-[10px] px-2 py-0.5 font-bold rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center gap-1">
                                                        📺 {relatedChannel.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] px-2 py-0.5 font-bold rounded-full bg-slate-50 text-slate-500 border border-slate-100 flex items-center gap-1">
                                                        🌐 Global
                                                    </span>
                                                )
                                            )}
                                        </div>

                                        {option.type === 'STATUS' && (
                                            <div className="flex items-center gap-3">
                                                {/* Sub steps indicator */}
                                                <button 
                                                    onClick={() => toggleExpandStatus(option.id)}
                                                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
                                                >
                                                    <ClipboardCheck className="w-3.5 h-3.5" />
                                                    ขั้นตอนย่อย ({subSteps.length})
                                                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                </button>

                                                {/* Status Percentage / Progress config indicator */}
                                                {option.progressValue !== undefined && (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                                                            <div className="h-full bg-indigo-500" style={{ width: `${option.progressValue}%` }} />
                                                        </div>
                                                        <span className="text-[10px] font-black text-indigo-600">{option.progressValue}%</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <span className="text-xs text-gray-400 font-mono hidden md:block">{option.key}</span>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => onEdit(option)} className="p-1.5 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-white rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                        <button onClick={async () => { 
                                            if(await showConfirm('ลบข้อมูลนี้?')) onDelete(option.id); 
                                        }} className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-white rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>

                                {/* Expanded sub checklist builder */}
                                {isStatusTab && isExpanded && (
                                    <div className="px-6 py-5 bg-indigo-50/20 border-t border-b border-indigo-100/40 space-y-4">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-indigo-100/50 pb-3">
                                            <div>
                                                <h4 className="text-sm font-black text-gray-800 flex items-center gap-2">
                                                    📋 จัดการขั้นตอนย่อยสำหรับสถานะ: <span className="text-indigo-600">{option.label}</span>
                                                </h4>
                                                <p className="text-xs text-gray-500 mt-0.5">กำหนดเช็คลิสต์ขั้นตอนย่อยเพื่อให้คนทำงานติ๊กความคืบหน้าได้ละเอียดขึ้น</p>
                                            </div>

                                            {/* Weights system information */}
                                            <div className="flex items-center gap-2 text-xs font-semibold bg-white border border-indigo-100 px-3 py-1.5 rounded-xl text-gray-700 shadow-sm">
                                                <AlertCircle className="w-4 h-4 text-indigo-500" />
                                                {weightSum.count === 0 ? (
                                                    <span>ยังไม่มีขั้นตอนย่อย</span>
                                                ) : weightSum.isBalanced ? (
                                                    <span className="text-green-600">⚖️ น้ำหนักคะแนนรวมลงตัว 100% ครบถ้วน!</span>
                                                ) : (
                                                    <span>💡 เฉลี่ยเท่ากัน: ขั้นตอนละ ~{weightSum.average}% (ไม่มีการถ่วงน้ำหนักหรือรวมไม่เท่ากับ 100%)</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* List of sub steps */}
                                        <div className="space-y-2">
                                            {subSteps.length === 0 ? (
                                                <div className="text-center py-6 text-xs text-gray-400 bg-white/50 border border-dashed rounded-xl">
                                                    ยังไม่มีขั้นตอนย่อยในสถานะนี้ กรุณาเพิ่มขั้นตอนใหม่ด้านล่าง 👇
                                                </div>
                                            ) : (
                                                subSteps.map((step, idx) => {
                                                    const isEditingStep = editingSubStepId === step.id;
                                                    const weight = getStepWeight(step);

                                                    return (
                                                        <div 
                                                            key={step.id} 
                                                            className={`flex items-center justify-between p-3 rounded-xl bg-white border transition-shadow hover:shadow-sm ${step.isActive ? 'border-gray-200' : 'border-gray-200 bg-gray-50/50 opacity-60'}`}
                                                        >
                                                            <div className="flex items-center gap-3 flex-1">
                                                                {/* Index indicator */}
                                                                <span className="text-xs font-black text-slate-400 w-5">{idx + 1}.</span>

                                                                {isEditingStep ? (
                                                                    <div className="flex items-center gap-2 flex-1 max-w-xl">
                                                                        <input 
                                                                            type="text" 
                                                                            className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 font-bold"
                                                                            value={editStepLabel}
                                                                            onChange={e => setEditStepLabel(e.target.value)}
                                                                        />
                                                                        <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-0.5">
                                                                            <span className="text-[10px] font-bold text-gray-500">น้ำหนัก:</span>
                                                                            <input 
                                                                                type="number" 
                                                                                className="w-12 bg-transparent text-center text-xs font-black text-indigo-600 outline-none"
                                                                                placeholder="เฉลี่ย"
                                                                                value={editStepWeight}
                                                                                onChange={e => setEditStepWeight(e.target.value === '' ? '' : Number(e.target.value))}
                                                                            />
                                                                            <span className="text-[10px] font-bold text-gray-500">%</span>
                                                                        </div>
                                                                        <button 
                                                                            onClick={() => handleSaveSubStepEdit(step)}
                                                                            className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                                                            title="บันทึก"
                                                                        >
                                                                            <Check className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => setEditingSubStepId(null)}
                                                                            className="p-1 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors"
                                                                            title="ยกเลิก"
                                                                        >
                                                                            <X className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-xs font-bold text-gray-800">{step.label}</span>
                                                                        <span className="text-[10px] font-mono text-gray-400 bg-slate-100 px-1.5 py-0.5 rounded">{step.key}</span>
                                                                        <span className="text-xs font-black text-indigo-500 bg-indigo-50 border border-indigo-100/40 px-2 py-0.5 rounded-lg">
                                                                            🎯 {weight !== null ? `${weight}%` : `เฉลี่ย (~${weightSum.average}%)`}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Actions row */}
                                                            <div className="flex items-center gap-1.5">
                                                                {/* Arrow up */}
                                                                <button 
                                                                    disabled={idx === 0}
                                                                    onClick={() => handleMoveSubStep(step, subSteps, 'up')}
                                                                    className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-md disabled:opacity-30"
                                                                >
                                                                    <ArrowUp className="w-3.5 h-3.5" />
                                                                </button>
                                                                {/* Arrow down */}
                                                                <button 
                                                                    disabled={idx === subSteps.length - 1}
                                                                    onClick={() => handleMoveSubStep(step, subSteps, 'down')}
                                                                    className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-md disabled:opacity-30"
                                                                >
                                                                    <ArrowDown className="w-3.5 h-3.5" />
                                                                </button>

                                                                {/* Active / Inactive Toggle */}
                                                                <button 
                                                                    onClick={() => handleToggleSubStepActive(step)}
                                                                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full border transition-all ${step.isActive ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}
                                                                >
                                                                    {step.isActive ? 'Active' : 'Inactive'}
                                                                </button>

                                                                {/* Edit label/weight */}
                                                                {!isEditingStep && (
                                                                    <button 
                                                                        onClick={() => {
                                                                            setEditingSubStepId(step.id);
                                                                            setEditStepLabel(step.label);
                                                                            setEditStepWeight(weight !== null ? weight : '');
                                                                        }}
                                                                        className="p-1.5 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-white border rounded-md"
                                                                    >
                                                                        <Edit2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                )}

                                                                {/* Delete button */}
                                                                <button 
                                                                    onClick={() => handleConfirmDeleteSubStep(step)}
                                                                    className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-white border rounded-md"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>

                                        {/* Add new sub-step form */}
                                        <div className="bg-white p-4 rounded-xl border border-gray-200/80 space-y-3">
                                            <div className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                                                <Plus className="w-4 h-4 text-indigo-600" />
                                                เพิ่มขั้นตอนย่อยใหม่
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">ชื่อขั้นตอนย่อย (ไทย)</label>
                                                    <input 
                                                        type="text" 
                                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 font-semibold"
                                                        placeholder="เช่น 1. คัทชน"
                                                        value={newStepLabel}
                                                        onChange={e => setNewStepLabel(e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">รหัสเฉพาะ (Slug/Key)</label>
                                                    <input 
                                                        type="text" 
                                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 font-mono font-bold"
                                                        placeholder="เช่น EDIT_CUT_ROUGH"
                                                        value={newStepKey}
                                                        onChange={e => setNewStepKey(e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">น้ำหนักความยาก % (ปล่อยว่างได้)</label>
                                                    <div className="flex gap-2">
                                                        <div className="relative flex-1">
                                                            <input 
                                                                type="number" 
                                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 font-bold text-right pr-6"
                                                                placeholder="อัตโนมัติ"
                                                                value={newStepWeight}
                                                                onChange={e => setNewStepWeight(e.target.value === '' ? '' : Number(e.target.value))}
                                                            />
                                                            <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-gray-400">%</span>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleAddSubStep(option.key, subSteps)}
                                                            disabled={isSubmittingSubStep || !newStepLabel.trim() || !newStepKey.trim()}
                                                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold px-4 rounded-lg transition-colors flex items-center justify-center gap-1"
                                                        >
                                                            {isSubmittingSubStep ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                                            เพิ่ม
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default GeneralMasterList;
