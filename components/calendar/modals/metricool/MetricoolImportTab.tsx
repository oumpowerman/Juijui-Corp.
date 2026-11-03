import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload } from 'lucide-react';
import { Task, Channel } from '../../../../types';
import { ParsedMetricoolRow } from '../../../../utils/metricoolCsv';
import { collapsibleDrawerVariants, ImportStatusFilter } from './constants';
import ImportUploadToolbar from './import/ImportUploadToolbar';
import ImportFilterSearchBar from './import/ImportFilterSearchBar';
import ImportPreviewRow from './import/ImportPreviewRow';
import TablePaginationBar from './common/TablePaginationBar';

interface MetricoolImportTabProps {
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    importedFileName: string;
    detectedHeaders: string[];
    parsedRows: ParsedMetricoolRow[];
    filteredImportRows: ParsedMetricoolRow[];
    paginatedImportRows: ParsedMetricoolRow[];
    importPage: number;
    setImportPage: (page: number) => void;
    importTotalPages: number;
    statusFilter: ImportStatusFilter;
    setStatusFilter: (filter: ImportStatusFilter) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    expandedDiffRowIndices: Set<number>;
    toggleDiffRow: (rowIndex: number) => void;
    channels: Channel[];
    tasks: Task[];
    nearbyTasks: Task[];
    importDefaultChannelId: string;
    setImportDefaultChannelId: (id: string) => void;
    importDefaultStatus: string;
    setImportDefaultStatus: (status: string) => void;
    contentStatuses: { key: string; label: string }[];
    isRunningAiMatch: boolean;
    aiMatchProgress: { current: number; total: number } | null;
    showPasteBox: boolean;
    setShowPasteBox: React.Dispatch<React.SetStateAction<boolean>>;
    rawCsvPaste: string;
    setRawCsvPaste: (val: string) => void;
    importSummary: { updateCount: number; createCount: number; skipCount: number };
    processCsvText: (text: string, sourceName: string) => Promise<void>;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleRunAiSmartMatch: () => Promise<void>;
    handleRowActionChange: (rowIndex: number, action: 'UPDATE' | 'CREATE' | 'SKIP') => void;
    handleRowTargetTaskChange: (rowIndex: number, taskId: string) => void;
    handleBulkActionForFiltered: (action: 'CREATE' | 'SKIP') => void;
}

