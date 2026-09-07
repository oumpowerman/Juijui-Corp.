import { useCallback } from 'react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { useGoogleDrive } from '../useGoogleDrive';

/**
 * Hook to handle uploading attendance & leave proof attachments.
 * Strategy: Attempts Google Drive first -> Fallback to Supabase Storage.
 */
export const useAttendanceProofUploader = () => {
    const { uploadFileToDrive, isReady: isDriveReady } = useGoogleDrive();
    const { showToast } = useToast();

    const uploadProofFiles = useCallback(async (
        file?: File | File[] | null,
        user?: any
    ): Promise<string[]> => {
        if (!file) return [];
        const filesArray = Array.isArray(file) ? file : [file];
        if (filesArray.length === 0) return [];

        const uploadedUrls: string[] = [];

        for (const singleFile of filesArray) {
            let fileUrl: string | null = null;
            let driveSuccess = false;

            if (isDriveReady) {
                try {
                    showToast('กำลังอัปโหลดไปที่ Google Drive...', 'info');
                    const currentYear = format(new Date(), 'yyyy');
                    const currentMonth = format(new Date(), 'MM');
                    const driveResult = await uploadFileToDrive(singleFile, [
                        'Juijui_Assets',
                        'Attendance',
                        'Leaves',
                        currentYear,
                        currentMonth,
                        user?.name || 'Unknown'
                    ]);
                    fileUrl = driveResult.thumbnailUrl || driveResult.url;
                    driveSuccess = true;
                } catch (driveErr: any) {
                    console.warn("Drive upload failed, falling back to Supabase", driveErr);
                }
            }

            if (!driveSuccess) {
                try {
                    showToast('กำลังอัปโหลดไปที่ Storage สำรอง...', 'info');
                    const fileExt = singleFile.name.split('.').pop();
                    const fileName = `${user?.id || 'anon'}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
                    const { error: uploadErr } = await supabase.storage
                        .from('chat-files')
                        .upload(`proofs/${fileName}`, singleFile);

                    if (uploadErr) throw uploadErr;

                    const { data } = supabase.storage.from('chat-files').getPublicUrl(`proofs/${fileName}`);
                    fileUrl = data.publicUrl;
                } catch (supabaseErr: any) {
                    console.error("Supabase upload failed", supabaseErr);
                    throw new Error("ไม่สามารถอัปโหลดไฟล์ได้ทั้ง Google Drive และ Supabase");
                }
            }

            if (fileUrl) {
                uploadedUrls.push(fileUrl);
            }
        }

        return uploadedUrls;
    }, [isDriveReady, uploadFileToDrive, showToast]);

    return {
        uploadProofFiles,
        isDriveReady
    };
};
