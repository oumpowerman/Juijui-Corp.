
import React, { useState, useEffect } from 'react';
import { Task, Channel, User, MasterOption, ScriptSummary, Script } from '../../types';
import { useContentForm } from '../../hooks/useContentForm';
import { useScripts } from '../../hooks/useScripts';
import { AlertTriangle, Trash2, Send, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import ScriptEditor from '../script/ScriptEditor'; 
import TaskAssets from '../TaskAssets';

// Import Refactored Parts
import CFHeader from './content-parts/CFHeader';
import CFScriptLinker from './content-parts/CFScriptLinker';
import CFDateAndStock from './content-parts/CFDateAndStock';
import CFProductionInfo from './content-parts/CFProductionInfo';
import CFCategorization from './content-parts/CFCategorization';
import CFStatusChannel from './content-parts/CFStatusChannel';
import CFPlatformSelector from './content-parts/CFPlatformSelector';
import CFCrewSelector from './content-parts/CFCrewSelector';
import CFBrief from './content-parts/CFBrief';

interface ContentFormProps {
    initialData?: Task | null;
    selectedDate?: Date | null;
    channels: Channel[];
    users: User[];
    masterOptions: MasterOption[];
    currentUser?: User; 
    onSave: (task: Task) => void;
    onDelete?: (taskId: string) => void;
    onClose: () => void;
}

const ContentForm: React.FC<ContentFormProps> = ({ 
    initialData, selectedDate, channels, users, masterOptions, currentUser, onSave, onDelete, onClose 
}) => {
    const { showToast } = useToast();
    const { showAlert, showConfirm } = useGlobalDialog(); 
    
    // Script Hook
    const { createScript, getScriptByContentId, getScriptById, updateScript, generateScriptWithAI } = useScripts(currentUser || { id: '', name: '', role: 'MEMBER' } as User);
    const [linkedScript, setLinkedScript] = useState<ScriptSummary | null>(null);
    const [scriptToEdit, setScriptToEdit] = useState<Script | null>(null); 
    const [isLoadingScript, setIsLoadingScript] = useState(false);
    const [isSendingQC, setIsSendingQC] = useState(false);

    const {
        title, setTitle,
        description, setDescription,
        // remark, setRemark,
        startDate, setStartDate,
        endDate, setEndDate,
        isStock, setIsStock,
        status, setStatus,
        channelId, setChannelId,
        targetPlatforms, 
        pillar, setPillar,
        contentFormat, setContentFormat,
        category, setCategory,
        publishedLinks, handleLinkChange,
        shootDate, setShootDate,
        shootLocation, setShootLocation,
        ideaOwnerIds, setIdeaOwnerIds,
        editorIds, setEditorIds,
        assigneeIds, setAssigneeIds,
        assets, addAsset, removeAsset, // Assets from hook
        error,
        formatOptions, pillarOptions, statusOptions,
        handleSubmit, togglePlatform, toggleUserSelection
    } = useContentForm({
        initialData,
        selectedDate,
        channels,
        masterOptions,
        onSave
    });

    const activeUsers = users.filter(u => u.isActive);

    // --- SCRIPT LOGIC ---
    useEffect(() => {
        const checkScript = async () => {
            if (initialData?.id) {
                setIsLoadingScript(true);
                const script = await getScriptByContentId(initialData.id);
                setLinkedScript(script);
                setIsLoadingScript(false);
            }
        };
        checkScript();
    }, [initialData?.id]);

    const handleCreateScript = async () => {
        if (!initialData?.id) {
            await showAlert('กรุณาบันทึกงาน (Save) ก่อนสร้างสคริปต์ครับ', 'แจ้งเตือน');
            return;
        }
        
        const confirmed = await showConfirm('ต้องการสร้างสคริปต์ใหม่สำหรับงานนี้?', 'สร้างสคริปต์');
        
        if (confirmed) {
            setIsLoadingScript(true);
            const scriptId = await createScript({
                title: title || 'Untitled Script',
                contentId: initialData.id,
                channelId: channelId || null,
                category: category || null
            });
            if (scriptId) {
                // Refresh link
                const script = await getScriptByContentId(initialData.id);
                setLinkedScript(script);
                
                // Optional: Open Editor Immediately
                const fullData = await getScriptById(scriptId);
                if (fullData) setScriptToEdit(fullData);
            }
            setIsLoadingScript(false);
        }
    };

    const handleOpenScript = async () => {
        if (!linkedScript) return;
        setIsLoadingScript(true);
        const fullData = await getScriptById(linkedScript.id);
        setIsLoadingScript(false);
        
        if (fullData) {
            setScriptToEdit(fullData);
        } else {
            await showAlert('ไม่สามารถโหลดข้อมูลสคริปต์ได้', 'เกิดข้อผิดพลาด');
        }
    };

    const handleDeleteTask = async () => {
        const confirmed = await showConfirm('แน่ใจนะว่าจะลบงานนี้? การกระทำนี้ไม่สามารถย้อนกลับได้', 'ยืนยันการลบ');
        if (confirmed && initialData && onDelete) {
            onDelete(initialData.id);
            onClose();
        }
    };

    const handleSendToQC = async () => {
        if (!initialData?.id) {
             await showAlert('กรุณาบันทึกงานครั้งแรกก่อนส่งตรวจครับ', 'แจ้งเตือน');
             return;
        }

        // Check for pending review
        const pendingReview = initialData.reviews?.find(r => r.status === 'PENDING');
        if (pendingReview) {
             await showAlert(
                 `มีรายการ "Draft ${pendingReview.round}" รอตรวจอยู่แล้ว \nกรุณารอผลการตรวจ หรือยกเลิกรายการเดิมก่อนส่งใหม่`,
                 '⚠️ ส่งซ้ำไม่ได้'
             );
             return;
        }
        
        const currentRoundCount = initialData.reviews?.length || 0;
        const nextRound = currentRoundCount + 1;
        
        const confirmed = await showConfirm(
            `งานจะถูกส่งเข้าห้องตรวจ และเปลี่ยนสถานะเป็น "Feedback"`,
            `🚀 ยืนยันส่งตรวจ "Draft ${nextRound}" ?`
        );

        if (!confirmed) return;

        setIsSendingQC(true);
        try {
            const { error: reviewError } = await supabase.from('task_reviews').insert({
                content_id: initialData.id, 
                task_id: null,
                round: nextRound,
                scheduled_at: new Date().toISOString(),
                status: 'PENDING',
                reviewer_id: null
            });
            if (reviewError) throw reviewError;

            await supabase.from('task_logs').insert({
                content_id: initialData.id,
                action: 'SENT_TO_QC',
                details: `ส่งตรวจงาน (Draft ${nextRound})`,
                user_id: currentUser?.id
            });

            // Update status to FEEDBACK
            setStatus('FEEDBACK');
            await supabase.from('contents').update({ status: 'FEEDBACK' }).eq('id', initialData.id);
            
            showToast(`ส่ง Draft ${nextRound} เรียบร้อย! 🚀`, 'success');
            onClose();

        } catch (err: any) {
            console.error(err);
            showToast('ส่งตรวจไม่สำเร็จ: ' + err.message, 'error');
        } finally {
            setIsSendingQC(false);
        }
    };

    // If Script Editor is Open, Render it on top
    if (scriptToEdit && currentUser) {
        return (
            <ScriptEditor 
                script={scriptToEdit}
                users={users}
                currentUser={currentUser}
                channels={channels}
                masterOptions={masterOptions}
                onClose={() => {
                    setScriptToEdit(null);
                    if (initialData?.id) {
                        getScriptByContentId(initialData.id).then(setLinkedScript);
                    }
                }}
                onSave={updateScript}
                onGenerateAI={generateScriptWithAI}
            />
        );
    }

    return (
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
            {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm flex items-center shadow-sm border border-red-100 animate-bounce"><AlertTriangle className="w-4 h-4 mr-2" />{error}</div>}

            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                
                {/* 1. Title Input */}
                <CFHeader title={title} setTitle={setTitle} />

                {/* 2. Script Integration */}
                <CFScriptLinker 
                    hasContentId={!!initialData?.id}
                    linkedScript={linkedScript}
                    isLoadingScript={isLoadingScript}
                    onOpenScript={handleOpenScript}
                    onCreateScript={handleCreateScript}
                />

                {/* 3. Date & Stock */}
                <CFDateAndStock 
                    startDate={startDate} setStartDate={setStartDate}
                    endDate={endDate} setEndDate={setEndDate}
                    isStock={isStock} setIsStock={setIsStock}
                />

                {/* 4. Production Info */}
                <CFProductionInfo 
                    shootDate={shootDate} setShootDate={setShootDate}
                    shootLocation={shootLocation} setShootLocation={setShootLocation}
                />

                {/* 5. Format & Pillar */}
                <CFCategorization 
                    contentFormat={contentFormat} setContentFormat={setContentFormat}
                    pillar={pillar} setPillar={setPillar}
                    formatOptions={formatOptions} pillarOptions={pillarOptions}
                />

                {/* 6. Status & Channel */}
                <CFStatusChannel 
                    status={status} setStatus={setStatus}
                    channelId={channelId} setChannelId={setChannelId}
                    statusOptions={statusOptions} channels={channels}
                />

                {/* 7. Platforms & Links */}
                <CFPlatformSelector 
                    targetPlatforms={targetPlatforms}
                    togglePlatform={togglePlatform}
                    publishedLinks={publishedLinks}
                    handleLinkChange={handleLinkChange}
                />

                {/* 8. Crew Selection */}
                <CFCrewSelector 
                    users={activeUsers}
                    ideaOwnerIds={ideaOwnerIds} editorIds={editorIds} assigneeIds={assigneeIds}
                    setIdeaOwnerIds={setIdeaOwnerIds} setEditorIds={setEditorIds} setAssigneeIds={setAssigneeIds}
                    toggleUserSelection={toggleUserSelection}
                />

                {/* 9. Description */}
                <CFBrief description={description} setDescription={setDescription} />

                {/* 10. Assets */}
                 <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <TaskAssets 
                        assets={assets}
                        onAdd={addAsset}
                        onDelete={removeAsset}
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-6 mt-8 border-t border-gray-100 bg-white pb-safe-area">
                <div className="flex items-center gap-2">
                    {initialData && onDelete && (
                        <button type="button" onClick={handleDeleteTask} className="text-red-400 text-sm hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl flex items-center transition-colors">
                        <Trash2 className="w-4 h-4 mr-2" /> ลบ
                        </button>
                    )}
                </div>
                <div className="flex space-x-3">
                    {initialData && status !== 'FEEDBACK' && status !== 'DONE' && status !== 'APPROVE' && (
                        <button 
                            type="button" 
                            onClick={handleSendToQC}
                            disabled={isSendingQC}
                            className="px-4 py-3 text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors flex items-center active:scale-95 disabled:opacity-50"
                        >
                            {isSendingQC ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                            ส่งตรวจ
                        </button>
                    )}

                    <button type="button" onClick={onClose} className="px-5 py-3 text-sm font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                        ยกเลิก
                    </button>
                    <button type="submit" className="px-6 py-3 text-sm font-bold text-white rounded-xl shadow-lg bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 transition-all">
                    {initialData ? 'บันทึกการแก้ไข' : 'สร้างคอนเทนต์!'}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default ContentForm;
