import React from "react";
import { motion } from "framer-motion";
import { User } from "../../../../../types";
import { UserStat } from "../types";
import { EmployeeNameCell } from "./cells/EmployeeNameCell";
import { StatBadgeCell } from "./cells/StatBadgeCell";
import { GradeBadgeCell } from "./cells/GradeBadgeCell";

interface EmployeeRowProps {
  stat: UserStat;
  user: User;
  index: number;
  activeStatFilter?: string;
  sortDirection: "ASC" | "DESC";
  getGrade: (stat: UserStat) => { grade: string; color: string };
  onUserClick: (user: User, stat: UserStat) => void;
}

const EmployeeRowComponent: React.FC<EmployeeRowProps> = ({
  stat,
  user,
  index,
  activeStatFilter,
  sortDirection,
  getGrade,
  onUserClick,
}) => {
  const isHighlightedRank =
    activeStatFilter && activeStatFilter !== "ALL" && index < 3;
  const rank = index + 1;
  const isNegativeFilter =
    activeStatFilter === "LATE" ||
    activeStatFilter === "ABSENT" ||
    activeStatFilter === "LEAVE";
  const isSortDESC = sortDirection === "DESC";
  const shouldShowNegativeTheme = isNegativeFilter ? isSortDESC : !isSortDESC;

  let rowBgClass = "hover:bg-indigo-50/30 transition-all cursor-pointer group";
  let borderLeftClass = "border-l-4 border-transparent";

  if (isHighlightedRank) {
    if (shouldShowNegativeTheme) {
      if (rank === 1) {
        rowBgClass = "cursor-pointer group";
        borderLeftClass = "border-l-4 border-red-700";
      } else if (rank === 2) {
        rowBgClass = "cursor-pointer group";
        borderLeftClass = "border-l-4 border-red-500";
      } else if (rank === 3) {
        rowBgClass = "cursor-pointer group";
        borderLeftClass = "border-l-4 border-red-300";
      }
    } else {
      if (rank === 1) {
        rowBgClass = "cursor-pointer group";
        borderLeftClass = "border-l-4 border-amber-500";
      } else if (rank === 2) {
        rowBgClass = "cursor-pointer group";
        borderLeftClass = "border-l-4 border-slate-400";
      } else if (rank === 3) {
        rowBgClass = "cursor-pointer group";
        borderLeftClass = "border-l-4 border-orange-400";
      }
    }
  }

  const animateConfig = isHighlightedRank
    ? {
        opacity: 1,
        y: 0,
        backgroundColor: shouldShowNegativeTheme
          ? rank === 1
            ? "rgba(254, 226, 226, 0.60)"
            : rank === 2
            ? "rgba(254, 226, 226, 0.30)"
            : "rgba(254, 226, 226, 0.10)"
          : rank === 1
          ? "rgba(254, 243, 199, 0.45)"
          : rank === 2
          ? "rgba(248, 250, 252, 0.70)"
          : "rgba(255, 247, 237, 0.25)",
      }
    : {
        opacity: 1,
        y: 0,
        backgroundColor: "rgba(255, 255, 255, 0)",
      };

  const hoverConfig = isHighlightedRank
    ? {
        scale: 1.012,
        backgroundColor: shouldShowNegativeTheme
          ? rank === 1
            ? "rgba(254, 202, 202, 0.60)"
            : rank === 2
            ? "rgba(254, 202, 202, 0.45)"
            : "rgba(254, 202, 202, 0.30)"
          : rank === 1
          ? "rgba(254, 243, 199, 0.65)"
          : rank === 2
          ? "rgba(241, 245, 249, 0.80)"
          : "rgba(255, 237, 213, 0.35)",
        boxShadow: shouldShowNegativeTheme
          ? rank === 1
            ? "0 6px 20px -4px rgba(220, 38, 38, 0.15)"
            : rank === 2
            ? "0 4px 12px -3px rgba(220, 38, 38, 0.08)"
            : "0 2px 8px -2px rgba(220, 38, 38, 0.04)"
          : rank === 1
          ? "0 6px 20px -4px rgba(245, 158, 11, 0.15)"
          : rank === 2
          ? "0 4px 12px -3px rgba(148, 163, 184, 0.12)"
          : "0 2px 8px -2px rgba(249, 115, 22, 0.06)",
        transition: { duration: 0.15 },
      }
    : {
        scale: 1.01,
        backgroundColor: "rgba(249, 250, 251, 0.8)",
        transition: { duration: 0.15 },
      };

  return (
    <motion.tr
      className={`${rowBgClass} ${borderLeftClass}`}
      onClick={() => onUserClick(user, stat)}
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={animateConfig}
      whileHover={hoverConfig}
      transition={{
        layout: {
          type: "spring",
          stiffness: 220,
          damping: 26,
        },
        opacity: { duration: 0.35 },
        backgroundColor: { duration: 0.25 },
      }}
    >
      <EmployeeNameCell
        user={user}
        isHighlightedRank={isHighlightedRank}
        rank={rank}
        shouldShowNegativeTheme={shouldShowNegativeTheme}
      />
      <StatBadgeCell value={stat.present} variant="present" />
      <StatBadgeCell value={stat.late} variant="late" />
      <StatBadgeCell value={stat.absent} variant="absent" />
      <StatBadgeCell value={stat.leaves} variant="leave" />
      <StatBadgeCell value={stat.totalHours} variant="hours" />
      <GradeBadgeCell grade={getGrade(stat)} />
    </motion.tr>
  );
};

export const EmployeeRow = React.memo(
  EmployeeRowComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.index === nextProps.index &&
      prevProps.activeStatFilter === nextProps.activeStatFilter &&
      prevProps.sortDirection === nextProps.sortDirection &&
      prevProps.stat === nextProps.stat &&
      prevProps.user.id === nextProps.user.id &&
      prevProps.user.name === nextProps.user.name &&
      prevProps.user.avatarUrl === nextProps.user.avatarUrl &&
      prevProps.user.position === nextProps.user.position
    );
  }
);
