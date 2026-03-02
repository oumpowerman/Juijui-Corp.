import React from 'react';
import { ShoppingBag, RotateCcw, Coins, Info } from 'lucide-react';
import { ConfigSlider } from './components/SharedComponents';
import { motion } from 'framer-motion';

interface ShopTunerProps {
    localConfig: any;
    handleChange: (section: string, key: string, value: any) => void;
}

const ShopTuner: React.FC<ShopTunerProps> = ({ localConfig, handleChange }) => {
    return (
        <div className="space-y-8">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-purple-50/50 backdrop-blur-sm p-8 rounded-3xl border border-purple-100 shadow-sm text-center relative overflow-hidden"
            >
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200"></div>
                 <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 text-purple-600 shadow-md shadow-purple-100 rotate-3 transform hover:rotate-6 transition-transform duration-300">
                     <ShoppingBag className="w-10 h-10" />
                 </div>
                 <h3 className="text-xl font-black text-purple-900">Item Shop Mechanics</h3>
                 <p className="text-purple-600/70 text-sm mt-2 max-w-md mx-auto">
                    ควบคุมกลไกเศรษฐกิจของร้านค้า การคืนเงิน และภาษี เพื่อรักษาสมดุลของค่าเงินในระบบ
                 </p>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
                <div className="bg-white p-1 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-5">
                        <div className="flex items-center gap-2 mb-4 text-indigo-600 font-bold text-sm uppercase tracking-wider">
                            <RotateCcw className="w-4 h-4" /> Refund Policy
                        </div>
                        <ConfigSlider 
                            label="Time Warp Refund %" 
                            value={localConfig.ITEM_MECHANICS?.time_warp_refund_percent || 100} 
                            min={50} max={100} step={10} unit="%"
                            icon={RotateCcw} color="indigo"
                            onChange={(v: number) => handleChange('ITEM_MECHANICS', 'time_warp_refund_percent', v)}
                        />
                        <p className="text-[10px] text-slate-400 mt-3 flex gap-2 leading-relaxed">
                            <Info className="w-4 h-4 flex-shrink-0 text-indigo-400" />
                            เปอร์เซ็นต์เงินคืนเมื่อผู้เล่นใช้ไอเทม "Time Warp" (ย้อนเวลา) แล้วทำงานสำเร็จตามเป้าหมาย (100% = คืนทุนเต็มจำนวน)
                        </p>
                    </div>
                </div>
                
                <div className="bg-white p-1 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-5">
                        <div className="flex items-center gap-2 mb-4 text-slate-600 font-bold text-sm uppercase tracking-wider">
                            <Coins className="w-4 h-4" /> Tax System
                        </div>
                        <ConfigSlider 
                            label="Shop Tax Rate" 
                            value={localConfig.ITEM_MECHANICS?.shop_tax_rate || 0} 
                            min={0} max={20} step={1} unit="%"
                            icon={Coins} color="slate"
                            onChange={(v: number) => handleChange('ITEM_MECHANICS', 'shop_tax_rate', v)}
                        />
                        <p className="text-[10px] text-slate-400 mt-3 flex gap-2 leading-relaxed">
                            <Info className="w-4 h-4 flex-shrink-0 text-slate-400" />
                            ภาษีที่หักออกจากราคาสินค้าเมื่อมีการซื้อขาย (ใช้เพื่อดึงเงินออกจากระบบ ลดภาวะเงินเฟ้อ)
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ShopTuner;