export const MetricoolImportTab: React.FC<MetricoolImportTabProps> = React.memo(({
    fileInputRef,
    importedFileName,
    detectedHeaders,
    parsedRows,
    filteredImportRows,
    paginatedImportRows,
    importPage,
    setImportPage,
    importTotalPages,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    expandedDiffRowIndices,
    toggleDiffRow,
    channels,
    tasks,
    nearbyTasks,
    importDefaultChannelId,
    setImportDefaultChannelId,
    importDefaultStatus,
    setImportDefaultStatus,
    contentStatuses,
    isRunningAiMatch,
    aiMatchProgress,
    showPasteBox,
    setShowPasteBox,
    rawCsvPaste,
    setRawCsvPaste,
    importSummary,
    processCsvText,
    handleFileChange,
    handleRunAiSmartMatch,
    handleRowActionChange,
    handleRowTargetTaskChange,
    handleBulkActionForFiltered
}) => {
    return (
        <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
            {/* 1. Pinned Upload & Default Settings Toolbar */}
            <ImportUploadToolbar
                fileInputRef={fileInputRef}
                importedFileName={importedFileName}
                detectedHeadersCount={detectedHeaders.length}
                parsedRowsCount={parsedRows.length}
                channels={channels}
                importDefaultChannelId={importDefaultChannelId}
                setImportDefaultChannelId={setImportDefaultChannelId}
                importDefaultStatus={importDefaultStatus}
                setImportDefaultStatus={setImportDefaultStatus}
                contentStatuses={contentStatuses}
                isRunningAiMatch={isRunningAiMatch}
                aiMatchProgress={aiMatchProgress}
                showPasteBox={showPasteBox}
                setShowPasteBox={setShowPasteBox}
                handleFileChange={handleFileChange}
                handleRunAiSmartMatch={handleRunAiSmartMatch}
            />

            {/* 2. Animated Collapsible Raw CSV Paste Drawer */}
            <AnimatePresence initial={false}>
                {showPasteBox && (
                    <motion.div
                        key="csv-paste-drawer"
                        variants={collapsibleDrawerVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="flex-shrink-0 overflow-hidden"
                    >
                        <div className="p-3 bg-[#F4EFE6] rounded-2xl border border-[#E5DDD0] space-y-2">
                            <label className="text-xs font-bold text-[#5A5044] block">
                                วางข้อความ CSV หรือหัวคอลัมน์จาก Metricool ที่นี่:
                            </label>
                            <textarea
                                rows={3}
                                value={rawCsvPaste}
                                onChange={e => setRawCsvPaste(e.target.value)}
                                placeholder={
                                    'Text,Date,Time,Draft,Facebook,Twitter/X,LinkedIn,GBP,Instagram,Pinterest,TikTok,Youtube...\n"5 อันดับน้าค่อมฮาๆ #ตลก #มีม",2026-09-29,06:00,false,true,false,false,false,true,false,true,true'
                                }
                                className="w-full p-2.5 text-xs font-mono bg-[#FFFDF9] text-[#4A4238] border border-[#DED4C6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#567A63]/30"
                            />
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (rawCsvPaste.trim()) {
                                            processCsvText(rawCsvPaste.trim(), 'ข้อมูลที่วางจากคลิปบอร์ด');
                                            setShowPasteBox(false);
                                        }
                                    }}
                                    className="px-4 py-1.5 bg-[#567A63] text-white text-xs font-bold rounded-xl hover:bg-[#476853] transition-colors"
                                >
                                    แปลงข้อมูล CSV
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3. Full-Height Preview Table or Contained Dropzone */}
            {parsedRows.length === 0 ? (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden p-4 sm:p-6 text-center bg-[#F6F2EA] hover:bg-[#EDF3EF]/70 rounded-2xl border-2 border-dashed border-[#DED4C6] hover:border-[#9AB8A5] cursor-pointer transition-all"
                >
                    {/* Using `my-auto` prevents flex justify-center from pushing the icon above top border when height is compact */}
                    <div className="my-auto flex flex-col items-center justify-center max-w-lg mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-[#E6EFE9] border border-[#C5DBD0] text-[#4F735B] flex items-center justify-center mb-2.5 shadow-2xs shrink-0">
                            <Upload className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-[#4A4238]">
                            คลิกเพื่ออัปโหลดไฟล์ `.csv` จาก Metricool (รองรับ 200–300+ แถว)
                        </p>
                        <p className="text-xs text-[#7D7265] mt-1 leading-relaxed">
                            รองรับไฟล์ Export แท้จาก Metricool ครบ 96 คอลัมน์ ระบบจะแยกชื่อคลิปออกจาก #แฮชแท็ก อัตโนมัติ รวมแถวซ้ำในวันเดียวกัน และเปิดตาราง Preview ให้ตรวจสอบก่อนบันทึกจริง
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
                    {/* Status Filter, Search & Bulk Action Bar */}
                    <ImportFilterSearchBar
                        totalRowsCount={parsedRows.length}
                        filteredRowsCount={filteredImportRows.length}
                        importSummary={importSummary}
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        onBulkAction={handleBulkActionForFiltered}
                    />

                    {/* Scrollable Table Container + Pagination Bar */}
                    <div className="flex-1 min-h-0 flex flex-col border border-[#E5DDD0] rounded-2xl overflow-hidden bg-[#FFFDF9]">
                        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 z-10 bg-[#F4EFE6]/95 backdrop-blur-sm border-b border-[#E5DDD0] text-[11px] font-bold text-[#6E6355] uppercase">
                                    <tr>
                                        <th className="py-2.5 px-3">วัน-เวลาใน CSV</th>
                                        <th className="py-2.5 px-3">ชื่อคลิป (ตัด #แท็ก) & แคปชัน</th>
                                        <th className="py-2.5 px-3">ผลการจับคู่ & เทียบข้อมูล</th>
                                        <th className="py-2.5 px-3">การทำงาน (Action)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#EFE9DF] text-xs">
                                    {paginatedImportRows.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="py-8 text-center text-xs font-semibold text-[#7D7265]"
                                            >
                                                ไม่พบแถวที่ตรงกับตัวกรองหรือคำค้นหา
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedImportRows.map(row => {
                                            const matchedTask = row.matchedTaskId
                                                ? tasks.find(t => t.id === row.matchedTaskId)
                                                : undefined;
                                            return (
                                                <ImportPreviewRow
                                                    key={row.rowIndex}
                                                    row={row}
                                                    matchedTask={matchedTask}
                                                    nearbyTasks={nearbyTasks}
                                                    isDiffExpanded={expandedDiffRowIndices.has(
                                                        row.rowIndex
                                                    )}
                                                    onToggleDiff={toggleDiffRow}
                                                    onActionChange={handleRowActionChange}
                                                    onTargetTaskChange={handleRowTargetTaskChange}
                                                />
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <TablePaginationBar
                            currentPage={importPage}
                            totalPages={importTotalPages}
                            totalItems={filteredImportRows.length}
                            onPageChange={setImportPage}
                        />
                    </div>
                </div>
            )}
        </div>
    );
});

export default MetricoolImportTab;
