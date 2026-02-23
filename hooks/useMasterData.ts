
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MasterOption } from '../types';
import { useToast } from '../context/ToastContext';
import { useGlobalDialog } from '../context/GlobalDialogContext';

// Default Data for seeding
const DEFAULT_OPTIONS = [
    // --- CONTENT STATUS (เดิม) ---
    { type: 'STATUS', key: 'TODO', label: 'To Do 📝', color: 'bg-gray-100 text-gray-600', sort_order: 1, progress_value: 0 },
    { type: 'STATUS', key: 'IDEA', label: 'Idea / Draft 💡', color: 'bg-yellow-50 text-yellow-600', sort_order: 2, progress_value: 15 },
    { type: 'STATUS', key: 'SCRIPT', label: 'Scripting ✍️', color: 'bg-orange-50 text-orange-600', sort_order: 3, progress_value: 30 },
    { type: 'STATUS', key: 'SHOOTING', label: 'Shooting 🎥', color: 'bg-purple-50 text-purple-600', sort_order: 4, progress_value: 50 },
    { type: 'STATUS', key: 'EDIT_CLIP', label: 'Editing ✂️', color: 'bg-indigo-50 text-indigo-600', sort_order: 5, progress_value: 70 },
    { type: 'STATUS', key: 'FEEDBACK', label: 'Review / Feedback 👀', color: 'bg-pink-50 text-pink-600', sort_order: 6, progress_value: 85 },
    { type: 'STATUS', key: 'APPROVE', label: 'Approved 👍', color: 'bg-emerald-50 text-emerald-600', sort_order: 7, progress_value: 95 },
    { type: 'STATUS', key: 'DONE', label: 'Done ✅', color: 'bg-green-100 text-green-700', sort_order: 8, progress_value: 100 },

    // --- TASK STATUS (ใหม่! สำหรับงานทั่วไป) ---
    { type: 'TASK_STATUS', key: 'TODO', label: 'To Do (รอทำ) 📥', color: 'bg-gray-100 text-gray-600', sort_order: 1 },
    { type: 'TASK_STATUS', key: 'DOING', label: 'Doing (กำลังทำ) 🔨', color: 'bg-blue-50 text-blue-600', sort_order: 2 },
    // SEPARATED: Use 'WAITING' for General Tasks, distinct from Content's 'FEEDBACK'
    { type: 'TASK_STATUS', key: 'WAITING', label: 'Waiting (รอตรวจ/รอผล) ✋', color: 'bg-orange-50 text-orange-600', sort_order: 3 },
    { type: 'TASK_STATUS', key: 'DONE', label: 'Done (เสร็จแล้ว) ✅', color: 'bg-green-100 text-green-700', sort_order: 4 },

    // --- FORMAT ---
    { type: 'FORMAT', key: 'SHORT_FORM', label: 'Short Form (สั้น)', color: 'bg-rose-100 text-rose-700', sort_order: 1 },
    { type: 'FORMAT', key: 'LONG_FORM', label: 'Long Form (ยาว)', color: 'bg-indigo-100 text-indigo-700', sort_order: 2 },
    { type: 'FORMAT', key: 'REELS', label: 'Reels / TikTok', color: 'bg-zinc-100 text-zinc-700', sort_order: 3 },
    { type: 'FORMAT', key: 'PICTURE', label: 'Photo / Album', color: 'bg-teal-100 text-teal-700', sort_order: 4 },
    { type: 'FORMAT', key: 'STORY', label: 'Story', color: 'bg-amber-100 text-amber-700', sort_order: 5 },

    // --- PILLAR ---
    { type: 'PILLAR', key: 'ENTERTAINMENT', label: 'Entertainment 🎬', color: 'bg-purple-100 text-purple-700', sort_order: 1 },
    { type: 'PILLAR', key: 'EDUCATION', label: 'Education 📚', color: 'bg-blue-100 text-blue-700', sort_order: 2 },
    { type: 'PILLAR', key: 'LIFESTYLE', label: 'Lifestyle 🌱', color: 'bg-green-100 text-green-700', sort_order: 3 },
    { type: 'PILLAR', key: 'PROMO', label: 'Promotion 📢', color: 'bg-orange-100 text-orange-700', sort_order: 4 },
    { type: 'PILLAR', key: 'REALTIME', label: 'Realtime / News ⚡', color: 'bg-red-100 text-red-700', sort_order: 5 },

    // --- CATEGORY ---
    { type: 'CATEGORY', key: 'VLOG', label: 'Vlog', color: 'bg-gray-100 text-gray-700', sort_order: 1 },
    { type: 'CATEGORY', key: 'REVIEW', label: 'Review', color: 'bg-gray-100 text-gray-700', sort_order: 2 },
    { type: 'CATEGORY', key: 'HOW_TO', label: 'How-to', color: 'bg-gray-100 text-gray-700', sort_order: 3 },
    { type: 'CATEGORY', key: 'INTERVIEW', label: 'Interview', color: 'bg-gray-100 text-gray-700', sort_order: 4 },
    
    // --- POSITION (For Users) ---
    { type: 'POSITION', key: 'CEO', label: 'CEO', color: 'bg-slate-900 text-white', sort_order: 0 },
    { type: 'POSITION', key: 'HR_MANAGER', label: 'HR Manager', color: 'bg-pink-100 text-pink-700', sort_order: 1 },
    { type: 'POSITION', key: 'SENIOR_HR', label: 'Senior HR', color: 'bg-pink-50 text-pink-600', sort_order: 2 },
    { type: 'POSITION', key: 'CREATIVE', label: 'Creative', color: 'bg-yellow-100 text-yellow-700', sort_order: 3 },
    { type: 'POSITION', key: 'EDITOR', label: 'Editor', color: 'bg-blue-100 text-blue-700', sort_order: 4 },
    { type: 'POSITION', key: 'PRODUCTION', label: 'Production', color: 'bg-green-100 text-green-700', sort_order: 5 },
    { type: 'POSITION', key: 'ADMIN', label: 'Admin / Co-ord', color: 'bg-purple-100 text-purple-700', sort_order: 6 },

    // --- WORK CONFIG (Attendance Rules) ---
    { type: 'WORK_CONFIG', key: 'START_TIME', label: '10:00', color: '', sort_order: 1 },
    { type: 'WORK_CONFIG', key: 'END_TIME', label: '19:00', color: '', sort_order: 2 },
    { type: 'WORK_CONFIG', key: 'LATE_BUFFER', label: '15', color: '', sort_order: 3 },
    { type: 'WORK_CONFIG', key: 'MIN_HOURS', label: '9', color: '', sort_order: 4 }, // Added Hybrid Rule Config

    // --- ATTENDANCE TYPES (Using sort_order as HP/Score impact) ---
    { type: 'ATTENDANCE_TYPE', key: 'OFFICE', label: 'เข้าออฟฟิศ', color: 'bg-indigo-600', sort_order: 10 },
    { type: 'ATTENDANCE_TYPE', key: 'WFH', label: 'ทำงานที่บ้าน (WFH)', color: 'bg-blue-600', sort_order: 10 },
    { type: 'ATTENDANCE_TYPE', key: 'SITE', label: 'ออกกอง/ข้างนอก', color: 'bg-orange-500', sort_order: 10 },
    { type: 'ATTENDANCE_TYPE', key: 'LATE', label: 'มาสาย (Late)', color: 'bg-yellow-500', sort_order: -5 },
    { type: 'ATTENDANCE_TYPE', key: 'EARLY_LEAVE', label: 'กลับก่อน (Early)', color: 'bg-orange-400', sort_order: -5 },
    { type: 'ATTENDANCE_TYPE', key: 'ABSENT', label: 'ขาดงาน (Absent)', color: 'bg-red-500', sort_order: -20 },
    { type: 'ATTENDANCE_TYPE', key: 'NO_SHOW', label: 'หายเงียบ (No Show)', color: 'bg-red-800', sort_order: -50 },

    // --- LEAVE TYPES ---
    { type: 'LEAVE_TYPE', key: 'SICK', label: 'ลาป่วย', color: 'bg-gray-500', sort_order: 0 },
    { type: 'LEAVE_TYPE', key: 'BUSINESS', label: 'ลากิจ', color: 'bg-gray-500', sort_order: 0 },
    { type: 'LEAVE_TYPE', key: 'VACATION', label: 'พักร้อน', color: 'bg-blue-500', sort_order: 0 },
    { type: 'LEAVE_TYPE', key: 'WITHOUT_PAY', label: 'ลาไม่รับค่าจ้าง', color: 'bg-gray-800', sort_order: -5 },
];

