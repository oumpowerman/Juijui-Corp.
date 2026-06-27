import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, List, ArrowRightLeft } from 'lucide-react';
import { User } from '../../../types/core';
import { CafeChamber } from './CafeChamber';
import { SleeperChamber } from './SleeperChamber';
import { FitnessChamber } from './FitnessChamber';
import { ArcadeChamber } from './ArcadeChamber';

interface HolidayCozyLoungeProps {
    users: User[];
}

export const HolidayCozyLounge: React.FC<HolidayCozyLoungeProps> = ({ users }) => {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [activeHoverZone, setActiveHoverZone] = useState<number | null>(null);
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
    const [viewMode, setViewMode] = useState<'visual' | 'compact'>('visual');

    // Automatically collapse and switch to compact mode on mobile screens upon initial render
    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setIsCollapsed(true);
            setViewMode('visual');
        }
    }, []);

    // Active zones meta definitions
    const zones = useMemo(() => [
        {
            id: 0,
            title: 'Sunlit Dev Cafe ☕',
            desc: 'บาร์เอสเพรสโซ่ข้างถนนอุ่นๆ ส่งกลิ่นกาแฟดริปอบอวล',
            colorBg: 'bg-amber-50/50',
            borderColor: 'border-amber-300',
            badgeClass: 'bg-amber-100 border-amber-300 text-amber-800'
        },
        {
            id: 1,
            title: 'Fluffy Rest Nest 😴',
            desc: 'เตียงนุ่มฟูกับโซฟาพาสเทล เอนหลังเคลิ้มชาร์จพลัง',
            colorBg: 'bg-blue-50/50',
            borderColor: 'border-blue-300',
            badgeClass: 'bg-blue-100 border-blue-300 text-blue-800'
        },
        {
            id: 2,
            title: 'Pro Active Gym 🏋️‍♂️',
            desc: 'เสื่อโยคะคลายเส้นและม้าบาร์เบล ฟื้นฟูร่างกายฟิตปั๋ง',
            colorBg: 'bg-emerald-50/50',
            borderColor: 'border-emerald-300',
            badgeClass: 'bg-emerald-100 border-emerald-300 text-emerald-800'
        },
        {
            id: 3,
            title: 'Arcade & Music 🎮',
            desc: 'โซนตู้เกมนีออนยุค 80s และสเตจแจมดนตรีดนตรีสด',
            colorBg: 'bg-purple-50/50',
            borderColor: 'border-purple-300',
            badgeClass: 'bg-purple-100 border-purple-300 text-purple-800'
        }
    ], []);

    // Layout calculation: Assign users to precise coordinates corresponding to the 2D side-profile furniture
    const renderedUsersInLounge = useMemo(() => {
        return users.map((user, index) => {
            const zoneIdx = index % 4;
            const idxInZone = Math.floor(index / 4);

            let posX = '0%';
            let posY = '0%';
            let direction: 'left' | 'right' = 'right';
            let pose: 'idle' | 'sleeping' | 'drinking' | 'gaming' | 'singing' | 'stretching' | 'lifting' | 'sitting' | 'sleeping_bed' | 'lifting_bench' | 'punching' = 'idle';
            let actionText = 'กำลังเที่ยวเล่นสนุกสนาน';
            let statusIcon = '✨';

            switch (zoneIdx) {
                case 0: // SUNLIT CAFE
                    if (idxInZone === 0) {
                        // Stool 1 sitting
                        posX = '28.8%';
                        posY = '226px';
                        direction = 'right';
                        pose = 'sitting';
                        actionText = 'นั่งชิลจิบกาแฟคาปูชิโน่หอมนุ่มริมเคาน์เตอร์';
                        statusIcon = '☕';
                    } else if (idxInZone === 1) {
                        // Stool 2 sitting
                        posX = '56.8%';
                        posY = '226px';
                        direction = 'left';
                        pose = 'sitting';
                        actionText = 'จิบลาร์เต้อาร์ตร้อน คุยโม้ปรัชญาการเขียนโค้ดไร้บั๊ก';
                        statusIcon = '☕';
                    } else if (idxInZone === 2) {
                        // Behind counter standing (barista!)
                        posX = '44.8%';
                        posY = '280px';
                        direction = 'right';
                        pose = 'idle';
                        actionText = 'สวมบทบาริสต้ามือหนึ่งกวนสตีมนมและดริปเอสเพรสโซ่เกรดพรีเมียม';
                        statusIcon = '🧪';
                    } else {
                        // Standing waiting line on floor
                        const offset = (idxInZone - 3) * 22;
                        const percentage = ((180 + offset) / 250) * 100;
                        posX = `${Math.min(94, percentage)}%`;
                        posY = '280px';
                        direction = 'right';
                        pose = 'idle';
                        actionText = 'ยืนรอคิวออเดอร์ครัวซองต์เนยเบลเยียมอบร้อนพวยพุ่ง';
                        statusIcon = '🥯';
                    }
                    break;

                case 1: // FLUFFY REST NEST
                    if (idxInZone === 0) {
                        // Cozy Bed - rotated horizontal flat sleeper
                        posX = '22.0%';
                        posY = '258px';
                        direction = 'right';
                        pose = 'sleeping_bed';
                        actionText = 'ล้มตัวลงนอนใต้หมอนนวมขนขนนกสุดหวานปุ๋ย';
                        statusIcon = '💤';
                    } else if (idxInZone === 1) {
                        // Cozy Sofa - Sitting comfy
                        posX = '70.8%';
                        posY = '267px';
                        direction = 'left';
                        pose = 'sitting';
                        actionText = 'เอนหลังเคลิ้มดูซีรีส์ฟินๆ ใต้ผ้าห่มสำลีสีเหลืองพาสเทล';
                        statusIcon = '😴';
                    } else if (idxInZone === 2) {
                        // Beanbag cushions
                        posX = '44.8%';
                        posY = '290px';
                        direction = 'right';
                        pose = 'sitting';
                        actionText = 'นั่งเอนหลังหลับตาสมาธิสูดไอเย็นธรรมชาติสุดสงบ';
                        statusIcon = '🍃';
                    } else {
                        // Cozy floor sleeping carpet flat
                        const offset = (idxInZone - 3) * 30;
                        const percentage = ((130 + offset) / 250) * 100;
                        posX = `${Math.min(94, percentage)}%`;
                        posY = '289px';
                        direction = 'left';
                        pose = 'sleeping';
                        actionText = 'ฟุบนอนซบเบาะแมวมารุฟินๆ ดำฝันหวานอย่างเป็นสุข';
                        statusIcon = '💤';
                    }
                    break;

                case 2: // ACTIVE GYM
                    if (idxInZone === 0) {
                        // Standing in front of the hanging sandbag
                        posX = '22.4%';
                        posY = '280px';
                        direction = 'left';
                        pose = 'punching';
                        actionText = 'รัวหมัดตะบันนวมระบายความเครียดจากการดีบักคิวเลกาซี่ข้ามปี';
                        statusIcon = '🥊';
                    } else if (idxInZone === 1) {
                        // Bench Press - Bench lifting
                        posX = '78.4%';
                        posY = '264px';
                        direction = 'right';
                        pose = 'lifting_bench';
                        actionText = 'เซ็ตยกดัมเบลหนารุ่นเหล็กดุ ปั๊มกล้ามสามหัวฟิตสุดพลัง';
                        statusIcon = '🏋️';
                    } else if (idxInZone === 2) {
                        // Yoga Mat - Stretching
                        posX = '46.0%';
                        posY = '280px';
                        direction = 'right';
                        pose = 'stretching';
                        actionText = 'เหยียดกล้ามเนื้อสะโพกและหลัง บรรเทาโรคออฟฟิศซินโดรมแสนปวดเกร็ง';
                        statusIcon = '🧘';
                    } else {
                        // Standing around floor dumbbell lifting
                        const offset = (idxInZone - 3) * 30;
                        const percentage = ((135 + offset) / 250) * 100;
                        posX = `${Math.min(94, percentage)}%`;
                        posY = '280px';
                        direction = 'right';
                        pose = 'lifting';
                        actionText = 'โซโล่ยกดัมเบิลบีบไหล่กว้างสร้างสเน่ห์กระชากใจ';
                        statusIcon = '⚡';
                    }
                    break;

                case 3: // RETRO ARCADE & MUSIC STAGE
                    if (idxInZone === 0) {
                        // Arcade machine standing
                        posX = '14.0%';
                        posY = '280px';
                        direction = 'right';
                        pose = 'gaming';
                        actionText = 'จับจอยสติ๊กคู่ใจ โยกยิงปราบลอร์ดบอสปีศาจมารแบบไม่กระพริบตา';
                        statusIcon = '🕹️';
                    } else if (idxInZone === 1) {
                        // Stage Center (near Microphone stand)
                        posX = '55.2%';
                        posY = '268px';
                        direction = 'left';
                        pose = 'singing';
                        actionText = 'ดีดกีต้าร์สะพายหลังขับเสียงเพลงร็อคบัลลาดปนโรแมนติกพริ้วใจ';
                        statusIcon = '🎸';
                    } else if (idxInZone === 2) {
                        // Keyboard player standing
                        posX = '46.0%';
                        posY = '280px';
                        direction = 'right';
                        pose = 'gaming';
                        actionText = 'โซโล่นิ้วพรมคีย์บอร์ดซินธิไซเซอร์ปั่นจังหวะแนวดาด้าแดนซ์เซนเซชั่น';
                        statusIcon = '🎹';
                    } else {
                        // Crowd spectating
                        const offset = (idxInZone - 3) * 20;
                        const percentage = ((70 + offset) / 250) * 100;
                        posX = `${Math.min(94, percentage)}%`;
                        posY = '280px';
                        direction = 'right';
                        pose = 'idle';
                        actionText = 'ยืนโบกมือปรบมือขอลายเซ็นศิลปินดังพร้อมฮัมทำนองแจ๊สหวานหู';
                        statusIcon = '🎵';
                    }
                    break;
            }

            return {
                user,
                posX,
                posY,
                direction,
                pose,
                actionText,
                statusIcon,
                zoneIdx
            };
        });
    }, [users]);

    return (
        <div className="w-full py-2 select-none animate-in fade-in duration-500 font-sans" id="holiday-cozy-lounge-root-view">
            {/* Header section with cute labels */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-900 pb-3 mb-4" id="holiday-cozy-header">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md border-2 border-slate-900 bg-amber-400 flex items-center justify-center text-xl shadow-[2px_2px_0px_#000] font-black">
                        🏡
                    </div>
                    <div>
                        <h3 className="font-sans font-black text-slate-900 text-sm tracking-wide uppercase">สนามกิจกรรมผ่อนคลายวันหยุดแสนน่ารัก</h3>
                        <p className="text-[10px] text-slate-500 font-bold">วันนี้วันหยุดพิเศษ! พนักงานทุกคนมาปักหลักคุยเล่นและพักผ่อนในบาร์/คาเฟ่วิวมินิมอล 2D กันอย่างพร้อมหน้า 🍮🛋️🎨</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border-2 border-slate-900 shadow-[2px_2px_0px_#000] text-[9.5px] font-black uppercase transition-all active:translate-y-[1px] active:shadow-[1px_1px_0px_#000] cursor-pointer ${
                            isCollapsed
                                ? "bg-emerald-400 hover:bg-emerald-500 text-slate-900 animate-pulse"
                                : "bg-rose-400 hover:bg-rose-500 text-slate-900"
                        }`}
                        id="cozy-collapse-toggle-btn"
                    >
                        {isCollapsed ? "➕ ขยายบอร์ด 🏡" : "➖ ย่อบอร์ด 🧐"}
                    </button>
                </div>
            </div>

            {/* TAB SELECTOR: Toggle between immersive 2D map & convenient compact text list */}
            {!isCollapsed && (
                <div className="flex items-center gap-2 mb-4 bg-slate-100 p-1 rounded-xl border-2 border-slate-900 w-full sm:w-auto overflow-x-auto" id="cozy-viewmode-tab-selector">
                    <button
                        onClick={() => setViewMode('visual')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10.5px] font-black uppercase transition-all cursor-pointer ${
                            viewMode === 'visual'
                                ? "bg-amber-400 text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_#000] -translate-y-[1.5px]"
                                : "text-slate-600 hover:text-slate-950 border-2 border-transparent"
                        }`}
                    >
                        <Map className="w-3.5 h-3.5 text-slate-900" />
                        🎮 มุมมอง 2D Cozy Lounge (ปัดเลื่อนได้)
                    </button>
                    <button
                        onClick={() => setViewMode('compact')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10.5px] font-black uppercase transition-all cursor-pointer ${
                            viewMode === 'compact'
                                ? "bg-amber-400 text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_#000] -translate-y-[1.5px]"
                                : "text-slate-600 hover:text-slate-950 border-2 border-transparent"
                        }`}
                    >
                        <List className="w-3.5 h-3.5 text-slate-900" />
                        📋 รายชื่อสรุปตามห้อง (Mobile List)
                    </button>
                </div>
            )}

            {/* THE AWESOME 2D SIDE-VIEW PLAYGROUND COZY DECK */}
            <AnimatePresence initial={false}>
                {!isCollapsed && viewMode === 'visual' && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden flex flex-col pt-3"
                        id="cozy-collapse-wrapper"
                    >
                        {/* Mobile Swipe Hint */}
                        <div className="lg:hidden flex justify-center mt-1 mb-3 items-center gap-2 text-[10px] font-black text-indigo-700 bg-indigo-50 border-2 border-slate-900 shadow-[2px_2px_0px_#000] rounded-xl py-1.5 px-3.5 w-fit mx-auto animate-bounce">
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            ปัดซ้าย-ขวา เพื่อสำรวจพื้นที่ผ่อนคลายวันหยุดได้เลย! ↔️
                        </div>

                        {/* Scroll container allowing full details width of 1000px without squeezing on mobile screens */}
                        <div className="w-full overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-transparent">
                            <div 
                                className="relative min-w-[1000px] lg:min-w-full h-[320px] border-4 border-slate-900 rounded-3xl overflow-hidden bg-slate-50 shadow-[4px_4px_0px_#000] flex flex-col justify-end"
                                id="cozy-2d-viewframe"
                                style={{
                                    backgroundImage: 'linear-gradient(to top, #e2e8f0 1.5px, transparent 1.5px)',
                                    backgroundSize: '100% 12px',
                                    backgroundColor: '#fafaf9'
                                }}
                            >
                                {/* 1) CHAMBER OVERLAYS & SKY WALLPAPERS */}
                                <div className="absolute inset-x-0 top-0 bottom-[40px] grid grid-cols-4 divide-x-2 divide-dashed divide-slate-300/60 z-10">
                                    <CafeChamber
                                        residents={renderedUsersInLounge.filter(u => u.zoneIdx === 0)}
                                        selectedUser={selectedUser}
                                        setSelectedUser={setSelectedUser}
                                        activeHoverZone={activeHoverZone}
                                        setActiveHoverZone={setActiveHoverZone}
                                    />
                                    <SleeperChamber
                                        residents={renderedUsersInLounge.filter(u => u.zoneIdx === 1)}
                                        selectedUser={selectedUser}
                                        setSelectedUser={setSelectedUser}
                                        activeHoverZone={activeHoverZone}
                                        setActiveHoverZone={setActiveHoverZone}
                                    />
                                    <FitnessChamber
                                        residents={renderedUsersInLounge.filter(u => u.zoneIdx === 2)}
                                        selectedUser={selectedUser}
                                        setSelectedUser={setSelectedUser}
                                        activeHoverZone={activeHoverZone}
                                        setActiveHoverZone={setActiveHoverZone}
                                    />
                                    <ArcadeChamber
                                        residents={renderedUsersInLounge.filter(u => u.zoneIdx === 3)}
                                        selectedUser={selectedUser}
                                        setSelectedUser={setSelectedUser}
                                        activeHoverZone={activeHoverZone}
                                        setActiveHoverZone={setActiveHoverZone}
                                    />
                                </div>

                                {/* FLOOR LINE BASE (2px strong line art) */}
                                <div className="absolute inset-x-0 bottom-[40px] h-1.5 bg-slate-900 z-20" />
                                {/* Ground grass dirt floor block */}
                                <div className="absolute inset-x-0 bottom-0 h-[40px] bg-slate-100 border-t border-slate-300 z-20" />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* COMPACT TEXT/AVATAR MOBILE LIST VIEW */}
            <AnimatePresence>
                {!isCollapsed && viewMode === 'compact' && (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 15 }}
                        transition={{ duration: 0.25 }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                        id="cozy-compact-list-grid"
                    >
                        {zones.map((zone) => {
                            const zoneResidents = renderedUsersInLounge.filter(u => u.zoneIdx === zone.id);
                            return (
                                <div 
                                    key={zone.id}
                                    className="p-4 border-2 border-slate-900 rounded-2xl bg-white shadow-[4px_4px_0px_#000] flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-3">
                                            <span className="font-black text-slate-950 text-xs tracking-wide uppercase">{zone.title}</span>
                                            <span className={`px-2 py-0.5 rounded-md border border-slate-900 text-[9.5px] font-black uppercase ${zone.badgeClass}`}>
                                                {zoneResidents.length} คน
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold mb-3 text-left leading-normal">{zone.desc}</p>
                                        
                                        {zoneResidents.length === 0 ? (
                                            <div className="text-center py-5 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400 text-[10px] font-black">
                                                💤 โซนนี้เงียบเหงา ยังไม่มีใครเข้ามาพักผ่อน
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {zoneResidents.map(({ user, actionText, statusIcon }) => (
                                                    <div 
                                                        key={user.id} 
                                                        onClick={() => setSelectedUser(user)}
                                                        className="group p-2.5 bg-slate-50 border-2 border-slate-200 hover:border-slate-900 hover:bg-amber-50 rounded-xl flex items-center justify-between gap-3 transition-all duration-150 cursor-pointer text-left"
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <span className="text-xl flex items-center justify-center bg-white border-2 border-slate-200 group-hover:border-slate-900 w-8 h-8 rounded-lg shadow-sm shrink-0">
                                                                {user.emoji || '👾'}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1">
                                                                    <span className="font-black text-xs text-slate-950 truncate">{user.name}</span>
                                                                    {user.name && (
                                                                        <span className="text-[9px] font-black text-slate-400 truncate">({user.name})</span>
                                                                    )}
                                                                </div>
                                                                <p className="text-[9.5px] text-slate-500 font-bold leading-tight mt-0.5 truncate">
                                                                    {actionText}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs bg-white border-2 border-slate-200 px-1.5 py-0.5 rounded-md shadow-sm shrink-0">
                                                            {statusIcon}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* LIVE COZY RESIDENT CHATS */}
            <AnimatePresence>
                {!isCollapsed && selectedUser && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mt-4 p-3.5 border-2 border-slate-900 bg-white rounded-2xl shadow-[4px_4px_0px_#000] flex items-center justify-between gap-3 animate-in fade-in"
                        id="user-cozy-chat-room"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-3xl leading-none bg-slate-50 border-2 border-slate-950 px-2 py-1.5 rounded-md shadow-sm select-none">
                                {selectedUser.emoji || '👾'}
                            </span>
                            <div>
                                <h4 className="font-sans font-black text-slate-900 text-xs text-left">
                                    มุมระบายความชาร์จแบตของ {selectedUser.name} <span className="text-amber-500">({selectedUser.name || 'ไม่มีชื่อเล่น'})</span>
                                </h4>
                                <p className="text-[10.5px] text-slate-500 font-bold leading-snug mt-0.5 text-left">
                                    {renderedUsersInLounge.find(u => u.user.id === selectedUser.id)?.actionText || 'กำลังเที่ยวเล่นชาร์จพลังงานเพื่อวันเขียนโค้ดอันยอดเยี่ยมที่สุด'}
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={() => setSelectedUser(null)}
                            className="bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-slate-900 text-[10px] font-black px-3.5 py-1 rounded-md transition-colors cursor-pointer"
                        >
                            ปิดคำอธิบายกิจกรรม
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
