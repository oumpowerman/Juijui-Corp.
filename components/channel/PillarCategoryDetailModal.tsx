import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Tag, Pencil, Plus, Layers, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMasterData } from '../../hooks/useMasterData';
import { useToast } from '../../context/ToastContext';

interface TempOption {
  id: string;
  type: 'PILLAR' | 'CATEGORY';
  key: string;
  label: string;
  parentKey?: string;
}

interface PillarCategoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  pillar: { id: string; key: string; label: string } | null;
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

  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatLabel, setEditingCatLabel] = useState<string>('');
  
  // Local active pillar state to persist content during exit animations
  const [activePillar, setActivePillar] = useState<{ id: string; key: string; label: string } | null>(null);

  useEffect(() => {
    if (pillar) {
      setActivePillar(pillar);
    }
  }, [pillar]);

  // Close editing when modal closes or pillar changes
  useEffect(() => {
    if (isOpen) {
      setNewCategoryLabel('');
      setEditingCatId(null);
      setEditingCatLabel('');
    }
  }, [isOpen, pillar]);

  const renderPillar = pillar || activePillar;
  if (!renderPillar) return null;

  const isPillarTemp = !renderPillar.id || tempOptions.some(to => to.id === renderPillar.id);

  // Derive categories under this specific pillar
  const existingCategories = masterOptions.filter(
    (o: any) => o.type === 'CATEGORY' && o.parentKey === renderPillar.key && o.isActive
  );
  const currentCategories = channel
    ? existingCategories
    : tempOptions.filter(o => o.type === 'CATEGORY' && o.parentKey === renderPillar.key);

  const handleAddCategory = async () => {
    const trimmed = newCategoryLabel.trim();
    if (!trimmed) return;

    const key = `CAT_${trimmed.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;

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
          parentKey: renderPillar.key,
        },
      ]);
    }

    setNewCategoryLabel('');
    showToast('เพิ่มหมวดหมู่ย่อยสำเร็จ 🎉', 'success');
  };

  const handleRemoveCategory = async (catId: string, isTemp: boolean) => {
    if (isTemp) {
      setTempOptions(prev => prev.filter(o => o.id !== catId));
    } else {
      await deleteMasterOption(catId);
    }
    showToast('ลบหมวดหมู่ย่อยเรียบร้อยแล้ว', 'info');
  };

  const handleStartEditCategory = (cat: any) => {
    setEditingCatId(cat.id || cat.key);
    setEditingCatLabel(cat.label);
  };

  const handleCancelEditCategory = () => {
    setEditingCatId(null);
    setEditingCatLabel('');
  };

  const handleCommitEditCategory = async (cat: any, isTemp: boolean) => {
    const trimmed = editingCatLabel.trim();
    if (!trimmed) {
      handleCancelEditCategory();
      return;
    }

    // Check duplicates under the same parentKey (Pillar) only
    const otherCatsInSamePillar = currentCategories.filter(
      c => (c.id || c.key) !== (cat.id || cat.key)
    );
    const isDuplicate = otherCatsInSamePillar.some(
      c => c.label.toLowerCase().trim() === trimmed.toLowerCase()
    );

    if (isDuplicate) {
      showToast(`ชื่อหมวดหมู่ย่อย "${trimmed}" ซ้ำในแกนเนื้อหานี้`, 'warning');
      handleCancelEditCategory();
      return;
    }

    if (trimmed === cat.label) {
      handleCancelEditCategory();
      return;
    }

    if (isTemp) {
      setTempOptions(prev =>
        prev.map(o => {
          if (o.id === cat.id || o.key === cat.key) {
            return { ...o, label: trimmed };
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
        <div className="fixed inset-0 z-[10001] flex items-end md:items-center justify-center p-0 md:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          {/* Modal Card / Bottom Drawer on Mobile (Locked height at 80vh / 620px for high stability) */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative bg-white w-full md:max-w-xl rounded-t-3xl md:rounded-3xl shadow-2xl border border-slate-100 flex flex-col h-[80vh] md:h-[620px] overflow-hidden"
          >
            {/* Handle Bar for mobile dragging visualization */}
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto my-3 md:hidden shrink-0" />

            {/* Header */}
            <div className="px-6 pb-4 pt-2 md:pt-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-2xl text-indigo-600">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg font-kanit leading-tight">
                    {renderPillar.label}
                  </h3>
                  <p className="text-xs text-slate-400 font-kanit">
                    จัดการหมวดหมู่ย่อยประจำแกนเนื้อหา
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content (Scrollable with solid locked height distribution) */}
            <div className="p-6 overflow-hidden flex-1 flex flex-col min-h-0 space-y-6">
              {/* Category Input Form */}
              <div className="space-y-2 shrink-0">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider font-kanit">
                  เพิ่มหมวดหมู่ย่อย (Add Sub-Category)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryLabel}
                    onChange={(e) => setNewCategoryLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                    placeholder="พิมพ์หมวดหมู่ย่อยใหม่ เช่น วิ่งมาราธอน, อาหารคลีน"
                    className="flex-1 px-4 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 text-sm rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all placeholder:text-slate-400 font-kanit"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={!newCategoryLabel.trim()}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold rounded-2xl transition-all active:scale-95 shrink-0 shadow-xs flex items-center gap-1.5 font-kanit"
                  >
                    <Plus className="w-4 h-4" />
                    เพิ่มหมวดหมู่
                  </button>
                </div>
              </div>

              {/* Sub-categories List (Now stretches to fill available height and has custom scrollbar) */}
              <div className="space-y-3 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between shrink-0">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider font-kanit">
                    รายการทั้งหมด ({currentCategories.length})
                  </label>
                  <span className="text-[10px] text-slate-400 font-kanit">
                    💡 ดับเบิ้ลคลิกหรือกดดินสอ เพื่อแก้ไขชื่อ
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 border border-slate-100 rounded-2xl bg-slate-50/25 custom-scrollbar min-h-0">
                  <div className="flex flex-wrap gap-2.5 content-start">
                    {currentCategories.map((cat: any) => {
                      const isCatTemp = !cat.id || tempOptions.some(to => to.id === cat.id);
                      const isEditing = editingCatId === (cat.id || cat.key);

                      if (isEditing) {
                        return (
                          <div
                            key={cat.id || cat.key}
                            className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold rounded-xl shadow-xs px-2.5 py-1.5"
                          >
                            <Tag className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <input
                              type="text"
                              value={editingCatLabel}
                              onChange={(e) => setEditingCatLabel(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleCommitEditCategory(cat, isCatTemp);
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  handleCancelEditCategory();
                                }
                              }}
                              onBlur={() => handleCommitEditCategory(cat, isCatTemp)}
                              autoFocus
                              className="bg-white border border-emerald-300 rounded-lg px-2 py-0.5 outline-none focus:border-emerald-500 text-emerald-850 text-xs font-semibold w-36 font-kanit"
                            />
                          </div>
                        );
                      }

                      return (
                        <div
                          key={cat.id || cat.key}
                          onDoubleClick={() => handleStartEditCategory(cat)}
                          className="group flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-150 text-slate-700 hover:text-slate-900 text-sm font-semibold rounded-xl shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer select-none"
                        >
                          <Tag className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-500 shrink-0" />
                          <span className="font-kanit text-slate-700 group-hover:text-slate-900">
                            {cat.label}
                          </span>
                          
                          {/* Edit Pencil Icon (Touch Target 44px on Hover or Hover State) */}
                          <button
                            type="button"
                            onClick={() => handleStartEditCategory(cat)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 transition-all p-1 rounded-lg hover:bg-slate-50 shrink-0"
                            title="แก้ไขหมวดหมู่ย่อย"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveCategory(cat.id, isCatTemp)}
                            className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors p-1 rounded-lg shrink-0"
                            title="ลบหมวดหมู่ย่อย"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}

                    {currentCategories.length === 0 && (
                      <div className="w-full text-center py-10">
                        <p className="text-slate-400 text-sm font-kanit">ยังไม่มีหมวดหมู่ย่อยย่อยใต้แกนหลักนี้</p>
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
                ปิดหน้าต่าง
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
