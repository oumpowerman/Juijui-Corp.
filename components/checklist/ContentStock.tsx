
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Task, Channel, User, MasterOption } from '../../types';
import { Loader2, Upload, Download, Plus, PackageSearch } from 'lucide-react';
import MentorTip from '../MentorTip';
import { useToast } from '../../context/ToastContext';
import { useContentStock } from '../../hooks/useContentStock';
import NotificationBellBtn from '../NotificationBellBtn';
import { useStockSync } from '../../hooks/useStockSync';
import { parseContentStockCSV } from '../../services/csvService';
import { supabase } from '../../lib/supabase';
import AppBackground, { BackgroundTheme } from '../common/AppBackground';

// Sub-Components
import StockFilterBar from './stock/StockFilterBar';
import StockTable from './stock/StockTable';
import StockInventoryModal from './stock/inventory/StockInventoryModal';
import StockCountBadge from './stock/StockCountBadge';

interface ContentStockProps {
  tasks: Task[]; // Sync Source
  channels: Channel[];
  users: User[];
  masterOptions: MasterOption[];
  onSchedule: (task: Task) => void;
  onEdit: (task: Task) => void;
  onAdd: () => void;
  onOpenSettings: () => void;
  onAddToWorkbox?: (task: Task) => void;
}

type SortKey = 'title' | 'status' | 'date' | 'remark' | 'publishDate' | 'shootDate' | 'shortNote' | 'ideaOwner' | 'editor' | 'helper' | 'createdAt';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 20;

