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
        <AppBackground theme="pastel-emerald" pattern="grid" className="h-full flex flex-col overflow-hidden">
            <div ref={containerRef} className="relative z-10 flex flex-col h-full overflow-hidden">
                
                {/* 1. FIXED TOP REGION: Main Title Header + Tabs */}
                {!activePayrollCycle && (
                    <div className="shrink-0 p-4 md:p-6 pb-2.5 space-y-3.5 border-b border-emerald-100/60 bg-emerald-50/40 backdrop-blur-md">
                        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center tracking-tight">
                                    <span className="text-3xl md:text-4xl mr-2">💰</span>
                                    {isAdmin ? 'ระบบบัญชี & ทรัพยากร' : 'ข้อมูลเงินเดือน (My Salary)'}
                                </h1>
                                <p className="text-gray-500 text-xs md:text-sm mt-0.5 font-medium">
                                    {isAdmin ? 'จัดการรายรับ รายจ่าย การออกกอง และเงินเดือน' : 'ตรวจสอบสลิปเงินเดือนและประวัติการจ่ายเงิน'}
                                </p>
                            </div>
                            
                            {/* Date Picker & Add Button (Admin Only for Transaction Tab) */}
                            {isAdmin && currentTab === 'TRANSACTIONS' && (
                                <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
                                    <div className="flex items-center bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                                        <button onClick={() => handleMonthQuickChange(-1)} className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors">
                                            <ChevronLeft className="w-4 h-4"/>
                                        </button>
                                        
                                        <div className="flex items-center gap-1.5 px-1.5">
                                            <input 
                                                type="date" 
                                                className="w-[105px] text-xs font-bold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:border-indigo-400 outline-none"
                                                value={startDate.toISOString().split('T')[0]}
                                                onChange={(e) => {
                                                    if(e.target.value) setStartDate(new Date(e.target.value));
                                                    pagination.setPage(1);
                                                }}
                                            />
                                            <span className="text-gray-300"><ArrowRight className="w-3 h-3"/></span>
                                            <input 
                                                type="date" 
                                                className="w-[105px] text-xs font-bold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:border-indigo-400 outline-none"
                                                value={endDate.toISOString().split('T')[0]}
                                                onChange={(e) => {
                                                    if(e.target.value) setEndDate(new Date(e.target.value));
                                                    pagination.setPage(1);
                                                }}
                                            />
                                        </div>

                                        <button onClick={() => handleMonthQuickChange(1)} className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors">
                                            <ChevronRight className="w-4 h-4"/>
                                        </button>
                                    </div>

                                    <button 
                                        onClick={() => setIsModalOpen(true)}
                                        className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs md:text-sm font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 whitespace-nowrap"
                                    >
                                        <Plus className="w-4 h-4 mr-1.5 stroke-[3px]" /> บันทึกรายการ
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Navigation Tabs (Admin Only) */}
                        {isAdmin && (
                            <div className="flex p-1 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200/90 shadow-sm w-fit overflow-x-auto max-w-full">
                                <button 
                                    onClick={() => handleSwitchTab('DASHBOARD')}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${currentTab === 'DASHBOARD' ? 'bg-emerald-50 text-emerald-600 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <PieChart className="w-3.5 h-3.5" /> ภาพรวม
                                </button>
                                <button 
                                    onClick={() => handleSwitchTab('TRANSACTIONS')}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${currentTab === 'TRANSACTIONS' ? 'bg-emerald-50 text-emerald-600 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <FileText className="w-3.5 h-3.5" /> รายการ
                                </button>
                                <button 
                                    onClick={() => handleSwitchTab('SPONSORS')}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${currentTab === 'SPONSORS' ? 'bg-amber-50 text-amber-600 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Coins className="w-3.5 h-3.5 text-amber-500" /> งานสปอนเซอร์ / ลูกค้า
                                </button>
                                <div className="w-px h-5 bg-gray-200 mx-1 self-center"></div>
                                <button 
                                    onClick={() => handleSwitchTab('TRIPS')}
                                    className={`relative px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${currentTab === 'TRIPS' ? 'bg-orange-50 text-orange-600 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <MapPin className="w-3.5 h-3.5" /> จัดการกองถ่าย
                                    {/* Notification Badge */}
                                    {potentialTrips.length > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] text-white ring-2 ring-white">
                                            {potentialTrips.length}
                                        </span>
                                    )}
                                </button>
                                <button 
                                    onClick={() => handleSwitchTab('LOCATIONS')}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${currentTab === 'LOCATIONS' ? 'bg-indigo-50 text-indigo-600 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Globe className="w-3.5 h-3.5" /> แผนที่การถ่าย (Loc Intel)
                                </button>
                                <div className="w-px h-5 bg-gray-200 mx-1 self-center"></div>
                                <button 
                                    onClick={() => handleSwitchTab('SALARY')}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${currentTab === 'SALARY' ? 'bg-blue-50 text-blue-600 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Wallet className="w-3.5 h-3.5" /> เงินเดือน
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* 2. INDEPENDENT SCROLLABLE CONTENT REGION WITH TOP FADE MASK */}
                <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
                    {/* Top Soft Gradient Blur Overlay to prevent hard edge cuts */}
                    <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-emerald-50/90 via-emerald-50/40 to-transparent pointer-events-none z-10" />

                    <div 
                        className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 pb-24 scrollbar-thin scrollbar-thumb-emerald-200/60 hover:scrollbar-thumb-emerald-300"
                        style={{
                            maskImage: 'linear-gradient(to bottom, transparent 0px, black 16px, black 100%)',
                            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 16px, black 100%)'
                        }}
                    >
                        <AnimatePresence mode="wait">
                        {isAdmin && currentTab === 'DASHBOARD' && !activePayrollCycle && (
                            <motion.div
                                key="tab-dashboard"
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                            >
                                <FinanceDashboard stats={stats} transactions={transactions} />
                            </motion.div>
                        )}

                        {isAdmin && currentTab === 'TRANSACTIONS' && !activePayrollCycle && (
                            <motion.div
                                key="tab-transactions"
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
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
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                            >
                                <SponsorshipManager onSelectTask={onSelectTask} />
                            </motion.div>
                        )}

                        {isAdmin && currentTab === 'TRIPS' && !activePayrollCycle && (
                            <motion.div
                                key="tab-trips"
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
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
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                            >
                                <LocationIntelligence />
                            </motion.div>
                        )}

                        {currentTab === 'SALARY' && (
                            <motion.div
                                key={activePayrollCycle ? `tab-payroll-editor-${activePayrollCycle.id}` : "tab-salary-list"}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
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
