import React from "react";
import { Award, Sparkles } from "lucide-react";
import { User } from "../../../../../../types";

interface EmployeeNameCellProps {
  user: User;
  isHighlightedRank: boolean;
  rank: number;
  shouldShowNegativeTheme: boolean;
}

export const EmployeeNameCell: React.FC<EmployeeNameCellProps> = ({
  user,
  isHighlightedRank,
  rank,
  shouldShowNegativeTheme,
}) => {
  let avatarBorderClass = "border border-gray-100";
  let nameTextClass = "text-gray-800";
  let badgeElement: React.ReactNode = null;
  let nameBadgeElement: React.ReactNode = null;

  if (isHighlightedRank) {
    if (shouldShowNegativeTheme) {
      if (rank === 1) {
        avatarBorderClass =
          "border-2 border-red-500 ring-2 ring-red-400/30 shadow-md";
        nameTextClass = "text-red-950 font-black";
        badgeElement = (
          <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-700 to-red-800 text-white shadow-md border border-white text-[10px] font-black">
            1
          </span>
        );
        nameBadgeElement = (
          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 bg-gradient-to-r from-red-700 to-red-800 text-white rounded-full uppercase tracking-wider shadow-sm animate-pulse whitespace-nowrap shrink-0">
            🚨 Rank 1
          </span>
        );
      } else if (rank === 2) {
        avatarBorderClass =
          "border-2 border-red-400 ring-2 ring-red-300/20 shadow-xs";
        nameTextClass = "text-red-900 font-bold";
        badgeElement = (
          <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md border border-white text-[10px] font-bold">
            2
          </span>
        );
        nameBadgeElement = (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap shrink-0">
            Rank 2
          </span>
        );
      } else if (rank === 3) {
        avatarBorderClass = "border border-red-200 shadow-2xs";
        nameTextClass = "text-red-800 font-medium";
        badgeElement = (
          <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-400 to-red-500 text-white shadow-md border border-white text-[10px] font-bold">
            3
          </span>
        );
        nameBadgeElement = (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap shrink-0">
            Rank 3
          </span>
        );
      }
    } else {
      if (rank === 1) {
        avatarBorderClass =
          "border-2 border-amber-400 ring-2 ring-amber-300/30 shadow-md";
        nameTextClass = "text-amber-950 font-black";
        badgeElement = (
          <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md border border-white">
            <Award className="w-3 h-3 text-amber-100 fill-amber-100" />
          </span>
        );
        nameBadgeElement = (
          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap shrink-0">
            <Sparkles className="w-2.5 h-2.5 text-amber-100 fill-amber-100" />
            Top 1
          </span>
        );
      } else if (rank === 2) {
        avatarBorderClass =
          "border-2 border-slate-400 ring-2 ring-slate-200/20 shadow-xs";
        nameTextClass = "text-slate-900 font-bold";
        badgeElement = (
          <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-md border border-white text-[10px] font-bold">
            2
          </span>
        );
        nameBadgeElement = (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-gradient-to-r from-slate-400 to-slate-500 text-white rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap shrink-0">
            🥈 Top 2
          </span>
        );
      } else if (rank === 3) {
        avatarBorderClass = "border border-orange-200 shadow-2xs";
        nameTextClass = "text-orange-950 font-medium";
        badgeElement = (
          <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-md border border-white text-[10px] font-bold">
            3
          </span>
        );
        nameBadgeElement = (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap shrink-0">
            🥉 Top 3
          </span>
        );
      }
    }
  }

  return (
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <img
            src={user.avatarUrl}
            referrerPolicy="no-referrer"
            className={`w-10 h-10 rounded-full bg-gray-200 object-cover shrink-0 ${avatarBorderClass}`}
          />
          {badgeElement}
        </div>
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className={`text-sm font-bold ${nameTextClass}`}>{user.name}</p>
            {nameBadgeElement}
          </div>
          <p className="text-xs text-gray-500">{user.position}</p>
        </div>
      </div>
    </td>
  );
};
