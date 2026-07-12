import React from "react";

interface GradeBadgeCellProps {
  grade: { grade: string; color: string };
}

export const GradeBadgeCell: React.FC<GradeBadgeCellProps> = ({ grade }) => {
  return (
    <td className="px-6 py-4 text-center">
      <span
        className={`inline-block w-10 py-1 rounded-lg text-xs font-bold ${grade.color}`}
      >
        {grade.grade}
      </span>
    </td>
  );
};
