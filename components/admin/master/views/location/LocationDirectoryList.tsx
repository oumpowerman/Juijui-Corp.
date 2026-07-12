import React from 'react';
import { MasterOption } from '../../../../../types';
import { 
  MapPin, Trash2, Edit2, AlertTriangle, 
  Search, SlidersHorizontal, Map, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseLocationKey } from './locationUtils';
import { useGlobalDialog } from '../../../../../context/GlobalDialogContext';

interface LocationDirectoryListProps {
  isOffice: boolean;
  locations: MasterOption[];
  filteredLocations: MasterOption[];
  duplicateAndOverlapsInfo: {
    duplicateNamesIds: Set<string>;
    overlappingIds: Set<string>;
    allWarningsIds: Set<string>;
  };
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  radiusFilter: 'ALL' | 'NARROW' | 'MEDIUM' | 'WIDE';
  setRadiusFilter: (f: 'ALL' | 'NARROW' | 'MEDIUM' | 'WIDE') => void;
  alertFilter: 'ALL' | 'ONLY_OVERLAPS';
  setAlertFilter: (f: 'ALL' | 'ONLY_OVERLAPS') => void;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (b: boolean) => void;
  editingId: string | null;
  handleFocusOnMap: (loc: MasterOption) => void;
  handleEdit: (loc: MasterOption) => void;
  onDelete: (id: string) => void;
}

