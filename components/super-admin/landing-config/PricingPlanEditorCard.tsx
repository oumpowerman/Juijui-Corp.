import React from 'react';
import { PlatformPricingPlan } from '../../../services/landingConfigService';
import { Plus, Trash2, CheckCircle2, Crown, Sparkles, Building2, Zap } from 'lucide-react';

interface PricingPlanEditorCardProps {
  plan: PlatformPricingPlan;
  onChange: (updated: PlatformPricingPlan) => void;
}

export const PricingPlanEditorCard: React.FC<PricingPlanEditorCardProps> = ({ plan, onChange }) => {
  const getTierIcon = () => {
    switch (plan.tier) {
      case 'STARTER':
        return <Zap className="w-5 h-5 text-sky-600" />;
      case 'PRO':
        return <Sparkles className="w-5 h-5 text-indigo-600" />;
      case 'ENTERPRISE':
        return <Building2 className="w-5 h-5 text-purple-600" />;
      case 'LIFETIME':
        return <Crown className="w-5 h-5 text-amber-500" />;
    }
  };

  const getTierBadgeColor = () => {
    switch (plan.tier) {
      case 'STARTER':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'PRO':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'ENTERPRISE':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'LIFETIME':
        return 'bg-amber-50 text-amber-800 border-amber-200';
    }
  };

  const handleFeatureChange = (index: number, val: string) => {
    const updatedFeatures = [...plan.features];
    updatedFeatures[index] = val;
    onChange({ ...plan, features: updatedFeatures });
  };

  const handleAddFeature = () => {
    onChange({ ...plan, features: [...plan.features, ''] });
  };

  const handleRemoveFeature = (index: number) => {
    onChange({ ...plan, features: plan.features.filter((_, i) => i !== index) });
  };

  return (
    <div className={`p-5 rounded-2xl bg-white border transition-all flex flex-col justify-between ${
      plan.recommended
        ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
        : 'border-slate-200 hover:border-slate-300 shadow-sm'
    }`}>
      <div>
        {/* Header with Tier & Recommend Toggle */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              {getTierIcon()}
            </div>
            <div>
              <span className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${getTierBadgeColor()}`}>
                {plan.tier}
              </span>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
            <input
              type="checkbox"
              checked={plan.recommended || false}
              onChange={(e) => onChange({ ...plan, recommended: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
            />
            <span>แนะนำ (Badge เด่น)</span>
          </label>
        </div>

        {/* Plan Name & Audience */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อแพ็กเกจ (Display Name)</label>
            <input
              type="text"
              value={plan.name}
              onChange={(e) => onChange({ ...plan, name: e.target.value })}
              className="w-full px-3 py-2 text-sm font-bold text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="e.g. Pro Studio Plan"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">กลุ่มเป้าหมาย (Audience Caption)</label>
            <input
              type="text"
              value={plan.audience}
              onChange={(e) => onChange({ ...plan, audience: e.target.value })}
              className="w-full px-3 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="e.g. ยอดนิยมสำหรับสตูดิโอและบริษัทผลิตคอนเทนต์"
            />
          </div>
        </div>

        {/* Pricing Inputs */}
        <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-slate-50/70 rounded-xl border border-slate-100">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">ราคาต่อเดือน (บาท)</label>
            <input
              type="number"
              min={0}
              value={plan.monthlyPrice}
              onChange={(e) => onChange({ ...plan, monthlyPrice: Number(e.target.value) || 0 })}
              className="w-full px-2.5 py-1.5 text-sm font-bold font-mono tabular-nums text-slate-900 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">ราคาต่อปี (บาท)</label>
            <input
              type="number"
              min={0}
              value={plan.yearlyPrice}
              onChange={(e) => onChange({ ...plan, yearlyPrice: Number(e.target.value) || 0 })}
              className="w-full px-2.5 py-1.5 text-sm font-bold font-mono tabular-nums text-slate-900 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Members & Badge */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">จำกัดสมาชิก (คน)</label>
            <input
              type="number"
              min={1}
              value={plan.maxMembers}
              onChange={(e) => onChange({ ...plan, maxMembers: Number(e.target.value) || 1 })}
              className="w-full px-3 py-1.5 text-xs font-semibold font-mono tabular-nums text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">ป้ายโปรโมชั่น (Badge)</label>
            <input
              type="text"
              value={plan.badge || ''}
              onChange={(e) => onChange({ ...plan, badge: e.target.value })}
              placeholder="e.g. ทดลองใช้ฟรี 7 วัน"
              className="w-full px-3 py-1.5 text-xs font-medium text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Features Bullet List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700">จุดเด่น / รายการฟีเจอร์ ({plan.features.length})</label>
            <button
              type="button"
              onClick={handleAddFeature}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มหัวข้อ</span>
            </button>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {plan.features.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <input
                  type="text"
                  value={feat}
                  onChange={(e) => handleFeatureChange(idx, e.target.value)}
                  className="flex-1 px-2.5 py-1 text-xs text-slate-700 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="รายละเอียดฟีเจอร์..."
                />
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(idx)}
                  className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                  title="ลบฟีเจอร์นี้"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
