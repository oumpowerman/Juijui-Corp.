import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Tag, Pencil, Plus, Layers, Trash2, AlignLeft, Check, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMasterData } from '../../../../hooks/useMasterData';
import { useToast } from '../../../../context/ToastContext';
import { useGlobalDialog } from '../../../../context/GlobalDialogContext';

interface TempOption {
  id: string;
  type: 'PILLAR' | 'CATEGORY';
  key: string;
  label: string;
  description?: string;
  parentKey?: string;
}

interface PillarCategoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  pillar: { id: string; key: string; label: string; description?: string } | null;
  channel: any;
  tempOptions: TempOption[];
  setTempOptions: React.Dispatch<React.SetStateAction<TempOption[]>>;
}

export const PillarCategoryDetailModal: React.FC<PillarCategoryDetailModalProps> = ({
  isOpen,
  onClose,
  pillar,
  channel,
  tempOptions,
  setTempOptions,
}) => {
  const { masterOptions, addMasterOption, updateMasterOption, deleteMasterOption, fetchMasterOptions } = useMasterData();
  const { showToast } = useToast();
  const { showConfirm } = useGlobalDialog();

  // Category creation states
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [showCategoryDescInput, setShowCategoryDescInput] = useState(false);

  // Category editing states
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatLabel, setEditingCatLabel] = useState<string>('');
  const [editingCatDescription, setEditingCatDescription] = useState<string>('');

  // Pillar editing within modal
  const [isEditingPillarHeader, setIsEditingPillarHeader] = useState(false);
  const [editPillarHeaderLabel, setEditPillarHeaderLabel] = useState('');
  const [editPillarHeaderDescription, setEditPillarHeaderDescription] = useState('');
  
  // Local active pillar state to persist content during exit animations
  const [activePillar, setActivePillar] = useState<{ id: string; key: string; label: string; description?: string } | null>(null);

  useEffect(() => {
    if (pillar) {
      // Find latest pillar data if from masterOptions
      const latestFromDb = masterOptions.find((o: any) => o.id === pillar.id || o.key === pillar.key);
      const latestFromTemp = tempOptions.find((to: any) => to.id === pillar.id || to.key === pillar.key);
      const currentPillarData = latestFromDb || latestFromTemp || pillar;
      setActivePillar(currentPillarData);
    }
  }, [pillar, masterOptions, tempOptions]);

  // Reset inputs when modal closes or opens
  useEffect(() => {
    if (isOpen) {
      setNewCategoryLabel('');
      setNewCategoryDescription('');
      setShowCategoryDescInput(false);
      setEditingCatId(null);
      setEditingCatLabel('');
      setEditingCatDescription('');
      setIsEditingPillarHeader(false);
    }
  }, [isOpen]);

  const renderPillar = activePillar || pillar;
  if (!renderPillar) return null;

  const isPillarTemp = !renderPillar.id || tempOptions.some(to => to.id === renderPillar.id);

  // Derive categories under this specific pillar
  const existingCategories = masterOptions.filter(
    (o: any) => o.type === 'CATEGORY' && o.parentKey === renderPillar.key && o.isActive
  );
  const currentCategories = channel
    ? existingCategories
    : tempOptions.filter(o => o.type === 'CATEGORY' && o.parentKey === renderPillar.key);

  const handleStartEditPillarHeader = () => {
    setEditPillarHeaderLabel(renderPillar.label);
    setEditPillarHeaderDescription(renderPillar.description || '');
    setIsEditingPillarHeader(true);
  };

  const handleSavePillarHeader = async () => {
    const trimmedLabel = editPillarHeaderLabel.trim();
    if (!trimmedLabel) {
      showToast('กรุณากรอกชื่อแกนเนื้อหา', 'warning');
      return;
    }
    const trimmedDesc = editPillarHeaderDescription.trim();

    if (isPillarTemp) {
      setTempOptions(prev =>
        prev.map(o => {
          if (o.id === renderPillar.id || o.key === renderPillar.key) {
            return {
              ...o,
              label: trimmedLabel,
              description: trimmedDesc || undefined
            };
          }
          return o;
        })
      );
      showToast('แก้ไขข้อมูลแกนเนื้อหาสำเร็จ ✨', 'success');
    } else {
      await updateMasterOption({
        id: renderPillar.id,
        type: 'PILLAR',
        key: renderPillar.key,
        label: trimmedLabel,
        description: trimmedDesc || undefined,
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        sortOrder: 10,
        isActive: true,
        isDefault: false,
        parentKey: (renderPillar as any).parentKey || (channel ? channel.id : undefined)
      });
      await fetchMasterOptions();
      showToast('อัปเดตข้อมูลแกนเนื้อหาในฐานข้อมูลสำเร็จ ✨', 'success');
    }

    setActivePillar(prev => prev ? ({ ...prev, label: trimmedLabel, description: trimmedDesc || undefined }) : null);
    setIsEditingPillarHeader(false);
  };

  const handleAddCategory = async () => {
    const trimmed = newCategoryLabel.trim();
    if (!trimmed) return;
    const trimmedDesc = newCategoryDescription.trim();

    const cleanKey = trimmed.toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    const key = `CAT_${cleanKey || 'GEN'}_${Date.now().toString().slice(-4)}`;

    const hasDuplicate = currentCategories.some(
      (cat: any) => cat.label.toLowerCase() === trimmed.toLowerCase()
    );

    if (hasDuplicate) {
      showToast(`ชื่อหมวดหมู่ย่อย "${trimmed}" มีอยู่แล้วในแกนเนื้อหานี้`, 'warning');
      setNewCategoryLabel('');
      return;
    }

    if (channel) {
      await addMasterOption({
        type: 'CATEGORY',
        key,
        label: trimmed,
        description: trimmedDesc || undefined,
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        sortOrder: 10,
        isActive: true,
        isDefault: false,
        parentKey: renderPillar.key,
      });
      await fetchMasterOptions();
    } else {
      setTempOptions(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: 'CATEGORY',
          key,
          label: trimmed,
          description: trimmedDesc || undefined,
          parentKey: renderPillar.key,
        },
      ]);
    }

    setNewCategoryLabel('');
    setNewCategoryDescription('');
    setShowCategoryDescInput(false);
    showToast('เพิ่มหมวดหมู่ย่อยสำเร็จ 🎉', 'success');
  };

  const handleRemoveCategory = async (catId: string, isTemp: boolean) => {
    const confirmed = await showConfirm(
      'คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่ย่อยนี้? การดำเนินการนี้ไม่สามารถยกเลิกได้',
      'ยืนยันการลบข้อมูล',
      true
    );
    if (!confirmed) return;

    if (isTemp) {
      setTempOptions(prev => prev.filter(o => o.id !== catId));
      showToast('ลบหมวดหมู่ย่อยเรียบร้อยแล้ว', 'info');
    } else {
      const success = await deleteMasterOption(catId);
      if (success) {
        showToast('ลบหมวดหมู่ย่อยเรียบร้อยแล้ว', 'info');
      }
    }
  };

  const handleStartEditCategory = (cat: any) => {
    setEditingCatId(cat.id || cat.key);
    setEditingCatLabel(cat.label || '');
    setEditingCatDescription(cat.description || '');
  };

  const handleCancelEditCategory = () => {
    setEditingCatId(null);
    setEditingCatLabel('');
    setEditingCatDescription('');
  };

  const handleCommitEditCategory = async (cat: any, isTemp: boolean) => {
    const trimmed = editingCatLabel.trim();
    if (!trimmed) {
      handleCancelEditCategory();
      return;
    }
    const trimmedDesc = editingCatDescription.trim();

    // Check duplicates under the same parentKey (Pillar) only
    const otherCatsInSamePillar = currentCategories.filter(
      c => (c.id || c.key) !== (cat.id || cat.key)
    );
    const isDuplicate = otherCatsInSamePillar.some(
      c => c.label.toLowerCase().trim() === trimmed.toLowerCase()
    );

    if (isDuplicate) {
      showToast(`ชื่อหมวดหมู่ย่อย "${trimmed}" ซ้ำในแกนเนื้อหานี้`, 'warning');
      return;
    }

    if (isTemp) {
      setTempOptions(prev =>
        prev.map(o => {
          if (o.id === cat.id || o.key === cat.key) {
            return {
              ...o,
              label: trimmed,
              description: trimmedDesc || undefined
            };
          }
          return o;
        })
      );
      showToast('แก้ไขหมวดหมู่ย่อยสำเร็จ ✨', 'success');
    } else {
      await updateMasterOption({
        id: cat.id,
        type: cat.type || 'CATEGORY',
        key: cat.key,
        label: trimmed,
        description: trimmedDesc || undefined,
        color: cat.color || 'bg-emerald-100 text-emerald-700 border-emerald-200',
        sortOrder: cat.sortOrder || 10,
        isActive: cat.isActive !== undefined ? cat.isActive : true,
        isDefault: cat.isDefault || false,
        parentKey: cat.parentKey,
      });
      await fetchMasterOptions();
      showToast('อัปเดตข้อมูลในฐานข้อมูลสำเร็จ ✨', 'success');
    }

    handleCancelEditCategory();
  };

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10001] flex items-end md:items-center justify-center p-0 md:p-4 font-kanit">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          {/* Modal Card / Bottom Drawer on Mobile */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative bg-white w-full md:max-w-2xl rounded-t-3xl md:rounded-3xl shadow-2xl border border-slate-100 flex flex-col h-[85vh] md:h-[650px] overflow-hidden"
          >
            {/* Handle Bar for mobile dragging visualization */}
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto my-3 md:hidden shrink-0" />

            {/* Header: Pillar Info + Description & Edit option */}
            <div className="px-6 pb-4 pt-2 md:pt-5 border-b border-slate-100 shrink-0 bg-slate-50/50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2.5 bg-indigo-50 rounded-2xl text-indigo-600 shrink-0 mt-0.5">
                    <Layers className="w-5 h-5" />
                  </div>

                  {isEditingPillarHeader ? (
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={editPillarHeaderLabel}
                        onChange={e => setEditPillarHeaderLabel(e.target.value)}
                        placeholder="ชื่อแกนเนื้อหา"
                        className="w-full px-3 py-1.5 bg-white border border-indigo-300 text-sm font-bold text-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none font-kanit"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={editPillarHeaderDescription}
                        onChange={e => setEditPillarHeaderDescription(e.target.value)}
                        placeholder="คำอธิบายแกนเนื้อหา..."
                        className="w-full px-3 py-1 bg-white border border-slate-200 text-xs text-slate-700 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-kanit"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSavePillarHeader}
                          className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> บันทึก
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingPillarHeader(false)}
                          className="px-3 py-1 bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-300 transition-all"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 text-lg leading-tight truncate">
                          {renderPillar.label}
                        </h3>
                        <button
                          type="button"
                          onClick={handleStartEditPillarHeader}
                          className="text-slate-400 hover:text-indigo-600 p-1 rounded-lg hover:bg-slate-100 transition-all shrink-0"
                          title="แก้ไขชื่อ/คำอธิบายแกนหลัก"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {renderPillar.description ? (
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {renderPillar.description}
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleStartEditPillarHeader}
                          className="text-[11px] text-slate-400 hover:text-indigo-600 mt-0.5 flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3 h-3 text-slate-300" />
                          <span>เพิ่มคำอธิบายแกนเนื้อหานี้...</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content (Scrollable with solid locked height distribution) */}
            <div className="p-6 overflow-hidden flex-1 flex flex-col min-h-0 space-y-5">
              {/* Category Input Form */}
              <div className="space-y-2 shrink-0 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                  <span>เพิ่มหมวดหมู่ย่อย (Add Sub-Category)</span>
                  <button
                    type="button"
                    onClick={() => setShowCategoryDescInput(prev => !prev)}
                    className={`text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                      showCategoryDescInput || newCategoryDescription.trim()
                        ? 'text-emerald-600 font-bold'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                    <span>{showCategoryDescInput ? 'ซ่อนคำอธิบาย' : '+ ใส่คำอธิบายย่อย'}</span>
                  </button>
                </label>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryLabel}
                      onChange={(e) => setNewCategoryLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !showCategoryDescInput) {
                          e.preventDefault();
                          handleAddCategory();
                        }
                      }}
                      placeholder="พิมพ์หมวดหมู่ย่อยใหม่ เช่น วิ่งมาราธอน, อาหารคลีน"
                      className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-sm rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all placeholder:text-slate-400 font-kanit"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      disabled={!newCategoryLabel.trim()}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shrink-0 shadow-xs flex items-center gap-1.5 font-kanit"
                    >
                      <Plus className="w-4 h-4" />
                      <span>เพิ่มหมวดหมู่</span>
                    </button>
                  </div>

                  {/* Optional Description Input for Sub-Category */}
                  {(showCategoryDescInput || newCategoryDescription.trim().length > 0) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <input
                        type="text"
                        value={newCategoryDescription}
                        onChange={(e) => setNewCategoryDescription(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCategory();
                          }
                        }}
                        placeholder="คำอธิบายหมวดหมู่ย่อย (ไม่บังคับ เช่น คอนเทนต์รีวิวรองเท้าและเทคนิคการวิ่ง)"
                        className="w-full px-4 py-2 bg-white border border-slate-200 text-xs text-slate-700 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all placeholder:text-slate-300 font-kanit"
                      />
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Sub-categories List */}
              <div className="space-y-3 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between shrink-0">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    หมวดหมู่ย่อยทั้งหมด ({currentCategories.length})
                  </label>
                  <span className="text-[11px] text-slate-400">
                    💡 กดปุ่มดินสอ เพื่อแก้ไขชื่อและคำอธิบาย
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 border border-slate-100 rounded-2xl bg-slate-50/30 custom-scrollbar min-h-0 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 content-start">
                    {currentCategories.map((cat: any) => {
                      const isCatTemp = !cat.id || tempOptions.some(to => to.id === cat.id);
                      const isEditing = editingCatId === (cat.id || cat.key);

                      if (isEditing) {
                        return (
                          <div
                            key={cat.id || cat.key}
                            className="col-span-1 sm:col-span-2 bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3 shadow-xs space-y-2"
                          >
                            <div className="flex items-center gap-2">
                              <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="text-xs font-bold text-emerald-800">แก้ไขข้อมูลหมวดหมู่ย่อย</span>
                            </div>

                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editingCatLabel}
                                onChange={(e) => setEditingCatLabel(e.target.value)}
                                placeholder="ชื่อหมวดหมู่ย่อย *"
                                className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-emerald-100 text-slate-800 text-xs font-semibold font-kanit"
                                autoFocus
                              />
                              <input
                                type="text"
                                value={editingCatDescription}
                                onChange={(e) => setEditingCatDescription(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleCommitEditCategory(cat, isCatTemp);
                                  } else if (e.key === 'Escape') {
                                    e.preventDefault();
                                    handleCancelEditCategory();
                                  }
                                }}
                                placeholder="คำอธิบายหมวดหมู่ย่อย (ไม่บังคับ)..."
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-emerald-500 text-slate-700 text-xs font-kanit"
                              />
                            </div>

                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={handleCancelEditCategory}
                                className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
                              >
                                ยกเลิก
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCommitEditCategory(cat, isCatTemp)}
                                className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" /> บันทึก
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={cat.id || cat.key}
                          className="group bg-white border border-slate-200/80 hover:border-slate-300 rounded-xl p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Tag className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span className="font-bold text-slate-800 text-sm font-kanit truncate">
                                  {cat.label}
                                </span>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-0.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditCategory(cat)}
                                  className="text-slate-400 hover:text-indigo-600 p-1 rounded-lg hover:bg-slate-50 transition-colors"
                                  title="แก้ไขหมวดหมู่ย่อย"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCategory(cat.id, isCatTemp)}
                                  className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-1 rounded-lg transition-colors"
                                  title="ลบหมวดหมู่ย่อย"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Category Description */}
                            {cat.description ? (
                              <p className="text-xs text-slate-500 font-kanit line-clamp-2 leading-relaxed pl-5">
                                {cat.description}
                              </p>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleStartEditCategory(cat)}
                                className="text-[11px] text-slate-300 hover:text-slate-500 font-kanit pl-5 flex items-center gap-1 transition-colors"
                              >
                                <Plus className="w-2.5 h-2.5" />
                                <span>เพิ่มคำอธิบาย</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {currentCategories.length === 0 && (
                      <div className="col-span-1 sm:col-span-2 text-center py-10">
                        <p className="text-slate-400 text-sm font-kanit">ยังไม่มีหมวดหมู่ย่อยใต้แกนหลักนี้</p>
                        <p className="text-slate-300 text-xs font-kanit mt-1">พิมพ์เพิ่มหมวดหมู่ย่อยด้านบนได้ทันที</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 shrink-0 rounded-b-3xl">
              <button
                type="button"
                onClick={onClose}
                className="w-full md:w-auto px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all font-kanit"
              >
                เสร็จสิ้น / ปิดหน้าต่าง
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
