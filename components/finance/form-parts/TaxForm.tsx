
import React from 'react';
import { Receipt, Building2, UserSquare } from 'lucide-react';

interface Props {
    hasVat: boolean;
    setHasVat: (v: boolean) => void;
    whtRate: number;
    setWhtRate: (r: number) => void;
    entityName: string;
    setEntityName: (v: string) => void;
    taxId: string;
    setTaxId: (v: string) => void;
    taxInvoiceNo: string;
    setTaxInvoiceNo: (v: string) => void;
    
    // Calculated Display Values
    baseAmount: number;
    vatAmount: number;
    whtAmount: number;
    netAmount: number;
}

const TaxForm: React.FC<Props> = ({ 
    hasVat, setHasVat, whtRate, setWhtRate, 
    entityName, setEntityName, taxId, setTaxId, taxInvoiceNo, setTaxInvoiceNo,
    baseAmount, vatAmount, whtAmount, netAmount
}) => {
    return (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Receipt className="w-4 h-4 text-slate-500" />
                <h4 className="text-xs font-bold text-slate-600 uppercase">ข้อมูลภาษี (Tax Info)</h4>
            </div>

            {/* Checkboxes & Radios */}
            <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={hasVat} 
                        onChange={e => setHasVat(e.target.checked)} 
                        className="w-4 h-4 accent-indigo-600 rounded"
                    />
                    <span className="text-xs font-bold text-gray-700">มี VAT 7%</span>
                </label>

                <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
                    <span className="text-xs text-gray-500 font-bold">WHT:</span>
                    {[0, 1, 3, 5].map(rate => (
                        <label key={rate} className="flex items-center gap-1 cursor-pointer">
                            <input 
                                type="radio" 
                                name="whtRate" 
                                checked={whtRate === rate} 
                                onChange={() => setWhtRate(rate)} 
                                className="w-3 h-3 accent-orange-500"
                            />
                            <span className="text-xs text-gray-600 font-medium">{rate === 0 ? 'None' : `${rate}%`}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Entity Details (Only if Tax is involved) */}
            {(hasVat || whtRate > 0) && (
                <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2">
                    <div className="col-span-2">
                        <label className="text-[10px] font-bold text-gray-400 block mb-1">ชื่อผู้รับ/จ่ายเงิน (Entity Name)</label>
                        <div className="relative">
                            <UserSquare className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text" 
                                value={entityName} 
                                onChange={e => setEntityName(e.target.value)} 
                                className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-xs font-bold focus:border-indigo-400 outline-none"
                                placeholder="เช่น บริษัท เอบีซี จำกัด"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1">เลขผู้เสียภาษี (Tax ID)</label>
                        <input 
                            type="text" 
                            value={taxId} 
                            onChange={e => setTaxId(e.target.value)} 
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold focus:border-indigo-400 outline-none"
                            placeholder="0000000000000"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1">เลขใบกำกับ (Inv No.)</label>
                        <input 
                            type="text" 
                            value={taxInvoiceNo} 
                            onChange={e => setTaxInvoiceNo(e.target.value)} 
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold focus:border-indigo-400 outline-none"
                            placeholder="INV-2024-..."
                        />
                    </div>
                </div>
            )}

            {/* Calculation Summary */}
            <div className="bg-white rounded-xl border border-slate-100 p-3 text-xs space-y-1">
                <div className="flex justify-between text-gray-500">
                    <span>ยอดก่อนภาษี (Base)</span>
                    <span>{baseAmount.toLocaleString()}</span>
                </div>
                {hasVat && (
                    <div className="flex justify-between text-indigo-600">
                        <span>VAT (7%)</span>
                        <span>+{vatAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                )}
                {whtRate > 0 && (
                    <div className="flex justify-between text-orange-600">
                        <span>หัก ณ ที่จ่าย ({whtRate}%)</span>
                        <span>-{whtAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                )}
                <div className="flex justify-between font-black text-sm border-t border-dashed border-gray-200 pt-1 mt-1">
                    <span className="text-gray-800">ยอดชำระสุทธิ (Net)</span>
                    <span className="text-green-600">{netAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
            </div>
        </div>
    );
};

export default TaxForm;
