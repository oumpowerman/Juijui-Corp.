import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../../../types';
import { Flag, Trophy, Zap } from 'lucide-react';

interface RandomizerRacingProps {
    activeUsers: User[];
    winners: User[];
    numWinners: number;
    duration: number;
    onFinish: () => void;
}

// Stick Figure Component with running animation
const StickFigure: React.FC<{ isRunning: boolean; speed: number; color: string; avatarUrl: string; name: string }> = ({ isRunning, speed, color, avatarUrl, name }) => {
    const legRotation = isRunning ? [25, -25, 25] : [0, 0];
    const armRotation = isRunning ? [-20, 20, -20] : [0, 0];
    const bodyBob = isRunning ? [0, -4, 0] : [0, 0];
    
    // Animation speed based on runner's actual speed
    const animDuration = Math.max(0.2, 0.8 - (speed / 150));

    return (
        <div className="flex flex-col items-center relative">
            {/* Name Tag */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/90 px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm border border-slate-200 z-20">
                {name.split(' ')[0]}
            </div>

            <motion.div 
            animate={{ 
                y: bodyBob,
                rotate: isRunning ? speed * 0.05 : 0
            }}
                transition={{ duration: animDuration, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
            >
                {/* Head (Avatar) */}
                <div className="w-10 h-10 rounded-full border-2 border-white shadow-md overflow-hidden bg-slate-200 relative z-10">
                    <img src={avatarUrl} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>

                {/* Stick Body */}
                <svg width="40" height="50" viewBox="0 0 40 50" className="overflow-visible">
                    {/* Torso */}
                    <line x1="20" y1="10" x2="20" y2="30" stroke={color} strokeWidth="3" strokeLinecap="round" />
                    
                    {/* Arms */}
                    <motion.line 
                        x1="20" y1="15" x2="10" y2="25" 
                        stroke={color} strokeWidth="3" strokeLinecap="round"
                        animate={{ rotate: armRotation }}
                        style={{ originX: "20px", originY: "15px" }}
                        transition={{ duration: animDuration, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.line 
                        x1="20" y1="15" x2="30" y2="25" 
                        stroke={color} strokeWidth="3" strokeLinecap="round"
                        animate={{ rotate: armRotation.map(r => -r) }}
                        style={{ originX: "20px", originY: "15px" }}
                        transition={{ duration: animDuration, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* Legs */}
                    <motion.line 
                        x1="20" y1="30" x2="12" y2="45" 
                        stroke={color} strokeWidth="3" strokeLinecap="round"
                        animate={{ rotate: legRotation }}
                        style={{ originX: "20px", originY: "30px" }}
                        transition={{ duration: animDuration, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.line 
                        x1="20" y1="30" x2="28" y2="45" 
                        stroke={color} strokeWidth="3" strokeLinecap="round"
                        animate={{ rotate: legRotation.map(r => -r) }}
                        style={{ originX: "20px", originY: "30px" }}
                        transition={{ duration: animDuration, repeat: Infinity, ease: "easeInOut" }}
                    />
                </svg>
            </motion.div>
        </div>
    );
};

const RandomizerRacing: React.FC<RandomizerRacingProps> = ({ activeUsers, winners, numWinners, duration, onFinish }) => {
    const racers = useMemo(() => {
        const winnerIds = new Set(winners.map(w => w.id));
        const others = activeUsers.filter(u => !winnerIds.has(u.id));
        const maxRacers = 8; // Keep it focused for better suspense
        const neededOthers = Math.max(0, maxRacers - winners.length);
        const selectedOthers = [...others].sort(() => 0.5 - Math.random()).slice(0, neededOthers);
        return [...winners, ...selectedOthers].sort(() => 0.5 - Math.random());
    }, [activeUsers, winners]);

    const [progress, setProgress] = useState<number[]>(new Array(racers.length).fill(0));
    const [speeds, setSpeeds] = useState<number[]>(new Array(racers.length).fill(0));
    const [isFinished, setIsFinished] = useState(false);
    const [statusText, setStatusText] = useState("Ready... Set... GO!");
    const winnerIds = useMemo(() => new Set(winners.map(w => w.id)), [winners]);
    
    // Track internal state for smoother updates
    const stateRef = useRef({
        progress: new Array(racers.length).fill(0),
        offsets: new Array(racers.length).fill(0),
        targetOffsets: new Array(racers.length).fill(0),
        lastOffsetUpdate: 0,
        startTime: Date.now()
    });

    useEffect(() => {
        stateRef.current.startTime = Date.now();
        stateRef.current.lastOffsetUpdate = 0;
        stateRef.current.progress = new Array(racers.length).fill(0);
        stateRef.current.offsets = new Array(racers.length).fill(0);
        stateRef.current.targetOffsets = new Array(racers.length).fill(0);

        let animationFrame: number;

        const loop = () => {
            const now = Date.now();
            const elapsed = now - stateRef.current.startTime;
            const overallTimeProgress = Math.min(elapsed / duration, 1);

            // Update status text based on progress
            if (overallTimeProgress < 0.2) setStatusText("They're off! 🏃💨");
            else if (overallTimeProgress < 0.5) setStatusText("It's neck and neck! ⚔️");
            else if (overallTimeProgress < 0.8) setStatusText("Who will take the lead?! 😱");
            else if (overallTimeProgress < 0.95) setStatusText("THE FINAL STRETCH! 🔥");
            else setStatusText("WE HAVE A WINNER! 🏆");

            // Update target offsets every 800ms for random movement
            if (now - stateRef.current.lastOffsetUpdate > 800 && overallTimeProgress < 0.9) {
                stateRef.current.targetOffsets = racers.map((user, idx) => {
                    const isWinner = winnerIds.has(user.id);
                    
                    if (overallTimeProgress < 0.7) {
                        // Early/Mid race: Random offsets for everyone
                        // Winners stay slightly back or in the middle
                        const base = isWinner ? -5 : 0;
                        const prev = stateRef.current.targetOffsets[idx] || 0;
                        const next = prev + (Math.random() - 0.5) * 6;
                        return Math.max(-15, Math.min(15, base + next));
                    } else {
                        // Final stretch: Winners push forward, others fall back
                        if (isWinner) return 10 + Math.random() * 10;
                        return -10 - Math.random() * 10;
                    }
                });
                stateRef.current.lastOffsetUpdate = now;
            }

            const newProgress = new Array(racers.length).fill(0);
            const newSpeeds = new Array(racers.length).fill(0);

            // Base progress reaches 90% (finish line) at duration
            const baseProgress = overallTimeProgress * 90;

            racers.forEach((user, idx) => {
                const isWinner = winnerIds.has(user.id);
                
                // Smoothly move current offset towards target offset
                const offsetStep = (stateRef.current.targetOffsets[idx] - stateRef.current.offsets[idx]) * 0.05;
                stateRef.current.offsets[idx] += offsetStep;

                // Calculate total progress
                let totalProgress = baseProgress + stateRef.current.offsets[idx];

                // Winner Scripting at the very end
                const finishPhase = Math.max(0, (overallTimeProgress - 0.85) / 0.15);

                if (finishPhase > 0) {
                    if (isWinner) {
                        totalProgress += finishPhase * (20 + Math.random() * 20);
                    } else {
                        totalProgress = Math.min(88, totalProgress - finishPhase * 10);
                    }
                }

                // Ensure progress doesn't go backwards
                newProgress[idx] = Math.max(stateRef.current.progress[idx], totalProgress);
                
                // Calculate speed for animation (delta progress)
                const delta = newProgress[idx] - stateRef.current.progress[idx];
                newSpeeds[idx] = delta * 60; // Scale for visual effect
                
                stateRef.current.progress[idx] = newProgress[idx];
            });

            setProgress([...newProgress]);
            setSpeeds(newSpeeds);

            if (overallTimeProgress >= 1) {
                setIsFinished(true);
                setTimeout(onFinish, 1500); // Small delay before showing results
                return;
            }

            animationFrame = requestAnimationFrame(loop);
        };

        animationFrame = requestAnimationFrame(loop);

        return () => cancelAnimationFrame(animationFrame);
    }, [racers, winnerIds, duration, onFinish]);

    const colors = ['#4f46e5', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#2563eb', '#9333ea', '#0891b2'];

    return (
        <motion.div 
            key="racing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full flex flex-col p-4 sm:p-8 bg-slate-900 rounded-[3rem] border-8 border-slate-800 shadow-2xl overflow-hidden relative"
        >
            {/* Stadium Lights Effect */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
            
            <div className="flex justify-between items-center mb-12 px-6 relative z-10">
                <div className="flex flex-col">
                    <h3 className="text-3xl font-black text-white flex items-center gap-3 italic tracking-tighter">
                        <Zap className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-pulse" />
                        GRAND PRIX
                    </h3>
                    <span className="text-indigo-400 text-xs font-bold tracking-[0.3em] uppercase">The Chosen One Championship</span>
                </div>
                <div className="flex flex-col items-end">
                    <div className="text-white font-black text-lg italic animate-bounce">{statusText}</div>
                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Distance to Glory</div>
                </div>
            </div>

            <div className="space-y-2 relative min-h-[400px]">
                {/* Finish Line Area */}
                <div className="absolute right-[10%] top-0 bottom-0 w-12 flex flex-col items-center z-20">
                    {/* Checkered Pattern */}
                    <div className="w-full h-full grid grid-cols-2 opacity-20">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <div key={i} className={`w-full h-4 ${i % 2 === 0 ? 'bg-white' : 'bg-black'}`} />
                        ))}
                    </div>
                    
                    {/* Ribbon */}
                    <AnimatePresence>
                        {!isFinished && (
                            <motion.div 
                                exit={{ scaleY: 0, opacity: 0 }}
                                className="absolute inset-0 bg-gradient-to-b from-rose-500 via-rose-600 to-rose-500 w-1.5 left-1/2 -translate-x-1/2 shadow-[0_0_15px_rgba(244,63,94,0.5)]"
                            />
                        )}
                    </AnimatePresence>
                </div>

                {/* Lanes */}
                {racers.map((user, idx) => (
                    <div key={user.id} className="relative h-14 flex items-center group">
                        {/* Lane Background */}
                        <div className="absolute inset-0 bg-slate-800/40 rounded-lg border-y border-white/5 shadow-inner" />
                        <div className="absolute left-4 text-[10px] font-black text-slate-700 italic">LANE {idx + 1}</div>
                        
                        {/* Racer Container */}
                        <div 
                            className="absolute flex items-center"
                            style={{ left: `${progress[idx]}%`, transform: 'translateX(-50%)' }}
                        >
                            <StickFigure 
                                isRunning={!isFinished} 
                                speed={speeds[idx]} 
                                color={colors[idx % colors.length]} 
                                avatarUrl={user.avatarUrl} 
                                name={user.name} 
                            />
                            
                            {/* Speed Trails */}
                            {speeds[idx] > 40 && !isFinished && (
                                <div className="absolute right-full mr-2 flex gap-1 blur-[1px]">
                                    {[1, 2, 3].map(i => (
                                        <motion.div 
                                            key={i}
                                            initial={{ opacity: 0.5, scaleX: 0 }}
                                            animate={{ opacity: 0, scaleX: 2 }}
                                            transition={{ duration: 0.3, repeat: Infinity, delay: i * 0.1 }}
                                            className="h-0.5 w-8 bg-white/40 rounded-full"
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Winner Celebration */}
                        {isFinished && winnerIds.has(user.id) && progress[idx] >= 90 && (
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: [1, 1.4, 1] }}
                                transition={{ duration: 0.6 }}
                                className="absolute right-[5%] z-30"
                            >
                                <div className="bg-yellow-400 text-slate-900 p-2 rounded-full shadow-[0_0_40px_rgba(250,204,21,0.9)] border-2 border-white">
                                    <Trophy className="w-6 h-6" />
                                </div>
                            </motion.div>
                        )}
                    </div>
                ))}
            </div>

            {/* Ground / Track Texture */}
            <div className="mt-4 h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className={`flex-1 h-full ${i % 2 === 0 ? 'bg-white/5' : 'bg-transparent'}`} />
                ))}
            </div>

            <div className="mt-8 flex justify-center gap-8 text-slate-500 font-black text-[10px] uppercase tracking-[0.5em]">
                <span className="animate-pulse">Accelerating</span>
                <span className="text-indigo-500">Overtaking</span>
                <span className="animate-pulse">Finishing</span>
            </div>
        </motion.div>
    );
};

export default RandomizerRacing;
