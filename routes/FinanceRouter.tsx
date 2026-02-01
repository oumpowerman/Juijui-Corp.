
import React, { useState } from 'react';
import { User } from '../types';
import MentorTip from '../components/MentorTip';
import { DollarSign, FileText, PieChart, Wallet } from 'lucide-react';

interface FinanceRouterProps {
    currentUser: User;
}

type FinanceTab = 'DASHBOARD' | 'TRANSACTIONS' | 'SALARY';

const FinanceRouter: React.FC<FinanceRouterProps> = ({ currentUser }) => {
    const [currentTab, setCurrentTab] = useState<FinanceTab>('DASHBOARD');

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <MentorTip variant="green" messages={[
                "ระบบบัญชีช่วยให้เราเห็นภาพรวมรายรับ-รายจ่ายของทีม",
                "โปรดตรวจสอบความถูกต้องก่อนบันทึกทุกครั้ง"
            ]} />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 flex items-center tracking-tight">
                        <span className="text-4xl mr-2">💰</span>
                        ระบบบัญชี (Finance & Accounting)
                    </h1>
                    <p className="text-gray-500 text-sm mt-1 font-medium">จัดการรายรับ รายจ่าย และงบประมาณโครงการ</p>
                </div>
            </div>

            {/* Navigation Tabs (Local Router) */}
            <div className="flex p-1 bg-white rounded-xl border border-gray-200 w-fit">
                <button 
                    onClick={() => setCurrentTab('DASHBOARD')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${currentTab === 'DASHBOARD' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <PieChart className="w-4 h-4" /> ภาพรวม (Dashboard)
                </button>
                <button 
                    onClick={() => setCurrentTab('TRANSACTIONS')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${currentTab === 'TRANSACTIONS' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <FileText className="w-4 h-4" /> รายการ (Transactions)
                </button>
                <button 
                    onClick={() => setCurrentTab('SALARY')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${currentTab === 'SALARY' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Wallet className="w-4 h-4" /> เงินเดือน (Payroll)
                </button>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px] bg-white rounded-[2rem] border border-gray-200 p-8 shadow-sm">
                {currentTab === 'DASHBOARD' && (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                            <DollarSign className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700">Financial Dashboard</h3>
                        <p className="text-gray-400 mt-2">พื้นที่สำหรับแสดงกราฟสรุปรายได้และค่าใช้จ่ายของทีม</p>
                        <span className="mt-4 px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full font-mono">Status: Waiting for Dev</span>
                    </div>
                )}

                {currentTab === 'TRANSACTIONS' && (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-10 h-10 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700">Transaction Logs</h3>
                        <p className="text-gray-400 mt-2">พื้นที่สำหรับบันทึกและดูรายการเดินบัญชีรายวัน</p>
                        <span className="mt-4 px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full font-mono">Status: Waiting for Dev</span>
                    </div>
                )}

                {currentTab === 'SALARY' && (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                            <Wallet className="w-10 h-10 text-purple-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700">Payroll System</h3>
                        <p className="text-gray-400 mt-2">พื้นที่สำหรับจัดการเงินเดือนและสลิปเงินเดือน</p>
                        <span className="mt-4 px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full font-mono">Status: Waiting for Dev</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FinanceRouter;
