import { useState } from 'react';
import { ChecklistItem, ChecklistCategory, ChecklistPreset } from '../types';
import { useToast } from '../context/ToastContext';

// Default Constants
const DEFAULT_CATEGORIES: ChecklistCategory[] = [
    { id: 'cat_camera', title: 'กล้อง & เลนส์ (Camera)', iconName: 'camera', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { id: 'cat_audio', title: 'เสียง (Audio)', iconName: 'mic', color: 'bg-red-50 text-red-600 border-red-200' },
    { id: 'cat_light', title: 'แสง (Lighting)', iconName: 'light', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
    { id: 'cat_misc', title: 'เบ็ดเตล็ด (Misc)', iconName: 'box', color: 'bg-purple-50 text-purple-600 border-purple-200' },
];

const DEFAULT_PRESETS: ChecklistPreset[] = [
    { 
        id: 'preset_vlog', 
        name: 'ถ่าย Vlog ทั่วไป 🤳', 
        items: [
            { id: '1', text: 'กล้อง Main', isChecked: false, categoryId: 'cat_camera' },
            { id: '2', text: 'แบตเตอรี่สำรอง 2 ก้อน', isChecked: false, categoryId: 'cat_camera' },
            { id: '3', text: 'ไมค์ Wireless', isChecked: false, categoryId: 'cat_audio' },
            { id: '4', text: 'Mem Card สำรอง', isChecked: false, categoryId: 'cat_misc' },
        ]
    },
    { 
        id: 'preset_studio', 
        name: 'ถ่าย Studio Interview 🎙️', 
        items: [
            { id: '1', text: 'กล้อง A (Wide)', isChecked: false, categoryId: 'cat_camera' },
            { id: '2', text: 'กล้อง B (Close-up)', isChecked: false, categoryId: 'cat_camera' },
            { id: '3', text: 'ไฟ Key Light', isChecked: false, categoryId: 'cat_light' },
            { id: '4', text: 'ไฟ Fill Light', isChecked: false, categoryId: 'cat_light' },
            { id: '5', text: 'ไมค์ Boom', isChecked: false, categoryId: 'cat_audio' },
            { id: '6', text: 'Slate (Clapper Board)', isChecked: false, categoryId: 'cat_misc' },
        ]
    }
];

// Helper for ID generation
const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

export const useChecklist = () => {
    const { showToast } = useToast();
    
    // States
    const [checklistCategories, setChecklistCategories] = useState<ChecklistCategory[]>(DEFAULT_CATEGORIES);
    const [checklistPresets, setChecklistPresets] = useState<ChecklistPreset[]>(DEFAULT_PRESETS);
    const [activeChecklistItems, setActiveChecklistItems] = useState<ChecklistItem[]>([]);

    // Load Data
    const loadChecklistData = () => {
         const savedChecklist = localStorage.getItem('juijui_active_checklist');
         if(savedChecklist) {
             setActiveChecklistItems(JSON.parse(savedChecklist));
         } else {
             setActiveChecklistItems([]);
         }
         
         const savedCats = localStorage.getItem('juijui_checklist_cats');
         if(savedCats) setChecklistCategories(JSON.parse(savedCats));

         const savedPresets = localStorage.getItem('juijui_checklist_presets');
         if(savedPresets) setChecklistPresets(JSON.parse(savedPresets));
    };

    // Logic
    const saveChecklist = (items: ChecklistItem[]) => {
        setActiveChecklistItems(items);
        localStorage.setItem('juijui_active_checklist', JSON.stringify(items));
    };
  
    const handleToggleChecklist = (id: string, currentStatus: boolean) => {
       const newItems = activeChecklistItems.map(item => item.id === id ? { ...item, isChecked: !currentStatus } : item);
       saveChecklist(newItems);
    };
  
    const handleAddChecklistItem = (text: string, categoryId: string) => {
        const newItem: ChecklistItem = {
            id: generateId(),
            text,
            isChecked: false,
            categoryId: categoryId
        };
        saveChecklist([...activeChecklistItems, newItem]);
    };
  
    const handleDeleteChecklistItem = (id: string) => {
        saveChecklist(activeChecklistItems.filter(item => item.id !== id));
    };
  
    const handleResetChecklist = () => {
        saveChecklist(activeChecklistItems.map(item => ({ ...item, isChecked: false })));
    };
    
    const handleLoadPreset = (presetId: string) => {
        if (presetId === 'CLEAR') {
            saveChecklist([]);
            return;
        }
        const preset = checklistPresets.find(p => p.id === presetId);
        if(preset) {
            const newItems = preset.items.map(i => ({...i, id: generateId(), isChecked: false}));
            saveChecklist(newItems);
            showToast(`โหลดชุด "${preset.name}" เรียบร้อย`, 'success');
        }
    };
  
    const handleAddPreset = (name: string) => {
        if (activeChecklistItems.length === 0) {
            showToast('ไม่มีรายการให้บันทึกครับ', 'warning');
            return;
        }
        const templateItems = activeChecklistItems.map(i => ({
            ...i,
            id: generateId(),
            isChecked: false
        }));
  
        const newPreset: ChecklistPreset = {
            id: `preset_${generateId()}`,
            name: name,
            items: templateItems
        };
  
        const updatedPresets = [...checklistPresets, newPreset];
        setChecklistPresets(updatedPresets);
        localStorage.setItem('juijui_checklist_presets', JSON.stringify(updatedPresets));
        showToast(`บันทึก Preset "${name}" แล้ว`, 'success');
    };
  
    const handleDeletePreset = (id: string) => {
        const updatedPresets = checklistPresets.filter(p => p.id !== id);
        setChecklistPresets(updatedPresets);
        localStorage.setItem('juijui_checklist_presets', JSON.stringify(updatedPresets));
        showToast('ลบ Preset เรียบร้อย', 'info');
    };
    
    const handleAddCategory = (title: string, color: string) => {
        const newCat: ChecklistCategory = {
            id: `cat_${generateId()}`,
            title,
            iconName: 'box',
            color
        };
        const newCats = [...checklistCategories, newCat];
        setChecklistCategories(newCats);
        localStorage.setItem('juijui_checklist_cats', JSON.stringify(newCats));
    };
    
    const handleDeleteCategory = (catId: string) => {
        const newCats = checklistCategories.filter(c => c.id !== catId);
        setChecklistCategories(newCats);
        localStorage.setItem('juijui_checklist_cats', JSON.stringify(newCats));
        
        saveChecklist(activeChecklistItems.filter(i => i.categoryId !== catId));
    };

    return {
        checklistCategories,
        checklistPresets,
        activeChecklistItems,
        loadChecklistData,
        handleToggleChecklist,
        handleAddChecklistItem,
        handleDeleteChecklistItem,
        handleResetChecklist,
        handleLoadPreset,
        handleAddPreset,
        handleDeletePreset,
        handleAddCategory,
        handleDeleteCategory
    };
};