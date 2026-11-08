import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ExternalLink,
    Trash2,
    HardDrive,
    Plus,
    Loader2,
    Link as LinkIcon,
    Image as ImageIcon,
    FileText,
    Video,
    X,
    CloudOff,
    FolderOpen,
    Cloud,
    ChevronDown,
    Check,
    CheckCircle2,
    AlertTriangle,
    Sparkles
} from 'lucide-react';
import { TaskAsset, AssetCategory } from '../types';
import { ASSET_CATEGORIES } from '../constants';
import { useGoogleDrive } from '../hooks/useGoogleDrive';
import { format } from 'date-fns';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import {
    classifyGoogleDriveUrl,
    isMediaEligibleCategory
} from '../utils/metricool/googleDriveMediaResolver';

export interface TaskAssetsProps {
    assets: TaskAsset[];
    onAdd: (asset: TaskAsset) => void;
    onDelete: (id: string) => void;
    onUpdateAsset?: (asset: TaskAsset) => void;
}

const SMOOTH_EASE = [0.16, 1, 0.3, 1] as const;

const TaskAssets: React.FC<TaskAssetsProps> = ({ assets, onAdd, onDelete, onUpdateAsset }) => {
    const { showConfirm } = useGlobalDialog();

    // UI States
    const [isExpanded, setIsExpanded] = useState(false);
    const [inputType, setInputType] = useState<'LINK' | 'DRIVE'>('LINK');
    const [isCatOpen, setIsCatOpen] = useState(false);

    // Form States
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [category, setCategory] = useState<AssetCategory>('VIDEO_DRAFT');
    const [isMetricoolReady, setIsMetricoolReady] = useState<boolean>(false);

    const driveUploadInputRef = useRef<HTMLInputElement>(null);
    const catDropdownRef = useRef<HTMLDivElement>(null);

    // Close category dropdown on outside click or Escape without blocking wheel scroll
    useEffect(() => {
        if (!isCatOpen) return;

        const handleMouseDown = (e: MouseEvent) => {
            if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
                setIsCatOpen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsCatOpen(false);
            }
        };

        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isCatOpen]);

    // Google Drive Hook
    const {
        openDrivePicker,
        uploadFileToDrive,
        login,
        isReady: isDriveReady,
        isUploading,
        isAuthenticated
    } = useGoogleDrive();

    const urlClassification = useMemo(() => classifyGoogleDriveUrl(url), [url]);
    const canMarkFormAsMetricool = useMemo(
        () => isMediaEligibleCategory(category) && urlClassification.kind !== 'DRIVE_FOLDER' && urlClassification.kind !== 'DRIVE_DOCUMENT',
        [category, urlClassification.kind]
    );

    const metricoolSelectedCount = useMemo(
        () => assets.filter(a => Boolean(a.isMetricoolReady) && a.category !== 'THUMBNAIL').length,
        [assets]
    );

    // --- Actions ---

    const handleOpenForm = () => {
        setName('');
        setUrl('');
        setCategory('VIDEO_DRAFT');
        setIsMetricoolReady(false);
        setInputType('LINK');
        setIsCatOpen(false);
        setIsExpanded(true);
    };

    const resetForm = () => {
        // Keep inputType, category, and fields intact while the container smoothly animates height -> 0
        setIsCatOpen(false);
        setIsExpanded(false);
    };

    const handleDriveSelect = () => {
        openDrivePicker(file => {
            const check = classifyGoogleDriveUrl(file.url);
            const autoCat: AssetCategory =
                check.kind === 'DRIVE_FILE' ? 'VIDEO_DRAFT' : 'OTHER';
            const newAsset: TaskAsset = {
                id: crypto.randomUUID(),
                name: file.name,
                url: file.url,
                type: 'LINK',
                category: autoCat,
                createdAt: new Date(),
                isMetricoolReady: false
            };
            onAdd(newAsset);
            resetForm();
        });
    };

    const handleAddLink = () => {
        if (!name.trim() || !url.trim()) return;

        const effectiveMetricoolReady =
            canMarkFormAsMetricool && Boolean(isMetricoolReady);

        const newAsset: TaskAsset = {
            id: crypto.randomUUID(),
            name: name.trim(),
            url: url.trim(),
            type: 'LINK',
            category,
            createdAt: new Date(),
            isMetricoolReady: effectiveMetricoolReady
        };

        onAdd(newAsset);
        resetForm();
    };

    const handleDriveUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const currentYear = format(new Date(), 'yyyy');
        const currentMonth = format(new Date(), 'MM_MMMM');

        try {
            const result = await uploadFileToDrive(file, ['Juijui_Assets', currentYear, currentMonth]);

            let autoCategory: AssetCategory = 'OTHER';
            if (result.mimeType.includes('image')) autoCategory = 'THUMBNAIL';
            if (result.mimeType.includes('video')) autoCategory = 'VIDEO_DRAFT';
            if (result.mimeType.includes('pdf')) autoCategory = 'SCRIPT';

            const newAsset: TaskAsset = {
                id: crypto.randomUUID(),
                name: result.name,
                url: result.url,
                type: 'LINK',
                category: autoCategory,
                createdAt: new Date(),
                isMetricoolReady: false
            };
            onAdd(newAsset);

            if (driveUploadInputRef.current) driveUploadInputRef.current.value = '';
            resetForm();
        } catch (error) {
            console.error('Drive upload error:', error);
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await showConfirm('จะลบไฟล์นี้จริงๆ หรอ?', 'ยืนยันการลบ');
        if (confirmed) {
            onDelete(id);
        }
    };

    const handleToggleMetricoolReady = (asset: TaskAsset) => {
        if (!onUpdateAsset) return;
        const check = classifyGoogleDriveUrl(asset.url);
        if (!asset.isMetricoolReady && !check.isPublishableFile) {
            return;
        }
        onUpdateAsset({
            ...asset,
            isMetricoolReady: !asset.isMetricoolReady
        });
    };

    // --- Render Helpers ---

    const getAssetStyle = (cat: AssetCategory, isDrive: boolean) => {
        if (isDrive) return { bg: 'bg-blue-100', text: 'text-blue-600', icon: HardDrive };

        switch (cat) {
            case 'SCRIPT':
                return { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: FileText };
            case 'THUMBNAIL':
                return { bg: 'bg-pink-100', text: 'text-pink-600', icon: ImageIcon };
            case 'VIDEO_DRAFT':
                return { bg: 'bg-purple-100', text: 'text-purple-600', icon: Video };
            default:
                return { bg: 'bg-gray-100', text: 'text-gray-600', icon: LinkIcon };
        }
    };

    const currentCatConfig = ASSET_CATEGORIES[category] || ASSET_CATEGORIES['OTHER'];
    const CurrentCatIcon = currentCatConfig.icon;

    return (
        <div className="space-y-4 [overflow-anchor:none]">
            {/* Header Area */}
            <div className="flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-slate-700 flex items-center gap-2">
                        <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-1.5 rounded-lg shadow-sm">
                            <FolderOpen className="w-4 h-4" />
                        </span>
                        Assets & Files{' '}
                        <span className="text-sm text-gray-400 font-medium tabular-nums">
                            ({assets.length})
                        </span>
                    </h3>

                    <AnimatePresence>
                        {metricoolSelectedCount > 0 && (
                            <motion.span
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.18, ease: SMOOTH_EASE }}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E6EFE9] text-[#3F634D] border border-[#C5DBD0] tabular-nums"
                            >
                                <CheckCircle2 className="w-3 h-3" />
                                คลิปส่ง Metricool {metricoolSelectedCount} ไฟล์
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                {/* Drive Status Indicator */}
                {!isDriveReady ? (
                    <div className="flex items-center gap-1.5 bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-bold border border-orange-100 animate-pulse">
                        <CloudOff className="w-3 h-3" />
                        <span>Drive API Loading...</span>
                    </div>
                ) : !isAuthenticated ? (
                    <button
                        type="button"
                        onClick={login}
                        className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold border border-blue-100 hover:bg-blue-100 transition-all"
                    >
                        <Cloud className="w-3 h-3" />
                        <span>Connect Drive</span>
                    </button>
                ) : (
                    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">
                        <Check className="w-3 h-3" />
                        <span>Drive Connected</span>
                    </div>
                )}
            </div>

            {/* Helper Tip for separating raw footage vs publishable clip */}
            <AnimatePresence initial={false}>
                {assets.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: SMOOTH_EASE }}
                        className="overflow-hidden"
                    >
                        <div className="px-3.5 py-2 rounded-xl bg-[#F8F4EC] border border-[#E6DFD3] flex items-center justify-between gap-2 text-xs text-[#5A5044]">
                            <div className="flex items-center gap-2 min-w-0">
                                <Sparkles className="w-3.5 h-3.5 text-[#567A63] shrink-0" />
                                <span className="truncate">
                                    แยกฟุตเทจดิบกับคลิปโพสต์จริง: กดติ๊กปุ่ม{' '}
                                    <strong className="font-bold text-[#3F634D]">"ส่งโพสต์ Metricool"</strong>{' '}
                                    เฉพาะไฟล์คลิปไฟนอลที่จะนำไปลงคอลัมน์ Picture Url 1
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- COMPACT UPLOAD BAR vs EXPANDED FORM (Zero-Jitter Height Morph) --- */}
            <div className="flex flex-col gap-0">
                <AnimatePresence initial={false}>
                    {!isExpanded ? (
                        <motion.div
                            key="collapsed-upload-bar"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.26, ease: SMOOTH_EASE }}
                            className="overflow-hidden"
                        >
                            <div className="flex flex-col sm:flex-row gap-3">
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.005 }}
                                    whileTap={{ scale: 0.985 }}
                                    onClick={handleOpenForm}
                                    className="flex-1 py-3.5 border-2 border-dashed border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 hover:border-indigo-300 hover:shadow-sm"
                                >
                                    <Plus className="w-5 h-5" /> เพิ่มไฟล์ / ลิงก์ (ฟุตเทจดิบ หรือ คลิปไฟนอล)
                                </motion.button>
                                {isDriveReady && (
                                    <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => driveUploadInputRef.current?.click()}
                                        className="px-6 py-3.5 bg-white border-2 border-blue-100 text-blue-600 hover:bg-blue-50 hover:border-blue-200 rounded-xl transition-colors shadow-sm flex items-center gap-2 text-sm font-bold"
                                        title="อัปโหลดขึ้น Drive ทันที"
                                    >
                                        {isUploading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <HardDrive className="w-5 h-5" />
                                        )}
                                        <span className="hidden sm:inline">Upload Drive</span>
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="expanded-upload-form"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.28, ease: SMOOTH_EASE }}
                            className={isCatOpen ? 'overflow-visible' : 'overflow-hidden'}
                        >
                            <div className="bg-white p-5 rounded-2xl border-2 border-indigo-100 shadow-xl shadow-indigo-50/50 relative">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <div className="mb-5 text-center">
                                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">
                                        Select Upload Type
                                    </p>
                                    <div className="flex bg-gray-100 p-1.5 rounded-xl gap-1 relative">
                                        <button
                                            type="button"
                                            onClick={() => setInputType('LINK')}
                                            className={`relative flex-1 py-2 text-sm font-bold rounded-lg transition-colors z-10 ${
                                                inputType === 'LINK'
                                                    ? 'text-indigo-600'
                                                    : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            {inputType === 'LINK' && (
                                                <motion.div
                                                    layoutId="taskAssetInputTypeIndicator"
                                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                                    className="absolute inset-0 bg-white rounded-lg shadow-sm ring-1 ring-black/5 -z-10"
                                                />
                                            )}
                                            <span className="relative z-10">แปะลิงก์ (Link)</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => (isDriveReady ? setInputType('DRIVE') : null)}
                                            className={`relative flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-1 z-10 ${
                                                inputType === 'DRIVE'
                                                    ? 'text-blue-600'
                                                    : 'text-gray-500 hover:text-gray-700'
                                            } ${!isDriveReady && 'opacity-50 cursor-not-allowed'}`}
                                        >
                                            {inputType === 'DRIVE' && (
                                                <motion.div
                                                    layoutId="taskAssetInputTypeIndicator"
                                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                                    className="absolute inset-0 bg-white rounded-lg shadow-sm ring-1 ring-black/5 -z-10"
                                                />
                                            )}
                                            <HardDrive className="w-4 h-4 relative z-10" />
                                            <span className="relative z-10">Google Drive</span>
                                        </button>
                                    </div>
                                </div>

                                <AnimatePresence mode="wait" initial={false}>
                                    {inputType === 'LINK' && (
                                        <motion.div
                                            key="tab-link"
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 8 }}
                                            transition={{ duration: 0.18, ease: SMOOTH_EASE }}
                                            className="space-y-4"
                                        >
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">
                                                    ชื่อไฟล์ (Label)
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="เช่น ฟุตเทจกล้อง A, Draft 1, หรือ คลิปไฟนอลพร้อมโพสต์..."
                                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-300 rounded-xl text-sm font-bold text-gray-700 outline-none transition-colors"
                                                    value={name}
                                                    onChange={e => setName(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">
                                                    URL / ลิงก์ Google Drive
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="วางลิงก์ Google Drive หรือ Direct URL ที่นี่..."
                                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-300 rounded-xl text-sm font-medium text-indigo-600 outline-none transition-colors font-mono"
                                                    value={url}
                                                    onChange={e => setUrl(e.target.value)}
                                                />

                                                {/* Live URL Classification Feedback */}
                                                <AnimatePresence initial={false}>
                                                    {url.trim() && (urlClassification.kind === 'DRIVE_FILE' || urlClassification.kind === 'DRIVE_FOLDER' || urlClassification.kind === 'DRIVE_DOCUMENT') && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            transition={{ duration: 0.18, ease: SMOOTH_EASE }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="pt-2">
                                                                {urlClassification.kind === 'DRIVE_FILE' && (
                                                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#3F634D] bg-[#E6EFE9] border border-[#C5DBD0] px-3 py-1.5 rounded-xl">
                                                                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                                                        <span>
                                                                            ตรวจพบลิงก์ไฟล์ Google Drive (รหัสไฟล์: {urlClassification.fileId?.slice(0, 10)}...) — แปลงเป็น Direct Link ได้อัตโนมัติ
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {(urlClassification.kind === 'DRIVE_FOLDER' ||
                                                                    urlClassification.kind === 'DRIVE_DOCUMENT') && (
                                                                    <div className="flex items-start gap-1.5 text-xs font-semibold text-[#8F6532] bg-[#F9EFE0] border border-[#E5C9A8] px-3 py-2 rounded-xl">
                                                                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                                                        <span>{urlClassification.warningMessage}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* --- Custom Dropdown (Ref-based click outside, no nested scroll, no wheel-blocking overlay) --- */}
                                            <div className="relative" ref={catDropdownRef}>
                                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">
                                                    หมวดหมู่
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCatOpen(prev => !prev)}
                                                    className={`w-full px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-between border-2 transition-colors bg-white hover:border-indigo-200 ${
                                                        isCatOpen
                                                            ? 'border-indigo-300 ring-4 ring-indigo-50'
                                                            : 'border-gray-200'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`p-1.5 rounded-lg ${currentCatConfig.color}`}>
                                                            <CurrentCatIcon className="w-4 h-4" />
                                                        </div>
                                                        <span className="text-gray-700">{currentCatConfig.label}</span>
                                                    </div>
                                                    <motion.div
                                                        animate={{ rotate: isCatOpen ? 180 : 0 }}
                                                        transition={{ duration: 0.2, ease: SMOOTH_EASE }}
                                                    >
                                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                                    </motion.div>
                                                </button>

                                                <AnimatePresence>
                                                    {isCatOpen && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                                            transition={{ duration: 0.18, ease: SMOOTH_EASE }}
                                                            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-30 p-2 grid grid-cols-1 sm:grid-cols-2 gap-1"
                                                        >
                                                            {Object.entries(ASSET_CATEGORIES).map(
                                                                ([key, val]: [string, any]) => {
                                                                    const Icon = val.icon;
                                                                    const isSelected = category === key;
                                                                    return (
                                                                        <button
                                                                            key={key}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const nextCat = key as AssetCategory;
                                                                                setCategory(nextCat);
                                                                                if (!isMediaEligibleCategory(nextCat)) {
                                                                                    setIsMetricoolReady(false);
                                                                                }
                                                                                setIsCatOpen(false);
                                                                            }}
                                                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${
                                                                                isSelected
                                                                                    ? 'bg-indigo-50 border border-indigo-100'
                                                                                    : 'hover:bg-gray-50 border border-transparent'
                                                                            }`}
                                                                        >
                                                                            <div className="flex items-center gap-2 min-w-0">
                                                                                <div
                                                                                    className={`p-1.5 rounded-lg shrink-0 ${val.color}`}
                                                                                >
                                                                                    <Icon className="w-3.5 h-3.5" />
                                                                                </div>
                                                                                <span
                                                                                    className={`text-xs font-bold truncate ${
                                                                                        isSelected
                                                                                            ? 'text-indigo-900'
                                                                                            : 'text-gray-600'
                                                                                    }`}
                                                                                >
                                                                                    {val.label}
                                                                                </span>
                                                                            </div>
                                                                            {isSelected && (
                                                                                <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-1" />
                                                                            )}
                                                                        </button>
                                                                    );
                                                                }
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* --- Metricool Publishable Clip Toggle --- */}
                                            <AnimatePresence initial={false}>
                                                {isMediaEligibleCategory(category) && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.2, ease: SMOOTH_EASE }}
                                                        className="overflow-hidden !mt-0"
                                                    >
                                                        <div className="pt-4">
                                                            <button
                                                                type="button"
                                                                disabled={!canMarkFormAsMetricool}
                                                                onClick={() => setIsMetricoolReady(prev => !prev)}
                                                                className={`w-full p-3.5 rounded-xl border text-left transition-colors flex items-center justify-between gap-3 ${
                                                                    !canMarkFormAsMetricool
                                                                        ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                                                                        : isMetricoolReady
                                                                          ? 'bg-[#E6EFE9] border-[#567A63] text-[#2F4D3A] shadow-2xs'
                                                                          : 'bg-[#FAF8F5] border-[#DFD7C9] text-[#5A5044] hover:border-[#567A63]/50'
                                                                }`}
                                                            >
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-bold flex items-center gap-1.5">
                                                                        <span>ใช้ส่งโพสต์ Metricool (คลิปไฟนอลพร้อมโพสต์)</span>
                                                                    </p>
                                                                    <p className="text-[11px] opacity-80 mt-0.5 leading-snug">
                                                                        {isMetricoolReady
                                                                            ? 'ระบบจะแปลงลิงก์นี้เป็น Direct Link ใส่คอลัมน์ Picture Url 1 ตอนกด Export CSV'
                                                                            : 'หากเป็นลิงก์ฟุตเทจดิบ เรฟ หรือดราฟต์แก้ไข ไม่ต้องติ๊กช่องนี้'}
                                                                    </p>
                                                                </div>
                                                                <div
                                                                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                                                                        isMetricoolReady
                                                                            ? 'bg-[#567A63] border-[#567A63] text-white'
                                                                            : 'bg-white border-[#C5B9A5]'
                                                                    }`}
                                                                >
                                                                    {isMetricoolReady && <Check className="w-4 h-4 stroke-[3]" />}
                                                                </div>
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            <motion.button
                                                type="button"
                                                whileTap={{ scale: 0.985 }}
                                                onClick={handleAddLink}
                                                disabled={!name.trim() || !url.trim()}
                                                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                <Plus className="w-5 h-5 stroke-[3px]" /> บันทึกรายการ
                                            </motion.button>
                                        </motion.div>
                                    )}

                                    {inputType === 'DRIVE' && (
                                        <motion.div
                                            key="tab-drive"
                                            initial={{ opacity: 0, x: 8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -8 }}
                                            transition={{ duration: 0.18, ease: SMOOTH_EASE }}
                                            className="space-y-4"
                                        >
                                            <div className="grid grid-cols-2 gap-3">
                                                <motion.button
                                                    type="button"
                                                    whileHover={{ y: -2 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => driveUploadInputRef.current?.click()}
                                                    className="flex flex-col items-center justify-center gap-2 p-4 bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl hover:bg-blue-100 transition-colors group"
                                                >
                                                    <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                                        <Plus className="w-6 h-6 text-blue-500" />
                                                    </div>
                                                    <span className="text-xs font-bold text-blue-700">
                                                        อัปโหลดไฟล์ใหม่
                                                    </span>
                                                </motion.button>

                                                <motion.button
                                                    type="button"
                                                    whileHover={{ y: -2 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={handleDriveSelect}
                                                    className="flex flex-col items-center justify-center gap-2 p-4 bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-2xl hover:bg-indigo-100 transition-colors group"
                                                >
                                                    <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                                        <FolderOpen className="w-6 h-6 text-indigo-500" />
                                                    </div>
                                                    <span className="text-xs font-bold text-indigo-700">
                                                        เลือกจาก Drive
                                                    </span>
                                                </motion.button>
                                            </div>

                                            <div className="text-center">
                                                <p className="text-[11px] text-gray-500 font-medium">
                                                    หลังเพิ่มไฟล์แล้ว สามารถกดปุ่ม{' '}
                                                    <span className="font-bold text-[#3F634D]">
                                                        "ส่งโพสต์ Metricool"
                                                    </span>{' '}
                                                    บนรายการที่เป็นคลิปไฟนอลได้ทันที
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <input
                type="file"
                ref={driveUploadInputRef}
                className="hidden"
                onChange={handleDriveUpload}
            />

            {/* Asset List (Grid - unified scroll with parent form) */}
            {assets.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <AnimatePresence initial={false}>
                        {assets.map(asset => {
                            const check = classifyGoogleDriveUrl(asset.url);
                            const isDrive = check.isGoogleDrive;
                            const style = getAssetStyle(asset.category, isDrive);
                            const Icon = style.icon;
                            const catLabel =
                                ASSET_CATEGORIES[asset.category]?.label?.split(' / ')[0] || 'ไฟล์แนบ';
                            const isEligibleForMetricool = isMediaEligibleCategory(asset.category);
                            const isMarkedMetricool = Boolean(asset.isMetricoolReady);
                            const isFolderOrDoc =
                                check.kind === 'DRIVE_FOLDER' || check.kind === 'DRIVE_DOCUMENT';

                            return (
                                <motion.div
                                    key={asset.id}
                                    layout="position"
                                    initial={{ opacity: 0, scale: 0.96, y: 6 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                                    transition={{ duration: 0.2, ease: SMOOTH_EASE }}
                                    className={`group flex flex-col justify-between p-3 rounded-2xl border transition-colors gap-2.5 ${
                                        isMarkedMetricool
                                            ? 'bg-[#F5FAF7] border-[#9EC2AC] shadow-xs'
                                            : 'bg-white border-gray-100 hover:border-indigo-300 hover:shadow-md'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2.5">
                                        <div className="flex items-center gap-3 overflow-hidden min-w-0">
                                            <div
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                    isMarkedMetricool
                                                        ? 'bg-[#E6EFE9] text-[#3F634D]'
                                                        : `${style.bg} ${style.text}`
                                                }`}
                                            >
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-bold text-gray-800 truncate">
                                                    {asset.name}
                                                </h4>
                                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11px] text-gray-500">
                                                    <span className="font-semibold text-gray-600">
                                                        {catLabel}
                                                    </span>
                                                    <span aria-hidden="true">·</span>
                                                    <a
                                                        href={asset.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-indigo-600 hover:underline inline-flex items-center gap-1 font-semibold"
                                                    >
                                                        <span>
                                                            {check.kind === 'DRIVE_FILE'
                                                                ? 'ไฟล์ Google Drive'
                                                                : check.kind === 'DRIVE_FOLDER'
                                                                  ? 'โฟลเดอร์ Drive'
                                                                  : 'เปิดลิงก์'}
                                                        </span>
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(asset.id)}
                                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                            title="ลบรายการไฟล์แนบ"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Bottom Bar: Metricool Toggle or Thumbnail/Folder Info */}
                                    {asset.category === 'THUMBNAIL' ? (
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] text-[#6E6355]">
                                            <span className="font-semibold">
                                                ภาพปกคลิป (ซิงค์เข้าคอลัมน์ Video Thumbnail Url อัตโนมัติ)
                                            </span>
                                        </div>
                                    ) : isEligibleForMetricool ? (
                                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100/80">
                                            {isFolderOrDoc ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8F6532]">
                                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                                    <span>
                                                        {check.kind === 'DRIVE_FOLDER'
                                                            ? 'ลิงก์โฟลเดอร์ (สำหรับเก็บฟุตเทจดิบ)'
                                                            : 'ลิงก์เอกสาร (ส่งโพสต์ไม่ได้)'}
                                                    </span>
                                                </span>
                                            ) : (
                                                <span className="text-[11px] font-medium text-gray-500 truncate">
                                                    {isMarkedMetricool
                                                        ? check.kind === 'DRIVE_FILE'
                                                            ? 'แปลง Direct Link ส่ง Metricool'
                                                            : 'พร้อมส่งเข้า Picture Url 1'
                                                        : 'ฟุตเทจดิบ / ดราฟต์ (ไม่ส่ง Metricool)'}
                                                </span>
                                            )}

                                            {onUpdateAsset && !isFolderOrDoc && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleMetricoolReady(asset)}
                                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors shrink-0 border ${
                                                        isMarkedMetricool
                                                            ? 'bg-[#567A63] text-white border-[#567A63] shadow-2xs'
                                                            : 'bg-[#FAF8F5] text-[#5A5044] border-[#DFD7C9] hover:border-[#567A63] hover:text-[#3F634D]'
                                                    }`}
                                                >
                                                    <div
                                                        className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                                                            isMarkedMetricool
                                                                ? 'bg-white text-[#567A63] border-white'
                                                                : 'bg-white border-[#B8AC99]'
                                                        }`}
                                                    >
                                                        {isMarkedMetricool && (
                                                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                                                        )}
                                                    </div>
                                                    <span>ส่งโพสต์ Metricool</span>
                                                </button>
                                            )}
                                        </div>
                                    ) : null}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default TaskAssets;