const ContentStock: React.FC<ContentStockProps> = ({ tasks: globalTasks, channels, users, masterOptions, onSchedule, onEdit, onAdd, onOpenSettings, onAddToWorkbox }) => {
  const { showToast } = useToast();

  // --- Filter States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChannel, setFilterChannel] = useState<string>('ALL');
  const [filterFormat, setFilterFormat] = useState<string[]>([]);
  const [filterPillar, setFilterPillar] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  
  // Updated: Range Filter
  const [filterHasShootDate, setFilterHasShootDate] = useState(false);
  const [filterShootDateStart, setFilterShootDateStart] = useState('');
  const [filterShootDateEnd, setFilterShootDateEnd] = useState('');
  
  const [showStockOnly, setShowStockOnly] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);

  // --- Sort States ---
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'createdAt', direction: 'desc' });

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);

  // --- CSV Import State ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Reset pagination when filters change
  useEffect(() => {
      setCurrentPage(1);
  }, [searchQuery, filterChannel, filterFormat, filterPillar, filterCategory, filterStatuses, filterHasShootDate, filterShootDateStart, filterShootDateEnd, showStockOnly, sortConfig]);

  // --- MEMOIZED FILTERS (Fixes Infinite Loop) ---
  const filters = useMemo(() => ({
      channelId: filterChannel,
      format: filterFormat,
      pillar: filterPillar,
      category: filterCategory,
      statuses: filterStatuses,
      hasShootDate: filterHasShootDate, // Added
      shootDateStart: filterShootDateStart, // Added
      shootDateEnd: filterShootDateEnd,     // Added
      showStockOnly: showStockOnly
  }), [filterChannel, filterFormat, filterPillar, filterCategory, filterStatuses, filterHasShootDate, filterShootDateStart, filterShootDateEnd, showStockOnly]);

  // Transition Effect
  useEffect(() => {
      setIsFiltering(true);
      const timer = setTimeout(() => setIsFiltering(false), 500);
      return () => clearTimeout(timer);
  }, [filters]);

  // --- SERVER SIDE HOOK ---
  const { contents: paginatedTasks, totalCount, isLoading, isRefreshing, fetchContents, updateLocalItem } = useContentStock({
      page: currentPage,
      pageSize: ITEMS_PER_PAGE,
      searchQuery: searchQuery,
      filters: filters,
      sortConfig: sortConfig
  });

  // --- HYBRID SYNC: Watch Global Tasks ---
  useStockSync(globalTasks, paginatedTasks, updateLocalItem);

  // --- Handle Sorting ---
  const handleSort = (key: SortKey) => {
      setSortConfig(current => {
          if (current && current.key === key) {
              return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
          }
          // Default to desc for date-related columns, asc for others
          const isDateKey = key === 'date' || key === 'publishDate' || key === 'shootDate';
          return { key, direction: isDateKey ? 'desc' : 'asc' };
      });
  };

  const handlePageChange = (newPage: number) => {
      setCurrentPage(newPage);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterChannel('ALL');
    setFilterFormat([]);
    setFilterPillar([]);
    setFilterCategory([]);
    setFilterHasShootDate(false);
    setFilterShootDateStart(''); 
    setFilterShootDateEnd('');
    setFilterStatuses([]);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
        // Use Service for Parsing
        const newTasksPayload = await parseContentStockCSV(file, users, channels, masterOptions);

        if (newTasksPayload.length > 0) {
            const { error } = await supabase.from('contents').insert(newTasksPayload);
            if (error) throw error;
            showToast(`นำเข้าสำเร็จ ${newTasksPayload.length} รายการ 🎉`, 'success');
            // Refresh list
            fetchContents();
        } else {
            showToast('ไม่พบข้อมูลในไฟล์ หรือรูปแบบไม่ถูกต้อง', 'warning');
        }
    } catch (err: any) {
        console.error(err);
        showToast('เกิดข้อผิดพลาดในการนำเข้า: ' + err.message, 'error');
    } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = () => {
        const exampleFormat = masterOptions.filter(o => o.type === 'FORMAT').length > 0 ? masterOptions.filter(o => o.type === 'FORMAT')[0].key : "Short Form";
        const headers = ["Content Format","Pillar","Category","Content Topic","Status","Publish Date","Chanel","Owner","IDEA","Edit","Sub","Help","Remark หมายเหตุ","Post"];
        const exampleRow = [`"${exampleFormat}"`,"Education","Review",`"ตัวอย่าง: รีวิวกล้องใหม่"`,`"TODO"`,`"01/01/2024"`,`"Juijui Vlog"`,`"Admin"`,`"รายละเอียด"`,`"Editor"`,`"Support"`,``,`"หมายเหตุ"`,`"TikTok"`].join(",");
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(",") + "\n" + exampleRow;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `juijui_template.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
  };

  const bgTheme = useMemo(() => {
    const themes: BackgroundTheme[] = [
      'pastel-pink', 'pastel-blue', 'pastel-green', 'pastel-purple', 'pastel-orange', 'pastel-yellow', 'pastel-teal'
    ];
    return themes[Math.floor(Math.random() * themes.length)];
  }, []);

  return (
    <AppBackground theme={bgTheme} pattern="icons" className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 p-4 md:p-8 min-h-screen">
      <div className="relative z-10 space-y-6 animate-in fade-in duration-500 pb-20">
        <MentorTip variant="purple" messages={["มุมมอง List แบบละเอียด ช่วยให้เช็คสถานะงานได้ครบถ้วน", "ใช้ตัวกรอง Status เลือกดูเฉพาะขั้นตอนที่สนใจได้ เช่น ดูเฉพาะ 'Script' และ 'Shooting'", "ใหม่! กรอง 'วันที่ถ่ายทำ' แบบช่วงเวลาได้แล้วนะ เพื่อดูคิวเป็นสัปดาห์หรือเดือน"]} />

        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/60 backdrop-blur-xl pt-7 pb-6 px-6 pr-7 rounded-3xl border border-white/60 shadow-xl shadow-indigo-500/5 overflow-x-visible overflow-y-visible">
              <div>
                  <h1 className="text-3xl font-bold text-gray-800 flex items-center mb-3 tracking-tight">
                      <span className="text-4xl mr-2">📑</span>
                      รายการคอนเทนต์ (All Content)
                      <StockCountBadge count={totalCount} isLoading={isLoading} />
                  </h1>

                  {/* Quick Channel Chips */}
                  <div className="w-full overflow-x-auto scrollbar-hide pb-1">
                      <div className="flex flex-wrap items-center gap-2 pt-1.5">
                          <button
                              onClick={() => setFilterChannel('ALL')}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm ${filterChannel === 'ALL' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white/80 text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'}`}
                          >
                              🔥 รวมมิตร (All)
                          </button>
                          {channels.map(ch => {
                              const bgClass = (ch.color || 'bg-gray-100').split(' ')[0].replace('bg-', 'bg-');
                              return (
                                  <button
                                      key={ch.id}
                                      onClick={() => setFilterChannel(ch.id)}
                                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 shadow-sm ${filterChannel === ch.id ? 'ring-2 ring-indigo-500 border-transparent text-gray-800 bg-white mr-[2px]' : 'border-gray-200 hover:border-indigo-300 bg-white/80 text-gray-600 hover:text-indigo-600'}`}
                                  >
                                  <span className={`w-2 h-2 rounded-full ${bgClass}`}></span>
                                  {ch.name}
                                  </button>
                              );
                          })}
                      </div>
                  </div>
              </div>

              <div className="w-full md:w-auto overflow-x-auto scrollbar-hide pb-1">
                  <div className="flex items-center gap-2 min-w-max lg:min-w-0 self-start md:self-center">
                      {/* Inventory Analysis Button */}
                      <button
                          onClick={() => setIsInventoryModalOpen(true)}
                          className="p-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl text-gray-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm group"
                          title="วิเคราะห์คลังคอนเทนต์"
                      >
                          <PackageSearch className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </button>

                      {/* Import Buttons */}
                      <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm p-1 rounded-xl border border-gray-200 shadow-sm mr-2">
                          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                          <button
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isImporting}
                              className="px-3 py-1.5 text-md font-bold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center transition-colors disabled:opacity-50"
                          >
                              {isImporting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />} Import
                          </button>
                          <div className="w-px h-4 bg-gray-200 mx-1"></div>
                          <button
                              onClick={handleDownloadTemplate}
                              className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center transition-colors"
                          >
                              <Download className="w-4 h-4 mr-1" /> Template
                          </button>
                      </div>

                      {/* Add Item Button */}
                      <button
                          onClick={onAdd}
                          className="
                              relative group flex items-center gap-2 px-6 py-3 rounded-2xl
                              bg-gradient-to-r from-indigo-600 to-violet-600
                              text-white font-black text-sm
                              shadow-[0_4px_0_rgb(67,56,202)]
                              hover:shadow-[0_2px_0_rgb(67,56,202)] hover:translate-y-[2px]
                              active:shadow-none active:translate-y-[4px]
                              transition-all duration-150
                              border border-indigo-500/20
                          "
                      >
                          <Plus className="w-5 h-5 stroke-[3px]" />
                          <span className="tracking-wide hidden md:inline drop-shadow-sm">เพิ่มรายการใหม่</span>
                      </button>

                      <NotificationBellBtn
                          onClick={onOpenSettings}
                          className="hidden md:flex"
                      />
                  </div>
              </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl shadow-indigo-500/5 border border-white/60 p-1 relative z-50">
          <StockFilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterChannel={filterChannel}
            setFilterChannel={setFilterChannel}
            filterFormat={filterFormat}
            setFilterFormat={setFilterFormat}
            filterPillar={filterPillar}
            setFilterPillar={setFilterPillar}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            filterStatuses={filterStatuses}
            setFilterStatuses={setFilterStatuses}
            
            filterHasShootDate={filterHasShootDate}
            setFilterHasShootDate={setFilterHasShootDate}
            filterShootDateStart={filterShootDateStart}
            setFilterShootDateStart={setFilterShootDateStart}
            filterShootDateEnd={filterShootDateEnd}
            setFilterShootDateEnd={setFilterShootDateEnd}
            
            showStockOnly={showStockOnly}
            setShowStockOnly={setShowStockOnly}
            clearFilters={clearFilters}
            channels={channels}
            masterOptions={masterOptions}
          />
        </div>

        {/* Table */}
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl shadow-indigo-500/5 border border-white/60 overflow-hidden">
          <StockTable
            isLoading={isLoading}
            isFiltering={isFiltering}
            tasks={paginatedTasks}
            channels={channels}
            users={users}
            masterOptions={masterOptions}
            sortConfig={sortConfig}
            onSort={handleSort}
            totalCount={totalCount}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            itemsPerPage={ITEMS_PER_PAGE}
            onEdit={onEdit}
            onSchedule={onSchedule}
            onAddToWorkbox={onAddToWorkbox}
          />
        </div>

        <StockInventoryModal 
          isOpen={isInventoryModalOpen}
          onClose={() => setIsInventoryModalOpen(false)}
          masterOptions={masterOptions}
          channels={channels}
        />
      </div>
    </AppBackground>
  );
};

export default ContentStock;
