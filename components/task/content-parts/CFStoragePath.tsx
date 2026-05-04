
import React from 'react';
import { Folder, HardDrive } from 'lucide-react';

interface CFStoragePathProps {
    localPath: string;
    setLocalPath: (val: string) => void;
}

const CFStoragePath: React.FC<CFStoragePathProps> = ({ localPath, setLocalPath }) => {
    const handlePickPlaceholder = async () => {
        // Since we can't get absolute path, we at least show them why and help them with instructions
        alert('Browser ไม่อนุญาตให้เข้าถึง Path เต็มโดยตรง\n\nแนะนำ: กดปุ่ม Shift + คลิกขวาที่โฟลเดอร์ในคอมพิวเตอร์ของคุณ\nแล้วเลือก "Copy as path" (คัดลอกเป็นเส้นทาง) เพื่อนำมาวางที่นี่ครับ');
    };

    return (
        <div className="relative group transition-all duration-500">
            {/* Background Decoration Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl opacity-10 group-hover:opacity-20 group-focus-within:opacity-40 blur transition duration-500"></div>
            
            <div className="relative bg-white rounded-2xl p-0.5 shadow-sm border border-slate-100">
                <div className="bg-white rounded-[0.9rem] p-4 flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                            <Folder className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Local Storage Path (โฟลเดอร์ในคอม)
                                </label>
                                <button 
                                    type="button"
                                    onClick={handlePickPlaceholder}
                                    className="text-[9px] font-bold text-emerald-500 hover:text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg transition-colors"
                                >
                                    วิธีดึง Path?
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="text"
                                    value={localPath}
                                    onChange={(e) => setLocalPath(e.target.value)}
                                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm text-slate-700 font-bold placeholder:text-slate-200 outline-none"
                                    placeholder='กด Shift + คลิกขวา แล้วเลือก "Copy as path"'
                                />
                                <HardDrive className="w-4 h-4 text-emerald-200" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-3 bg-slate-50/50 p-3 rounded-xl border border-dashed border-slate-200">
                <p className="text-[9px] text-slate-500 leading-relaxed font-medium">
                    <span className="text-emerald-500 font-bold">Smart Tip:</span> การระบุ Path ช่วยให้ทีมงานคนอื่นทราบว่าไฟล์ถูกเก็บไว้ที่ไหน (เช่น <code>D:\Project\EP01</code>) และสามารถ Copy ไปเปิดใน File Explorer ได้ทันที
                </p>
            </div>
        </div>
    );
};

export default CFStoragePath;
