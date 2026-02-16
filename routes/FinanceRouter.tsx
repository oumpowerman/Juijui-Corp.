
import React, { useState, useEffect } from 'react';
import { User, PayrollCycle, PayrollSlip } from '../types';
import MentorTip from '../components/MentorTip';
import { DollarSign, FileText, PieChart, Wallet, Plus, Calendar, MapPin, RefreshCw, ArrowRight, Loader2, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFinance } from '../hooks/useFinance';
import { useMasterData } from '../hooks/useMasterData';
import { useTasks } from '../hooks/useTasks'; 
import { startOfMonth, endOfMonth, addMonths, format } from 'date-fns';

import FinanceDashboard from '../components/finance/FinanceDashboard';
import TransactionList from '../components/finance/TransactionList';
import TransactionModal from '../components/finance/TransactionModal';
import ShootTripManager from '../components/finance/ShootTripManager'; 

// Payroll Imports
import { usePayroll } from '../hooks/usePayroll';
import PayrollCycleList from '../components/finance/payroll/PayrollCycleList';
import PayrollEditor from '../components/finance/payroll/PayrollEditor';

interface FinanceRouterProps {
    currentUser: User;
    users?: User[]; // Accept users list
}

type FinanceTab = 'DASHBOARD' | 'TRANSACTIONS' | 'TRIPS' | 'SALARY';

