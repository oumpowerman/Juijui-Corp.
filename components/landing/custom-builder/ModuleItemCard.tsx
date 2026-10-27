import React from 'react';
import { motion } from 'framer-motion';
import { Check, Lock } from 'lucide-react';
import { CustomModuleItemConfig } from '../../../services/landingConfigService';
import { BillingCycleType, GroupMetaConfig } from './types';

interface ModuleItemCardProps {
  mod: CustomModuleItemConfig;
  isSelected: boolean;
  iconComponent: React.ElementType;
  groupMeta: GroupMetaConfig;
  billingCycle: BillingCycleType;
  yearlyPayableMonths: number;
  onToggle: (mod: CustomModuleItemConfig) => void;
}

export const ModuleItemCard: React.FC<ModuleItemCardProps> = ({
  mod,
  isSelected,
  iconComponent: IconComp,
  groupMeta,
  billingCycle,
  yearlyPayableMonths,
  onToggle,
}) => {
  const displayModPrice =
    billingCycle === 'YEARLY' ? mod.monthlyPrice * yearlyPayableMonths : mod.monthlyPrice;

  return (
    <motion.div
      whileHover={mod.isCore ? undefined : { y: -2 }}
      whileTap={mod.isCore ? undefined : { scale: 0.99 }}
      onClick={() => onToggle(mod)}
      className={`p-4 rounded-2xl border transition-colors flex items-start gap-3.5 relative ${
        mod.isCore
          ? 'bg-slate-50/95 border-slate-200/90 cursor-default'
          : isSelected
          ? `${groupMeta.activeCardClass} cursor-pointer`
          : 'bg-white hover:bg-slate-50/80 border-slate-200/85 hover:border-indigo-300 cursor-pointer'
      }`}
    >
      {/* Module Icon */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
          mod.isCore
            ? 'bg-slate-700 text-white'
            : isSelected
            ? groupMeta.iconBgClass
            : 'bg-slate-100 text-slate-600'
        }`}
      >
        <IconComp className="w-5 h-5" />
      </div>

      {/* Module Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-1.5 mb-1">
          <span className="text-xs sm:text-sm font-bold text-slate-900">{mod.label}</span>
          {mod.highlightTag && (
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                mod.isCore
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              {mod.highlightTag}
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500 leading-relaxed mb-3">{mod.description}</p>

        <div className="flex items-center justify-between">
          {mod.isCore ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
              <Lock className="w-3 h-3" />
              <span>รวมใน Base Core พื้นฐาน</span>
            </span>
          ) : (
            <span className="text-xs font-bold font-google-sans tabular-nums text-indigo-700">
              +฿{displayModPrice.toLocaleString()}
              <span className="text-[11px] font-semibold text-slate-400">
                /{billingCycle === 'YEARLY' ? 'ปี' : 'เดือน'}
              </span>
            </span>
          )}

          {/* Selection Check Badge */}
          <motion.div
            initial={false}
            animate={{
              scale: isSelected || mod.isCore ? 1 : 0.92,
            }}
            transition={{ type: 'spring' as const, stiffness: 420, damping: 28 }}
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
              mod.isCore
                ? 'bg-emerald-600 text-white'
                : isSelected
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-transparent border border-slate-300'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
