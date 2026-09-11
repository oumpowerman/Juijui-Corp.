import { useState, useMemo, useEffect } from 'react';
import { 
    MasterOption, 
    Channel, 
    Platform, 
    ViewModeType, 
    StatusFilterType, 
    ScopeFilterType, 
    PillarFormData, 
    CategoryFormData, 
    MatrixRow, 
    PillarStats 
} from '../types';
import { useChannels } from '../../../../../../hooks/useChannels';
import { useChannelGroups } from '../../../../../../hooks/useChannelGroups';
import { useMasterData } from '../../../../../../hooks/useMasterData';
import { useToast } from '../../../../../../context/ToastContext';
import { useGlobalDialog } from '../../../../../../context/GlobalDialogContext';
import { COLOR_PRESETS } from '../pillarConstants';

export function usePillarMasterLogic(masterOptions: MasterOption[]) {
    const { channels: rawChannels } = useChannels();
    const { groups: channelGroups, enrichChannelsWithGroups } = useChannelGroups();
    const channels = useMemo(() => enrichChannelsWithGroups(rawChannels), [rawChannels, enrichChannelsWithGroups]);
    const { addMasterOption, updateMasterOption, deleteMasterOption, fetchMasterOptions } = useMasterData();
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();

    // --- VIEW CONTROLS ---
    const [viewMode, setViewMode] = useState<ViewModeType>('grouped');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL');
    const [selectedGroupId, setSelectedGroupId] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');
    const [scopeFilter, setScopeFilter] = useState<ScopeFilterType>('ALL');

    // --- ACCORDION STATE ---
    const [expandedChannelIds, setExpandedChannelIds] = useState<Set<string>>(new Set());

    // --- BATCH SELECTION STATE (Matrix view) ---
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

    // --- INLINE QUICK-ADD CATEGORY STATE ---
    const [inlineCategoryInputs, setInlineCategoryInputs] = useState<Record<string, string>>({});
    const [activeInlinePillarKey, setActiveInlinePillarKey] = useState<string | null>(null);

    // --- MODAL STATES ---
    const [isPillarModalOpen, setIsPillarModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    
    // Modal Form Data for Pillar
    const [pillarFormData, setPillarFormData] = useState<PillarFormData>({
        label: '',
        key: '',
        channelId: '',
        description: '',
        color: COLOR_PRESETS[0].class,
        sortOrder: 10,
        isActive: true
    });

    // Modal Form Data for Category
    const [categoryFormData, setCategoryFormData] = useState<CategoryFormData>({
        label: '',
        key: '',
        pillarKey: '',
        description: '',
        color: COLOR_PRESETS[0].class,
        sortOrder: 10,
        isActive: true
    });

    // --- DERIVED DATA ---
    const allPillars = useMemo(() => {
        return masterOptions
            .filter(o => o.type === 'PILLAR')
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }, [masterOptions]);

    const allCategories = useMemo(() => {
        return masterOptions
            .filter(o => o.type === 'CATEGORY')
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }, [masterOptions]);

    // Map: Pillar Key -> Categories[]
    const categoriesByPillarKey = useMemo(() => {
        const map = new Map<string, MasterOption[]>();
        allCategories.forEach(cat => {
            const pKey = cat.parentKey || 'UNASSIGNED';
            if (!map.has(pKey)) {
                map.set(pKey, []);
            }
            map.get(pKey)!.push(cat);
        });
        return map;
    }, [allCategories]);

    // Map: Channel ID -> Pillars[]
    const pillarsByChannelId = useMemo(() => {
        const map = new Map<string, MasterOption[]>();
        allPillars.forEach(pillar => {
            const cId = pillar.parentKey || 'GLOBAL';
            if (!map.has(cId)) {
                map.set(cId, []);
            }
            map.get(cId)!.push(pillar);
        });
        return map;
    }, [allPillars]);

    // Auto-expand channels when search query is active
    useEffect(() => {
        if (searchQuery.trim()) {
            const matchedChannels = new Set<string>();
            const q = searchQuery.toLowerCase();

            channels.forEach(ch => {
                const chPillars = pillarsByChannelId.get(ch.id) || [];
                const matchesChannel = ch.name.toLowerCase().includes(q);
                const matchesPillars = chPillars.some(p => 
                    p.label.toLowerCase().includes(q) || 
                    p.key.toLowerCase().includes(q) ||
                    (categoriesByPillarKey.get(p.key) || []).some(c => c.label.toLowerCase().includes(q) || c.key.toLowerCase().includes(q))
                );
                if (matchesChannel || matchesPillars) {
                    matchedChannels.add(ch.id);
                }
            });

            const globalPillars = pillarsByChannelId.get('GLOBAL') || [];
            if (globalPillars.some(p => p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q))) {
                matchedChannels.add('GLOBAL');
            }

            setExpandedChannelIds(matchedChannels);
        }
    }, [searchQuery, channels, pillarsByChannelId, categoriesByPillarKey]);

    // Summary Statistics
    const stats: PillarStats = useMemo(() => {
        const totalPillars = allPillars.length;
        const totalCategories = allCategories.length;
        const activePillars = allPillars.filter(p => p.isActive).length;
        const activeCategories = allCategories.filter(c => c.isActive).length;
        const channelsWithPillars = channels.filter(ch => (pillarsByChannelId.get(ch.id)?.length || 0) > 0).length;
        const globalPillarsCount = (pillarsByChannelId.get('GLOBAL') || []).length;

        return {
            totalPillars,
            totalCategories,
            activePillars,
            activeCategories,
            channelsWithPillars,
            totalChannels: channels.length,
            globalPillarsCount
        };
    }, [allPillars, allCategories, channels, pillarsByChannelId]);

    // Filtered Channel List
    const filteredChannels = useMemo(() => {
        return channels.filter(ch => {
            if (selectedPlatform !== 'ALL') {
                if (!ch.platforms || !ch.platforms.includes(selectedPlatform as Platform)) {
                    return false;
                }
            }

            if (selectedGroupId !== 'ALL') {
                if (ch.group_id !== selectedGroupId) {
                    return false;
                }
            }

            const chPillars = pillarsByChannelId.get(ch.id) || [];
            if (scopeFilter === 'HAS_DATA' && chPillars.length === 0) return false;
            if (scopeFilter === 'EMPTY' && chPillars.length > 0) return false;
            if (scopeFilter === 'GLOBAL_ONLY') return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchesName = ch.name.toLowerCase().includes(q);
                const matchesPillarOrCategory = chPillars.some(p => {
                    if (p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q)) return true;
                    const cats = categoriesByPillarKey.get(p.key) || [];
                    return cats.some(c => c.label.toLowerCase().includes(q) || c.key.toLowerCase().includes(q));
                });
                if (!matchesName && !matchesPillarOrCategory) return false;
            }

            return true;
        });
    }, [channels, selectedPlatform, selectedGroupId, scopeFilter, searchQuery, pillarsByChannelId, categoriesByPillarKey]);

    // Global Pillars (Filtered)
    const filteredGlobalPillars = useMemo(() => {
        if (scopeFilter === 'EMPTY') return [];
        const globals = pillarsByChannelId.get('GLOBAL') || [];
        if (!searchQuery.trim() && statusFilter === 'ALL') return globals;

        const q = searchQuery.toLowerCase();
        return globals.filter(p => {
            if (statusFilter === 'ACTIVE' && !p.isActive) return false;
            if (statusFilter === 'INACTIVE' && p.isActive) return false;
            if (!q) return true;

            const matchesSelf = p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q);
            const cats = categoriesByPillarKey.get(p.key) || [];
            const matchesCat = cats.some(c => c.label.toLowerCase().includes(q) || c.key.toLowerCase().includes(q));
            return matchesSelf || matchesCat;
        });
    }, [pillarsByChannelId, scopeFilter, searchQuery, statusFilter, categoriesByPillarKey]);

    // --- ACCORDION TOGGLES ---
    const toggleChannelExpand = (channelId: string) => {
        setExpandedChannelIds(prev => {
            const next = new Set(prev);
            if (next.has(channelId)) {
                next.delete(channelId);
            } else {
                next.add(channelId);
            }
            return next;
        });
    };

    const expandAll = () => {
        const allIds = new Set<string>(channels.map(c => c.id));
        allIds.add('GLOBAL');
        setExpandedChannelIds(allIds);
    };

    const collapseAll = () => {
        setExpandedChannelIds(new Set());
    };

    // --- QUICK ACTIONS ---
    const handleToggleActive = async (option: MasterOption) => {
        try {
            const success = await updateMasterOption({
                ...option,
                isActive: !option.isActive
            });
            if (success) {
                showToast(`เปลี่ยนสถานะ "${option.label}" สำเร็จ`, 'success');
            }
        } catch (error: any) {
            console.error(error);
            showToast('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ', 'error');
        }
    };

    const handleDeleteOption = async (option: MasterOption) => {
        const isPillar = option.type === 'PILLAR';
        const subCount = isPillar ? (categoriesByPillarKey.get(option.key) || []).length : 0;
        
        let confirmMsg = `ยืนยันการลบ ${isPillar ? 'Pillar' : 'Category'} "${option.label}"?`;
        if (subCount > 0) {
            confirmMsg += ` (จะมีผลกับหมวดหมู่ย่อยอีก ${subCount} รายการ)`;
        }

        const confirmed = await showConfirm(confirmMsg, isPillar ? 'ลบแกนเนื้อหา' : 'ลบหมวดหมู่ย่อย');
        if (!confirmed) return;

        try {
            const success = await deleteMasterOption(option.id);
            if (success) {
                showToast(`ลบ "${option.label}" เรียบร้อยแล้ว`, 'info');
            }
        } catch (error: any) {
            console.error(error);
            showToast('เกิดข้อผิดพลาดในการลบ', 'error');
        }
    };

    const handleInlineAddCategory = async (pillar: MasterOption) => {
        const inputVal = inlineCategoryInputs[pillar.key]?.trim();
        if (!inputVal) return;

        const cleanKey = inputVal.toUpperCase()
            .replace(/[^A-Z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
        const newKey = `CAT_${cleanKey || 'GEN'}_${Date.now().toString().slice(-4)}`;

        try {
            const success = await addMasterOption({
                type: 'CATEGORY',
                key: newKey,
                label: inputVal,
                parentKey: pillar.key,
                color: pillar.color || COLOR_PRESETS[0].class,
                sortOrder: (categoriesByPillarKey.get(pillar.key)?.length || 0) * 10 + 10,
                isActive: true,
                isDefault: false
            });

            if (success) {
                setInlineCategoryInputs(prev => ({ ...prev, [pillar.key]: '' }));
                setActiveInlinePillarKey(null);
                showToast(`เพิ่มหมวดหมู่ย่อย "${inputVal}" ใน ${pillar.label} สำเร็จ`, 'success');
                await fetchMasterOptions();
            }
        } catch (error: any) {
            console.error(error);
            showToast('ไม่สามารถเพิ่มหมวดหมู่ย่อยได้', 'error');
        }
    };

    const handleOpenCreatePillar = (channelId?: string) => {
        setPillarFormData({
            label: '',
            key: '',
            channelId: channelId || (channels[0]?.id || ''),
            description: '',
            color: COLOR_PRESETS[0].class,
            sortOrder: 10,
            isActive: true
        });
        setIsPillarModalOpen(true);
    };

    const handleOpenEditPillar = (pillar: MasterOption) => {
        setPillarFormData({
            id: pillar.id,
            label: pillar.label,
            key: pillar.key,
            channelId: pillar.parentKey || '',
            description: pillar.description || '',
            color: pillar.color || COLOR_PRESETS[0].class,
            sortOrder: pillar.sortOrder || 10,
            isActive: pillar.isActive
        });
        setIsPillarModalOpen(true);
    };

    const handleSavePillar = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedLabel = pillarFormData.label.trim();
        if (!trimmedLabel) {
            showToast('กรุณาระบุชื่อ Pillar', 'warning');
            return;
        }

        let key = pillarFormData.key.trim();
        if (!key) {
            const cleanKey = trimmedLabel.toUpperCase()
                .replace(/[^A-Z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '');
            key = `PIL_${cleanKey || 'GEN'}_${Date.now().toString().slice(-4)}`;
        }

        try {
            if (pillarFormData.id) {
                const existing = allPillars.find(p => p.id === pillarFormData.id);
                if (!existing) return;
                const success = await updateMasterOption({
                    ...existing,
                    label: trimmedLabel,
                    key,
                    parentKey: pillarFormData.channelId || undefined,
                    description: pillarFormData.description.trim() || undefined,
                    color: pillarFormData.color,
                    sortOrder: pillarFormData.sortOrder,
                    isActive: pillarFormData.isActive
                });
                if (success) {
                    setIsPillarModalOpen(false);
                    showToast('อัปเดตข้อมูล Pillar สำเร็จ', 'success');
                    await fetchMasterOptions();
                }
            } else {
                const success = await addMasterOption({
                    type: 'PILLAR',
                    key,
                    label: trimmedLabel,
                    parentKey: pillarFormData.channelId || undefined,
                    description: pillarFormData.description.trim() || undefined,
                    color: pillarFormData.color,
                    sortOrder: pillarFormData.sortOrder,
                    isActive: pillarFormData.isActive,
                    isDefault: false
                });
                if (success) {
                    setIsPillarModalOpen(false);
                    if (pillarFormData.channelId) {
                        setExpandedChannelIds(prev => new Set(prev).add(pillarFormData.channelId));
                    }
                    showToast(`สร้าง Pillar "${trimmedLabel}" สำเร็จ`, 'success');
                    await fetchMasterOptions();
                }
            }
        } catch (error: any) {
            console.error(error);
            showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
        }
    };

    const handleOpenCreateCategory = (pillarKey?: string) => {
        setCategoryFormData({
            label: '',
            key: '',
            pillarKey: pillarKey || (allPillars[0]?.key || ''),
            description: '',
            color: COLOR_PRESETS[0].class,
            sortOrder: 10,
            isActive: true
        });
        setIsCategoryModalOpen(true);
    };

    const handleOpenEditCategory = (category: MasterOption) => {
        setCategoryFormData({
            id: category.id,
            label: category.label,
            key: category.key,
            pillarKey: category.parentKey || '',
            description: category.description || '',
            color: category.color || COLOR_PRESETS[0].class,
            sortOrder: category.sortOrder || 10,
            isActive: category.isActive
        });
        setIsCategoryModalOpen(true);
    };

    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedLabel = categoryFormData.label.trim();
        if (!trimmedLabel) {
            showToast('กรุณาระบุชื่อ Category', 'warning');
            return;
        }

        let key = categoryFormData.key.trim();
        if (!key) {
            const cleanKey = trimmedLabel.toUpperCase()
                .replace(/[^A-Z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '');
            key = `CAT_${cleanKey || 'GEN'}_${Date.now().toString().slice(-4)}`;
        }

        try {
            if (categoryFormData.id) {
                const existing = allCategories.find(c => c.id === categoryFormData.id);
                if (!existing) return;
                const success = await updateMasterOption({
                    ...existing,
                    label: trimmedLabel,
                    key,
                    parentKey: categoryFormData.pillarKey || undefined,
                    description: categoryFormData.description.trim() || undefined,
                    color: categoryFormData.color,
                    sortOrder: categoryFormData.sortOrder,
                    isActive: categoryFormData.isActive
                });
                if (success) {
                    setIsCategoryModalOpen(false);
                    showToast('อัปเดตข้อมูล Category สำเร็จ', 'success');
                    await fetchMasterOptions();
                }
            } else {
                const success = await addMasterOption({
                    type: 'CATEGORY',
                    key,
                    label: trimmedLabel,
                    parentKey: categoryFormData.pillarKey || undefined,
                    description: categoryFormData.description.trim() || undefined,
                    color: categoryFormData.color,
                    sortOrder: categoryFormData.sortOrder,
                    isActive: categoryFormData.isActive,
                    isDefault: false
                });
                if (success) {
                    setIsCategoryModalOpen(false);
                    showToast(`สร้าง Category "${trimmedLabel}" สำเร็จ`, 'success');
                    await fetchMasterOptions();
                }
            }
        } catch (error: any) {
            console.error(error);
            showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
        }
    };

    const handleSelectAllMatrix = (items: MasterOption[]) => {
        if (selectedItemIds.size === items.length && items.length > 0) {
            setSelectedItemIds(new Set());
        } else {
            setSelectedItemIds(new Set(items.map(i => i.id)));
        }
    };

    const handleToggleItemSelection = (id: string) => {
        setSelectedItemIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleBatchToggleActive = async (setActive: boolean) => {
        if (selectedItemIds.size === 0) return;
        const confirmed = await showConfirm(
            `ต้องการเปลี่ยนสถานะของ ${selectedItemIds.size} รายการเป็น "${setActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}" หรือไม่?`,
            'เปลี่ยนสถานะแบบกลุ่ม'
        );
        if (!confirmed) return;

        try {
            const targets = masterOptions.filter(o => selectedItemIds.has(o.id));
            const updated = targets.map(t => ({ ...t, isActive: setActive }));
            
            await Promise.all(updated.map(u => updateMasterOption(u)));
            showToast(`อัปเดตสถานะ ${targets.length} รายการเรียบร้อยแล้ว`, 'success');
            setSelectedItemIds(new Set());
            await fetchMasterOptions();
        } catch (error: any) {
            console.error(error);
            showToast('เกิดข้อผิดพลาดในการอัปเดตแบบกลุ่ม', 'error');
        }
    };

    const handleBatchDelete = async () => {
        if (selectedItemIds.size === 0) return;
        const confirmed = await showConfirm(
            `⚠️ คุณกำลังจะลบข้อมูลทั้งหมด ${selectedItemIds.size} รายการ การกระทำนี้ไม่สามารถย้อนกลับได้!`,
            'ลบรายการแบบกลุ่ม'
        );
        if (!confirmed) return;

        try {
            await Promise.all(Array.from(selectedItemIds).map(id => deleteMasterOption(id)));
            showToast(`ลบข้อมูล ${selectedItemIds.size} รายการเรียบร้อยแล้ว`, 'info');
            setSelectedItemIds(new Set());
            await fetchMasterOptions();
        } catch (error: any) {
            console.error(error);
            showToast('เกิดข้อผิดพลาดในการลบแบบกลุ่ม', 'error');
        }
    };

    const matrixRows: MatrixRow[] = useMemo(() => {
        const rows: MatrixRow[] = [];

        allPillars.forEach(pillar => {
            const ch = channels.find(c => c.id === pillar.parentKey) || null;
            const cats = categoriesByPillarKey.get(pillar.key) || [];

            if (selectedPlatform !== 'ALL') {
                if (!ch || !ch.platforms || !ch.platforms.includes(selectedPlatform as Platform)) return;
            }
            if (selectedGroupId !== 'ALL') {
                if (!ch || ch.group_id !== selectedGroupId) return;
            }
            if (statusFilter === 'ACTIVE' && !pillar.isActive) return;
            if (statusFilter === 'INACTIVE' && pillar.isActive) return;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchesCh = ch?.name.toLowerCase().includes(q);
                const matchesP = pillar.label.toLowerCase().includes(q) || pillar.key.toLowerCase().includes(q);
                const matchesC = cats.some(c => c.label.toLowerCase().includes(q) || c.key.toLowerCase().includes(q));
                if (!matchesCh && !matchesP && !matchesC) return;
            }

            rows.push({
                id: pillar.id,
                pillar,
                channel: ch,
                categories: cats
            });
        });

        return rows;
    }, [allPillars, channels, categoriesByPillarKey, selectedPlatform, selectedGroupId, statusFilter, searchQuery]);

    const hasActiveFilters = Boolean(searchQuery || selectedPlatform !== 'ALL' || selectedGroupId !== 'ALL' || statusFilter !== 'ALL' || scopeFilter !== 'ALL');

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedPlatform('ALL');
        setSelectedGroupId('ALL');
        setStatusFilter('ALL');
        setScopeFilter('ALL');
    };

    return {
        // Master Data & Channels
        channels,
        channelGroups,
        allPillars,
        allCategories,
        categoriesByPillarKey,
        pillarsByChannelId,
        stats,

        // Filters & Search
        viewMode,
        setViewMode,
        searchQuery,
        setSearchQuery,
        selectedPlatform,
        setSelectedPlatform,
        selectedGroupId,
        setSelectedGroupId,
        statusFilter,
        setStatusFilter,
        scopeFilter,
        setScopeFilter,
        hasActiveFilters,
        resetFilters,

        // Filtered Results
        filteredChannels,
        filteredGlobalPillars,
        matrixRows,

        // Accordion Controls
        expandedChannelIds,
        toggleChannelExpand,
        expandAll,
        collapseAll,

        // Batch Matrix Operations
        selectedItemIds,
        setSelectedItemIds,
        handleSelectAllMatrix,
        handleToggleItemSelection,
        handleBatchToggleActive,
        handleBatchDelete,

        // Inline Category Quick Add
        inlineCategoryInputs,
        setInlineCategoryInputs,
        activeInlinePillarKey,
        setActiveInlinePillarKey,
        handleInlineAddCategory,

        // Modals & Form State
        isPillarModalOpen,
        setIsPillarModalOpen,
        pillarFormData,
        setPillarFormData,
        handleOpenCreatePillar,
        handleOpenEditPillar,
        handleSavePillar,

        isCategoryModalOpen,
        setIsCategoryModalOpen,
        categoryFormData,
        setCategoryFormData,
        handleOpenCreateCategory,
        handleOpenEditCategory,
        handleSaveCategory,

        // Quick Row Actions
        handleToggleActive,
        handleDeleteOption
    };
}
