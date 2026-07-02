import React from "react";

interface StatBadgeCellProps {
  value: number;
  variant: "present" | "late" | "absent" | "leave" | "hours";
}

export const StatBadgeCell: React.FC<StatBadgeCellProps> = ({
  value,
  variant,
}) => {
  let cellClass = "";

  if (variant === "present") {
    cellClass =
      "inline-block px-3 py-1 bg-gray-100 rounded-lg text-sm font-bold text-gray-700";
  } else if (variant === "late") {
    cellClass = `inline-block px-3 py-1 rounded-lg text-sm font-bold ${
      value > 0 ? "bg-red-50 text-red-600" : "text-gray-400"
    }`;
  } else if (variant === "absent") {
    cellClass = `inline-block px-3 py-1 rounded-lg text-sm font-bold ${
      value > 0 ? "bg-red-100 text-red-700" : "text-gray-400"
    }`;
  } else if (variant === "leave") {
    cellClass = `inline-block px-3 py-1 rounded-lg text-sm font-bold ${
      value > 0 ? "bg-pink-50 text-pink-600" : "text-gray-400"
    }`;
  }

  return (
    <td className="px-6 py-4 text-center">
      {variant === "hours" ? (
        <span className="text-sm font-mono text-gray-600">
          {value.toFixed(1)} h
        </span>
      ) : (
        <span className={cellClass}>{value}</span>
      )}
    </td>
  );
};
