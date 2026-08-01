import React, { useState, useEffect, useRef } from 'react';
import { LayoutTemplate, X, Check, Plus, ChevronDown, Sparkles, Layers, Tag } from 'lucide-react';
import { Channel } from '../../types';
import { useMasterData } from '../../hooks/useMasterData';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Input states
  const [newPillarLabel, setNewPillarLabel] = useState('');
  const [newCategoryLabels, setNewCategoryLabels] = useState<Record<string, string>>({});

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

  const allSuggestedPillars = Array.from(
    new Set([...systemPillars, ...DEFAULT_POPULAR_PILLARS])
  );

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

    const key = `PIL_${trimmedValue.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;

    const hasDuplicate =
      currentPillars.some((p: any) => p.label.toLowerCase() === trimmedValue.toLowerCase()) ||
      tempOptions.some(o => o.type === 'PILLAR' && o.label.toLowerCase() === trimmedValue.toLowerCase());

    if (hasDuplicate) {
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
  };

  const handleAddPillarClick = () => {
    handleAddPillarWithValue(newPillarLabel);
  };

  const handleAddCategoryClick = async (pillarKey: string) => {
    const trimmed = (newCategoryLabels[pillarKey] || '').trim();
    if (!trimmed) return;

    const key = `CAT_${trimmed.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;

    const pillarCategories = currentCategories.filter(o => o.parentKey === pillarKey);
    const hasDuplicate =
      pillarCategories.some((cat: any) => cat.label.toLowerCase() === trimmed.toLowerCase()) ||
      tempOptions.some(o => o.type === 'CATEGORY' && o.parentKey === pillarKey && o.label.toLowerCase() === trimmed.toLowerCase());

    if (hasDuplicate) {
      setNewCategoryLabels(prev => ({ ...prev, [pillarKey]: '' }));
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
        parentKey: pillarKey // Now maps to the parent Pillar's key
      });
    } else {
      setTempOptions(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: 'CATEGORY',
          key,
          label: trimmed,
          parentKey: pillarKey // Now maps to the parent Pillar's key
        }
      ]);
    }
    setNewCategoryLabels(prev => ({ ...prev, [pillarKey]: '' }));
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
  };

  const handleRemoveCategoryClick = async (catId: string, isTemp: boolean) => {
    if (isTemp) {
      setTempOptions(prev => prev.filter(o => o.id !== catId));
    } else {
      await deleteMasterOption(catId);
    }
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
                  className="w-full pr-10 px-3.5 py-2 bg-white border border-slate-200 text-sm rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-300"
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
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shrink-0 shadow-sm"
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
                          <span>{pillarVal}</span>
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
                  className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all relative flex flex-col justify-between"
                >
                  {/* Pillar Card Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                        <Layers className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-slate-800 text-sm font-kanit">{p.label}</span>
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

                  {/* Sub-Categories Section */}
                  <div className="space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Sub-Category Tags */}
                      <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                        {pCats.map((cat: any) => {
                          const isCatTemp = !cat.id || tempOptions.some(to => to.id === cat.id);
                          return (
                            <div
                              key={cat.id || cat.key}
                              className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg shadow-2xs"
                            >
                              <Tag className="w-3 h-3 text-emerald-500 shrink-0" />
                              <span>{cat.label}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveCategoryClick(cat.id, isCatTemp)}
                                className="text-emerald-400 hover:text-rose-500 transition-colors ml-1 p-0.5 rounded-full hover:bg-rose-50"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          );
                        })}
                        {pCats.length === 0 && (
                          <p className="text-slate-400 text-xs italic font-kanit self-center py-1">
                            ยังไม่มีหมวดหมู่ย่อย (ระบุด้านล่างเพื่อเพิ่ม)
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Add Sub-Category Input */}
                    <div className="flex gap-2 pt-2 border-t border-slate-50 mt-2">
                      <input
                        type="text"
                        value={newCategoryLabels[p.key] || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setNewCategoryLabels(prev => ({ ...prev, [p.key]: val }));
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCategoryClick(p.key);
                          }
                        }}
                        placeholder="พิมพ์เพิ่มหมวดหมู่ย่อย... (เช่น shorts)"
                        className="flex-1 px-3 py-1.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 text-xs rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCategoryClick(p.key)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl transition-all active:scale-95 shrink-0 shadow-sm"
                      >
                        เพิ่มย่อย
                      </button>
                    </div>
                  </div>
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
    </div>
  );
};
