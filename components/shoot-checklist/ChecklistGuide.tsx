import React from 'react';
import {
    PackageOpen,
    RotateCcw,
    Trash2,
    Camera,
    Layers,
    PackageCheck,
    Truck,
    ArchiveRestore,
    History
} from 'lucide-react';

const ChecklistGuide: React.FC = () => {
    return (
        <div className="space-y-6 font-sans">
            {/* Intro Card */}
            <div className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h4 className="text-xl font-bold mb-2 flex items-center">
                        🎒 จัดเป๋าออกกอง 3 รอบ (Smart Shoot Checklist)
                    </h4>
                    <p className="text-teal-50 leading-relaxed font-medium text-sm">
                        เช็คของครบตั้งแต่หยิบออกจากคลัง ยกกลับจากหน้างาน จนถึงคืนเข้าคลัง! <br />
                        บันทึกชื่อและเวลาคนที่ติ๊กอุปกรณ์แต่ละชิ้นแบบ Real-time พร้อมเก็บ Report ย้อนหลังดูได้ตลอดเวลา
                    </p>
                </div>
                <div className="absolute right-[-20px] bottom-[-20px] opacity-20 rotate-12">
                    <Camera className="w-32 h-32" />
                </div>
            </div>

            {/* 3-Round Lifecycle */}
            <section>
                <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-teal-500" /> ระบบตรวจเช็ค 3 รอบการออกกอง
                </h3>

                <div className="space-y-3">
                    <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm flex gap-3.5">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 font-bold">
                            <PackageCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h5 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                รอบที่ 1: หยิบออกจากคลังไปใช้
                                <span className="text-[11px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-semibold">
                                    Check-out
                                </span>
                            </h5>
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                เลือกชุด Preset ระบบจะตั้งชื่อคิวตาม <b>Preset + วันที่</b> ให้อัตโนมัติ เมื่อเช็คของลงกระเป๋าครบแล้วให้กด <b>ส่งรายงานรอบที่ 1</b> ระบบจะรีเซ็ตติ๊กถูกและเลื่อนไปรอบที่ 2 ทันที
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm flex gap-3.5">
                        <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0 font-bold">
                            <Truck className="w-5 h-5" />
                        </div>
                        <div>
                            <h5 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                รอบที่ 2: ยกกลับจากหน้างาน
                                <span className="text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-semibold">
                                    Pack Back
                                </span>
                            </h5>
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                หลังเลิกกอง ไล่ติ๊กอุปกรณ์ทุกชิ้นก่อนขึ้นรถกลับเพื่อไม่ให้ลืมของไว้ที่โลเคชั่น แล้วกด <b>ส่งรายงานรอบที่ 2</b>
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm flex gap-3.5">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 font-bold">
                            <ArchiveRestore className="w-5 h-5" />
                        </div>
                        <div>
                            <h5 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                รอบที่ 3: คืนเข้าคลังอุปกรณ์
                                <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-semibold">
                                    Return to Studio
                                </span>
                            </h5>
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                เมื่อถึงออฟฟิศ ติ๊กของเก็บเข้าชั้นวางแล้วกด <b>ส่งรายงานรอบที่ 3</b> เพื่อปิดจบทริปอย่างสมบูรณ์!
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* History & Reset Info */}
            <section className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    เครื่องมือช่วยจัดการหน้างาน
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex items-start gap-2.5">
                        <div className="p-2 bg-white rounded-lg border border-gray-200 text-indigo-600">
                            <History className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-800 text-xs">ประวัติการออกกอง</p>
                            <p className="text-[11px] text-gray-500">
                                ดูย้อนหลังว่าแต่ละทริปใครติ๊กอะไรไปเวลาไหน หรือดึงทริปที่ยังไม่จบกลับมาเช็คต่อ
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                        <div className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500">
                            <RotateCcw className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-800 text-xs">ปุ่มรีเซ็ตติ๊ก</p>
                            <p className="text-[11px] text-gray-500">
                                เอาติ๊กถูกในรอบปัจจุบันออกเพื่อเริ่มติ๊กใหม่โดยที่รายการของยังอยู่ครบ
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                        <div className="p-2 bg-red-50 rounded-lg border border-red-100 text-red-500">
                            <Trash2 className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="font-bold text-red-600 text-xs">ปุ่มล้างกระเป๋า (Clear)</p>
                            <p className="text-[11px] text-gray-500">
                                ลบรายการอุปกรณ์ออกจากหน้าจอเพื่อจัดเซ็ตใหม่ทั้งหมด
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pro Tip */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
                <div className="p-2 bg-white rounded-full text-blue-500 shadow-sm">
                    <PackageOpen className="w-5 h-5" />
                </div>
                <p className="text-xs text-blue-800 font-medium">
                    <b>Pro Tip บนมือถือ:</b> แตะที่แถวอุปกรณ์เพื่อติ๊กด่วนได้ทันที หรือแตะปุ่มรูปภาพด้านขวาของแถวหากต้องการดูรูปตัวอย่างอุปกรณ์ก่อนหยิบ!
                </p>
            </div>
        </div>
    );
};

export default ChecklistGuide;