const FinanceRouter: React.FC<FinanceRouterProps> = ({ currentUser, users = [] }) => {
    // Default tab logic: Admin -> Dashboard, Member -> Salary
    const isAdmin = currentUser.role === 'ADMIN';
    const [currentTab, setCurrentTab] = useState<FinanceTab>(isAdmin ? 'DASHBOARD' : 'SALARY');
    
    // Date Range State
    const [startDate, setStartDate] = useState(startOfMonth(new Date()));
    const [endDate, setEndDate] = useState(endOfMonth(new Date()));
    
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Hooks
    const { 
        transactions, stats, 
        refreshAll, 
        addTransaction, deleteTransaction,
        pagination,
        isLoading,
        potentialTrips // Use potentialTrips for badge
    } = useFinance(currentUser);
    
    const { masterOptions } = useMasterData();
    const { tasks } = useTasks(); 

    // Payroll Hook (New: Integrated Logic)
    const { 
        cycles, currentSlips, isLoading: payrollLoading, isSeniorHR,
        generateCycle, deleteCycle, fetchSlips, 
        updateSlip, deleteSlip, createSlip, 
        sendToReview, respondToSlip, finalizeCycle 
    } = usePayroll(currentUser);
    
    const [activePayrollCycle, setActivePayrollCycle] = useState<PayrollCycle | null>(null);

    const projects = tasks.filter(t => t.type === 'CONTENT');

    // Refetch when date range or page changes
    useEffect(() => {
        if (isAdmin) {
             refreshAll(startDate, endDate, pagination.page);
        }
    }, [startDate, endDate, pagination.page, isAdmin]);

    const handleMonthQuickChange = (offset: number) => {
        const currentMid = new Date((startDate.getTime() + endDate.getTime()) / 2);
        const newMid = addMonths(currentMid, offset);
        setStartDate(startOfMonth(newMid));
        setEndDate(endOfMonth(newMid));
        pagination.setPage(1);
    };

    const handleSaveTransaction = async (data: any) => {
        const success = await addTransaction(data);
        if (success) {
             refreshAll(startDate, endDate, 1);
             return true;
        }
        return false;
    };
    
    const handleDeleteTransaction = async (id: string) => {
        await deleteTransaction(id);
        refreshAll(startDate, endDate, pagination.page);
    }
    
    // Payroll Handlers
    const handleCreateCycle = async () => {
        const monthKey = format(new Date(), 'yyyy-MM');
        await generateCycle(monthKey, users);
    };

    const handleOpenCycle = async (cycle: PayrollCycle) => {
        setActivePayrollCycle(cycle);
        await fetchSlips(cycle.id);
    };

    // If Member (not Senior HR), auto-open their slip if they click a cycle in "WAITING_REVIEW" or "PAID"
    // Or we provide a button "View My Slip"

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            
            {/* Conditional Header: Hide if in Payroll Editor Mode to give more space */}
            {!activePayrollCycle && (
                <>
                <MentorTip variant="green" messages={[
                    "ระบบบัญชีรองรับการเลือกช่วงเวลาแบบกำหนดเองแล้วนะ!",
                    "เวลาจ่ายเงินเดือน อย่าลืมตรวจสอบยอดรวมก่อนกด Finalize นะครับ",
                    "ใช้ตัวกรอง Channel ในหน้าบันทึก เพื่อหางานโปรเจกต์ได้ง่ายขึ้น"
                ]} />

                <div className="flex flex-col xl:flex-row justify-between items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-800 flex items-center tracking-tight">
                            <span className="text-4xl mr-2">💰</span>
                            {isAdmin ? 'ระบบบัญชี (Finance)' : 'ข้อมูลเงินเดือน (My Salary)'}
                        </h1>
                        <p className="text-gray-500 text-sm mt-1 font-medium">
                            {isAdmin ? 'จัดการรายรับ รายจ่าย และเงินเดือน' : 'ตรวจสอบสลิปเงินเดือนและประวัติการจ่ายเงิน'}
                        </p>
                    </div>
                    
                    {/* Date Picker & Add Button (Admin Only for Transaction Tab) */}
                    {isAdmin && currentTab !== 'SALARY' && (
                        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                            <div className="flex items-center bg-white p-1 rounded-xl border border-gray-200 shadow-sm w-full sm:w-auto">
                                <button onClick={() => handleMonthQuickChange(-1)} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors hidden sm:block">
                                    <ChevronLeft className="w-5 h-5"/>
                                </button>
                                
                                <div className="flex items-center gap-2 px-2">
                                    <div className="relative">
                                        <input 
                                            type="date" 
                                            className="w-[110px] text-xs font-bold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:border-indigo-400 outline-none"
                                            value={startDate.toISOString().split('T')[0]}
                                            onChange={(e) => {
                                                if(e.target.value) setStartDate(new Date(e.target.value));
                                                pagination.setPage(1);
                                            }}
                                        />
                                    </div>
                                    <span className="text-gray-300"><ArrowRight className="w-3 h-3"/></span>
                                    <div className="relative">
                                        <input 
                                            type="date" 
                                            className="w-[110px] text-xs font-bold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:border-indigo-400 outline-none"
                                            value={endDate.toISOString().split('T')[0]}
                                            onChange={(e) => {
                                                if(e.target.value) setEndDate(new Date(e.target.value));
                                                pagination.setPage(1);
                                            }}
                                        />
                                    </div>
                                </div>

                                <button onClick={() => handleMonthQuickChange(1)} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors hidden sm:block">
                                    <ChevronRight className="w-5 h-5"/>
                                </button>
                            </div>

                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 whitespace-nowrap"
                            >
                                <Plus className="w-4 h-4 mr-2 stroke-[3px]" /> บันทึกรายการ
                            </button>
                        </div>
                    )}
                </div>

                {/* Navigation Tabs (Admin Only - Members see only Salary by default) */}
                {isAdmin && (
                    <div className="flex p-1 bg-white rounded-xl border border-gray-200 w-fit overflow-x-auto">
                        <button 
                            onClick={() => setCurrentTab('DASHBOARD')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${currentTab === 'DASHBOARD' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <PieChart className="w-4 h-4" /> ภาพรวม
                        </button>
                        <button 
                            onClick={() => setCurrentTab('TRANSACTIONS')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${currentTab === 'TRANSACTIONS' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <FileText className="w-4 h-4" /> รายการ
                        </button>
                        <button 
                            onClick={() => setCurrentTab('TRIPS')}
                            className={`relative px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${currentTab === 'TRIPS' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <MapPin className="w-4 h-4" /> จัดการออกกอง
                            {/* Notification Badge */}
                            {potentialTrips.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] text-white ring-2 ring-white">
                                    {potentialTrips.length}
                                </span>
                            )}
                        </button>
                        <button 
                            onClick={() => setCurrentTab('SALARY')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${currentTab === 'SALARY' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Wallet className="w-4 h-4" /> เงินเดือน
                        </button>
                    </div>
                )}
                </>
            )}

            {/* Content Area */}
            <div className="min-h-[400px]">
                {isAdmin && currentTab === 'DASHBOARD' && !activePayrollCycle && (
                    <FinanceDashboard stats={stats} transactions={transactions} />
                )}

                {isAdmin && currentTab === 'TRANSACTIONS' && !activePayrollCycle && (
                    <TransactionList 
                        transactions={transactions}
                        onDelete={handleDeleteTransaction}
                        pagination={pagination}
                        isLoading={isLoading}
                    />
                )}

                {isAdmin && currentTab === 'TRIPS' && !activePayrollCycle && (
                    <ShootTripManager 
                        masterOptions={masterOptions}
                        tasks={tasks}
                    />
                )}

                {currentTab === 'SALARY' && (
                    activePayrollCycle ? (
                        <PayrollEditor 
                            cycle={activePayrollCycle}
                            slips={currentSlips}
                            allUsers={users} 
                            currentUser={currentUser}
                            isSeniorHR={isSeniorHR}
                            onBack={() => setActivePayrollCycle(null)}
                            onUpdateSlip={updateSlip}
                            onDeleteSlip={deleteSlip} 
                            onCreateSlip={createSlip} 
                            onFinalize={() => finalizeCycle(activePayrollCycle.id)}
                            onSendToReview={(date) => sendToReview(activePayrollCycle.id, date)}
                            onRespondToSlip={respondToSlip}
                        />
                    ) : (
                        <PayrollCycleList 
                            cycles={cycles}
                            onSelect={handleOpenCycle}
                            onCreate={handleCreateCycle}
                            onDelete={deleteCycle}
                            canCreate={isSeniorHR}
                        />
                    )
                )}
            </div>

            {isAdmin && (
                <TransactionModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveTransaction}
                    masterOptions={masterOptions}
                    projects={projects}
                    users={users} 
                />
            )}
        </div>
    );
};

export default FinanceRouter;