export const LocationDirectoryList: React.FC<LocationDirectoryListProps> = ({
  isOffice,
  locations,
  filteredLocations,
  duplicateAndOverlapsInfo,
  searchQuery,
  setSearchQuery,
  radiusFilter,
  setRadiusFilter,
  alertFilter,
  setAlertFilter,
  showAdvancedFilters,
  setShowAdvancedFilters,
  editingId,
  handleFocusOnMap,
  handleEdit,
  onDelete,
}) => {
  const { showConfirm } = useGlobalDialog();

  return (
    <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-150 overflow-hidden flex flex-col min-h-[500px]">
      {/* Header bar */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-700 flex items-center text-sm sm:text-base">
            <Map className="w-4.5 h-4.5 mr-2 text-indigo-500 animate-pulse" /> 
            {isOffice ? 'พิกัดสำนักงานออฟฟิศหลัก' : 'พิกัดพื้นที่จัดเตรียมกองถ่าย'} ({locations.length})
          </h3>
          
          {/* Warning Badge for duplicates/overlaps */}
          {duplicateAndOverlapsInfo.allWarningsIds.size > 0 && (
            <span className="text-[10px] font-bold text-red-500 flex items-center bg-red-50 px-2 py-1 rounded-full border border-red-100 animate-pulse">
              <AlertTriangle className="w-3 h-3 mr-1" /> พบพิกัดมีปัญหา {duplicateAndOverlapsInfo.allWarningsIds.size} จุด
            </span>
          )}
        </div>

        {/* Search & Filter bar */}
        <div className="flex flex-col sm:flex-row gap-2 mt-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="พิมพ์ค้นหาชื่อสถานที่..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100/50 focus:border-indigo-400 transition-all"
            />
          </div>

          <div className="flex gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`p-2 border rounded-xl flex items-center justify-center transition-all ${
                showAdvancedFilters || radiusFilter !== 'ALL' || alertFilter !== 'ALL'
                  ? 'border-indigo-200 bg-indigo-50/50 text-indigo-600'
                  : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'
              }`}
              title="ตัวกรองขั้นสูง"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-100/80 pt-3 flex flex-col sm:flex-row gap-3"
            >
              {/* Radius filter */}
              <div className="flex-1 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">ขนาดขอบเขตรัศมี</span>
                <div className="flex flex-wrap gap-1">
                  {(['ALL', 'NARROW', 'MEDIUM', 'WIDE'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRadiusFilter(r)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                        radiusFilter === r
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {r === 'ALL' && 'ทั้งหมด'}
                      {r === 'NARROW' && 'แคบ (≤150m)'}
                      {r === 'MEDIUM' && 'กลาง (151-300m)'}
                      {r === 'WIDE' && 'กว้าง (&gt;300m)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Warnings Filter */}
              <div className="flex-1 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">แจ้งเตือนปัญหาระบบ</span>
                <div className="flex gap-1">
                  {(['ALL', 'ONLY_OVERLAPS'] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAlertFilter(a)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                        alertFilter === a
                          ? 'bg-rose-600 border-rose-600 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {a === 'ALL' && 'ทั้งหมด'}
                      {a === 'ONLY_OVERLAPS' && '⚠️ เฉพาะจุดมีปัญหา'}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Directory list of locations */}
      <div className="flex-1 p-4 space-y-3 max-h-[600px] overflow-y-auto bg-slate-50/30">
        <AnimatePresence mode="popLayout">
          {filteredLocations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 text-slate-400 text-xs font-semibold flex flex-col items-center justify-center gap-2"
            >
              <MapPin className="w-8 h-8 text-slate-300 animate-bounce" />
              <span>ไม่พบสถานที่ที่ตรงกับเงื่อนไขการค้นหา/ตัวกรองของคุณ</span>
              {(searchQuery || radiusFilter !== 'ALL' || alertFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setRadiusFilter('ALL');
                    setAlertFilter('ALL');
                  }}
                  className="mt-2 text-indigo-600 hover:underline font-bold text-[11px]"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              )}
            </motion.div>
          ) : (
            filteredLocations.map((loc) => {
              const { lat: lLat, lng: lLng, radius: lRad } = parseLocationKey(loc.key);
              
              const hasDuplicateName = duplicateAndOverlapsInfo.duplicateNamesIds.has(loc.id);
              const hasOverlap = duplicateAndOverlapsInfo.overlappingIds.has(loc.id);
              const isHighlighting = editingId === loc.id;

              return (
                <motion.div 
                  key={loc.id} 
                  layout
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={`
                    flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all bg-white gap-3 relative overflow-hidden
                    ${isHighlighting ? 'ring-2 ring-indigo-500 border-indigo-400 shadow-md' : 'border-slate-150 hover:border-slate-300 hover:shadow'}
                    ${hasOverlap || hasDuplicateName ? 'border-rose-200 bg-rose-50/10' : ''}
                  `}
                >
                  {/* Left Column info */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className={`p-2 rounded-xl mt-0.5 shrink-0 shadow-sm ${
                      isOffice ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="font-bold text-slate-800 text-sm sm:text-base leading-snug truncate">
                          {loc.label}
                        </h4>
                        
                        {hasDuplicateName && (
                          <span className="text-[8px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            ชื่อซ้ำ
                          </span>
                        )}
                        {hasOverlap && (
                          <span className="text-[8px] font-bold text-white bg-amber-500 px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                            ทับซ้อน
                          </span>
                        )}
                        
                        <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded-full ${
                          isOffice 
                            ? 'bg-indigo-50/80 text-indigo-700 border-indigo-100' 
                            : 'bg-orange-50/80 text-orange-700 border-orange-100'
                        }`}>
                          {isOffice ? 'ออฟฟิศหลัก' : 'กองนอกสถานที่'}
                        </span>
                      </div>
                      
                      {/* Coordinates badges */}
                      <div className="text-[10px] text-slate-500 font-mono flex flex-wrap gap-1.5 items-center">
                        <span className="bg-slate-100 border border-slate-150 px-1.5 py-0.5 rounded-md">
                          Lat: {lLat.toFixed(6)}
                        </span>
                        <span className="bg-slate-100 border border-slate-150 px-1.5 py-0.5 rounded-md">
                          Lng: {lLng.toFixed(6)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-indigo-600 font-bold">
                          🎯 ขอบเขตรัศมีเช็คอิน: {lRad} เมตร
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Action buttons */}
                  <div className="flex items-center sm:justify-end gap-1.5 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    {/* Map Focus Button */}
                    <button 
                      onClick={() => handleFocusOnMap(loc)}
                      className="flex-1 sm:flex-none p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-100 hover:border-indigo-100 min-h-[38px] min-w-[38px]"
                      title="แสดงบนแผนที่"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="sm:hidden text-xs font-bold">เล็งเป้า</span>
                    </button>

                    {/* Edit Button */}
                    <button 
                      onClick={() => handleEdit(loc)}
                      className="flex-1 sm:flex-none p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-100 hover:border-indigo-100 min-h-[38px] min-w-[38px]"
                      title="แก้ไขข้อมูลสถานที่"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span className="sm:hidden text-xs font-bold">แก้ไข</span>
                    </button>

                    {/* Delete Button */}
                    <button 
                      onClick={async () => { 
                        if (await showConfirm(`ต้องการลบสถานที่ตรวจจับ "${loc.label}" ออกจากสารบบใช่หรือไม่?`)) {
                          onDelete(loc.id); 
                        }
                      }}
                      className="flex-1 sm:flex-none p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-100 hover:border-red-100 min-h-[38px] min-w-[38px]"
                      title="ลบสถานที่"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="sm:hidden text-xs font-bold">ลบออก</span>
                    </button>
                  </div>

                  {/* Overlap background highlight hint */}
                  {(hasOverlap || hasDuplicateName) && (
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-red-400" />
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
