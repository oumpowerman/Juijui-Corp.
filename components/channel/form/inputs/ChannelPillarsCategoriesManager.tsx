import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LayoutTemplate, X, ChevronDown, Sparkles, Layers, Tag, Pencil, ArrowRight, Plus, AlignLeft, Check, FileText } from 'lucide-react';
import { Channel } from '../../../../types';
import { useMasterData } from '../../../../hooks/useMasterData';
import { supabase } from '../../../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../../../context/ToastContext';
import { useGlobalDialog } from '../../../../context/GlobalDialogContext';
import { PillarCategoryDetailModal } from './PillarCategoryDetailModal';

// Curated default recommendations to ensure excellent fallback options
const DEFAULT_POPULAR_PILLARS = [
  'Entertainment 🎬',
  'Education 📚',
  'Lifestyle 🌱',
  'Promotion 📢',
  'Realtime / News ⚡',
  'Vlog / Diary 📹',
  'Review / Unboxing 📦',
  'Podcast / Interview 🎙️',
  'Behind the Scenes 🎥',
  'Tutorial / How-to 💡'
];

interface TempOption {
  id: string;
  type: 'PILLAR' | 'CATEGORY';
  key: string;
  label: string;
  description?: string;
  parentKey?: string;
}

interface ChannelPillarsCategoriesManagerProps {
  targetId: string;
  channel: Channel | null;
  tempOptions: TempOption[];
  setTempOptions: React.Dispatch<React.SetStateAction<TempOption[]>>;
}

