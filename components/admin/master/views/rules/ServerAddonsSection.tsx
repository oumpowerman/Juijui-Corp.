import React, { useState, useEffect } from 'react';
import { Sparkles, LayoutGrid, Sliders, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import LateAlertCard from './addons/LateAlertCard';
import MidnightCheckCard from './addons/MidnightCheckCard';
import DailyReportCard from './addons/DailyReportCard';
import AttendanceRaceCard from './addons/AttendanceRaceCard';

interface WorkTimeConfig {
    start: string;
    end: string;
    buffer: string;
    minHours: string;
    otThreshold: string;
    checkoutPenaltyTime: string;
    dailySummaryDelayHours: string;
    lineSummaryDestination: string;
    enableAttendanceRace: string;
    lateAlertMode?: string;
    lateAlertOffset?: string;
}

interface ServerAddonsSectionProps {
    tempTimeConfig: WorkTimeConfig;
    setTempTimeConfig: React.Dispatch<React.SetStateAction<WorkTimeConfig>>;
}

const ServerAddonsSection: React.FC<ServerAddonsSectionProps> = ({
    tempTimeConfig,
    setTempTimeConfig,
}) => {
    // UI View Settings
    const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');
    const [activeSlide, setActiveSlide] = useState<number>(0);
    const [isMobile, setIsMobile] = useState<boolean>(false);

    useEffect(() => {
        const media = window.matchMedia('(max-width: 640px)');
        setIsMobile(media.matches);
        const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, []);

    const totalSlides = 4;

    const handleNext = () => {
        setActiveSlide((prev) => (prev + 1) % totalSlides);
    };

    const handlePrev = () => {
        setActiveSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    };

    // CARDS CONTENT ARRAY
    const renderCardContent = (index: number) => {
        switch (index) {
            case 0:
                return (
                    <LateAlertCard 
                        tempTimeConfig={tempTimeConfig} 
                        setTempTimeConfig={setTempTimeConfig} 
                    />
                );
            case 1:
                return (
                    <MidnightCheckCard
                        tempTimeConfig={tempTimeConfig}
                        setTempTimeConfig={setTempTimeConfig}
                    />
                );
            case 2:
                return (
                    <DailyReportCard
                        tempTimeConfig={tempTimeConfig}
                        setTempTimeConfig={setTempTimeConfig}
                    />
                );
            case 3:
                return (
                    <AttendanceRaceCard
                        tempTimeConfig={tempTimeConfig}
                        setTempTimeConfig={setTempTimeConfig}
                    />
                );
            default:
                return null;
        }
    };

    // ACTIVE DOTS PRESETS
    const slideMeta = [
        { title: 'Late Alert Alarm', color: 'bg-indigo-500', glow: 'shadow-indigo-500/30' },
        { title: 'Midnight Auto Check-out', color: 'bg-amber-500', glow: 'shadow-amber-500/30' },
        { title: 'Daily Summary Report', color: 'bg-emerald-500', glow: 'shadow-emerald-500/30' },
        { title: 'Weekly Attendance Race', color: 'bg-purple-500', glow: 'shadow-purple-500/30' },
    ];

    return (
        <div id="server-addons-section" className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50/20 rounded-bl-full pointer-events-none"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
                <div className="space-y-1">
                    <h3 className="font-extrabold text-gray-800 text-lg flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                        ระบบตรวจสอบอัตโนมัติของเซิร์ฟเวอร์ & ฟังก์ชันพิเศษ
                    </h3>
                    <p className="text-xs text-gray-400">
                        ตั้งค่าโมดูลอัตโนมัติที่ช่วยเตือนสติพนักงานและแจ้งสรุปความเรียบร้อยให้แก่ทีมบริหารและฝ่ายบุคคล
                    </p>
                </div>

                {/* VIEW MODE TOGGLE BUTTONS */}
                <div className="inline-flex bg-gray-100 p-1.5 rounded-2xl self-start shrink-0">
                    <button
                        type="button"
                        onClick={() => setViewMode('carousel')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                            viewMode === 'carousel'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        <Sliders className="w-3.5 h-3.5" /> คารูเซลสไลด์
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('grid')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                            viewMode === 'grid'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        <LayoutGrid className="w-3.5 h-3.5" /> แสดงตาราง
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            {viewMode === 'carousel' ? (
                <div className="relative">
                    {/* Navigation Buttons (Left/Right) */}
                    <div className="absolute top-1/2 -left-3 sm:-left-4 -translate-y-1/2 z-20">
                        <button
                            type="button"
                            onClick={handlePrev}
                            className="w-8 h-8 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all text-gray-600 hover:text-indigo-600"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="absolute top-1/2 -right-3 sm:-right-4 -translate-y-1/2 z-20">
                        <button
                            type="button"
                            onClick={handleNext}
                            className="w-8 h-8 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all text-gray-600 hover:text-indigo-600"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Animated Carousel Slide Frame with Side-Peeking */}
                    <div className="overflow-hidden py-4 -mx-6 px-6 relative min-h-[570px] flex items-center w-[calc(100%+3rem)]">
                        <motion.div
                            className="flex items-stretch relative left-1/2"
                            style={{
                                gap: `${isMobile ? 16 : 24}px`,
                            }}
                            animate={{
                                x: - (activeSlide * ((isMobile ? 280 : 500) + (isMobile ? 16 : 24)) + (isMobile ? 280 : 500) / 2)
                            }}
                            transition={{ type: "spring", stiffness: 220, damping: 26 }}
                        >
                            {[0, 1, 2, 3].map((idx) => {
                                const isActive = idx === activeSlide;
                                return (
                                    <motion.div
                                        key={idx}
                                        onClick={() => {
                                            if (!isActive) {
                                                setActiveSlide(idx);
                                            }
                                        }}
                                        className={`shrink-0 select-none border border-gray-100 bg-white p-5 rounded-2xl shadow-sm flex flex-col justify-between h-[540px] ${
                                            isActive 
                                                ? `${slideMeta[idx].glow} ring-2 ring-indigo-100/50 cursor-default` 
                                                : "cursor-pointer hover:border-gray-200"
                                        }`}
                                        style={{
                                            width: isMobile ? '280px' : '500px',
                                        }}
                                        animate={{
                                            scale: isActive ? 1.0 : 0.92,
                                            opacity: isActive ? 1.0 : 0.45,
                                        }}
                                        transition={{ type: "spring", stiffness: 220, damping: 26 }}
                                    >
                                        <div className={isActive ? "h-full flex flex-col justify-between" : "pointer-events-none select-none h-full flex flex-col justify-between"}>
                                            {renderCardContent(idx)}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </div>

                    {/* CAROUSEL PAGINATION DOTS */}
                    <div className="flex items-center justify-center gap-2 mt-4">
                        {slideMeta.map((slide, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => setActiveSlide(idx)}
                                className={`h-2 rounded-full transition-all duration-300 ${
                                    activeSlide === idx
                                        ? `${slide.color} w-6`
                                        : 'bg-gray-200 w-2 hover:bg-gray-300'
                                }`}
                                title={slide.title}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                /* GRID VIEW MODE */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[0, 1, 2, 3].map((idx) => (
                        <div
                            key={idx}
                            className={`border border-gray-100 bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[440px]`}
                        >
                            {renderCardContent(idx)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ServerAddonsSection;
