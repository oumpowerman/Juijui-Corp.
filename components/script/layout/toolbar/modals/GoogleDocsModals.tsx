import React from 'react';
import { motion } from 'framer-motion';
import { Check, ExternalLink } from 'lucide-react';
import { GoogleDocsIcon } from '../components/GoogleDocsIcon';

interface GoogleDocsModalsProps {
    showExportConfirm: boolean;
    setShowExportConfirm: (show: boolean) => void;
    isExporting: boolean;
    showSuccessModal: boolean;
    setShowSuccessModal: (show: boolean) => void;
    exportResult: { id: string, name: string, webViewLink: string } | null;
    title: string;
    handleExport: () => void;
}

export const GoogleDocsModals: React.FC<GoogleDocsModalsProps> = ({
    showExportConfirm,
    setShowExportConfirm,
    isExporting,
    showSuccessModal,
    setShowSuccessModal,
    exportResult,
    title,
    handleExport,
}) => {
    return (
        <>
            {/* Google Docs Confirmation Dialog */}
            {showExportConfirm && (
                <div className="fixed inset-0 z-[10100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-gray-100 relative"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-blue-50 text-[#1a73e8] rounded-xl">
                                <GoogleDocsIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">ยืนยันการส่งออกไป Google Docs</h3>
                        </div>

                        <p className="text-sm font-medium text-gray-600 mb-6 leading-relaxed">
                            คุณต้องการส่งออกสคริปต์ <span className="font-bold text-gray-900">“{title || 'Untitled Script'}”</span> นี้ไปยัง Google Docs หรือไม่?
                            <br />
                            <span className="text-xs text-gray-400 font-normal block mt-2 leading-relaxed">
                                (ระบบจะสร้างเอกสารเพื่อเชื่อมโยงแชร์กับลูกค้าของคุณให้อัตโนมัติ ปราศจากการของเข้าถึงไฟล์ส่วนตัวอื่นๆ ของคุณตามมาตรฐานสิทธิ์ขับเคลื่อน drive.file ขั้นต่ำสุด)
                            </span>
                        </p>

                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => setShowExportConfirm(false)}
                                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
                            >
                                ยกเลิก (Cancel)
                            </button>
                            <button
                                onClick={handleExport}
                                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md hover:shadow-lg shadow-blue-100 transition-all flex items-center gap-2"
                            >
                                <GoogleDocsIcon className="w-3.5 h-3.5 brightness-0 invert" />
                                เริ่มส่งข้อมูล (Export)
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Spinning Loader & Progress Backdrop */}
            {isExporting && (
                <div className="fixed inset-0 z-[10200] flex flex-col items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl">
                        <div className="relative w-20 h-20 mx-auto">
                            {/* Pulse background */}
                            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping duration-1000"></div>
                            {/* Inner rotating ring */}
                            <div className="absolute inset-0 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin duration-700"></div>
                            <div className="absolute inset-4 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-inner">
                                <GoogleDocsIcon className="w-8 h-8 animate-pulse" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-white font-bold text-lg tracking-wide animate-pulse">
                                Formatting & Transferring...
                            </h4>
                            <p className="text-gray-300 text-xs leading-relaxed">
                                ระบบกำลังแปลงโครงสร้าง Tag, ปรับสไตล์ตัวหนังสือ และทำการเชื่อมต่อเขียนไฟล์ไปยังระบบคลาวด์เอกสาร...
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && exportResult && (
                <div className="fixed inset-0 z-[10100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-gray-100 relative text-center"
                    >
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
                            <Check className="w-8 h-8 text-green-500" />
                        </div>

                        <h3 className="text-xl font-bold text-gray-800 mb-2">ส่งออกเอกสารสำเร็จแล้ว!</h3>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            ระบบได้สอดแทรกหัวข้อบทภาพยนตร์ ปรับสไตล์ตัวหนา และโครงสร้างเรียงลำดับลงบน Google Docs ในชื่อ <span className="font-bold text-gray-800">“{exportResult.name || title}”</span> เรียบร้อยแล้ว
                        </p>

                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-left mb-6 flex items-start gap-4">
                            <GoogleDocsIcon className="w-10 h-10 shrink-0" />
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">เอกสารพร้อมเปิด:</p>
                                <p className="text-sm font-semibold text-gray-800 truncate">{exportResult.name}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <a
                                href={exportResult.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2 border border-emerald-400"
                            >
                                <ExternalLink className="w-4 h-4 text-white" />
                                เปิดดูผลงานบน Google Doc
                            </a>
                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="w-full py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all"
                            >
                                ปิดหน้าต่าง (Close)
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </>
    );
};
