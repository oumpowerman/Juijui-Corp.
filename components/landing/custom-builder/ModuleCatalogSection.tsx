import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sliders, Layers } from 'lucide-react';
import {
  CustomModuleItemConfig,
  ModuleGroupId,
} from '../../../services/landingConfigService';
import {
  BillingCycleType,
  CategoryFilterType,
  GROUP_META,
  SPRING_TAB_TRANSITION,
  TAB_CONTENT_VARIANTS,
} from './types';
import { ModuleItemCard } from './ModuleItemCard';

interface ModuleCatalogSectionProps {
  modules: CustomModuleItemConfig[];
  selectedKeys: string[];
  addonCount: number;
  activeGroupFilter: CategoryFilterType;
  billingCycle: BillingCycleType;
  yearlyPayableMonths: number;
  iconMap: Record<string, React.ElementType>;
  onChangeGroupFilter: (filter: CategoryFilterType) => void;
  onToggleModule: (mod: CustomModuleItemConfig) => void;
  onToggleEntireGroup: (groupId: ModuleGroupId) => void;
}

const CATEGORY_TABS: { id: CategoryFilterType; label: string }[] = [
  { id: 'ALL', label: 'ทุกหมวด (26)' },
  { id: 'WORKSPACE', label: 'Workspace (8)' },
  { id: 'PRODUCTION', label: 'Production (5)' },
  { id: 'OFFICE', label: 'Office & HR (9)' },
  { id: 'ADMIN', label: 'Admin & QC (4)' },
];

export const ModuleCatalogSection: React.FC<ModuleCatalogSectionProps> = ({
  modules,
  selectedKeys,
  addonCount,
  activeGroupFilter,
  billingCycle,
  yearlyPayableMonths,
  iconMap,
  onChangeGroupFilter,
  onToggleModule,
  onToggleEntireGroup,
}) => {
  const visibleGroups: ModuleGroupId[] =
    activeGroupFilter === 'ALL'
      ? ['WORKSPACE', 'PRODUCTION', 'OFFICE', 'ADMIN']
      : [activeGroupFilter];

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-slate-200/85 shadow-lg shadow-indigo-500/5">
      {/* Header + Category Filter Tabs with Framer Motion layoutId */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              ขั้นตอนที่ 3: เลือกโมดูลฟีเจอร์ตามหมวดหมู่ Sidebar ({selectedKeys.length}/
              {modules.length} เมนู)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ประกอบด้วยโมดูลแกนกลาง (Base Core) 4 เมนู และโมดูลเสริมที่เลือกไว้{' '}
              <strong className="text-indigo-700 font-google-sans tabular-nums">
                {addonCount}
              </strong>{' '}
              เมนู
            </p>
          </div>
        </div>

        {/* Category Tabs Bar */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70 w-fit">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeGroupFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeGroupFilter(tab.id)}
                className={`relative z-10 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  isActive ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="custom-builder-category-tab"
                    transition={SPRING_TAB_TRANSITION}
                    className="absolute inset-0 rounded-xl bg-slate-900 shadow-xs -z-10"
                  />
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Animated Tab Content Area */}
      <div className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeGroupFilter}
            variants={TAB_CONTENT_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-8"
          >
            {visibleGroups.map((groupId) => {
              const meta = GROUP_META[groupId];
              const GroupIcon = meta.groupIcon;
              const groupModules = modules.filter((m) => m.group === groupId);
              const optionalGroupMods = groupModules.filter((m) => !m.isCore);
              const allOptionalSelected =
                optionalGroupMods.length > 0 &&
                optionalGroupMods.every((m) => selectedKeys.includes(m.key));

              return (
                <div key={groupId} className="space-y-3.5">
                  {/* Group Header Bar */}
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 rounded-2xl border ${meta.headerBgClass}`}
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.iconBgClass}`}
                      >
                        <GroupIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider opacity-75">
                          {meta.code}
                        </span>
                        <h3 className="text-xs sm:text-sm font-bold">{meta.title}</h3>
                        <p className="text-[11px] opacity-80">{meta.subtitle}</p>
                      </div>
                    </div>

                    {optionalGroupMods.length > 0 && (
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onToggleEntireGroup(groupId)}
                        className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200/90 shadow-2xs cursor-pointer self-start sm:self-auto shrink-0"
                      >
                        {allOptionalSelected ? 'ยกเลิกทั้งหมวดนี้' : '+ เลือกครบทั้งหมวดนี้'}
                      </motion.button>
                    )}
                  </div>

                  {/* Module Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {groupModules.map((mod) => {
                      const isSelected = selectedKeys.includes(mod.key);
                      const IconComp = iconMap[mod.key] || Layers;

                      return (
                        <ModuleItemCard
                          key={mod.key}
                          mod={mod}
                          isSelected={isSelected}
                          iconComponent={IconComp}
                          groupMeta={meta}
                          billingCycle={billingCycle}
                          yearlyPayableMonths={yearlyPayableMonths}
                          onToggle={onToggleModule}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