export const ChannelPillarsCategoriesManager: React.FC<ChannelPillarsCategoriesManagerProps> = ({
  targetId,
  channel,
  tempOptions,
  setTempOptions
}) => {
  const { masterOptions, addMasterOption, updateMasterOption, deleteMasterOption, fetchMasterOptions } = useMasterData();
  const { showToast } = useToast();
  const { showConfirm } = useGlobalDialog();

  // Input states for adding new Pillar
  const [newPillarLabel, setNewPillarLabel] = useState('');
  const [newPillarDescription, setNewPillarDescription] = useState('');
  const [showDescriptionInput, setShowDescriptionInput] = useState(false);
  
  // Selected pillar for viewing/editing subcategories modal
  const [selectedPillarForModal, setSelectedPillarForModal] = useState<any | null>(null);

  // Pillar Edit Modal State
  const [editingPillar, setEditingPillar] = useState<{ id: string; key: string; label: string; description?: string } | null>(null);
  const [editPillarLabel, setEditPillarLabel] = useState('');
  const [editPillarDescription, setEditPillarDescription] = useState('');

  // Dropdown states for Pillar
  const [isPillarDropdownOpen, setIsPillarDropdownOpen] = useState(false);
  const pillarInputContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pillarInputContainerRef.current &&
        !pillarInputContainerRef.current.contains(event.target as Node)
      ) {
        setIsPillarDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch system-wide global pillars dynamically or fallback to static defaults
  const systemPillars = masterOptions
    ? masterOptions
        .filter((o: any) => o.type === 'PILLAR' && !o.parentKey && o.isActive)
        .map((p: any) => p.label)
    : [];

  const allSuggestedPillars = systemPillars.length > 0
    ? systemPillars
    : DEFAULT_POPULAR_PILLARS;

  // Filter recommendations based on user input string
  const filteredSuggestedPillars = allSuggestedPillars.filter(p =>
    p.toLowerCase().includes(newPillarLabel.toLowerCase())
  );

  // Channel existing options
  const existingPillars = masterOptions.filter(
    (o: any) => o.type === 'PILLAR' && o.parentKey === targetId && o.isActive
  );
  const currentPillars = channel ? existingPillars : tempOptions.filter(o => o.type === 'PILLAR');

  const currentPillarKeys = currentPillars.map(p => p.key);

  const existingCategories = masterOptions.filter(
    (o: any) => o.type === 'CATEGORY' && o.parentKey && currentPillarKeys.includes(o.parentKey) && o.isActive
  );
  const currentCategories = channel 
    ? existingCategories 
    : tempOptions.filter(o => o.type === 'CATEGORY' && o.parentKey && currentPillarKeys.includes(o.parentKey));

  const handleAddPillarWithValue = async (labelValue: string, descValue?: string) => {
    const trimmedLabel = labelValue.trim();
    if (!trimmedLabel) return;
    const trimmedDesc = descValue !== undefined ? descValue.trim() : newPillarDescription.trim();

    const cleanKey = trimmedLabel.toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    const key = `PIL_${cleanKey || 'GEN'}_${Date.now().toString().slice(-4)}`;

    const hasDuplicate =
      currentPillars.some((p: any) => p.label.toLowerCase() === trimmedLabel.toLowerCase()) ||
      tempOptions.some(o => o.type === 'PILLAR' && o.label.toLowerCase() === trimmedLabel.toLowerCase());

    if (hasDuplicate) {
      showToast(`มีแกนเนื้อหา "${trimmedLabel}" อยู่แล้วในรายการประจำช่อง`, 'warning');
      setNewPillarLabel('');
      setNewPillarDescription('');
      setShowDescriptionInput(false);
      setIsPillarDropdownOpen(false);
      return;
    }

    if (channel) {
      // Direct save to DB in edit mode
      await addMasterOption({
        type: 'PILLAR',
        key,
        label: trimmedLabel,
        description: trimmedDesc || undefined,
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        sortOrder: 10,
        isActive: true,
        isDefault: false,
        parentKey: targetId
      });
      await fetchMasterOptions();
    } else {
      // Store temp options for later commit in create mode
      setTempOptions(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: 'PILLAR',
          key,
          label: trimmedLabel,
          description: trimmedDesc || undefined
        }
      ]);
    }

    setNewPillarLabel('');
    setNewPillarDescription('');
    setShowDescriptionInput(false);
    setIsPillarDropdownOpen(false);
    showToast(`เพิ่มแกนเนื้อหา "${trimmedLabel}" สำเร็จ!`, 'success');
  };

  const handleAddPillarClick = () => {
    handleAddPillarWithValue(newPillarLabel, newPillarDescription);
  };

  const handleOpenEditPillar = (p: any) => {
    setEditingPillar(p);
    setEditPillarLabel(p.label || '');
    setEditPillarDescription(p.description || '');
  };

  const handleSaveEditPillar = async () => {
    if (!editingPillar) return;
    const trimmedLabel = editPillarLabel.trim();
    if (!trimmedLabel) {
      showToast('กรุณากรอกชื่อแกนเนื้อหา', 'warning');
      return;
    }
    const trimmedDesc = editPillarDescription.trim();

    const isTemp = !editingPillar.id || tempOptions.some(to => to.id === editingPillar.id);

    if (isTemp) {
      setTempOptions(prev =>
        prev.map(o => {
          if (o.id === editingPillar.id || o.key === editingPillar.key) {
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
        id: editingPillar.id,
        type: 'PILLAR',
        key: editingPillar.key,
        label: trimmedLabel,
        description: trimmedDesc || undefined,
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        sortOrder: 10,
        isActive: true,
        isDefault: false,
        parentKey: targetId
      });
      await fetchMasterOptions();
      showToast('อัปเดตข้อมูลแกนเนื้อหาในฐานข้อมูลสำเร็จ ✨', 'success');
    }

    // Update selected pillar if open in modal
    if (selectedPillarForModal && (selectedPillarForModal.id === editingPillar.id || selectedPillarForModal.key === editingPillar.key)) {
      setSelectedPillarForModal((prev: any) => prev ? ({ ...prev, label: trimmedLabel, description: trimmedDesc || undefined }) : null);
    }

    setEditingPillar(null);
  };

  const handleRemovePillarClick = async (pillarId: string, pillarKey: string, isTemp: boolean) => {
    const confirmed = await showConfirm(
      'คุณแน่ใจหรือไม่ว่าต้องการลบแกนเนื้อหานี้และหมวดหมู่ย่อยทั้งหมด? การดำเนินการนี้ไม่สามารถยกเลิกได้',
      'ยืนยันการลบข้อมูล',
      true
    );
    if (!confirmed) return;

    if (isTemp) {
      // Cascading deletion for temp options
      setTempOptions(prev => prev.filter(o => o.id !== pillarId && o.parentKey !== pillarKey));
      showToast('ลบแกนเนื้อหาและหมวดหมู่ย่อยทั้งหมดเรียบร้อย', 'info');
    } else {
      const success = await deleteMasterOption(pillarId);
      if (success) {
        // Cascading deletion for database options using a single batch query to avoid prompts
        const childCats = masterOptions.filter(
          (o: any) => o.type === 'CATEGORY' && o.parentKey === pillarKey
        );
        if (childCats.length > 0) {
          await supabase.from('master_options').delete().in('id', childCats.map(c => c.id));
        }
        await fetchMasterOptions();
        showToast('ลบแกนเนื้อหาและหมวดหมู่ย่อยทั้งหมดเรียบร้อย', 'info');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-0.5">
        <label className="text-xs font-bold text-slate-700 flex items-center">
          <LayoutTemplate className="w-4 h-4 mr-1.5 text-indigo-500" />
          ตั้งค่าแกนเนื้อหาและหมวดหมู่เฉพาะช่อง (Channel-Specific Pillars & Categories)
        </label>
        <p className="text-[11px] text-slate-400">กำหนดแกนหลัก (Pillar) พร้อมคำอธิบาย และประเภทคอนเทนต์ (Category) ประจำช่องรายการนี้</p>
      </div>

      <div className="space-y-5 bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
        
        {/* Pillar Section - Channel-Level Pillar Addition */}
        <div className="space-y-3 max-w-xl" ref={pillarInputContainerRef}>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between h-5">
            <span>เพิ่มแกนเนื้อหาประจำช่อง (Add Pillars)</span>
            <span className="text-[10px] text-slate-400 font-normal normal-case flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500 animate-[pulse_2s_infinite]" /> มีรูปแบบแนะนำและดรอปดาวน์
            </span>
          </label>
          
          <div className="relative space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newPillarLabel}
                  onChange={e => {
                    setNewPillarLabel(e.target.value);
                    setIsPillarDropdownOpen(true);
                  }}
                  onFocus={() => setIsPillarDropdownOpen(true)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPillarClick();
                    }
                  }}
                  placeholder="เช่น รีวิวสินค้า, สปอนเซอร์, กินโชว์"
                  className="w-full pr-10 px-3.5 py-2 bg-white border border-slate-200 text-sm rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-300 font-kanit"
                />
                <button
                  type="button"
                  onClick={() => setIsPillarDropdownOpen(prev => !prev)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-all"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowDescriptionInput(prev => !prev)}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all shrink-0 font-kanit ${
                  showDescriptionInput || newPillarDescription.trim()
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                    : 'bg-white text-slate-500 border-slate-200 hover:text-slate-700 hover:bg-slate-50'
                }`}
                title="เพิ่ม/แก้ไขคำอธิบายแกนเนื้อหา"
              >
                <AlignLeft className="w-4 h-4" />
                <span className="hidden sm:inline">คำอธิบาย</span>
              </button>

              <button
                type="button"
                onClick={handleAddPillarClick}
                disabled={!newPillarLabel.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shrink-0 shadow-sm font-kanit flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มแกนหลัก</span>
              </button>
            </div>

            {/* Optional Description Input for New Pillar */}
            <AnimatePresence initial={false}>
              {(showDescriptionInput || newPillarDescription.trim().length > 0) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="pt-1">
                    <input
                      type="text"
                      value={newPillarDescription}
                      onChange={e => setNewPillarDescription(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddPillarClick();
                        }
                      }}
                      placeholder="คำอธิบายแกนเนื้อหา (ไม่บังคับ เช่น เนื้อหาความบันเทิง เบาสมอง เน้นเข้าถึงง่าย)"
                      className="w-full px-3.5 py-1.5 bg-white border border-slate-200 text-xs text-slate-700 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-300 font-kanit"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Smart Suggested Dropdown */}
            <AnimatePresence>
              {isPillarDropdownOpen && filteredSuggestedPillars.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full z-[9999] mt-1.5 bg-white border border-slate-150 rounded-2xl shadow-xl overflow-hidden max-h-52 overflow-y-auto custom-scrollbar"
                >
                  <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-kanit">
                    แกนหลักยอดนิยมที่แนะนำ
                  </div>
                  <div className="py-1">
                    {filteredSuggestedPillars.map((pillarVal, index) => {
                      const isAdded = currentPillars.some(
                        p => p.label.toLowerCase() === pillarVal.toLowerCase()
                      );
                      return (
                        <div
                          key={index}
                          onClick={() => {
                            if (!isAdded) {
                              setNewPillarLabel(pillarVal);
                              setIsPillarDropdownOpen(false);
                            }
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2 text-left text-sm transition-colors text-slate-700 ${
                            isAdded
                              ? 'opacity-50 cursor-not-allowed bg-slate-50 text-slate-400'
                              : 'cursor-pointer hover:bg-indigo-50/70 focus:bg-indigo-50/70 outline-none'
                          }`}
                        >
                          <span className="font-kanit">{pillarVal}</span>
                          {isAdded ? (
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md font-bold font-kanit">
                              เพิ่มแล้ว
                            </span>
                          ) : (
                            <button
                              type="button"
                              title="เลือกและเพิ่มทันที"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddPillarWithValue(pillarVal);
                              }}
                              className="text-indigo-600 hover:text-indigo-800 p-1 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Pillars Cards & Sub-Categories Hierarchy Display */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between h-5 font-kanit">
            <span>โครงสร้างหมวดหมู่ย่อยใต้แกนหลัก (Pillars & Sub-Categories)</span>
            <span className="text-[11px] text-slate-400 font-normal">
              ทั้งหมด {currentPillars.length} แกนหลัก
            </span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentPillars.map((p: any) => {
              const isPillarTemp = !p.id || tempOptions.some(to => to.id === p.id);
              const pCats = currentCategories.filter(cat => cat.parentKey === p.key);

              return (
                <div
                  key={p.id || p.key}
                  className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-2xs hover:shadow-sm hover:border-slate-300/80 transition-all relative flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Pillar Card Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600 shrink-0 mt-0.5">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm font-kanit truncate">{p.label}</span>
                            <span className="text-[10px] font-semibold text-indigo-600 font-kanit bg-indigo-50/70 px-1.5 py-0.5 rounded-md shrink-0">
                              {pCats.length} หมวดหมู่
                            </span>
                          </div>

                          {/* Pillar Description Display */}
                          {p.description ? (
                            <p 
                              onClick={() => handleOpenEditPillar(p)}
                              className="text-xs text-slate-500 font-kanit line-clamp-2 mt-1 leading-relaxed cursor-pointer hover:text-indigo-600 transition-colors"
                              title="คลิกเพื่อแก้ไขคำอธิบาย"
                            >
                              {p.description}
                            </p>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenEditPillar(p)}
                              className="text-[11px] text-slate-400 hover:text-indigo-600 font-kanit mt-1 flex items-center gap-1 transition-colors group/desc"
                            >
                              <Plus className="w-3 h-3 text-slate-300 group-hover/desc:text-indigo-500" />
                              <span>เพิ่มคำอธิบายแกนเนื้อหา...</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditPillar(p)}
                          className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-xl transition-all"
                          title="แก้ไขชื่อและคำอธิบายแกนเนื้อหา"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePillarClick(p.id, p.key, isPillarTemp)}
                          className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-xl transition-all"
                          title="ลบแกนและหมวดหมู่ย่อยทั้งหมด"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Sub-Categories Preview Section */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                        {pCats.slice(0, 4).map((cat: any) => (
                          <div
                            key={cat.id || cat.key}
                            title={cat.description ? `${cat.label}: ${cat.description}` : cat.label}
                            className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50/60 border border-emerald-100/50 text-emerald-700 text-[11px] font-semibold rounded-md shadow-3xs group/item"
                          >
                            <Tag className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                            <span className="font-kanit">{cat.label}</span>
                            {cat.description && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="มีคำอธิบาย" />
                            )}
                          </div>
                        ))}
                        {pCats.length > 4 && (
                          <span className="text-[10px] font-bold text-slate-400 font-kanit px-1.5 py-0.5 bg-slate-100 rounded-md">
                            +{pCats.length - 4} เพิ่มเติม
                          </span>
                        )}
                        {pCats.length === 0 && (
                          <p className="text-slate-300 text-xs italic font-kanit">
                            ไม่มีหมวดหมู่ย่อย
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Focused Editor Launcher Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedPillarForModal(p)}
                    className="w-full mt-3.5 py-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 font-kanit cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>จัดการหมวดหมู่ย่อย ({pCats.length})</span>
                    <ArrowRight className="w-3 h-3 shrink-0 ml-0.5 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              );
            })}

            {currentPillars.length === 0 && (
              <div className="col-span-1 md:col-span-2 text-center py-8 bg-white border border-dashed border-slate-200 rounded-3xl">
                <p className="text-slate-400 text-sm font-kanit">ยังไม่มีแกนเนื้อหาสำหรับช่องรายการนี้</p>
                <p className="text-slate-300 text-xs font-kanit mt-1">กรุณากรอกชื่อแกนเนื้อหาด้านบนเพื่อสร้าง</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Edit Pillar Modal */}
      {editingPillar && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditingPillar(null)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-6 overflow-hidden space-y-4 z-10 font-kanit"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">แก้ไขข้อมูลแกนเนื้อหา</h3>
                  <p className="text-xs text-slate-400">แก้ไขชื่อและคำอธิบายสำหรับแกนหลักนี้</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPillar(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">ชื่อแกนเนื้อหา (Pillar Name) *</label>
                <input
                  type="text"
                  value={editPillarLabel}
                  onChange={e => setEditPillarLabel(e.target.value)}
                  placeholder="เช่น รีวิวสินค้า, สปอนเซอร์"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-sm text-slate-800 rounded-xl focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-kanit"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">คำอธิบายแกนเนื้อหา (Description)</label>
                <textarea
                  rows={3}
                  value={editPillarDescription}
                  onChange={e => setEditPillarDescription(e.target.value)}
                  placeholder="ระบุคำอธิบาย หรือวัตถุประสงค์ของแกนเนื้อหานี้..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-kanit resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingPillar(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveEditPillar}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>บันทึกการแก้ไข</span>
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* Focus Category Manager Modal */}
      <PillarCategoryDetailModal
        isOpen={!!selectedPillarForModal}
        onClose={() => setSelectedPillarForModal(null)}
        pillar={selectedPillarForModal}
        channel={channel}
        tempOptions={tempOptions}
        setTempOptions={setTempOptions}
      />
    </div>
  );
};
