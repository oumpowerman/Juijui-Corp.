
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { MasterOption } from '../types';
import { useToast } from '../context/ToastContext';
import { useGlobalDialog } from '../context/GlobalDialogContext';

interface MasterDataContextType {
    masterOptions: MasterOption[];
    annualHolidays: any[];
    calendarExceptions: any[];
    inventoryItems: any[];
    isLoading: boolean;
    fetchMasterOptions: () => Promise<void>;
    addMasterOption: (option: Omit<MasterOption, 'id'>) => Promise<boolean>;
    updateMasterOption: (option: MasterOption) => Promise<boolean>;
    deleteMasterOption: (id: string) => Promise<boolean>;
    seedDefaults: () => Promise<void>;
}

const MasterDataContext = createContext<MasterDataContextType | undefined>(undefined);

// LocalStorage Keys
const CACHE_KEY_OPTIONS = 'master_options_cache';
const CACHE_KEY_VERSION = 'master_options_version_cache';

// Default Data for seeding (Moved from hook to provider)
const DEFAULT_OPTIONS = [
    { type: 'STATUS', key: 'TODO', label: 'To Do 📝', color: 'bg-gray-100 text-gray-600', sort_order: 1, progress_value: 0 },
    { type: 'STATUS', key: 'IDEA', label: 'Idea / Draft 💡', color: 'bg-yellow-50 text-yellow-600', sort_order: 2, progress_value: 15 },
    { type: 'STATUS', key: 'SCRIPT', label: 'Scripting ✍️', color: 'bg-orange-50 text-orange-600', sort_order: 3, progress_value: 30 },
    { type: 'STATUS', key: 'SHOOTING', label: 'Shooting 🎥', color: 'bg-purple-50 text-purple-600', sort_order: 4, progress_value: 50 },
    { type: 'STATUS', key: 'EDIT_CLIP', label: 'Editing ✂️', color: 'bg-indigo-50 text-indigo-600', sort_order: 5, progress_value: 70 },
    { type: 'STATUS', key: 'FEEDBACK', label: 'Review / Feedback 👀', color: 'bg-pink-50 text-pink-600', sort_order: 6, progress_value: 85 },
    { type: 'STATUS', key: 'APPROVE', label: 'Approved 👍', color: 'bg-emerald-50 text-emerald-600', sort_order: 7, progress_value: 95 },
    { type: 'STATUS', key: 'DONE', label: 'Done ✅', color: 'bg-green-100 text-green-700', sort_order: 8, progress_value: 100 },
    { type: 'TASK_STATUS', key: 'TODO', label: 'To Do (รอทำ) 📥', color: 'bg-gray-100 text-gray-600', sort_order: 1 },
    { type: 'TASK_STATUS', key: 'DOING', label: 'Doing (กำลังทำ) 🔨', color: 'bg-blue-50 text-blue-600', sort_order: 2 },
    { type: 'TASK_STATUS', key: 'WAITING', label: 'Waiting (รอตรวจ/รอผล) ✋', color: 'bg-orange-50 text-orange-600', sort_order: 3 },
    { type: 'TASK_STATUS', key: 'DONE', label: 'Done (เสร็จแล้ว) ✅', color: 'bg-green-100 text-green-700', sort_order: 4 },
    { type: 'FORMAT', key: 'SHORT_FORM', label: 'Short Form (สั้น)', color: 'bg-rose-100 text-rose-700', sort_order: 1 },
    { type: 'FORMAT', key: 'LONG_FORM', label: 'Long Form (ยาว)', color: 'bg-indigo-100 text-indigo-700', sort_order: 2 },
    { type: 'FORMAT', key: 'REELS', label: 'Reels / TikTok', color: 'bg-zinc-100 text-zinc-700', sort_order: 3 },
    { type: 'FORMAT', key: 'PICTURE', label: 'Photo / Album', color: 'bg-teal-100 text-teal-700', sort_order: 4 },
    { type: 'FORMAT', key: 'STORY', label: 'Story', color: 'bg-amber-100 text-amber-700', sort_order: 5 },
    { type: 'PILLAR', key: 'ENTERTAINMENT', label: 'Entertainment 🎬', color: 'bg-purple-100 text-purple-700', sort_order: 1 },
    { type: 'PILLAR', key: 'EDUCATION', label: 'Education 📚', color: 'bg-blue-100 text-blue-700', sort_order: 2 },
    { type: 'PILLAR', key: 'LIFESTYLE', label: 'Lifestyle 🌱', color: 'bg-green-100 text-green-700', sort_order: 3 },
    { type: 'PILLAR', key: 'PROMO', label: 'Promotion 📢', color: 'bg-orange-100 text-orange-700', sort_order: 4 },
    { type: 'PILLAR', key: 'REALTIME', label: 'Realtime / News ⚡', color: 'bg-red-100 text-red-700', sort_order: 5 },
    { type: 'CATEGORY', key: 'VLOG', label: 'Vlog', color: 'bg-gray-100 text-gray-700', sort_order: 1 },
    { type: 'CATEGORY', key: 'REVIEW', label: 'Review', color: 'bg-gray-100 text-gray-700', sort_order: 2 },
    { type: 'CATEGORY', key: 'HOW_TO', label: 'How-to', color: 'bg-gray-100 text-gray-700', sort_order: 3 },
    { type: 'CATEGORY', key: 'INTERVIEW', label: 'Interview', color: 'bg-gray-100 text-gray-700', sort_order: 4 },
    { type: 'POSITION', key: 'CEO', label: 'CEO', color: 'bg-slate-900 text-white', sort_order: 0 },
    { type: 'POSITION', key: 'HR_MANAGER', label: 'HR Manager', color: 'bg-pink-100 text-pink-700', sort_order: 1 },
    { type: 'POSITION', key: 'SENIOR_HR', label: 'Senior HR', color: 'bg-pink-50 text-pink-600', sort_order: 2 },
    { type: 'POSITION', key: 'CREATIVE', label: 'Creative', color: 'bg-yellow-100 text-yellow-700', sort_order: 3 },
    { type: 'POSITION', key: 'EDITOR', label: 'Editor', color: 'bg-blue-100 text-blue-700', sort_order: 4 },
    { type: 'POSITION', key: 'PRODUCTION', label: 'Production', color: 'bg-green-100 text-green-700', sort_order: 5 },
    { type: 'POSITION', key: 'ADMIN', label: 'Admin / Co-ord', color: 'bg-purple-100 text-purple-700', sort_order: 6 },
    { type: 'WORK_CONFIG', key: 'START_TIME', label: '10:00', color: '', sort_order: 1 },
    { type: 'WORK_CONFIG', key: 'END_TIME', label: '19:00', color: '', sort_order: 2 },
    { type: 'WORK_CONFIG', key: 'LATE_BUFFER', label: '15', color: '', sort_order: 3 },
    { type: 'WORK_CONFIG', key: 'MIN_HOURS', label: '9', color: '', sort_order: 4 },
    { type: 'ATTENDANCE_TYPE', key: 'OFFICE', label: 'เข้าออฟฟิศ', color: 'bg-indigo-600', sort_order: 10 },
    { type: 'ATTENDANCE_TYPE', key: 'ON_TIME', label: 'มาตรงเวลา (On Time)', color: 'bg-emerald-600', sort_order: 15, description: '{"icon": "CheckCircle", "category": "STANDARD"}' },
    { type: 'ATTENDANCE_TYPE', key: 'WFH', label: 'ทำงานที่บ้าน (WFH)', color: 'bg-blue-600', sort_order: 10, description: '{"icon": "Home", "category": "STANDARD"}' },
    { type: 'ATTENDANCE_TYPE', key: 'SITE', label: 'ออกกอง/ข้างนอก', color: 'bg-orange-500', sort_order: 10, description: '{"icon": "MapPin", "category": "STANDARD"}' },
    { type: 'ATTENDANCE_TYPE', key: 'LATE', label: 'มาสาย (Late)', color: 'bg-yellow-500', sort_order: -5, description: '{"icon": "Clock", "category": "STANDARD"}' },
    { type: 'ATTENDANCE_TYPE', key: 'EARLY_LEAVE', label: 'กลับก่อน (Early)', color: 'bg-orange-400', sort_order: -5, description: '{"icon": "LogOut", "category": "STANDARD"}' },
    { type: 'ATTENDANCE_TYPE', key: 'ABSENT', label: 'ขาดงาน (Absent)', color: 'bg-red-500', sort_order: -20, description: '{"icon": "UserX", "category": "STANDARD"}' },
    { type: 'ATTENDANCE_TYPE', key: 'NO_SHOW', label: 'หายเงียบ (No Show)', color: 'bg-red-800', sort_order: -50, description: '{"icon": "Ghost", "category": "STANDARD"}' },
    { type: 'LEAVE_TYPE', key: 'SICK', label: 'ลาป่วย', color: 'bg-red-500', sort_order: 1, description: '{"icon": "HeartPulse", "category": "STANDARD", "defaultQuota": 30, "placeholder": "ระบุอาการป่วย..."}' },
    { type: 'LEAVE_TYPE', key: 'VACATION', label: 'พักร้อน', color: 'bg-blue-500', sort_order: 2, description: '{"icon": "Palmtree", "category": "STANDARD", "defaultQuota": 6, "placeholder": "ระบุแผนการพักผ่อน..."}' },
    { type: 'LEAVE_TYPE', key: 'PERSONAL', label: 'ลากิจ', color: 'bg-purple-500', sort_order: 3, description: '{"icon": "Briefcase", "category": "STANDARD", "defaultQuota": 6, "placeholder": "ระบุธุระที่จำเป็น..."}' },
    { type: 'LEAVE_TYPE', key: 'EMERGENCY', label: 'ลาฉุกเฉิน', color: 'bg-rose-600', sort_order: 4, description: '{"icon": "AlertCircle", "category": "STANDARD", "defaultQuota": 3, "placeholder": "ระบุเหตุฉุกเฉิน..."}' },
    { type: 'LEAVE_TYPE', key: 'WFH', label: 'Work From Home', color: 'bg-blue-600', sort_order: 0, description: '{"icon": "Home", "category": "SPECIAL", "subLabel": "ขออนุญาตทำงานที่บ้าน", "defaultQuota": 100, "placeholder": "เช่น เคลียร์งานตัดต่อที่บ้าน...", "reasonLabel": "รายละเอียดงานที่จะทำ (Task)"}' },
    { type: 'LEAVE_TYPE', key: 'OVERTIME', label: 'ขอทำ OT', color: 'bg-indigo-600', sort_order: 5, description: '{"icon": "Moon", "category": "SPECIAL", "subLabel": "ขอทำงานล่วงเวลา", "defaultQuota": 999, "placeholder": "เช่น เร่งปิดงานลูกค้า Project A...", "reasonLabel": "รายละเอียดงานที่จะทำ (OT Task)"}' },
    { type: 'LEAVE_TYPE', key: 'LATE_ENTRY', label: 'แจ้งเข้าสาย', color: 'bg-amber-500', sort_order: 10, description: '{"icon": "Clock", "category": "CORRECTION", "defaultQuota": 999, "placeholder": "เช่น รถติดหนักมากที่แยก..."}' },
    { type: 'LEAVE_TYPE', key: 'FORGOT_CHECKIN', label: 'ลืมลงเวลาเข้า', color: 'bg-rose-500', sort_order: 11, description: '{"icon": "LogIn", "category": "CORRECTION", "defaultQuota": 999, "placeholder": "เช่น ลืมกดเข้างานเนื่องจากรีบไปประชุม..."}' },
    { type: 'LEAVE_TYPE', key: 'FORGOT_CHECKOUT', label: 'ลืมลงเวลาออก', color: 'bg-orange-500', sort_order: 12, description: '{"icon": "LogOut", "category": "CORRECTION", "defaultQuota": 999, "placeholder": "เช่น ลืมกดออกเนื่องจากรีบไปธุระต่อ..."}' },
    { type: 'LEAVE_TYPE', key: 'FORGOT_BOTH', label: 'ลืมทั้งเข้า-ออก', color: 'bg-red-600', sort_order: 13, description: '{"icon": "History", "category": "CORRECTION", "defaultQuota": 999, "placeholder": "เช่น ลืมกดทั้งเข้าและออกเนื่องจาก..."}' },
    { type: 'LEAVE_TYPE', key: 'UNPAID', label: 'ลาไม่รับค่าจ้าง', color: 'bg-slate-800', sort_order: 20, description: '{"icon": "FileText", "category": "STANDARD", "defaultQuota": 999, "placeholder": "ระบุเหตุผลการลา..."}' },
    { type: 'ATTENDANCE_RULE_KEY', key: 'CORRECTION_REFUND', label: 'คืนค่า HP (แก้เวลาออก)', color: 'bg-emerald-500', sort_order: 100, description: '{"icon": "RefreshCw", "category": "SYSTEM"}' },
    { type: 'ATTENDANCE_RULE_KEY', key: 'ABSENT_REFUND', label: 'คืนค่า HP (แก้ขาดงาน)', color: 'bg-blue-500', sort_order: 101, description: '{"icon": "RefreshCw", "category": "SYSTEM"}' },
    { type: 'ATTENDANCE_RULE_KEY', key: 'FORGOT_CHECKOUT', label: 'ลืมตอกบัตรออก (Penalty)', color: 'bg-rose-500', sort_order: 102, description: '{"icon": "AlertTriangle", "category": "SYSTEM"}' },
];

