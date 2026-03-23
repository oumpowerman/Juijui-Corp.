import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Dices, Trash2, History } from 'lucide-react';
import confetti from 'canvas-confetti';
import { User } from '../../types';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { RandomizerHistoryItem } from './randomizer/types';
import RandomizerConfig from './randomizer/RandomizerConfig';
import RandomizerSpinning from './randomizer/RandomizerSpinning';
import RandomizerRacing from './randomizer/RandomizerRacing';
import RandomizerWheel from './randomizer/RandomizerWheel';
import RandomizerResult from './randomizer/RandomizerResult';
import RandomizerHistoryView from './randomizer/RandomizerHistoryView';

interface RandomizerModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    currentUser: User | null;
}

const RandomizerModal: React.FC<RandomizerModalProps> = ({ isOpen, onClose, users, currentUser }) => {
    // Config State
    const [topic, setTopic] = useState<string>('');
    const [numWinners, setNumWinners] = useState<number>(1);
    const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    
    // Spin State
    const [isSpinning, setIsSpinning] = useState(false);
    const [animationMode, setAnimationMode] = useState<'SLOT' | 'RACING' | 'WHEEL'>('SLOT');
    const [winners, setWinners] = useState<User[]>([]);
    const [pendingWinners, setPendingWinners] = useState<User[]>([]);
    
    // History State
    const [history, setHistory] = useState<RandomizerHistoryItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    
    const { showToast } = useToast();
    const activeUsers = users.filter(u => u.isActive && u.isApproved);

    // Refs for animation
    const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchHistory();
        } else {
            resetState();
        }
    }, [isOpen]);

    const resetState = () => {
        setWinners([]);
        setPendingWinners([]);
        setIsSpinning(false);
        setTopic('');
        setNumWinners(1);
        setSelectedPosition('ALL');
        setSelectedUserIds([]);
        setShowHistory(false);
        if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
    };

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const { data, error } = await supabase
                .from('randomizer_history')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            
            // Map winner data
            const historyWithUsers = data.map(item => {
                // Handle both old schema (winner_id) and new schema (winner_ids)
                const ids = item.winner_ids || (item.winner_id ? [item.winner_id] : []);
                return {
                    ...item,
                    winner_ids: ids,
                    winners: ids.map((id: string) => users.find(u => u.id === id)).filter(Boolean)
                };
            });
            
            setHistory(historyWithUsers);
        } catch (error: any) {
            console.error('Error fetching history:', error);
            showToast('ดึงประวัติการสุ่มไม่สำเร็จ', 'error');
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleSpin = () => {
        if (!topic.trim()) {
            showToast('กรุณาระบุหัวข้อก่อนสุ่ม', 'warning');
            return;
        }

        // Determine the pool of users
        let pool = activeUsers;
        
        // If position is selected, filter by position
        if (selectedPosition !== 'ALL') {
            pool = pool.filter(u => u.position === selectedPosition);
        }

        // If specific users are selected, filter the pool further
        if (selectedUserIds.length > 0) {
            pool = pool.filter(u => selectedUserIds.includes(u.id));
        }

        if (pool.length === 0) {
            showToast('ไม่มีสมาชิกในทีมให้สุ่ม', 'error');
            return;
        }

        if (numWinners > pool.length) {
            showToast('จำนวนผู้โชคดีมากกว่าจำนวนคนในทีม', 'error');
            return;
        }

        setIsSpinning(true);
        setShowHistory(false);
        
        // Fisher-Yates Shuffle for unbiased randomization
        const shuffle = (array: any[]) => {
            const newArray = [...array];
            for (let i = newArray.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
            }
            return newArray;
        };

        const finalWinners = shuffle(pool).slice(0, numWinners);
        setPendingWinners(finalWinners);
        
        // Randomly choose animation mode
        const modes: ('SLOT' | 'RACING' | 'WHEEL')[] = ['SLOT', 'RACING', 'WHEEL'];
        const mode = modes[Math.floor(Math.random() * modes.length)];
        setAnimationMode(mode);

        // Slot machine effect (Only for SLOT mode)
        if (mode === 'SLOT') {
            let speed = 50;
            let duration = 3000; // 3 seconds spin
            let elapsed = 0;

            const spin = () => {
                elapsed += speed;

                // Slow down effect
                if (elapsed > duration * 0.6) {
                    speed += 20;
                }

                if (elapsed < duration) {
                    spinIntervalRef.current = setTimeout(spin, speed);
                } else {
                    handleFinishRacing(finalWinners);
                }
            };

            spin();
        }
        // RACING and WHEEL modes handle their own timing and call handleFinishRacing via onFinish prop
    };

    const handleFinishRacing = (finalWinners: User[]) => {
        setWinners(finalWinners);
        setIsSpinning(false);
        triggerConfetti();
        saveResult(topic, finalWinners.map(w => w.id));
    };

    const triggerConfetti = () => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    };

    const saveResult = async (finalTopic: string, winnerIds: string[]) => {
        try {
            const { data, error } = await supabase
                .from('randomizer_history')
                .insert({
                    topic: finalTopic,
                    winner_ids: winnerIds,
                    created_by: currentUser?.id
                })
                .select()
                .single();

            if (error) throw error;
            
            // Add to local history
            const newHistoryItem = {
                ...data,
                winners: winnerIds.map(id => users.find(u => u.id === id)).filter(Boolean)
            };
            setHistory(prev => [newHistoryItem, ...prev].slice(0, 20));
            
        } catch (error: any) {
            console.error('Error saving result:', error);
            showToast('บันทึกผลการสุ่มไม่สำเร็จ', 'error');
        }
    };

    const handleDeleteHistory = async (id: string) => {
        try {
            const { error } = await supabase
                .from('randomizer_history')
                .delete()
                .eq('id', id);

            if (error) throw error;
            
            setHistory(prev => prev.filter(h => h.id !== id));
            showToast('ลบประวัติสำเร็จ', 'success');
        } catch (error: any) {
            console.error('Error deleting history:', error);
            showToast('ลบประวัติไม่สำเร็จ', 'error');
        }
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        onClick={!isSpinning ? onClose : undefined}
                    />
                    
                    {/* Glowing Background Effect */}
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.5, 0.3],
                            rotate: [0, 90, 180, 270, 360]
                        }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute w-[800px] h-[800px] bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-[100px] pointer-events-none"
                    />

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.5, rotate: -10, y: 100 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, rotate: 10, y: 100 }}
                        transition={{ type: "spring", damping: 15, stiffness: 100 }}
                        className="relative w-full max-w-3xl bg-white rounded-[3rem] shadow-[0_0_50px_rgba(79,70,229,0.3)] overflow-hidden flex flex-col max-h-[90vh] border-4 border-white"
                    >
                        {/* Header */}
                        <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
                            <div className="flex items-center gap-4 relative z-10">
                                <motion.div 
                                    animate={{ 
                                        rotate: [0, 15, -15, 15, 0],
                                        scale: [1, 1.1, 1]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="p-4 bg-white rounded-[1.5rem] shadow-lg text-indigo-600 border border-indigo-50"
                                >
                                    <Dices className="w-8 h-8" />
                                </motion.div>
                                <div>
                                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                                        สุ่มผู้โชคดี 
                                        <motion.span
                                            animate={{ y: [0, -5, 0] }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                        >
                                            🎲
                                        </motion.span>
                                    </h2>
                                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest opacity-70">The Chosen One Randomizer</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 relative z-10">
                                <button 
                                    onClick={() => setShowHistory(!showHistory)}
                                    className={`p-3.5 rounded-2xl transition-all ${showHistory ? 'bg-indigo-600 text-white shadow-lg scale-110' : 'bg-white text-slate-500 hover:bg-slate-100 shadow-sm'}`}
                                    title="ประวัติการสุ่ม"
                                >
                                    <History className="w-6 h-6" />
                                </button>
                                <button 
                                    onClick={onClose}
                                    disabled={isSpinning}
                                    className="p-3.5 bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all shadow-sm disabled:opacity-50"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 flex flex-col items-center">
                            <AnimatePresence mode="wait">
                                {showHistory ? (
                                    <RandomizerHistoryView 
                                        history={history} 
                                        isLoading={isLoadingHistory} 
                                        onDelete={handleDeleteHistory} 
                                    />
                                ) : winners.length > 0 ? (
                                    <RandomizerResult 
                                        winners={winners} 
                                        topicLabel={topic} 
                                        onReset={() => setWinners([])} 
                                    />
                                ) : isSpinning ? (
                                    animationMode === 'SLOT' ? (
                                        <RandomizerSpinning 
                                            activeUsers={(() => {
                                                let pool = activeUsers;
                                                if (selectedPosition !== 'ALL') pool = pool.filter(u => u.position === selectedPosition);
                                                if (selectedUserIds.length > 0) pool = pool.filter(u => selectedUserIds.includes(u.id));
                                                return pool;
                                            })()}
                                            numWinners={numWinners}
                                        />
                                    ) : animationMode === 'RACING' ? (
                                        <RandomizerRacing 
                                            activeUsers={(() => {
                                                let pool = activeUsers;
                                                if (selectedPosition !== 'ALL') pool = pool.filter(u => u.position === selectedPosition);
                                                if (selectedUserIds.length > 0) pool = pool.filter(u => selectedUserIds.includes(u.id));
                                                return pool;
                                            })()}
                                            winners={pendingWinners}
                                            numWinners={numWinners}
                                            duration={15000}
                                            onFinish={() => handleFinishRacing(pendingWinners)}
                                        />
                                    ) : (
                                        <RandomizerWheel 
                                            activeUsers={(() => {
                                                let pool = activeUsers;
                                                if (selectedPosition !== 'ALL') pool = pool.filter(u => u.position === selectedPosition);
                                                if (selectedUserIds.length > 0) pool = pool.filter(u => selectedUserIds.includes(u.id));
                                                return pool;
                                            })()}
                                            winners={pendingWinners}
                                            onFinish={() => handleFinishRacing(pendingWinners)}
                                        />
                                    )
                                ) : (
                                    <RandomizerConfig 
                                        topic={topic}
                                        setTopic={setTopic}
                                        numWinners={numWinners}
                                        setNumWinners={setNumWinners}
                                        selectedPosition={selectedPosition}
                                        setSelectedPosition={setSelectedPosition}
                                        selectedUserIds={selectedUserIds}
                                        setSelectedUserIds={setSelectedUserIds}
                                        activeUsers={activeUsers}
                                        isSpinning={isSpinning}
                                        onSpin={handleSpin}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default RandomizerModal;
