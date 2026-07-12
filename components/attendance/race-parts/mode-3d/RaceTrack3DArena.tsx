import React, { useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { RacetrackActiveUser } from '../types';
import { User } from '../../../../types/core';
import { RaceTrackBackground } from './RaceTrackBackground';
import { RaceTrackParticipant } from './RaceTrackParticipant';
import { useUserSession } from '../../../../context/UserSessionContext';
import { get3DCoordinates } from './projection';
import { Target } from 'lucide-react';

interface RaceTrack3DArenaProps {
    idleRacers: RacetrackActiveUser[];
    checkedInRacers: RacetrackActiveUser[];
    totalLanes: number;
    sortedProfiles: User[];
    runningUserId: string | null;
}

export const RaceTrack3DArena: React.FC<RaceTrack3DArenaProps> = ({
    idleRacers,
    checkedInRacers,
    totalLanes,
    sortedProfiles,
    runningUserId
}) => {
    const { currentUserProfile } = useUserSession();
    const containerRef = useRef<HTMLDivElement>(null);

    const scrollToCurrentUser = (isSmooth = true) => {
        const container = containerRef.current;
        if (!container || !currentUserProfile?.id) return;

        const currentUserId = currentUserProfile.id;
        const currentUserRacer = checkedInRacers.find(r => r.user.id === currentUserId) || 
                                idleRacers.find(r => r.user.id === currentUserId);
        
        if (currentUserRacer) {
            const profileIndex = sortedProfiles.findIndex(u => u.id === currentUserRacer.user.id);
            const safeIndex = profileIndex === -1 ? 0 : profileIndex;
            const progress = currentUserRacer.isCheckedIn 
                ? Math.max(0.15, 1.0 - (currentUserRacer.checkInOrder - 1) * 0.05)
                : 0;

            const coords = get3DCoordinates(safeIndex, progress, totalLanes);
            
            const scrollWidth = container.scrollWidth;
            const clientWidth = container.clientWidth;
            
            // Map coordinates from 1000 base to container scroll width
            const xPosPixels = (coords.x / 1000) * scrollWidth;
            const targetScrollLeft = xPosPixels - clientWidth / 2;

            container.scrollTo({
                left: targetScrollLeft,
                behavior: isSmooth ? 'smooth' : 'auto'
            });
        }
    };

    // Autoscroll to the current user's racer on load or update
    useEffect(() => {
        const timer = setTimeout(() => {
            scrollToCurrentUser(true);
        }, 350);
        return () => clearTimeout(timer);
    }, [checkedInRacers, idleRacers, currentUserProfile?.id, runningUserId]);

    return (
        <div className="lg:col-span-3 relative group/arena">
            <div 
                ref={containerRef}
                className="overflow-x-auto overflow-y-hidden scrollbar-thin rounded-2xl border-2 border-slate-900 bg-white p-2 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
            >
                <div className="relative min-w-[760px] lg:min-w-0 w-full h-[360px] flex flex-col justify-end pb-3 overflow-visible z-20">
                    
                    {/* Floating Focus Button - Helps mobile users find themselves instantly */}
                    {currentUserProfile?.id && (
                        <button
                            onClick={() => scrollToCurrentUser(true)}
                            className="absolute top-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 text-[10px] font-bold rounded-xl border-2 border-slate-900 active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all cursor-pointer shadow-sm"
                            title="โฟกัสตำแหน่งของฉัน"
                        >
                            <Target className="w-3.5 h-3.5 text-indigo-400" />
                            <span>โฟกัสฉัน 🎯</span>
                        </button>
                    )}

                    {/* Programmable Isometric 3D Racetrack SVG vectors drawing the lanes */}
                    <RaceTrackBackground totalLanes={totalLanes} sortedProfiles={sortedProfiles} />

                    {/* 1) RENDER SLEEPING / IDLE RACERS */}
                    <div className="absolute inset-0 pointer-events-none overflow-visible">
                        {idleRacers.map((racer) => {
                            const profileIndex = sortedProfiles.findIndex(u => u.id === racer.user.id);
                            const safeIndex = profileIndex === -1 ? 0 : profileIndex;
                            return (
                                <RaceTrackParticipant 
                                    key={`racer-idle-${racer.user.id}`}
                                    racer={racer}
                                    totalLanes={totalLanes}
                                    safeIndex={safeIndex}
                                    runningUserId={runningUserId}
                                />
                            );
                        })}
                    </div>

                    {/* 2) RENDER ACTIVE / RUNNING RACERS */}
                    <div className="absolute inset-0 pointer-events-none overflow-visible">
                        <AnimatePresence>
                            {checkedInRacers.map((racer) => {
                                const profileIndex = sortedProfiles.findIndex(u => u.id === racer.user.id);
                                const safeIndex = profileIndex === -1 ? 0 : profileIndex;
                                return (
                                    <RaceTrackParticipant 
                                        key={`racer-active-${racer.user.id}`}
                                        racer={racer}
                                        totalLanes={totalLanes}
                                        safeIndex={safeIndex}
                                        runningUserId={runningUserId}
                                    />
                                );
                            })}
                        </AnimatePresence>
                    </div>

                </div>
            </div>
        </div>
    );
};
