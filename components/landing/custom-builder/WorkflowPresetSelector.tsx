import React from 'react';
import { motion } from 'framer-motion';
import { Layers, CheckCircle2 } from 'lucide-react';
import { CustomRecipePreset } from '../../../services/landingConfigService';
import { PRESET_STYLE_META, SPRING_TAB_TRANSITION } from './types';

interface WorkflowPresetSelectorProps {
  presets: CustomRecipePreset[];
  activePresetId: string;
  totalModuleCount: number;
  onSelectPreset: (presetId: string, moduleKeys: string[]) => void;
  onSelectAllModules: () => void;
}

export const WorkflowPresetSelector: React.FC<WorkflowPresetSelectorProps> = ({
  presets,
  activePresetId,
  totalModuleCount,
  onSelectPreset,
  onSelectAllModules,
}) => {
  const isAllSelected = activePresetId === 'all-modules';

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-slate-200/85 shadow-lg shadow-indigo-500/5 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              ขั้นตอนที่ 1: เลือกชุดโครงสร้างระบบตั้งต้น (Workflow Presets)
            </h2>
            <p className="text-xs text-slate-500">
              เลือกเทมเพลตตามรูปแบบการทำงานของทีม แล้วปรับเพิ่ม-ลดโมดูลรายตัวในขั้นตอนถัดไปได้ทันที
            </p>
          </div>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSelectAllModules}
          className={`relative px-4 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer w-fit shrink-0 ${
            isAllSelected
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
              : 'bg-indigo-50/90 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>เปิดใช้งานครบทุกโมดูล ({totalModuleCount} เมนู)</span>
        </motion.button>
      </div>

      {/* 5 Preset Tabs Grid with Framer Motion layoutId */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {presets.map((preset) => {
          const isSelected = activePresetId === preset.id;
          const styleMeta = PRESET_STYLE_META[preset.id] || {
            title: preset.name,
            tagLabel: preset.badge,
            activeTextClass: 'text-white',
            pillClass: 'bg-indigo-50 text-indigo-700',
          };

          return (
            <motion.button
              key={preset.id}
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => onSelectPreset(preset.id, preset.moduleKeys)}
              className={`relative z-10 text-left p-4 rounded-2xl border transition-colors flex flex-col justify-between cursor-pointer overflow-hidden ${
                isSelected
                  ? 'border-indigo-600 text-white shadow-md shadow-indigo-500/15'
                  : 'bg-white/95 hover:bg-slate-50/90 text-slate-800 border-slate-200/90 hover:border-indigo-300'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="custom-builder-preset-tab"
                  transition={SPRING_TAB_TRANSITION}
                  className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-700 -z-10"
                />
              )}

              <div>
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors ${
                      isSelected ? 'bg-white/20 text-white' : styleMeta.pillClass
                    }`}
                  >
                    {styleMeta.tagLabel}
                  </span>
                  <span
                    className={`text-[11px] font-bold font-google-sans tabular-nums ${
                      isSelected ? 'text-indigo-100' : 'text-slate-400'
                    }`}
                  >
                    {preset.moduleKeys.length} โมดูล
                  </span>
                </div>

                <div
                  className={`text-xs sm:text-sm font-bold leading-snug mb-1 ${
                    isSelected ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {styleMeta.title}
                </div>

                <p
                  className={`text-[11px] leading-relaxed ${
                    isSelected ? 'text-indigo-100' : 'text-slate-500'
                  }`}
                >
                  {preset.subtitle}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