export const useMasterData = () => {
    const [options, setOptions] = useState<MasterOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();

    const fetchOptions = async () => {
        // Only set loading on initial fetch or empty state
        if (options.length === 0) setIsLoading(true);
        
        try {
            const { data, error } = await supabase
                .from('master_options')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) {
                console.error('Error fetching master_options:', error);
                throw error;
            }

            if (data) {
                setOptions(data.map((item: any) => ({
                    id: item.id,
                    // Normalize type: Uppercase and Trim whitespace to prevent matching errors
                    type: (item.type || '').trim().toUpperCase(),
                    key: (item.key || '').trim(),
                    label: item.label,
                    color: item.color,
                    sortOrder: item.sort_order,
                    isActive: item.is_active,
                    isDefault: item.is_default,
                    parentKey: item.parent_key,
                    description: item.description, // Map description
                    progressValue: item.progress_value // Map progress_value
                })));
            }
        } catch (err: any) {
            console.error('Fetch master options failed:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddOption = async (option: Omit<MasterOption, 'id'>) => {
        try {
            // Check for Duplicates (Case-Insensitive)
            const exists = options.some(o => 
                o.type === option.type && 
                (o.key === option.key || o.label.toLowerCase().trim() === option.label.toLowerCase().trim())
            );

            if (exists) {
                showToast(`ข้อมูล "${option.label}" มีอยู่แล้วในระบบ`, 'warning');
                return false;
            }

            const payload = {
                type: option.type,
                key: option.key,
                label: option.label,
                color: option.color,
                sort_order: option.sortOrder,
                is_active: option.isActive,
                is_default: option.isDefault,
                parent_key: option.parentKey || null,
                description: option.description || null, // Add description
                progress_value: option.progressValue || 0 // Add progress_value
            };

            const { data, error } = await supabase.from('master_options').insert(payload).select().single();
            if (error) throw error;

            const newOption: MasterOption = {
                id: data.id,
                type: (data.type || '').trim().toUpperCase(),
                key: data.key,
                label: data.label,
                color: data.color,
                sortOrder: data.sort_order,
                isActive: data.is_active,
                isDefault: data.is_default,
                parentKey: data.parent_key,
                description: data.description,
                progressValue: data.progress_value
            };

            setOptions(prev => [...prev, newOption]);
            showToast('เพิ่มข้อมูลสำเร็จ ✅', 'success');
            return true;
        } catch (err: any) {
            console.error(err);
            showToast('เพิ่มไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const handleUpdateOption = async (option: MasterOption) => {
        try {
            const payload = {
                type: option.type,
                key: option.key,
                label: option.label,
                color: option.color,
                sort_order: option.sortOrder,
                is_active: option.isActive,
                is_default: option.isDefault,
                parent_key: option.parentKey || null,
                description: option.description || null, // Add description
                progress_value: option.progressValue || 0 // Add progress_value
            };

            const { error } = await supabase.from('master_options').update(payload).eq('id', option.id);
            if (error) throw error;

            setOptions(prev => prev.map(o => o.id === option.id ? option : o));
            showToast('อัปเดตข้อมูลสำเร็จ ✨', 'success');
            return true;
        } catch (err: any) {
            console.error(err);
            showToast('อัปเดตไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const handleDeleteOption = async (id: string) => {
        // Fix: Replaced native confirm with showConfirm
        const confirmed = await showConfirm('ยืนยันการลบข้อมูลนี้? หากลบแล้วอาจกระทบกับงานเก่าที่ใช้ค่านี้อยู่', 'ลบข้อมูลมาสเตอร์');
        if(!confirmed) return;

        try {
            const { error } = await supabase.from('master_options').delete().eq('id', id);
            if (error) throw error;

            setOptions(prev => prev.filter(o => o.id !== id));
            showToast('ลบข้อมูลเรียบร้อย 🗑️', 'info');
            return true;
        } catch (err: any) {
            console.error(err);
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const seedDefaults = async () => {
        try {
            setIsLoading(true);
            showToast('กำลังตรวจสอบฐานข้อมูล... กรุณารอสักครู่', 'info');
            
            const { data: existingData, error: fetchError } = await supabase
                .from('master_options')
                .select('type, key');

            if (fetchError) throw fetchError;

            const existingSet = new Set(
                existingData?.map((i: any) => `${i.type.trim().toUpperCase()}_${i.key.trim()}`) || []
            );

            let insertedCount = 0;
            
            for (const opt of DEFAULT_OPTIONS) {
                const compositeKey = `${opt.type}_${opt.key}`;

                if (!existingSet.has(compositeKey)) {
                    const { error: insertError } = await supabase
                        .from('master_options')
                        .insert(opt);

                    if (!insertError) {
                        insertedCount++;
                    } else {
                        console.error(`Failed to insert ${compositeKey}:`, insertError);
                    }
                }
            }

            if (insertedCount > 0) {
                showToast(`สร้างข้อมูลเพิ่มสำเร็จ ${insertedCount} รายการ 🎉`, 'success');
                await fetchOptions(); 
            } else {
                showToast('ข้อมูลครบถ้วนอยู่แล้วครับ (ตรวจสอบจาก DB แล้ว)', 'success');
            }

        } catch (err: any) {
            console.error(err);
            showToast('สร้างข้อมูลไม่สำเร็จ: ' + err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOptions();

        const channel = supabase
            .channel('realtime-master-options-v2')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'master_options' },
                () => {
                    fetchOptions();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return {
        masterOptions: options,
        isLoading,
        fetchMasterOptions: fetchOptions,
        addMasterOption: handleAddOption,
        updateMasterOption: handleUpdateOption,
        deleteMasterOption: handleDeleteOption,
        seedDefaults
    };
};
