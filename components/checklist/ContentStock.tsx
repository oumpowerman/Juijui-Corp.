
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Task, Channel, Status, User, ContentPillar, ContentFormat, Platform, MasterOption } from '../../types';
import { CalendarPlus, Film, Scissors, PlaySquare, ListFilter, Lightbulb, Video, CheckCircle2, MoreHorizontal, Search, X, Layout, FileText, StickyNote, Plus, Bell, Upload, Loader2, Download, Users, Filter, ChevronDown, CheckSquare, Square, Sparkles, ArrowUpDown, ArrowUp, ArrowDown, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { PLATFORM_ICONS, STATUS_COLORS } from '../../constants';
import MentorTip from '../MentorTip';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { useContentStock } from '../../hooks/useContentStock';
import Skeleton from '../ui/Skeleton';

interface ContentStockProps {
  tasks: Task[]; // Kept for interface compatibility but mostly unused for list
  channels: Channel[];
  users: User[];
  masterOptions: MasterOption[];
  onSchedule: (task: Task) => void;
  onEdit: (task: Task) => void;
  onAdd: () => void;
  onOpenSettings: () => void;
}

type SortKey = 'title' | 'status' | 'date' | 'remark';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 20;

const ContentStock: React.FC<ContentStockProps> = ({ tasks: _legacyTasks, channels, users, masterOptions, onSchedule, onEdit, onAdd, onOpenSettings }) => {
  const { showToast } = useToast();
  
  // --- Filter States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChannel, setFilterChannel] = useState<string>('ALL');
  const [filterFormat, setFilterFormat] = useState<string>('ALL');
  const [filterPillar, setFilterPillar] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]); 
  const [showStockOnly, setShowStockOnly] = useState(false); 

  // --- Sort States ---
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'date', direction: 'desc' });

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);

  // --- UI States ---
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // --- CSV Import State ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  // --- MEMOIZED FILTERS (Fixes Infinite Loop) ---
  const filters = useMemo(() => ({
      channelId: filterChannel,
      format: filterFormat,
      pillar: filterPillar,
      category: filterCategory,
      statuses: filterStatuses,
      showStockOnly: showStockOnly
  }), [filterChannel, filterFormat, filterPillar, filterCategory, filterStatuses, showStockOnly]);

  // --- SERVER SIDE HOOK ---
  const { contents: paginatedTasks, totalCount, isLoading } = useContentStock({
      page: currentPage,
      pageSize: ITEMS_PER_PAGE,
      searchQuery: searchQuery,
      filters: filters,
      sortConfig: sortConfig
  });

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Derive Options
  const formatOptions = masterOptions.filter(o => o.type === 'FORMAT' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);
  const pillarOptions = masterOptions.filter(o => o.type === 'PILLAR' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);
  const categoryOptions = masterOptions.filter(o => o.type === 'CATEGORY' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);
  const statusOptions = masterOptions.filter(o => o.type === 'STATUS' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);

  // Helper to get labels from Master Data
  const getFormatLabel = (key?: string) => {
      const opt = formatOptions.find(o => o.key === key);
      return opt ? opt.label : key;
  };

  const getPillarLabel = (key?: string) => {
      const opt = pillarOptions.find(o => o.key === key);
      return opt ? opt.label : key;
  };

  const getCategoryLabel = (key?: string) => {
      const opt = categoryOptions.find(o => o.key === key || o.label === key);
      return opt ? opt.label : key;
  };

  const getStatusLabel = (key: string) => {
      const opt = statusOptions.find(o => o.key === key);
      return opt ? opt.label : key;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [statusDropdownRef]);

  // Reset pagination when filters change
  useEffect(() => {
      setCurrentPage(1);
  }, [searchQuery, filterChannel, filterFormat, filterPillar, filterCategory, filterStatuses, showStockOnly, sortConfig]);

  const getChannel = (channelId: string | undefined) => {
    if (!channelId) return null;
    return channels.find(c => c.id === channelId);
  };

  const toggleStatusFilter = (status: string) => {
      setFilterStatuses(prev => 
          prev.includes(status) 
          ? prev.filter(s => s !== status) 
          : [...prev, status]
      );
  };

  // --- Handle Sorting ---
  const handleSort = (key: SortKey) => {
      setSortConfig(current => {
          if (current && current.key === key) {
              return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
          }
          return { key, direction: key === 'date' ? 'desc' : 'asc' };
      });
  };

  const renderSortIcon = (key: SortKey) => {
      if (sortConfig?.key !== key) return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
      return sortConfig.direction === 'asc' 
          ? <ArrowUp className="w-3 h-3 ml-1 text-indigo-600" />
          : <ArrowDown className="w-3 h-3 ml-1 text-indigo-600" />;
  };

  const handlePageChange = (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
          setCurrentPage(newPage);
      }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterChannel('ALL');
    setFilterFormat('ALL');
    setFilterPillar('ALL');
    setFilterCategory('ALL');
    setFilterStatuses([]);
  };

  const renderUserAvatars = (userIds: string[] | undefined) => {
    if (!userIds || userIds.length === 0) return <span className="text-gray-300 text-xs">-</span>;
    return (
        <div className="flex justify-center -space-x-1.5">
            {userIds.map(id => {
                const user = users.find(u => u.id === id);
                if (!user) return null;
                return (
                    <div key={id} className="w-8 h-8 rounded-full border-2 border-white ring-1 ring-gray-100 bg-gray-100 shadow-sm flex items-center justify-center overflow-hidden" title={user.name}>
                        {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover"/> : <span className="text-[9px] font-bold text-gray-500">{user.name.charAt(0).toUpperCase()}</span>}
                    </div>
                );
            })}
        </div>
    );
  };

  // --- CSV Import Logic (Keep same as before) ---
  const handleDownloadTemplate = () => {
        // ... (Logic kept same)
        const exampleFormat = formatOptions.length > 0 ? formatOptions[0].key : "Short Form";
        const headers = ["Content Format","Pillar","Category","Content Topic","Status","Publish Date","Chanel","Owner","IDEA","Edit","Sub","Help","Remark หมายเหตุ","Post"];
        const exampleRow = [`"${exampleFormat}"`,"Education","Review",`"ตัวอย่าง: รีวิวกล้องใหม่"`,`"TODO"`,`"${format(new Date(), 'dd/MM/yyyy')}"`,`"Juijui Vlog"`,`"Admin"`,`"รายละเอียด"`,`"Editor"`,`"Support"`,``,`"หมายเหตุ"`,`"TikTok"`].join(",");
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(",") + "\n" + exampleRow;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `juijui_template.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
  };

  const parseCSVLine = (text: string) => {
        const result = [];
        let cell = '';
        let quote = false;
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '"' && text[i + 1] === '"') { cell += '"'; i++; } 
            else if (char === '"') { quote = !quote; } 
            else if (char === ',' && !quote) { result.push(cell); cell = ''; } 
            else { cell += char; }
        }
        result.push(cell);
        return result;
  };

  const findUserByName = (name: string): string | null => {
        if (!name) return null;
        const cleanName = name.trim().toLowerCase();
        const user = users.find(u => u.name.toLowerCase() === cleanName) || users.find(u => u.name.toLowerCase().includes(cleanName));
        return user ? user.id : null;
  };

  const findMasterKey = (type: 'FORMAT' | 'PILLAR' | 'CATEGORY' | 'STATUS', rawValue: string) => {
        if (!rawValue) return null;
        const cleanRaw = rawValue.trim().toUpperCase();
        const options = masterOptions.filter(o => o.type === type);
        const exactKey = options.find(o => o.key === cleanRaw);
        if (exactKey) return exactKey.key;
        const fuzzyLabel = options.find(o => o.label.toUpperCase().includes(cleanRaw));
        if (fuzzyLabel) return fuzzyLabel.key;
        return null;
  }

  const parseTHDate = (dateStr: string): Date | null => {
        if (!dateStr) return null;
        const cleanStr = dateStr.trim();
        if (cleanStr.includes('/')) {
            const parts = cleanStr.split('/');
            if (parts.length === 3) {
                const d = parseInt(parts[0]);
                const m = parseInt(parts[1]) - 1; 
                let y = parseInt(parts[2]);
                if (y > 2400) y -= 543;
                const date = new Date(y, m, d);
                if (!isNaN(date.getTime())) return date;
            }
        }
        const fallback = new Date(cleanStr);
        return !isNaN(fallback.getTime()) ? fallback : null;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const text = e.target?.result as string;
            const rows = text.split(/\r\n|\n/);
            if (rows.length < 2) { showToast('ไฟล์ไม่มีข้อมูล', 'warning'); return; }
            const headers = parseCSVLine(rows[0]).map(h => h.trim().toLowerCase());
            
            // Map headers to logic (Same as before)
            const colMap = {
                title: headers.indexOf('content topic'),
                format: headers.indexOf('content format'),
                pillar: headers.indexOf('pillar'),
                category: headers.indexOf('category'),
                status: headers.indexOf('status'),
                date: headers.indexOf('publish date'),
                channel: headers.findIndex(h => h === 'chanel' || h === 'channel'),
                owner: headers.indexOf('owner'),
                idea: headers.indexOf('idea'),
                edit: headers.indexOf('edit'),
                sub: headers.indexOf('sub'),
                remark: headers.findIndex(h => h.includes('remark')),
                platform: headers.indexOf('post')
            };

            const newTasksPayload: any[] = [];
            for (let i = 1; i < rows.length; i++) {
                const rowStr = rows[i].trim();
                if (!rowStr) continue;
                const cols = parseCSVLine(rowStr);
                const title = colMap.title > -1 ? cols[colMap.title]?.trim() : '';
                if (!title) continue; 
                
                let status = findMasterKey('STATUS', (colMap.status > -1 ? cols[colMap.status] : '').toUpperCase()) || 'TODO';
                let channelId = null;
                const channelName = colMap.channel > -1 ? cols[colMap.channel]?.trim() : '';
                if (channelName) {
                    const foundChannel = channels.find(c => c.name.toLowerCase().includes(channelName.toLowerCase()));
                    if (foundChannel) channelId = foundChannel.id;
                }

                let targetPlatforms: string[] = [];
                if (colMap.platform > -1) {
                     const p = cols[colMap.platform]?.toLowerCase() || '';
                     if(p.includes('yt')) targetPlatforms.push('YOUTUBE');
                     if(p.includes('fb')) targetPlatforms.push('FACEBOOK');
                }

                let targetDate = new Date();
                let isUnscheduled = true;
                const dateStr = colMap.date > -1 ? cols[colMap.date]?.trim() : '';
                const parsedDate = parseTHDate(dateStr);
                if (parsedDate) {
                    targetDate = parsedDate;
                    isUnscheduled = false;
                }

                const ideaOwnerIds = [];
                const editorIds = [];
                const assigneeIds = [];
                if (colMap.owner > -1) { const uid = findUserByName(cols[colMap.owner]); if (uid) ideaOwnerIds.push(uid); }
                if (colMap.edit > -1) { const uid = findUserByName(cols[colMap.edit]); if (uid) editorIds.push(uid); }
                if (colMap.sub > -1) { const uid = findUserByName(cols[colMap.sub]); if (uid) assigneeIds.push(uid); }

                const contentFormat = colMap.format > -1 ? findMasterKey('FORMAT', cols[colMap.format]) : null;
                const pillar = colMap.pillar > -1 ? findMasterKey('PILLAR', cols[colMap.pillar]) : null;
                const category = colMap.category > -1 ? findMasterKey('CATEGORY', cols[colMap.category]) : null;

                newTasksPayload.push({
                    title,
                    description: colMap.idea > -1 ? cols[colMap.idea] : '',
                    status,
                    channel_id: channelId,
                    start_date: targetDate.toISOString(),
                    end_date: targetDate.toISOString(),
                    is_unscheduled: isUnscheduled,
                    priority: 'MEDIUM',
                    content_format: contentFormat,
                    pillar: pillar,
                    category: category,
                    remark: colMap.remark > -1 ? cols[colMap.remark] : '',
                    target_platform: targetPlatforms,
                    idea_owner_ids: ideaOwnerIds,
                    editor_ids: editorIds,
                    assignee_ids: assigneeIds
                });
            }
            
            if (newTasksPayload.length > 0) {
                const { error } = await supabase.from('contents').insert(newTasksPayload);
                if (error) throw error;
                showToast(`นำเข้าสำเร็จ ${newTasksPayload.length} รายการ 🎉`, 'success');
            } else { showToast('ไม่พบข้อมูลในไฟล์ หรือรูปแบบไม่ถูกต้อง', 'warning'); }
        } catch (err: any) {
            console.error(err);
            showToast('เกิดข้อผิดพลาดในการนำเข้า: ' + err.message, 'error');
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      <MentorTip variant="purple" messages={["มุมมอง List แบบละเอียด ช่วยให้เช็คสถานะงานได้ครบถ้วน", "ใช้ตัวกรอง Status เลือกดูเฉพาะขั้นตอนที่สนใจได้ เช่น ดูเฉพาะ 'Script' และ 'Shooting'", "คลิกที่หัวตารางเพื่อเรียงลำดับข้อมูลได้นะ!"]} />

      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center mb-2">
                    รายการคอนเทนต์ 📑 (All Content)
                </h1>
                
                {/* Channel Filter Buttons (Chips) */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setFilterChannel('ALL')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm ${filterChannel === 'ALL' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'}`}
                    >
                        🔥 รวมมิตร (All)
                    </button>
                    {channels.map(ch => {
                        const bgClass = (ch.color || 'bg-gray-100').split(' ')[0].replace('bg-', 'bg-');
                        return (
                            <button
                                key={ch.id}
                                onClick={() => setFilterChannel(ch.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 shadow-sm ${filterChannel === ch.id ? 'ring-2 ring-offset-1 ring-indigo-500 border-transparent text-gray-800 bg-white' : 'border-gray-200 hover:border-indigo-300 bg-white text-gray-600 hover:text-indigo-600'}`}
                            >
                            <span className={`w-2 h-2 rounded-full ${bgClass}`}></span>
                            {ch.name}
                            </button>
                        );
                    })}
                </div>
            </div>
            
            <div className="flex items-center gap-2 self-start md:self-center">
                {/* Import Button */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm mr-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImporting}
                        className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center transition-colors disabled:opacity-50"
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
                    <div className="bg-white/20 p-1 rounded-lg group-hover:bg-white/30 transition-colors">
                        <Plus className="w-5 h-5 stroke-[3px]" />
                    </div>
                    <span className="tracking-wide hidden md:inline drop-shadow-sm">เพิ่มรายการใหม่</span>
                    <Sparkles className="w-4 h-4 text-yellow-300 absolute -top-1 -right-1 animate-bounce opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <button 
                    onClick={onOpenSettings}
                    className="hidden md:flex p-2.5 bg-white text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 rounded-xl shadow-sm transition-all active:scale-95"
                >
                    <Bell className="w-5 h-5" />
                </button>
            </div>
        </div>
      </div>

      {/* Filter Bar & Table */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col xl:flex-row gap-4">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
                type="text" 
                placeholder="ค้นหาชื่อคลิป, หมายเหตุ..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-sm transition-all"
            />
            {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-3 h-3" />
                </button>
            )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
            {/* Format Filter */}
            <div className="relative min-w-[120px]">
                <select 
                    value={filterFormat}
                    onChange={(e) => setFilterFormat(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                >
                    <option value="ALL">🎬 ทุก Format</option>
                    {formatOptions.length > 0 ? (
                        formatOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)
                    ) : (
                        <option disabled>No Formats</option>
                    )}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Pillar Filter */}
            <div className="relative min-w-[120px]">
                <select 
                    value={filterPillar}
                    onChange={(e) => setFilterPillar(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                >
                    <option value="ALL">🏛️ ทุก Pillar</option>
                    {pillarOptions.map(opt => (
                        <option key={opt.key} value={opt.key}>{opt.label}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Category Filter */}
            <div className="relative min-w-[120px]">
                <select 
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                >
                    <option value="ALL">🏷️ ทุก Category</option>
                    {categoryOptions.map(opt => (
                        <option key={opt.key} value={opt.key}>{opt.label}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Status Multi-Select Filter */}
            <div className="relative" ref={statusDropdownRef}>
                <button 
                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                    className={`
                        flex items-center justify-between px-3 py-2.5 border rounded-xl text-sm font-bold min-w-[160px] transition-all
                        ${filterStatuses.length > 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-700'}
                    `}
                >
                    <span className="truncate">
                        {filterStatuses.length === 0 ? '📊 ทุกสถานะ' : `${filterStatuses.length} สถานะ`}
                    </span>
                    <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                </button>

                {isStatusDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-2 overflow-y-auto max-h-[300px]">
                        <div className="text-xs font-bold text-gray-400 px-2 py-1 mb-1">เลือกสถานะที่ต้องการแสดง</div>
                        {statusOptions.length > 0 ? (
                            statusOptions.map(status => (
                                <div 
                                    key={status.key} 
                                    onClick={() => toggleStatusFilter(status.key)}
                                    className="flex items-center px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                                >
                                    <div className={`w-4 h-4 mr-3 flex items-center justify-center rounded border ${filterStatuses.includes(status.key) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                                        {filterStatuses.includes(status.key) && <CheckSquare className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="text-sm text-gray-700">{status.label}</span>
                                </div>
                            ))
                        ) : (
                            <div className="p-3 text-center text-xs text-gray-400">กรุณาเพิ่ม Status Master Data</div>
                        )}
                        <div className="border-t border-gray-100 mt-2 pt-2">
                            <button onClick={() => setFilterStatuses([])} className="w-full text-center text-xs text-red-500 font-bold hover:bg-red-50 py-1.5 rounded-lg">
                                ล้างค่า (แสดงทั้งหมด)
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Stock Toggle */}
            <button
                onClick={() => setShowStockOnly(!showStockOnly)}
                className={`
                    px-3 py-2.5 rounded-xl text-sm font-bold transition-all border flex items-center whitespace-nowrap
                    ${showStockOnly 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}
                `}
            >
                {showStockOnly ? <Layout className="w-4 h-4 mr-2" /> : <ListFilter className="w-4 h-4 mr-2" />}
                {showStockOnly ? 'เฉพาะใน Stock' : 'Stock Only'}
            </button>

            {/* Clear All */}
            {(searchQuery || filterChannel !== 'ALL' || filterFormat !== 'ALL' || filterPillar !== 'ALL' || filterCategory !== 'ALL' || filterStatuses.length > 0) && (
                <button 
                    onClick={clearFilters}
                    className="px-3 py-2.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
                >
                    ล้างตัวกรอง
                </button>
            )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
        {isLoading ? (
            <div className="p-16 flex flex-col items-center justify-center text-gray-400">
                <Skeleton className="w-16 h-16 rounded-full mb-4" />
                <Skeleton className="w-32 h-4 rounded-full" />
            </div>
        ) : paginatedTasks.length === 0 ? (
           <div className="p-16 text-center flex flex-col items-center justify-center h-full">
                <Search className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-800">ไม่พบรายการที่ค้นหา 🔍</h3>
                <p className="text-gray-400">ลองเปลี่ยนตัวกรองดูนะครับ</p>
           </div>
        ) : (
            <div className="flex flex-col h-full">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                                <th className="px-4 py-3 font-bold bg-gray-50 sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] w-[300px] text-center cursor-pointer group hover:bg-gray-100 transition-colors" onClick={() => handleSort('title')}>
                                    <div className="flex items-center justify-center">ชื่อคอนเทนต์ 🎬 {renderSortIcon('title')}</div>
                                </th>
                                <th className="px-4 py-3 font-bold w-[180px] text-center cursor-pointer group hover:bg-gray-100 transition-colors sticky top-0 bg-gray-50 z-10" onClick={() => handleSort('status')}>
                                    <div className="flex items-center justify-center">สถานะตอนนี้ 🚦 {renderSortIcon('status')}</div>
                                </th>
                                <th className="px-4 py-3 font-bold w-[120px] text-center cursor-pointer group hover:bg-gray-100 transition-colors sticky top-0 bg-gray-50 z-10" onClick={() => handleSort('date')}>
                                    <div className="flex items-center justify-center">ลงเมื่อไหร่ 📅 {renderSortIcon('date')}</div>
                                </th>
                                {/* Sort by user is complex with server-side pagination, disabled for now or requires advanced backend logic */}
                                <th className="px-4 py-3 font-bold w-[80px] text-center text-gray-400">Owner 💡</th>
                                <th className="px-4 py-3 font-bold w-[80px] text-center text-gray-400">Editor ✂️</th>
                                <th className="px-4 py-3 font-bold w-[80px] text-center text-gray-400">Sub 🤝</th>
                                <th className="px-4 py-3 font-bold w-[250px] text-center cursor-pointer group hover:bg-gray-100 transition-colors sticky top-0 bg-gray-50 z-10" onClick={() => handleSort('remark')}>
                                    <div className="flex items-center justify-center">โน้ตไว้หน่อย 📝 {renderSortIcon('remark')}</div>
                                </th>
                                <th className="px-4 py-3 font-bold text-center sticky right-0 top-0 bg-gray-50 z-20 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] w-[80px]">ทำไรต่อ ⚙️</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {paginatedTasks.map((task) => {
                                const channel = getChannel(task.channelId);
                                const channelStyle = channel ? channel.color : 'bg-gray-100 text-gray-500 border-gray-200';
                                
                                return (
                                    <tr key={task.id} onClick={() => onEdit(task)} className="hover:bg-indigo-50/20 transition-colors group cursor-pointer relative">
                                        <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-indigo-50/20 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] align-top">
                                            <div className="font-bold text-gray-800 group-hover:text-indigo-600 line-clamp-2 text-sm" title={task.title}>{task.title}</div>
                                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                                <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${channelStyle}`}>{channel?.name || '-'}</span>
                                                {task.contentFormat && <span className="text-[10px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 font-bold flex items-center">{getFormatLabel(task.contentFormat)}</span>}
                                                {task.pillar && <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-medium flex items-center">{getPillarLabel(task.pillar)}</span>}
                                                {task.category && <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 font-medium flex items-center"><Tag className="w-2.5 h-2.5 mr-1 opacity-50" />{getCategoryLabel(task.category)}</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center align-middle">
                                            <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold border w-full text-center whitespace-nowrap shadow-sm ${STATUS_COLORS[task.status] || 'bg-gray-100'}`}>{getStatusLabel(task.status)}</span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-center align-middle">
                                            {task.isUnscheduled ? <span className="text-gray-400 italic text-xs bg-gray-50 px-2 py-1 rounded">No Date</span> : <span className="font-medium">{format(task.endDate, 'd MMM yy')}</span>}
                                        </td>
                                        <td className="px-4 py-3 text-center align-middle">{renderUserAvatars(task.ideaOwnerIds)}</td>
                                        <td className="px-4 py-3 text-center align-middle">{renderUserAvatars(task.editorIds)}</td>
                                        <td className="px-4 py-3 text-center align-middle">{renderUserAvatars(task.assigneeIds)}</td>
                                        <td className="px-4 py-3 text-gray-500 text-xs align-middle">
                                            {task.remark ? <div className="flex items-start gap-1 justify-center" title={task.remark}><StickyNote className="w-3 h-3 text-yellow-500 shrink-0 mt-0.5" /><span className="line-clamp-2 text-left">{task.remark}</span></div> : <div className="text-center text-gray-300">-</div>}
                                        </td>
                                        <td className="px-4 py-3 text-right sticky right-0 bg-white group-hover:bg-indigo-50/20 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] align-middle">
                                            <div className="flex justify-center gap-1">
                                                <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                                                <button onClick={(e) => { e.stopPropagation(); onSchedule(task); }} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors" title="ลงตาราง"><CalendarPlus className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {totalCount > 0 && (
                    <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white sticky bottom-0 z-20">
                        <div className="text-xs text-gray-500 hidden sm:block">แสดง {((currentPage - 1) * ITEMS_PER_PAGE) + 1} ถึง {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} จากทั้งหมด {totalCount} รายการ</div>
                        <div className="flex items-center gap-2 mx-auto sm:mx-0">
                            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                            <span className="text-xs font-bold text-gray-700 px-2">หน้า {currentPage} / {totalPages}</span>
                            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default ContentStock;
