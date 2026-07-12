import React from "react";
import { Sparkles, ArrowUp, ArrowDown } from "lucide-react";
import { GroupMode } from "../types";

interface TableHeaderProps {
  groupMode: GroupMode;
  setGroupMode: (mode: GroupMode) => void;
  sortDirection: "ASC" | "DESC";
  onSortDirectionChange: (dir: "ASC" | "DESC") => void;
  activeStatFilter?: string;
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  groupMode,
  setGroupMode,
  sortDirection,
  onSortDirectionChange,
  activeStatFilter,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-gray-50/50 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
          <Sparkles className="w-5 h-5 text-indigo-500 fill-indigo-100" />
        </span>
        <div>
          <h3 className="font-bold text-gray-800 text-sm">
            ตารางสรุปสถิติเข้างาน
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {activeStatFilter === "ALL" || !activeStatFilter
              ? "แสดงข้อมูลการเข้างานและประเภทการลาทั้งหมด"
              : `เรียงลำดับตามสถิติ: ${
                  activeStatFilter === "LATE"
                    ? "มาสายสูงสุด"
                    : activeStatFilter === "ABSENT"
                    ? "ขาดงานสูงสุด"
                    : activeStatFilter === "LEAVE"
                    ? "ลางานสูงสุด"
                    : "วันเข้างานสูงสุด"
                }`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 self-start md:self-auto">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            จัดรูปแบบตาราง:
          </span>
          <div className="inline-flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setGroupMode("POSITION")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                groupMode === "POSITION"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              💼 ตามตำแหน่ง
            </button>
            <button
              onClick={() => setGroupMode("EMPLOYMENT_TYPE")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                groupMode === "EMPLOYMENT_TYPE"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              📋 ตามประเภทจ้างงาน
            </button>
            <button
              onClick={() => setGroupMode("NONE")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                groupMode === "NONE"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              ⚡ ไม่จัดกลุ่ม (แสดงทั้งหมด)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            เรียงลำดับ:
          </span>
          <button
            onClick={() =>
              onSortDirectionChange(sortDirection === "ASC" ? "DESC" : "ASC")
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
              sortDirection === "DESC"
                ? "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100/70 shadow-2xs"
                : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/70 shadow-2xs"
            }`}
          >
            {sortDirection === "DESC" ? (
              <>
                <ArrowDown className="w-3.5 h-3.5 text-indigo-500" />
                <span>มาก ➔ น้อย (DESC)</span>
              </>
            ) : (
              <>
                <ArrowUp className="w-3.5 h-3.5 text-amber-600" />
                <span>น้อย ➔ มาก (ASC)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
