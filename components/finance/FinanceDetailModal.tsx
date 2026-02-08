
import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calculator, Lightbulb, TrendingUp, TrendingDown, PieChart, ArrowRight, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { FinanceTransaction } from '../../types';
import { format } from 'date-fns';

interface FinanceDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'INCOME' | 'EXPENSE' | 'PROFIT' | null;
    transactions: FinanceTransaction[];
    stats: { totalIncome: number; totalExpense: number; netProfit: number };
}

const FinanceDetailModal: React.FC<FinanceDetailModalProps> = ({ isOpen, onClose, type, transactions, stats }) => {
    const [showTip, setShowTip] = useState(true);

    // --- Calculation Logic (Always run hooks) ---
    const { filteredTransactions, breakdown, formula } = useMemo(() => {
        if (!type) return { filteredTransactions: [], breakdown: [], formula: '' };

        let filtered: FinanceTransaction[] = [];
        let group: Record<string, number> = {};
        let logicText = '';

        if (type === 'INCOME') {
            filtered = transactions.filter(t => t.type === 'INCOME');
            logicText = 'Total Income = Sum(Project Fee + Adsense + Sponsor)';
        } else if (type === 'EXPENSE') {
            filtered = transactions.filter(t => t.type === 'EXPENSE');
            logicText = 'Total Expense = Sum(Salary + Equipment + Ops Cost)';
        } else {
            // Profit
            filtered = transactions; 
            logicText = 'Net Profit = Total Income (Revenue) - Total Expense (Cost)';
        }

        // Group by Category Label
        filtered.forEach(t => {
            const label = t.categoryLabel || t.categoryKey;
            const amount = t.netAmount || t.amount;
            group[label] = (group[label] || 0) + amount;
        });

        // Sort breakdown
        const sortedBreakdown = Object.entries(group)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        return { filteredTransactions: filtered, breakdown: sortedBreakdown, formula: logicText };
    }, [type, transactions]);

    // --- Early Return (Must be after hooks) ---
    if (!isOpen || !type) return null;

    // --- Config based on Type (Safe to access type here) ---
    const config = {
        INCOME: {
            title: 'เจาะลึกรายรับ (Revenue Breakdown)',
            icon: TrendingUp,
            color: 'text-green-600',
            bg: 'bg-green-50',
            border: 'border-green-100',
            total: stats.totalIncome,
            tips: [
                "💡 Tip: ควรแยกบัญชีรับเงินบริษัทออกจากบัญชีส่วนตัว เพื่อให้เห็น Cashflow ที่แท้จริง",
                "📄 ใบหัก ณ ที่จ่าย (50 ทวิ) ที่ลูกค้าหักเราไป คือ 'เงินสดล่วงหน้า' ที่เราจ่ายภาษีไปแล้ว อย่าลืมเก็บหนังสือรับรองไว้ขอคืนภาษีตอนสิ้นปี!",
                "📈 ลองสังเกตดูว่ารายรับก้อนใหญ่มาจากลูกค้าเก่าหรือใหม่ ถ้ามาจากลูกค้าเก่าเยอะ แสดงว่าบริการเราดีจนเค้าบอกต่อ"
            ]
        },
        EXPENSE: {
            title: 'วิเคราะห์รายจ่าย (Cost Analysis)',
            icon: TrendingDown,
            color: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-100',
            total: stats.totalExpense,
            tips: [
                "💡 Tip: ค่าใช้จ่ายบางอย่างเป็น Fixed Cost (เช่น เงินเดือน) ที่ต้องจ่ายทุกเดือน ควรสำรองเงินสดให้พอจ่ายอย่างน้อย 3-6 เดือน",
                "🧾 บิลค่าน้ำมัน, ทางด่วน, ค่ารับรองลูกค้า สามารถนำมาเป็นค่าใช้จ่ายบริษัทได้ (ถ้าจดทะเบียน) ช่วยลดภาษีได้เยอะ",
                "⚠️ ระวัง 'ค่าใช้จ่ายแฝง' เช่น ค่า Subscription รายเดือนที่ไม่ได้ใช้แล้ว ให้รีบยกเลิก"
            ]
        },
        PROFIT: {
            title: 'ผลกำไรสุทธิ (Net Profit Analysis)',
            icon: PieChart,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            border: 'border-indigo-100',
            total: stats.netProfit,
            tips: [
                "💡 Profit Margin (อัตรากำไร) ควรอยู่ที่ 20-30% สำหรับงาน Production ถ้าต่ำกว่านี้ อาจต้องปรับราคาหรือลดต้นทุน",
                "💰 'กำไรทางบัญชี' ไม่เท่ากับ 'เงินสดในมือ' (Cashflow) ระวังเรื่อง Credit Term ที่ยาวเกินไป อาจทำให้ขาดสภาพคล่องได้",
                "🏦 กำไรที่ได้มา ควรแบ่ง 30% เก็บไว้เป็นทุนสำรองบริษัท (Retained Earnings) อย่าเพิ่งปันผลหมด"
            ]
        }
    }[type];

    const marginPercent = stats.totalIncome > 0 ? ((stats.netProfit / stats.totalIncome) * 100).toFixed(1) : '0';

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className={`bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 border-4 ${config.border}`}>
                
                {/* Header */}
                <div className={`px-8 py-6 border-b flex justify-between items-center ${config.bg} ${config.border}`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 bg-white rounded-2xl shadow-sm ${config.color}`}>
                            <config.icon className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className={`text-2xl font-black ${config.color}`}>{config.title}</h3>
                            <p className="text-gray-500 font-medium text-sm">รายละเอียดและการคำนวณ</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/50 hover:bg-white rounded-full transition-colors text-gray-500 hover:text-red-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-[#f8fafc] space-y-8">
                    
                    {/* 1. The Math (Formula) */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
                        <div className={`absolute top-0 left-0 w-2 h-full ${config.bg.replace('50', '400')}`}></div>
                        <div className="flex justify-between items-start mb-4">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center">
                                <Calculator className="w-4 h-4 mr-2" /> วิธีคิด (Logic)
                            </h4>
                            <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">System Algorithm</span>
                        </div>
                        
                        <div className="text-center py-2">
                            <div className="text-lg font-bold text-gray-600 mb-2 font-mono">{formula}</div>
                            {type === 'PROFIT' ? (
                                <div className="flex items-center justify-center gap-4 text-2xl font-black">
                                    <span className="text-green-600">{stats.totalIncome.toLocaleString()}</span>
                                    <span className="text-gray-300">-</span>
                                    <span className="text-red-600">{stats.totalExpense.toLocaleString()}</span>
                                    <span className="text-gray-300">=</span>
                                    <span className={`text-3xl ${stats.netProfit >= 0 ? 'text-indigo-600' : 'text-orange-500'}`}>{stats.netProfit.toLocaleString()}</span>
                                </div>
                            ) : (
                                <div className={`text-4xl font-black ${config.color}`}>
                                    ฿ {config.total.toLocaleString()}
                                </div>
                            )}
                            
                            {type === 'PROFIT' && (
                                <div className="mt-4 inline-block bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
                                    <span className="text-indigo-800 font-bold text-sm">Net Margin: {marginPercent}%</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. Breakdown (Visual Bar) */}
                    {type !== 'PROFIT' && breakdown.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-gray-700 ml-1">สัดส่วน (Breakdown)</h4>
                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                                {breakdown.map((item, idx) => {
                                    const percent = (item.value / config.total) * 100;
                                    return (
                                        <div key={idx}>
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-sm font-bold text-gray-600">{item.name}</span>
                                                <span className="text-sm font-bold text-gray-800">{item.value.toLocaleString()} <span className="text-xs text-gray-400">({percent.toFixed(1)}%)</span></span>
                                            </div>
                                            <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${config.bg.replace('50', '500')}`} 
                                                    style={{ width: `${percent}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* 3. PRO TIPS (Expandable) */}
                    <div className={`rounded-3xl border-2 transition-all duration-300 overflow-hidden ${showTip ? `${config.bg} ${config.border}` : 'bg-white border-gray-200'}`}>
                        <button 
                            onClick={() => setShowTip(!showTip)}
                            className="w-full px-6 py-4 flex justify-between items-center hover:bg-black/5 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${showTip ? 'bg-white' : 'bg-gray-100'} shadow-sm`}>
                                    <Lightbulb className={`w-5 h-5 ${showTip ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
                                </div>
                                <span className={`font-bold ${showTip ? config.color : 'text-gray-500'}`}>Mentor's Secret Tips (เทคนิคลับ)</span>
                            </div>
                            {showTip ? <ChevronUp className="w-5 h-5 opacity-50"/> : <ChevronDown className="w-5 h-5 opacity-50"/>}
                        </button>
                        
                        {showTip && (
                            <div className="px-6 pb-6 pt-2">
                                <ul className="space-y-3">
                                    {config.tips.map((tip, i) => (
                                        <li key={i} className="flex gap-3 text-sm text-gray-700 leading-relaxed bg-white/60 p-3 rounded-xl border border-black/5">
                                            <Info className="w-5 h-5 shrink-0 mt-0.5 opacity-50" />
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>,
        document.body
    );
};

export default FinanceDetailModal;
