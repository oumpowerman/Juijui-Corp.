
import { useState, Dispatch, SetStateAction } from 'react';
import { supabase } from '../../lib/supabase';
import { Duty, User } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import { useGamification } from '../useGamification';
import { format } from 'date-fns';

export const useDutyProof = (
    currentUser: User | null, 
    duties: Duty[],
    setDuties: Dispatch<SetStateAction<Duty[]>>,
    isDriveReady: boolean,
    uploadFileToDrive: (file: File, path: string[]) => Promise<any>,
    isAuthenticated: boolean,
    login: () => void
) => {
    const [isUploading, setIsUploading] = useState(false);
    const { showToast } = useToast();
    const { showAlert, showConfirm } = useGlobalDialog();
    const { processAction } = useGamification();

    const submitProof = async (
        dutyId: string, 
        file: File, 
        userName: string
    ): Promise<boolean> => {
        if (!currentUser) return false;
        
        const duty = duties.find(d => d.id === dutyId);
        if (!duty) return false;

        setIsUploading(true);

        try {
            let imageUrl: string | null = null;

            // ... (Google Drive logic) ...
            if (isDriveReady) {
                // ... (upload logic) ...
                try {
                    const currentYear = format(new Date(), 'yyyy');
                    const currentMonth = format(new Date(), 'MM');
                    const result = await uploadFileToDrive(file, ['Juijui_Assets', 'Duty', currentYear, currentMonth]);
                    imageUrl = result.thumbnailUrl || result.url;
                    
                    if (imageUrl) {
                        showToast('บันทึกลง Google Drive สำเร็จ ✅', 'success');
                    }
                } catch (driveErr: any) {
                    // ... (fallback confirm logic) ...
                    console.error("Drive Upload Error:", driveErr);
                    
                    const useFallback = await showConfirm(
                        "บันทึกไดร์ฟไม่สำเร็จ",
                        `เกิดข้อผิดพลาด: ${driveErr.message || 'ไม่ทราบสาเหตุ'}\n\nคุณต้องการบันทึกผ่านระบบสำรอง (Supabase) เพื่อให้งานเสร็จสมบูรณ์ทันทีหรือไม่?`
                    );

                    if (!useFallback) {
                        setIsUploading(false);
                        return false;
                    }
                }
            }

            // --- STRATEGY: FALLBACK TO SUPABASE ---
            if (!imageUrl) {
                // ... (supabase upload logic) ...
                try {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `duty-proof-${dutyId}-${Date.now()}.${fileExt}`;
                    
                    const { error: uploadError } = await supabase.storage
                        .from('chat-files') 
                        .upload(fileName, file);

                    if (uploadError) throw uploadError;

                    const { data: urlData } = supabase.storage
                        .from('chat-files')
                        .getPublicUrl(fileName);
                    
                    imageUrl = urlData.publicUrl;
                    showToast('บันทึกผ่านระบบสำรองเรียบร้อย', 'info');
                } catch (supabaseErr: any) {
                    showAlert("ข้อผิดพลาด", "ไม่สามารถบันทึกไฟล์ลงระบบสำรองได้: " + supabaseErr.message);
                    setIsUploading(false);
                    return false;
                }
            }

            if (!imageUrl) throw new Error("Could not upload image to any storage provider.");

            // --- FINALIZING: UPDATE DB & NOTIFY ---
            const { error: dbError } = await supabase
                .from('duties')
                .update({ 
                    is_done: true,
                    proof_image_url: imageUrl
                })
                .eq('id', dutyId);

            if (dbError) throw dbError;

            // Update Local State for Instant UI Feedback
            setDuties(prev => prev.map(d => d.id === dutyId ? { ...d, isDone: true, proofImageUrl: imageUrl! } : d));

            // Send Message to Chat
            // ... (chat message logic) ...
            const isAssist = currentUser.id !== duty.assigneeId;
            const message = isAssist 
                ? `🦸‍♂️ **${userName}** เป็นฮีโร่! ช่วยทำเวรแทนเจ้าของเวร "${duty.title}" เรียบร้อย!` 
                : `📸 **${userName}** ส่งการบ้านเวร "${duty.title}" เรียบร้อย! \n(Proof: ${format(new Date(), 'HH:mm')})`;
            
            await supabase.from('team_messages').insert([
                {
                    content: message,
                    is_bot: true, 
                    message_type: 'TEXT', 
                    user_id: null
                },
                {
                    content: imageUrl,
                    is_bot: true,
                    message_type: 'IMAGE',
                    user_id: null
                }
            ]);

            // Gamification
            // ... (gamification logic) ...
            if (isAssist) {
                processAction(currentUser.id, 'DUTY_ASSIST', { ...duty, targetName: 'เพื่อนร่วมทีม' });
            } else if (duty.assigneeId) {
                // Check if it's a late submission
                const today = new Date();
                today.setHours(0,0,0,0);
                const dutyDate = new Date(duty.date);
                dutyDate.setHours(0,0,0,0);
                
                const isLate = dutyDate < today || duty.penaltyStatus === 'AWAITING_TRIBUNAL';
                
                if (isLate) {
                    processAction(duty.assigneeId, 'DUTY_LATE_SUBMIT', duty);
                } else {
                    processAction(duty.assigneeId, 'DUTY_COMPLETE', duty);
                }
            }

            return true;
        } catch (err: any) {
            console.error(err);
            showToast('เกิดข้อผิดพลาดในการส่งหลักฐาน', 'error');
            return false;
        } finally {
            setIsUploading(false);
        }
    };

    const submitAppeal = async (
        dutyId: string,
        reason: string,
        file?: File,
        userName?: string
    ) => {
        try {
            let proofUrl = null;
            if (file) {
                // ... (appeal upload logic) ...
                const fileExt = file.name.split('.').pop();
                const fileName = `duty-appeal-${dutyId}-${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('chat-files').upload(fileName, file);
                if (!uploadError) {
                    const { data } = supabase.storage.from('chat-files').getPublicUrl(fileName);
                    proofUrl = data.publicUrl;
                }
            }

            const { error } = await supabase
                .from('duties')
                .update({ 
                    penalty_status: 'UNDER_REVIEW',
                    appeal_reason: reason,
                    appeal_proof_url: proofUrl
                })
                .eq('id', dutyId);

            if (error) throw error;

            // Update Local State
            setDuties(prev => prev.map(d => d.id === dutyId ? { 
                ...d, 
                penaltyStatus: 'UNDER_REVIEW', 
                appealReason: reason, 
                appealProofUrl: proofUrl || d.appealProofUrl 
            } : d));
            
            const duty = duties.find(d => d.id === dutyId);
            if (duty) {
                 const message = `🙏 **${userName || 'User'}** ส่งคำร้องอุทธรณ์เวร "${duty.title}" \n📝 เหตุผล: "${reason}"`;
                 await supabase.from('team_messages').insert({
                    content: message,
                    is_bot: true, 
                    message_type: 'TEXT', 
                    user_id: null
                });
            }

            showToast('ส่งคำร้องแล้ว รอ Admin ตรวจสอบครับ', 'success');
            return true;
        } catch (err: any) {
             console.error(err);
             showToast('ส่งคำร้องไม่สำเร็จ: ' + err.message, 'error');
             return false;
        }
    };

    return {
        isUploading,
        submitProof,
        submitAppeal
    };
};
