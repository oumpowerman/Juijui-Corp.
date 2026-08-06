import React, { useState, useEffect, useRef } from 'react';
import { LayoutTemplate, X, ChevronDown, Sparkles, Layers, Tag, Pencil, ArrowRight, Plus } from 'lucide-react';
import { Channel } from '../../types';
import { useMasterData } from '../../hooks/useMasterData';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../context/ToastContext';
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
  const { masterOptions, addMasterOption, deleteMasterOption, fetchMasterOptions } = useMasterData();
  const { showToast } = useToast();

  // Input states
  const [newPillarLabel, setNewPillarLabel] = useState('');
  const [selectedPillarForModal, setSelectedPillarForModal] = useState<any | null>(null);

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

  const handleAddPillarWithValue = async (value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return;

    const cleanKey = trimmedValue.toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    const key = `PIL_${cleanKey || 'GEN'}_${Date.now().toString().slice(-4)}`;

    const hasDuplicate =
      currentPillars.some((p: any) => p.label.toLowerCase() === trimmedValue.toLowerCase()) ||
      tempOptions.some(o => o.type === 'PILLAR' && o.label.toLowerCase() === trimmedValue.toLowerCase());

    if (hasDuplicate) {
      showToast(`มีแกนเนื้อหา "${trimmedValue}" อยู่แล้วในรายการประจำช่อง`, 'warning');
      setNewPillarLabel('');
      setIsPillarDropdownOpen(false);
      return;
    }

    if (channel) {
      // Direct save to DB in edit mode
      await addMasterOption({
        type: 'PILLAR',
        key,
        label: trimmedValue,
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
          label: trimmedValue
        }
      ]);
    }

    setNewPillarLabel('');
    setIsPillarDropdownOpen(false);
    showToast(`เพิ่มแกนเนื้อหา "${trimmedValue}" สำเร็จ!`, 'success');
  };

  const handleAddPillarClick = () => {
    handleAddPillarWithValue(newPillarLabel);
  };

  const handleRemovePillarClick = async (pillarId: string, pillarKey: string, isTemp: boolean) => {
    if (isTemp) {
      // Cascading deletion for temp options
      setTempOptions(prev => prev.filter(o => o.id !== pillarId && o.parentKey !== pillarKey));
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
      }
    }
    showToast('ลบแกนเนื้อหาและหมวดหมู่ย่อยทั้งหมดเรียบร้อย', 'info');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-bold text-gray-700 flex items-center">
          <LayoutTemplate className="w-4 h-4 mr-2 text-indigo-500" />
          4. ตั้งค่าแกนเนื้อหาและหมวดหมู่เฉพาะช่อง (Channel-Specific Pillars & Categories)
        </label>
        <p className="text-xs text-slate-400">กำหนดแกนหลัก (Pillar) และประเภทคลิป (Category) ที่จะใช้สำหรับช่องรายการนี้</p>
      </div>

      <div className="space-y-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
        
        {/* Pillar Section - Channel-Level Pillar Addition */}
        <div className="space-y-4 max-w-xl" ref={pillarInputContainerRef}>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between h-5">
            <span>เพิ่มแกนเนื้อหาประจำช่อง (Add Pillars)</span>
            <span className="text-[10px] text-slate-400 font-normal normal-case flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500 animate-[pulse_2s_infinite]" /> มีรูปแบบแนะนำและดรอปดาวน์
            </span>
          </label>
          
          <div className="relative">
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
                onClick={handleAddPillarClick}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shrink-0 shadow-sm font-kanit"
              >
                เพิ่มแกนหลัก
              </button>
            </div>

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
                  <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md font-bold">
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
                  <div>
                    {/* Pillar Card Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 text-sm font-kanit block leading-tight">{p.label}</span>
                          <span className="text-[10px] font-semibold text-indigo-600 font-kanit">
                            {pCats.length} หมวดหมู่ย่อย
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePillarClick(p.id, p.key, isPillarTemp)}
                        className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-xl transition-all"
                        title="ลบแกนและหมวดหมู่ย่อยทั้งหมด"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Sub-Categories Preview Section (Phase A) */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                        {pCats.slice(0, 4).map((cat: any) => (
                          <div
                            key={cat.id || cat.key}
                            className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50/60 border border-emerald-100/50 text-emerald-700 text-[11px] font-semibold rounded-md shadow-3xs"
                          >
                            <Tag className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                            <span className="font-kanit">{cat.label}</span>
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

                  {/* Focused Editor Launcher Button (Phase B & C) */}
                  <button
                    type="button"
                    onClick={() => setSelectedPillarForModal(p)}
                    className="w-full mt-4 py-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 font-kanit cursor-pointer"
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
