import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, PayrollCycle, PayrollSlip } from '../types';
import MentorTip from '../components/MentorTip';
import { DollarSign, FileText, PieChart, Wallet, Plus, Calendar, MapPin, RefreshCw, ArrowRight, Loader2, ArrowLeft, ChevronLeft, ChevronRight, Globe, Coins } from 'lucide-react';
import AppBackground, { BackgroundTheme } from '../components/common/AppBackground';
import { useFinance } from '../hooks/useFinance';
import { useMasterData } from '../hooks/useMasterData';
import { useTasks } from '../hooks/useTasks'; 
import { startOfMonth, endOfMonth, addMonths, format } from 'date-fns';

import FinanceDashboard from '../components/finance/FinanceDashboard';
import TransactionList from '../components/finance/TransactionList';
import TransactionModal from '../components/finance/TransactionModal';
import ShootTripManager from '../components/finance/ShootTripManager'; 
import LocationIntelligence from '../components/finance/location/LocationIntelligence'; // NEW IMPORT
import SponsorshipManager from '../components/finance/sponsorship/SponsorshipManager';

// Payroll Imports
import { usePayroll } from '../hooks/usePayroll';
import PayrollCycleList from '../components/finance/payroll/PayrollCycleList';
import PayrollEditor from '../components/finance/payroll/PayrollEditor';

interface FinanceRouterProps {
    currentUser: User;
    users?: User[]; // Accept users list
    onSelectTask?: (taskId: string) => void;
}

type FinanceTab = 'DASHBOARD' | 'TRANSACTIONS' | 'SPONSORS' | 'TRIPS' | 'LOCATIONS' | 'SALARY';

