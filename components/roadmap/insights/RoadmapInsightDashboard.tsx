import React from 'react';
import { Filter, X, Sparkles } from 'lucide-react';
import { RoadmapInsightCard, InsightType } from './RoadmapInsightCard';
import { RoadmapAdviceBanner } from './RoadmapAdviceBanner';

interface RoadmapInsightDashboardProps {
  insights: {
    ongoing: number;
    highImpact: number;
    peakLoad: number;
    delayed: number;
  };
  activeInsightFilter: InsightType | null;
  onToggleInsightFilter: (type: InsightType) => void;
  onClearInsightFilter: () => void;
  onOpenDeepDive: (tab: InsightType) => void;
}

export const RoadmapInsightDashboard: React.FC<RoadmapInsightDashboardProps> = ({
  insights,
  activeInsightFilter,
  onToggleInsightFilter,
  onClearInsightFilter,
  onOpenDeepDive
}) => {
  return (
    <div className="bg-slate-50/50">
      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 px-10 pt-6 pb-4">
        {/* Card 1: Ongoing Projects */}
        <RoadmapInsightCard
          type="ongoing"
          label="โครงการกำลังทำ"
          sub="Active Pipeline"
          value={insights.ongoing}
          icon="⚡"
          colorScheme="indigo"
          isActiveFilter={activeInsightFilter === 'ongoing'}
          onToggleFilter={() => onToggleInsightFilter('ongoing')}
          onOpenDeepDive={() => onOpenDeepDive('ongoing')}
          badgeText="In Progress"
        />

        {/* Card 2: High Impact */}
        <RoadmapInsightCard
          type="high_impact"
          label="ผลกระทบสูง (≥4)"
          sub="Strategic Impact"
          value={insights.highImpact}
          icon="🔥"
          colorScheme="emerald"
          isActiveFilter={activeInsightFilter === 'high_impact'}
          onToggleFilter={() => onToggleInsightFilter('high_impact')}
          onOpenDeepDive={() => onOpenDeepDive('high_impact')}
          badgeText="High ROI"
        />

        {/* Card 3: Peak Capacity */}
        <RoadmapInsightCard
          type="peak"
          label="ภาระงานสูงสุด (ขนาน)"
          sub="Peak Capacity"
          value={insights.peakLoad}
          icon="📊"
          colorScheme="amber"
          isActiveFilter={activeInsightFilter === 'peak'}
          onToggleFilter={() => onToggleInsightFilter('peak')}
          onOpenDeepDive={() => onOpenDeepDive('peak')}
          badgeText={insights.peakLoad > 3 ? 'Bottleneck' : 'Optimal'}
          alert={insights.peakLoad > 3}
        />

        {/* Card 4: Delayed / At Risk */}
        <RoadmapInsightCard
          type="delayed"
          label="โครงการที่ล่าช้า"
          sub="At Risk Triage"
          value={insights.delayed}
          icon="⚠️"
          colorScheme="rose"
          isActiveFilter={activeInsightFilter === 'delayed'}
          onToggleFilter={() => onToggleInsightFilter('delayed')}
          onOpenDeepDive={() => onOpenDeepDive('delayed')}
          badgeText={insights.delayed > 0 ? 'Action Needed' : 'All Clear'}
          alert={insights.delayed > 0}
        />
      </div>

      {/* Active Filter Indicator Bar */}
      {activeInsightFilter && (
        <div className="px-10 pb-3">
          <div className="flex items-center justify-between px-4 py-2 bg-indigo-50/80 border border-indigo-200/70 rounded-xl text-xs font-bold text-indigo-700 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                กำลังกรองตารางด้วยโหมด:{' '}
                <span className="text-indigo-900 font-extrabold">
                  {activeInsightFilter === 'ongoing' && '⚡ เฉพาะโครงการที่กำลังดำเนินการ (Ongoing)'}
                  {activeInsightFilter === 'high_impact' && '🔥 เฉพาะแผนงานที่มีผลกระทบสูง (Impact ≥ 4)'}
                  {activeInsightFilter === 'peak' && '📊 เฉพาะโครงการที่อยู่ในสัปดาห์ภาระงานสูงสุด (Peak Load)'}
                  {activeInsightFilter === 'delayed' && '⚠️ เฉพาะโครงการที่ล่าช้า (Delayed / At Risk)'}
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={onClearInsightFilter}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1 bg-white rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
            >
              <X className="w-3.5 h-3.5" />
              <span>ล้างตัวกรอง</span>
            </button>
          </div>
        </div>
      )}

      {/* Intelligent Advice Banner */}
      <RoadmapAdviceBanner
        peakLoad={insights.peakLoad}
        delayedCount={insights.delayed}
        onOpenDeepDive={onOpenDeepDive}
      />
    </div>
  );
};
