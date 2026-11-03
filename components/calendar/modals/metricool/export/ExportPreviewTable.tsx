import React, { useMemo } from 'react';
import { Calendar, CheckCircle2, AlertTriangle, HardDrive, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { Task, Channel } from '../../../../../types';
import { inspectTaskMetricoolMedia } from '../../../../../utils/metricoolCsv';
import { PLATFORM_BADGE_STYLE } from '../constants';
import TablePaginationBar from '../common/TablePaginationBar';

interface ExportPreviewTableProps {
    channels: Channel[];
    defaultExportTime: string;
    exportCandidateTasks: Task[];
    paginatedExportTasks: Task[];
    exportPage: number;
    setExportPage: (page: number) => void;
    exportTotalPages: number;
    selectedExportTasks: Task[];
    excludedTaskIds: Set<string>;
    toggleExportTask: (id: string) => void;
    toggleSelectAllExportTasks: () => void;
}

export const ExportPreviewTable: React.FC<ExportPreviewTableProps> = React.memo(({
    channels,
    defaultExportTime,
    exportCandidateTasks,
    paginatedExportTasks,
    exportPage,
    setExportPage,
    exportTotalPages,
    selectedExportTasks,
    excludedTaskIds,
    toggleExportTask,
    toggleSelectAllExportTasks
}) => {
    const mediaReadinessStats = useMemo(() => {
        let readyCount = 0;
        let unmarkedWarningCount = 0;
        let folderWarningCount = 0;

        selectedExportTasks.forEach(task => {
            const info = inspectTaskMetricoolMedia(task);
            if (info.status === 'READY_DRIVE_DIRECT' || info.status === 'READY_EXTERNAL') {
                readyCount += 1;
            } else if (info.status === 'WARNING_DRIVE_FOLDER') {
                folderWarningCount += 1;
            } else if (info.status === 'WARNING_UNMARKED_ASSETS') {
                unmarkedWarningCount += 1;
            }
        });

        return {
            readyCount,
            unmarkedWarningCount,
            folderWarningCount
        };
    }, [selectedExportTasks]);

    return (
        <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
            {/* Table Toolbar Header */}
            <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E6355]">
                    <h4 className="text-xs sm:text-sm font-bold text-[#4A4238]">
                        รายการคอนเทนต์ที่จะส่งออก
                    </h4>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-[#8C4F3E] tabular-nums">
                        เลือก {selectedExportTasks.length} / {exportCandidateTasks.length} รายการ
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-[#3F634D] tabular-nums">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        มีคลิปไฟนอลพร้อมโพสต์ {mediaReadinessStats.readyCount} รายการ
                    </span>
                    {mediaReadinessStats.unmarkedWarningCount > 0 && (
                        <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 font-semibold text-[#8F6532] tabular-nums">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                ยังไม่ติ๊กคลิปไฟนอล {mediaReadinessStats.unmarkedWarningCount} รายการ
                            </span>
                        </>
                    )}
                    {mediaReadinessStats.folderWarningCount > 0 && (
                        <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 font-semibold text-[#9E5240] tabular-nums">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                ติดลิงก์โฟลเดอร์ {mediaReadinessStats.folderWarningCount} รายการ
                            </span>
                        </>
                    )}
                </div>

                {exportCandidateTasks.length > 0 && (
                    <button
                        type="button"
                        onClick={toggleSelectAllExportTasks}
                        className="text-xs font-semibold text-[#4F735B] hover:text-[#35523F] transition-colors shrink-0"
                    >
                        {excludedTaskIds.size > 0 ? 'เลือกทั้งหมด' : 'ยกเลิกการเลือกทั้งหมด'}
                    </button>
                )}
            </div>

            {exportCandidateTasks.length === 0 ? (
                <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6 text-center bg-[#F6F2EA] rounded-2xl border border-dashed border-[#DED4C6]">
                    <div className="w-12 h-12 rounded-2xl bg-[#F5E0D8] text-[#9E5240] flex items-center justify-center mb-3 shadow-2xs">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-[#4A4238]">
                        ไม่พบรายการคอนเทนต์ในช่วงเวลาที่เลือก
                    </p>
                    <p className="text-xs text-[#7D7265] mt-1 max-w-sm">
                        ลองเปลี่ยนตัวกรองช่วงเวลา หรือเปลี่ยนช่อง (Channel) ด้านบนเพื่อค้นหารายการที่จะส่งออก
                    </p>
                </div>
            ) : (
                <div className="flex-1 min-h-0 flex flex-col border border-[#E5DDD0] rounded-2xl overflow-hidden bg-[#FFFDF9]">
                    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10 bg-[#F4EFE6]/95 backdrop-blur-sm border-b border-[#E5DDD0] text-[11px] font-bold text-[#6E6355] uppercase">
                                <tr>
                                    <th className="py-2.5 px-3 w-10 text-center">เลือก</th>
                                    <th className="py-2.5 px-3">วัน-เวลาโพสต์</th>
                                    <th className="py-2.5 px-3">ชื่อคลิป (Title) & แคปชัน (Text)</th>
                                    <th className="py-2.5 px-3">ช่อง (Channel)</th>
                                    <th className="py-2.5 px-3">แพลตฟอร์ม</th>
                                    <th className="py-2.5 px-3">ความพร้อมคลิปไฟนอล (Picture Url 1)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#EFE9DF] text-xs">
                                {paginatedExportTasks.map(task => {
                                    const isSelected = !excludedTaskIds.has(task.id);
                                    const ch = channels.find(c => c.id === task.channelId);
                                    const tDate =
                                        task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
                                    const mediaInspection = inspectTaskMetricoolMedia(task);
                                    const firstClipName =
                                        mediaInspection.validPublishAssets[0]?.name ||
                                        mediaInspection.folderWarningAssets[0]?.name ||
                                        '';

                                    return (
                                        <tr
                                            key={task.id}
                                            onClick={() => toggleExportTask(task.id)}
                                            className={`cursor-pointer transition-colors ${
                                                isSelected
                                                    ? 'bg-[#FFFDF9] hover:bg-[#FAF3EC]'
                                                    : 'bg-[#F4EFE6]/60 opacity-50'
                                            }`}
                                        >
                                            <td className="py-2.5 px-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => {}}
                                                    className="w-4 h-4 rounded text-[#A8644F] focus:ring-[#A8644F]"
                                                />
                                            </td>
                                            <td className="py-2.5 px-3 whitespace-nowrap tabular-nums">
                                                <div className="font-bold text-[#4A4238]">
                                                    {isValid(tDate) ? format(tDate, 'dd/MM/yyyy') : '-'}
                                                </div>
                                                <div className="text-[11px] font-semibold text-[#8C8070]">
                                                    {task.scheduledTime || `${defaultExportTime} (ค่าเริ่มต้น)`}
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-3 max-w-xs">
                                                <div className="font-bold text-[#4A4238] truncate">
                                                    {task.title}
                                                </div>
                                                <div className="text-[11px] text-[#7D7265] truncate">
                                                    {task.description || 'ใช้ชื่อคลิปเป็นแคปชัน'}
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-3 whitespace-nowrap font-semibold text-[#5A5044]">
                                                {ch?.name || 'ไม่ระบุช่อง'}
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <div className="flex flex-wrap items-center gap-1 text-[11px] font-semibold text-[#5A5246]">
                                                    {(task.targetPlatforms || []).map((p, idx, arr) => {
                                                        const badge = PLATFORM_BADGE_STYLE[p] || {
                                                            label: p,
                                                            bg: '',
                                                            text: 'text-[#5A5246]'
                                                        };
                                                        return (
                                                            <React.Fragment key={p}>
                                                                <span className={badge.text}>
                                                                    {badge.label}
                                                                </span>
                                                                {idx < arr.length - 1 && (
                                                                    <span
                                                                        aria-hidden="true"
                                                                        className="text-[#B8AC99]"
                                                                    >
                                                                        ·
                                                                    </span>
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-3 max-w-[240px]">
                                                {mediaInspection.status === 'READY_DRIVE_DIRECT' && (
                                                    <div className="space-y-0.5">
                                                        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#3F634D]">
                                                            <HardDrive className="w-3.5 h-3.5 shrink-0" />
                                                            <span>
                                                                พร้อมโพสต์ (Drive Direct Link
                                                                {mediaInspection.validPublishAssets.length > 1
                                                                    ? ` · ${mediaInspection.validPublishAssets.length} ไฟล์`
                                                                    : ''}
                                                                )
                                                            </span>
                                                        </div>
                                                        <div className="text-[11px] text-[#6E6355] truncate flex items-center gap-1.5">
                                                            <span className="truncate">{firstClipName}</span>
                                                            {mediaInspection.hasThumbnail && (
                                                                <>
                                                                    <span aria-hidden="true">·</span>
                                                                    <span className="inline-flex items-center gap-0.5 text-[#567A63] shrink-0">
                                                                        <ImageIcon className="w-3 h-3" />
                                                                        มีปก
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {mediaInspection.status === 'READY_EXTERNAL' && (
                                                    <div className="space-y-0.5">
                                                        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#3F634D]">
                                                            <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                                                            <span>
                                                                พร้อมโพสต์ (Direct URL
                                                                {mediaInspection.validPublishAssets.length > 1
                                                                    ? ` · ${mediaInspection.validPublishAssets.length} ไฟล์`
                                                                    : ''}
                                                                )
                                                            </span>
                                                        </div>
                                                        <div className="text-[11px] text-[#6E6355] truncate">
                                                            {firstClipName}
                                                        </div>
                                                    </div>
                                                )}

                                                {mediaInspection.status === 'WARNING_DRIVE_FOLDER' && (
                                                    <div className="space-y-0.5">
                                                        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#9E5240]">
                                                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                                            <span>เตือน: เป็นลิงก์โฟลเดอร์ (ใช้ไม่ได้)</span>
                                                        </div>
                                                        <div className="text-[11px] text-[#8F6532] truncate">
                                                            กรุณาเปลี่ยนเป็นลิงก์ไฟล์ .mp4 โดยตรง
                                                        </div>
                                                    </div>
                                                )}

                                                {mediaInspection.status === 'WARNING_UNMARKED_ASSETS' && (
                                                    <div className="space-y-0.5">
                                                        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#8F6532]">
                                                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                                            <span className="tabular-nums">
                                                                ยังไม่ติ๊กคลิปไฟนอล (มี {mediaInspection.unmarkedCandidateCount} ไฟล์แนบ)
                                                            </span>
                                                        </div>
                                                        <div className="text-[11px] text-[#7D7265] truncate">
                                                            ระบบไม่ดึงฟุตเทจดิบ (ส่งเฉพาะแคปชัน)
                                                        </div>
                                                    </div>
                                                )}

                                                {mediaInspection.status === 'NO_MEDIA' && (
                                                    <div className="text-[11px] text-[#8C8070] flex items-center gap-1.5">
                                                        <span>ส่งเฉพาะแคปชัน (ไม่มีไฟล์คลิป)</span>
                                                        {mediaInspection.hasThumbnail && (
                                                            <>
                                                                <span aria-hidden="true">·</span>
                                                                <span className="inline-flex items-center gap-0.5 text-[#567A63] font-semibold">
                                                                    <ImageIcon className="w-3 h-3" />
                                                                    มีปก
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <TablePaginationBar
                        currentPage={exportPage}
                        totalPages={exportTotalPages}
                        totalItems={exportCandidateTasks.length}
                        onPageChange={setExportPage}
                    />
                </div>
            )}
        </div>
    );
});

export default ExportPreviewTable;