const FinanceRouter: React.FC<FinanceRouterProps> = ({ currentUser, users = [], onSelectTask }) => {
    // Default tab logic: Admin -> Dashboard, Member -> Salary
    const isAdmin = currentUser.role === 'ADMIN';
    const [currentTab, setCurrentTab] = useState<FinanceTab>(isAdmin ? 'DASHBOARD' : 'SALARY');
    
    // Container ref for smooth scroll management
    const containerRef = useRef<HTMLDivElement>(null);
    const tabNavRef = useRef<HTMLDivElement>(null);

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

    // Seamless Tab Switching Handler with Scroll Management
    const handleSwitchTab = useCallback((nextTab: FinanceTab) => {
        if (currentTab === nextTab) return;
        
        // Find the scrollable container (either window or parent main container in AppShell)
        const scrollableParent = containerRef.current?.closest('main')?.firstElementChild as HTMLElement | null;
        const currentScrollTop = scrollableParent ? scrollableParent.scrollTop : window.scrollY;

        // If scrolled down beyond initial view, smooth scroll up to tab bar/content start
        if (currentScrollTop > 140) {
            if (scrollableParent) {
                scrollableParent.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }

        setCurrentTab(nextTab);
    }, [currentTab]);

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

    return (
        <AppBackground theme="pastel-emerald" pattern="grid" className="min-h-full">
            <div ref={containerRef} className="relative z-10 p-4 md:p-8 space-y-6 animate-in fade-in duration-500 pb-20">
                
                {/* Conditional Header: Hide if in Payroll Editor Mode to give more space */}
                {!activePayrollCycle && (
                <>
                <MentorTip variant="green" messages={[
                    "ระบบบัญชีรองรับการเลือกช่วงเวลาแบบกำหนดเองแล้วนะ!",
                    "ใช้ Location Intelligence เพื่อดูประวัติการถ่ายทำแยกตามสถานที่ได้เลย",
                    "เวลาจ่ายเงินเดือน อย่าลืมตรวจสอบยอดรวมก่อนกด Finalize นะครับ"
                ]} />

                <div className="flex flex-col xl:flex-row justify-between items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center tracking-tight">
                            <span className="text-4xl mr-2">💰</span>
                            {isAdmin ? 'ระบบบัญชี & ทรัพยากร' : 'ข้อมูลเงินเดือน (My Salary)'}
                        </h1>
                        <p className="text-gray-500 text-sm mt-1 font-medium">
                            {isAdmin ? 'จัดการรายรับ รายจ่าย การออกกอง และเงินเดือน' : 'ตรวจสอบสลิปเงินเดือนและประวัติการจ่ายเงิน'}
                        </p>
                    </div>
                    
                    {/* Date Picker & Add Button (Admin Only for Transaction Tab) */}
                    {isAdmin && currentTab === 'TRANSACTIONS' && (
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

                {/* Sticky Navigation Tabs (Admin Only) */}
                {isAdmin && (
                    <div ref={tabNavRef} className="sticky top-0 z-20 -mx-4 md:-mx-8 px-4 md:px-8 py-2.5 bg-emerald-50/80 backdrop-blur-md border-b border-emerald-100/60 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.06)] transition-all">
                        <div className="flex p-1 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200/90 shadow-sm w-fit overflow-x-auto max-w-full">
                            <button 
                                onClick={() => handleSwitchTab('DASHBOARD')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${currentTab === 'DASHBOARD' ? 'bg-emerald-50 text-emerald-600 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <PieChart className="w-4 h-4" /> ภาพรวม
                            </button>
                            <button 
                                onClick={() => handleSwitchTab('TRANSACTIONS')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${currentTab === 'TRANSACTIONS' ? 'bg-emerald-50 text-emerald-600 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <FileText className="w-4 h-4" /> รายการ
                            </button>
                            <button 
                                onClick={() => handleSwitchTab('SPONSORS')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${currentTab === 'SPONSORS' ? 'bg-amber-50 text-amber-600 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Coins className="w-4 h-4 text-amber-500" /> งานสปอนเซอร์ / ลูกค้า
                            </button>
                            <div className="w-px h-6 bg-gray-200 mx-1 self-center"></div>
                            <button 
                                onClick={() => handleSwitchTab('TRIPS')}
                                className={`relative px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${currentTab === 'TRIPS' ? 'bg-orange-50 text-orange-600 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <MapPin className="w-4 h-4" /> จัดการกองถ่าย
                                {/* Notification Badge */}
                                {potentialTrips.length > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] text-white ring-2 ring-white">
                                        {potentialTrips.length}
                                    </span>
                                )}
                            </button>
                            <button 
                                onClick={() => handleSwitchTab('LOCATIONS')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${currentTab === 'LOCATIONS' ? 'bg-indigo-50 text-indigo-600 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Globe className="w-4 h-4" /> แผนที่การถ่าย (Loc Intel)
                            </button>
                            <div className="w-px h-6 bg-gray-200 mx-1 self-center"></div>
                            <button 
                                onClick={() => handleSwitchTab('SALARY')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${currentTab === 'SALARY' ? 'bg-blue-50 text-blue-600 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Wallet className="w-4 h-4" /> เงินเดือน
                            </button>
                        </div>
                    </div>
                )}
                </>
            )}

            {/* Seamless Content Area with min-height & AnimatePresence for smooth transitions */}
            <div className="min-h-[calc(100vh-280px)]">
                <AnimatePresence mode="wait">
                    {isAdmin && currentTab === 'DASHBOARD' && !activePayrollCycle && (
                        <motion.div
                            key="tab-dashboard"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                        >
                            <FinanceDashboard stats={stats} transactions={transactions} />
                        </motion.div>
                    )}

                    {isAdmin && currentTab === 'TRANSACTIONS' && !activePayrollCycle && (
                        <motion.div
                            key="tab-transactions"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                        >
                            <TransactionList 
                                transactions={transactions}
                                onDelete={handleDeleteTransaction}
                                pagination={pagination}
                                isLoading={isLoading}
                            />
                        </motion.div>
                    )}

                    {isAdmin && currentTab === 'SPONSORS' && !activePayrollCycle && (
                        <motion.div
                            key="tab-sponsors"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                        >
                            <SponsorshipManager onSelectTask={onSelectTask} />
                        </motion.div>
                    )}

                    {isAdmin && currentTab === 'TRIPS' && !activePayrollCycle && (
                        <motion.div
                            key="tab-trips"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                        >
                            <ShootTripManager 
                                masterOptions={masterOptions}
                                tasks={tasks}
                            />
                        </motion.div>
                    )}

                    {isAdmin && currentTab === 'LOCATIONS' && !activePayrollCycle && (
                        <motion.div
                            key="tab-locations"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                        >
                            <LocationIntelligence />
                        </motion.div>
                    )}

                    {currentTab === 'SALARY' && (
                        <motion.div
                            key={activePayrollCycle ? `tab-payroll-editor-${activePayrollCycle.id}` : "tab-salary-list"}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                        >
                            {activePayrollCycle ? (
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
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
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
        </AppBackground>
    );
};

export default FinanceRouter;
