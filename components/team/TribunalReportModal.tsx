
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Send, AlertTriangle, User, FileText, CheckCircle2 } from 'lucide-react';
import { useTribunal } from '../../hooks/useTribunal';
import { useTeam } from '../../hooks/useTeam';
import { useGameConfig } from '../../context/GameConfigContext';
import { User as UserType } from '../../types';

interface TribunalReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: UserType | null;
}

const TribunalReportModal: React.FC<TribunalReportModalProps> = ({ isOpen, onClose, currentUser }) => {
    const { submitReport, isLoading } = useTribunal(currentUser);
    const { allUsers } = useTeam();
    const { config } = useGameConfig();
    
    const [category, setCategory] = useState('');
    const [targetId, setTargetId] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const tribunalCfg = config.TRIBUNAL_CONFIG;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!category || !description) return;

        try {
            await submitReport({
                category,
                target_id: targetId || undefined,
                description
            }, file || undefined);
            
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                // Reset state
                setCategory('');
                setTargetId('');
                setDescription('');
                setFile(null);
                setPreviewUrl(null);
                setIsSuccess(false);
            }, 2000);
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการส่งคำฟ้อง กรุณาลองใหม่อีกครั้ง');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-red-600 p-6 text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-xl">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">ศาลเตี้ยออฟฟิศ</h2>
                                <p className="text-xs opacity-80">แจ้งเหตุไม่พึงประสงค์เพื่อความสงบสุข</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {isSuccess ? (
                        <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center"
                            >
                                <CheckCircle2 className="w-12 h-12" />
                            </motion.div>
                            <h3 className="text-2xl font-bold text-gray-800">ส่งคำฟ้องสำเร็จ!</h3>
                            <p className="text-gray-500">Admin จะทำการพิจารณาคดีในเร็วๆ นี้</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                            {/* Category Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> หมวดหมู่ปัญหา
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {tribunalCfg?.categories?.map((cat: any) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setCategory(cat.label)}
                                            className={`p-3 rounded-2xl text-sm font-medium transition-all border-2 ${
                                                category === cat.label 
                                                ? 'border-red-500 bg-red-50 text-red-700 shadow-sm' 
                                                : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'
                                            }`}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Target Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <User className="w-4 h-4" /> ใครคือคนผิด? (ถ้ามี)
                                </label>
                                <select 
                                    value={targetId}
                                    onChange={(e) => setTargetId(e.target.value)}
                                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:ring-0 transition-all outline-none"
                                >
                                    <option value="">-- ไม่ระบุตัวตน / ไม่ทราบ --</option>
                                    {allUsers?.filter(u => u.id !== currentUser?.id).map(user => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">รายละเอียดเหตุการณ์</label>
                                <textarea 
                                    required
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="พิมพ์ฟ้องแบบฟรีสไตล์ที่นี่..."
                                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:ring-0 transition-all outline-none min-h-[120px] resize-none"
                                />
                            </div>

                            {/* Evidence Upload */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">หลักฐานรูปถ่าย (แนะนำ)</label>
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="relative w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-all overflow-hidden"
                                >
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <Camera className="w-10 h-10 text-gray-400 mb-2" />
                                            <p className="text-sm text-gray-500">กดเพื่อถ่ายรูปหรือเลือกไฟล์</p>
                                        </>
                                    )}
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            {/* Warning Footer */}
                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                                <p className="text-xs text-amber-700 leading-relaxed">
                                    <strong>คำเตือน:</strong> หาก Admin ตรวจพบว่าเป็นการฟ้องเท็จหรือแกล้งกัน 
                                    คุณจะถูกหัก <strong>-{tribunalCfg?.false_report_penalty_hp || 15} HP</strong> ทันที!
                                </p>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading || !category || !description}
                                className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-bold rounded-2xl shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" /> ส่งคำฟ้องเข้าสู่ศาล
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default TribunalReportModal;
