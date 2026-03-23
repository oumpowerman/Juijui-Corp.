import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, ArrowBigDown } from 'lucide-react';
import { User } from '../../../types';
import * as d3 from 'd3';

interface RandomizerWheelProps {
    activeUsers: User[];
    winners: User[];
    onFinish: () => void;
}

const RandomizerWheel: React.FC<RandomizerWheelProps> = ({ activeUsers, winners, onFinish }) => {
    const [currentWinnerIndex, setCurrentWinnerIndex] = useState(0);
    const [rotation, setRotation] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [revealedWinners, setRevealedWinners] = useState<User[]>([]);
    const [showWinnerOverlay, setShowWinnerOverlay] = useState(false);
    
    const wheelRef = useRef<SVGSVGElement>(null);
    const lastRotationRef = useRef(0);

    // Filter out already revealed winners from the wheel pool for the next spin
    const currentPool = useMemo(() => {
        const revealedIds = new Set(revealedWinners.map(w => w.id));
        // We want to keep the wheel interesting, so if pool is small, we show everyone but the current winners
        return activeUsers.filter(u => !revealedIds.has(u.id));
    }, [activeUsers, revealedWinners]);

    const pieData = useMemo(() => {
        const data = currentPool.map(u => ({ name: u.name, id: u.id }));
        const pie = d3.pie<any>().value(1).sort(null);
        return pie(data);
    }, [currentPool]);

    const arcGenerator = d3.arc<any>()
        .innerRadius(0)
        .outerRadius(150);

    const colors = d3.scaleOrdinal(d3.schemeTableau10);

    const spin = () => {
        if (isSpinning || currentWinnerIndex >= winners.length) return;

        setIsSpinning(true);
        setShowWinnerOverlay(false);

        const targetWinner = winners[currentWinnerIndex];
        const winnerPoolIndex = currentPool.findIndex(u => u.id === targetWinner.id);
        
        if (winnerPoolIndex === -1) {
            // Should not happen if logic is correct
            console.error("Winner not in pool");
            setIsSpinning(false);
            return;
        }

        // Calculate rotation to land on the winner
        // Each slice is 360 / currentPool.length degrees
        const sliceAngle = 360 / currentPool.length;
        const targetAngle = 360 - (winnerPoolIndex * sliceAngle + sliceAngle / 2);
        
        // Add multiple full rotations for effect (at least 5-8 circles)
        const extraRotations = (5 + Math.floor(Math.random() * 5)) * 360;
        const finalRotation = lastRotationRef.current + extraRotations + (targetAngle - (lastRotationRef.current % 360));
        
        setRotation(finalRotation);
        lastRotationRef.current = finalRotation;

        // Wait for animation to finish
        setTimeout(() => {
            setIsSpinning(false);
            setShowWinnerOverlay(true);
            setRevealedWinners(prev => [...prev, targetWinner]);
            
            // If it was the last winner, wait a bit then finish
            if (currentWinnerIndex === winners.length - 1) {
                setTimeout(onFinish, 3000);
            }
        }, 5000); // 5 seconds spin duration
    };

    // Auto-start first spin
    useEffect(() => {
        const timer = setTimeout(spin, 1000);
        return () => clearTimeout(timer);
    }, []);

    const nextSpin = () => {
        if (currentWinnerIndex < winners.length - 1) {
            setCurrentWinnerIndex(prev => prev + 1);
            setShowWinnerOverlay(false);
            // Small delay before next spin starts
            setTimeout(spin, 500);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full flex flex-col items-center justify-center p-4 relative min-h-[500px]"
        >
            {/* Header Info */}
            <div className="text-center mb-8 z-10">
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                    Lucky Wheel 🎡
                </h3>
                <p className="text-sm text-slate-500 font-bold">
                    Picking winner {currentWinnerIndex + 1} of {winners.length}
                </p>
            </div>

            {/* The Wheel Container */}
            <div className="relative w-[320px] h-[320px] sm:w-[400px] sm:h-[400px]">
                {/* Pointer */}
                <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 z-30 text-rose-500 drop-shadow-lg">
                    <ArrowBigDown className="w-12 h-12 fill-current" />
                </div>

                {/* Outer Ring */}
                <div className="absolute inset-[-10px] border-[12px] border-slate-800 rounded-full shadow-2xl z-0" />
                
                {/* Lights on the ring */}
                <div className="absolute inset-[-10px] z-10 pointer-events-none">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                            className="absolute w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_10px_#facc15]"
                            style={{
                                top: '50%',
                                left: '50%',
                                transform: `rotate(${i * 30}deg) translate(0, -205px)`
                            }}
                        />
                    ))}
                </div>

                {/* SVG Wheel */}
                <motion.svg
                    ref={wheelRef}
                    width="100%"
                    height="100%"
                    viewBox="-200 -200 400 400"
                    animate={{ rotate: rotation }}
                    transition={{ duration: 5, ease: [0.15, 0, 0.15, 1] }}
                    className="relative z-20 drop-shadow-xl"
                >
                    <g>
                        {pieData.map((d, i) => {
                            const centroid = arcGenerator.centroid(d);
                            const angle = (d.startAngle + d.endAngle) / 2 * (180 / Math.PI);
                            
                            return (
                                <g key={d.data.id}>
                                    <path
                                        d={arcGenerator(d) || ''}
                                        fill={colors(i.toString())}
                                        stroke="white"
                                        strokeWidth="2"
                                    />
                                    <text
                                        transform={`translate(${centroid}) rotate(${angle - 90})`}
                                        dy=".35em"
                                        textAnchor="middle"
                                        fill="white"
                                        fontSize={currentPool.length > 15 ? "8px" : "12px"}
                                        fontWeight="900"
                                        className="pointer-events-none select-none"
                                    >
                                        {d.data.name.split(' ')[0]}
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                    {/* Center Pin */}
                    <circle r="20" fill="white" stroke="#1e293b" strokeWidth="4" />
                    <circle r="8" fill="#1e293b" />
                </motion.svg>
            </div>

            {/* Winner Overlay */}
            <AnimatePresence>
                {showWinnerOverlay && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.5, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: 50 }}
                        className="absolute inset-0 z-40 flex items-center justify-center bg-white/40 backdrop-blur-sm rounded-[3rem]"
                    >
                        <div className="bg-white p-8 rounded-[2rem] shadow-2xl border-4 border-indigo-500 flex flex-col items-center text-center max-w-xs">
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                                className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mb-4 shadow-lg"
                            >
                                <Trophy className="w-10 h-10 text-white" />
                            </motion.div>
                            
                            <h4 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-1">Winner #{currentWinnerIndex + 1}</h4>
                            <div className="w-24 h-24 rounded-full border-4 border-indigo-100 overflow-hidden mb-4 shadow-md">
                                <img 
                                    src={winners[currentWinnerIndex].avatarUrl} 
                                    alt="Winner" 
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-6">{winners[currentWinnerIndex].name}</h3>
                            
                            {currentWinnerIndex < winners.length - 1 ? (
                                <button
                                    onClick={nextSpin}
                                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                                >
                                    Next Spin <Star className="w-4 h-4 fill-current" />
                                </button>
                            ) : (
                                <div className="text-indigo-600 font-black animate-pulse">
                                    All winners found! 🎉
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List of found winners */}
            <div className="mt-12 flex flex-wrap justify-center gap-4">
                {revealedWinners.map((winner, idx) => (
                    <motion.div
                        key={winner.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100"
                    >
                        <div className="w-6 h-6 rounded-full overflow-hidden border border-indigo-200">
                            <img src={winner.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <span className="text-xs font-bold text-slate-700">{winner.name.split(' ')[0]}</span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 rounded-full font-black">#{idx + 1}</span>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default RandomizerWheel;