export const MasterDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [options, setOptions] = useState<MasterOption[]>([]);
    const [annualHolidays, setAnnualHolidays] = useState<any[]>([]);
    const [calendarExceptions, setCalendarExceptions] = useState<any[]>([]);
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();
    const isMutatingCache = useRef(false);

    const fetchOptions = useCallback(async () => {
        try {
            // 1. Check LocalStorage Cache
            const cachedOptions = localStorage.getItem(CACHE_KEY_OPTIONS);
            const cachedVersion = localStorage.getItem(CACHE_KEY_VERSION);

            // 2. Fetch Current Version from system_metadata
            const { data: versionData, error: versionError } = await supabase
                .from('system_metadata')
                .select('last_updated_at')
                .eq('key', 'master_options_version')
                .single();

            const currentVersion = versionData?.last_updated_at;

            // 3. Compare Version and decide whether to fetch full data
            let optionsData = null;
            let useCache = false;

            if (isMutatingCache.current) {
                useCache = true;
                optionsData = JSON.parse(localStorage.getItem(CACHE_KEY_OPTIONS) || '[]');
                console.log('🚀 Master Data: Using cached version (Mutation in progress)');
            } else if (!versionError && cachedOptions && cachedVersion && currentVersion && cachedVersion === currentVersion) {
                try {
                    optionsData = JSON.parse(cachedOptions);
                    useCache = true;
                    console.log('🚀 Master Data: Using cached version', currentVersion);
                } catch (e) {
                    console.warn('⚠️ Master Data: Cache corrupted, clearing...');
                    localStorage.removeItem(CACHE_KEY_OPTIONS);
                    localStorage.removeItem(CACHE_KEY_VERSION);
                }
            }

            if (!useCache) {
                // Fetch Full Data
                console.log('📡 Master Data: Fetching 80KB+ data (Version mismatch, no cache, or table missing)...');
                const { data, error } = await supabase
                    .from('master_options')
                    .select('*')
                    .order('sort_order', { ascending: true });
                
                if (error) throw error;
                optionsData = data;

                // Update Cache
                if (data && currentVersion) {
                    localStorage.setItem(CACHE_KEY_OPTIONS, JSON.stringify(data));
                    localStorage.setItem(CACHE_KEY_VERSION, currentVersion);
                }
            }

            // 4. Fetch other small data in parallel
            const [holidaysRes, exceptionsRes, inventoryRes] = await Promise.all([
                supabase.from('annual_holidays').select('*').order('month', { ascending: true }).order('day', { ascending: true }),
                supabase.from('calendar_exceptions').select('*').order('date', { ascending: true }),
                supabase.from('inventory_items').select('*').order('name', { ascending: true })
            ]);

            if (optionsData) {
                setOptions(optionsData.map((item: any) => ({
                    id: item.id,
                    type: (item.type || '').trim().toUpperCase(),
                    key: (item.key || '').trim(),
                    label: item.label,
                    color: item.color,
                    sortOrder: item.sort_order,
                    isActive: item.is_active,
                    isDefault: item.is_default,
                    parentKey: item.parent_key,
                    description: item.description,
                    progressValue: item.progress_value
                })));
            }

            if (holidaysRes.data) setAnnualHolidays(holidaysRes.data);
            if (exceptionsRes.data) setCalendarExceptions(exceptionsRes.data);
            if (inventoryRes.data) {
                setInventoryItems(inventoryRes.data.map((i: any) => ({
                    id: i.id,
                    name: i.name,
                    description: i.description, 
                    categoryId: i.category_id,
                    imageUrl: i.image_url,
                    itemType: i.item_type || 'FIXED', 
                    quantity: i.quantity || 0,
                    unit: i.unit,
                    minThreshold: i.min_threshold,
                    maxCapacity: i.max_capacity,
                    tags: i.tags || [],
                    assetGroup: i.asset_group,
                    purchasePrice: i.purchase_price,
                    purchaseDate: i.purchase_date ? new Date(i.purchase_date) : undefined,
                    serialNumber: i.serial_number,
                    warrantyExpire: i.warranty_expire ? new Date(i.warranty_expire) : undefined,
                    condition: i.condition,
                    currentHolderId: i.current_holder_id
                })));
            }

        } catch (err: any) {
            console.error('Fetch master options failed:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateLocalCache = async (action: 'ADD' | 'UPDATE' | 'DELETE', payload: any) => {
        isMutatingCache.current = true;
        try {
            const cachedOptions = localStorage.getItem(CACHE_KEY_OPTIONS);
            let rawOptions = cachedOptions ? JSON.parse(cachedOptions) : [];
            
            if (action === 'ADD') {
                rawOptions.push(payload);
            } else if (action === 'UPDATE') {
                const index = rawOptions.findIndex((o: any) => o.id === payload.id);
                if (index > -1) rawOptions[index] = { ...rawOptions[index], ...payload };
            } else if (action === 'DELETE') {
                rawOptions = rawOptions.filter((o: any) => o.id !== payload);
            }
            
            rawOptions.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
            localStorage.setItem(CACHE_KEY_OPTIONS, JSON.stringify(rawOptions));
            
            setOptions(rawOptions.map((item: any) => ({
                id: item.id,
                type: (item.type || '').trim().toUpperCase(),
                key: (item.key || '').trim(),
                label: item.label,
                color: item.color,
                sortOrder: item.sort_order,
                isActive: item.is_active,
                isDefault: item.is_default,
                parentKey: item.parent_key,
                description: item.description,
                progressValue: item.progress_value
            })));

            const { data: versionData } = await supabase
                .from('system_metadata')
                .select('last_updated_at')
                .eq('key', 'master_options_version')
                .single();
                
            if (versionData) {
                localStorage.setItem(CACHE_KEY_VERSION, versionData.last_updated_at);
            }
        } catch (e) {
            console.error('Error updating local cache:', e);
        } finally {
            setTimeout(() => {
                isMutatingCache.current = false;
            }, 1000);
        }
    };

    const addMasterOption = async (option: Omit<MasterOption, 'id'>) => {
        try {
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
                description: option.description || null,
                progress_value: option.progressValue || 0
            };

            const { data, error } = await supabase.from('master_options').insert(payload).select().single();
            if (error) throw error;

            await updateLocalCache('ADD', data);
            showToast('เพิ่มข้อมูลสำเร็จ ✅', 'success');
            return true;
        } catch (err: any) {
            console.error(err);
            showToast('เพิ่มไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const updateMasterOption = async (option: MasterOption) => {
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
                description: option.description || null,
                progress_value: option.progressValue || 0
            };

            const { data, error } = await supabase.from('master_options').update(payload).eq('id', option.id).select().single();
            if (error) throw error;

            await updateLocalCache('UPDATE', data);
            showToast('อัปเดตข้อมูลสำเร็จ ✨', 'success');
            return true;
        } catch (err: any) {
            console.error(err);
            showToast('อัปเดตไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const deleteMasterOption = async (id: string) => {
        const confirmed = await showConfirm('ยืนยันการลบข้อมูลนี้? หากลบแล้วอาจกระทบกับงานเก่าที่ใช้ค่านี้อยู่', 'ลบข้อมูลมาสเตอร์');
        if(!confirmed) return false;

        try {
            const { error } = await supabase.from('master_options').delete().eq('id', id);
            if (error) throw error;

            await updateLocalCache('DELETE', id);
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
                .select('id, type, key, description');

            if (fetchError) throw fetchError;

            const existingMap = new Map(
                existingData?.map((i: any) => [`${i.type.trim().toUpperCase()}_${i.key.trim()}`, i]) || []
            );

            let insertedCount = 0;
            let updatedCount = 0;
            
            for (const opt of DEFAULT_OPTIONS) {
                const compositeKey = `${opt.type}_${opt.key}`;
                const existing = existingMap.get(compositeKey);

                if (!existing) {
                    const { error: insertError } = await supabase
                        .from('master_options')
                        .insert(opt);

                    if (!insertError) {
                        insertedCount++;
                    }
                } else if (!existing.description && opt.description) {
                    // Update if description is missing
                    const { error: updateError } = await supabase
                        .from('master_options')
                        .update({ description: opt.description })
                        .eq('id', existing.id);
                    
                    if (!updateError) {
                        updatedCount++;
                    }
                }
            }

            if (insertedCount > 0 || updatedCount > 0) {
                showToast(`ซิงค์ข้อมูลสำเร็จ (เพิ่ม ${insertedCount}, อัปเดต ${updatedCount}) 🎉`, 'success');
                await fetchOptions(); 
            } else {
                showToast('ข้อมูลครบถ้วนและเป็นปัจจุบันอยู่แล้วครับ', 'success');
            }

        } catch (err: any) {
            console.error(err);
            showToast('สร้างข้อมูลไม่สำเร็จ: ' + err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // fetchOptions(); // Disable initial fetchOptions on mount - managed by useTaskManager

        // Listen to system_metadata for version changes
        const metadataChannel = supabase.channel('system-metadata-changes')
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'system_metadata',
                filter: 'key=eq.master_options_version'
            }, () => {
                console.log('🔄 Master Data: Remote version updated, syncing...');
                fetchOptions();
            }).subscribe();

        const holidaysChannel = supabase.channel('global-annual-holidays')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'annual_holidays' }, () => {
                fetchOptions();
            }).subscribe();

        const exceptionsChannel = supabase.channel('global-calendar-exceptions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_exceptions' }, () => {
                fetchOptions();
            }).subscribe();

        const inventoryChannel = supabase.channel('global-inventory-items')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => {
                fetchOptions();
            }).subscribe();

        return () => {
            supabase.removeChannel(metadataChannel);
            supabase.removeChannel(holidaysChannel);
            supabase.removeChannel(exceptionsChannel);
            supabase.removeChannel(inventoryChannel);
        };
    }, [fetchOptions]);

    return (
        <MasterDataContext.Provider value={{
            masterOptions: options,
            annualHolidays,
            calendarExceptions,
            inventoryItems,
            isLoading,
            fetchMasterOptions: fetchOptions,
            addMasterOption,
            updateMasterOption,
            deleteMasterOption,
            seedDefaults
        }}>
            {children}
        </MasterDataContext.Provider>
    );
};

export const useMasterDataContext = () => {
    const context = useContext(MasterDataContext);
    if (context === undefined) {
        throw new Error('useMasterDataContext must be used within a MasterDataProvider');
    }
    return context;
};
