import React from "react";
import { motion } from "framer-motion";
import { startOfMonth, format } from "date-fns";
import { User } from "../../../../../../types";

interface EmployeeHpCellProps {
  user: User;
  currentMonth?: Date;
  hpViewMode?: "MONTHLY" | "YEARLY";
  snapshots?: any[];
}

export const EmployeeHpCell: React.FC<EmployeeHpCellProps> = ({
  user,
  currentMonth,
  hpViewMode = "MONTHLY",
  snapshots = [],
}) => {
  const isMonthlyMode = hpViewMode === "MONTHLY";
  const today = new Date();

  // Check if currentMonth is indeed the current calendar month
  const isCurrentMonth = currentMonth
    ? currentMonth.getFullYear() === today.getFullYear() &&
      currentMonth.getMonth() === today.getMonth()
    : true;

  const isFutureMonth = currentMonth
    ? startOfMonth(currentMonth) > startOfMonth(today)
    : false;

  const useCurrentHp = isCurrentMonth || isFutureMonth;

  const currentHp = user.hp !== undefined ? user.hp : 100;
  const maxHp = user.maxHp || 100;

  const baseSnapshotDateStr = currentMonth
    ? format(startOfMonth(currentMonth), "yyyy-MM-01")
    : format(startOfMonth(today), "yyyy-MM-01");

  const nextMonthDate = currentMonth
    ? new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    : new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const endingSnapshotDateStr = format(nextMonthDate, "yyyy-MM-01");

  // Retrieve snapshots from snapshots prop
  const userBaseSnapshot = snapshots?.find(
    (s) => s.user_id === user.id && s.snapshot_date === baseSnapshotDateStr
  );
  const userEndingSnapshot = snapshots?.find(
    (s) => s.user_id === user.id && s.snapshot_date === endingSnapshotDateStr
  );

  const baseHp = userBaseSnapshot ? userBaseSnapshot.hp_value : maxHp;
  const endingHp = userEndingSnapshot ? userEndingSnapshot.hp_value : currentHp;

  // Values depending on view mode
  let displayedHp = currentHp;

  if (isMonthlyMode) {
    if (useCurrentHp) {
      // Monthly HP = maxHp - (HP lost during this month)
      const lostHp = Math.max(0, baseHp - currentHp);
      displayedHp = Math.max(0, maxHp - lostHp);
    } else {
      // Monthly HP for past month = maxHp - (HP lost during that past month)
      const lostHp = Math.max(0, baseHp - endingHp);
      displayedHp = Math.max(0, maxHp - lostHp);
    }
  } else {
    // Annual/Yearly View: accumulated overall HP at that point
    if (useCurrentHp) {
      displayedHp = currentHp;
    } else {
      displayedHp = endingHp;
    }
  }

  const hpPercent = (displayedHp / maxHp) * 100;

  let hpBadgeClass = "bg-emerald-50/50 hover:bg-emerald-100/50 text-emerald-700 border-emerald-100/50";
  if (hpPercent <= 30) {
    hpBadgeClass = "bg-rose-50/60 hover:bg-rose-100/60 text-rose-600 border-rose-100/60 animate-pulse font-bold";
  } else if (hpPercent <= 70) {
    hpBadgeClass = "bg-amber-50/50 hover:bg-amber-100/50 text-amber-700 border-amber-100/50";
  }

  return (
    <td className="px-4 py-4 text-center">
      <div className="flex items-center justify-center h-8">
        <span className={`inline-block px-3 py-1.5 border rounded-lg text-xs font-bold font-mono transition-all duration-300 min-w-[42px] ${hpBadgeClass}`}>
          {displayedHp}
        </span>
      </div>
    </td>
  );
};
