import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { HPDeathLog } from '../../../types';
import {
  X,
  Skull,
  Calendar,
  AlertTriangle,
  ChevronRight,
  History,
  Zap,
  Ghost
} from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface DeathHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const DeathHistoryModal: React.FC<DeathHistoryModalProps> = ({
  isOpen,
  onClose,
  userId
}) => {
  const [logs, setLogs] = useState<HPDeathLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<HPDeathLog | null>(null);
  const [expandedPenaltyIndex, setExpandedPenaltyIndex] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchLogs = async () => {
      if (!isOpen || !userId) return;

      setIsLoading(true);

      const { data, error } = await supabase
        .from('hp_death_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!isMounted) return;

      if (!error && data) {
        const mapped = data.map((d) => ({
          id: d.id,
          userId: d.user_id,
          deathNumber: d.death_number,
          snapshotData: d.snapshot_data,
          createdAt: new Date(d.created_at)
        }));

        setLogs(mapped);
        if (mapped.length > 0) {
          setSelectedLog(mapped[0]);
        }
      }

      setIsLoading(false);
    };

    fetchLogs();

    return () => {
      isMounted = false;
    };
  }, [isOpen, userId]);

  const [view, setView] = useState<'list' | 'detail'>('list');

  useEffect(() => {
    if (!isOpen) {
      setSelectedLog(null);
      setExpandedPenaltyIndex(null);
      setView('list');
    }
  }, [isOpen]);

  const handleLogClick = (log: HPDeathLog) => {
    setSelectedLog(log);
    if (window.innerWidth < 768) {
      setView('detail');
    }
  };

  const penalties = useMemo(() => {
    if (!selectedLog) return [];

    const raw =
        selectedLog.snapshotData?.recentPenalties?.filter(
        (p: any) => p.hpChange < 0
        ) ?? [];

    let cumulative = 0;

    return raw.map((p: any) => {
        cumulative += p.hpChange; // hpChange เป็นค่าติดลบอยู่แล้ว
        return {
        ...p,
        cumulative
        };
    });
    }, [selectedLog]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 md:p-8
        bg-gradient-to-br from-slate-900/70 via-indigo-900/60 to-slate-900/70 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-4xl h-[90vh] md:h-[650px] 
          rounded-[2rem] md:rounded-[2.5rem] overflow-hidden 
          backdrop-blur-2xl bg-white/40 
          border border-white/30 
          shadow-[0_20px_80px_rgba(0,0,0,0.25)]
          flex flex-col"
        >
          {/* HEADER */}
          <div className="relative p-4 md:p-6 flex justify-between items-center 
            bg-gradient-to-br from-white/40 to-white/10 
            backdrop-blur-2xl border-b border-white/30 shrink-0"
          >
            <div className="flex items-center gap-3 md:gap-4">
              {view === 'detail' && (
                <button 
                  onClick={() => setView('list')}
                  className="md:hidden p-2 hover:bg-white/30 rounded-xl transition"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600 rotate-180" />
                </button>
              )}
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-red-500/20 
                flex items-center justify-center border border-red-500/30">
                <History className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-slate-800">
                  ประวัติการ HP หมด
                </h2>
                <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">
                  บันทึกเหตุการณ์ทั้งหมด
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/30 rounded-full transition"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden relative">
            {/* LEFT LIST */}
            <div className={`
              ${view === 'list' ? 'flex' : 'hidden md:flex'}
              w-full md:w-2/5 border-r border-white/30 overflow-y-auto p-4 flex-col space-y-3
            `}>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 font-bold">
                  Loading...
                </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 font-bold text-center">
                  <Ghost className="w-14 h-14 mb-4 opacity-30" />
                  ยังไม่เคย HP หมด ✨
                </div>
              ) : (
                logs.map((log) => (
                  <button
                    key={log.id}
                    onClick={() => handleLogClick(log)}
                    className={`w-full p-4 rounded-2xl text-left transition
                      backdrop-blur-xl border border-white/40
                      ${selectedLog?.id === log.id
                        ? 'bg-red-100/60'
                        : 'bg-white/50 hover:bg-white/70'}`}
                  >
                    <div className="flex justify-between text-[10px] md:text-xs font-bold text-slate-600 mb-1">
                      <span>ครั้งที่ {log.deathNumber}</span>
                      <span>
                        {format(log.createdAt, 'd MMM yy', { locale: th })}
                      </span>
                    </div>
                    <p className="font-bold text-red-600 text-sm md:text-base">HP CRITICAL</p>
                  </button>
                ))
              )}
            </div>

            {/* RIGHT DETAIL */}
            <div className={`
              ${view === 'detail' ? 'flex' : 'hidden md:flex'}
              flex-1 overflow-y-auto p-4 md:p-6 flex-col
            `}>
              {selectedLog ? (
                <div className="space-y-4 md:space-y-6">
                  <div className="bg-white/60 backdrop-blur-xl 
                    border border-white/40 rounded-3xl p-4 md:p-6 shadow-md">
                    <h3 className="text-base md:text-lg font-bold text-red-600 mb-4">
                      เหตุการณ์ทั้งหมดที่ทำให้ HP หมด
                    </h3>

                    <div className="space-y-3">
                        {/* TABLE HEADER */}
                        <div className="grid grid-cols-3 px-4 pb-3 
                            border-b border-white/40 
                            text-[10px] md:text-xs text-slate-500 font-bold tracking-wide">
                            <span>สาเหตุ</span>
                            <span className="text-right">HP ลด</span>
                            <span className="text-right">สะสม</span>
                        </div>

                        {penalties.map((penalty: any, i: number) => {

                            const isFinal = i === penalties.length - 1;

                            return (
                            <motion.div
                                key={i}
                                className={`rounded-2xl border border-white/40 
                                backdrop-blur-xl shadow-sm transition-all duration-200
                                ${isFinal
                                ? 'bg-red-100/50 ring-2 ring-red-400/40'
                                : 'bg-white/60 hover:bg-white/70'
                                }`}
                            >
                                <button
                                onClick={() =>
                                    setExpandedPenaltyIndex(
                                    expandedPenaltyIndex === i ? null : i
                                    )
                                }
                                className="w-full grid grid-cols-3 items-center p-3 md:p-4 font-bold text-left"
                                >
                                {/* DESCRIPTION */}
                                <div className="flex flex-col pr-2">
                                <span
                                    className={`text-red-600 text-xs md:text-sm transition-all duration-200
                                    ${
                                        expandedPenaltyIndex === i
                                        ? 'whitespace-normal break-words'
                                        : 'truncate'
                                    }
                                    `}
                                >
                                    {penalty.description}
                                </span>

                                {expandedPenaltyIndex === i && (
                                    <motion.span
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="text-[10px] md:text-xs text-slate-500 font-bold mt-1"
                                    >
                                    ▼ กดเพื่อซ่อนรายละเอียด
                                    </motion.span>
                                )}
                                </div>

                                {/* DAMAGE */}
                                <span className="text-right text-red-500 tabular-nums text-xs md:text-sm">
                                    {penalty.hpChange}
                                </span>

                                {/* CUMULATIVE */}
                                <span className={`text-right tabular-nums text-xs md:text-sm
                                    ${isFinal ? 'text-red-700' : 'text-indigo-600'}
                                `}>
                                    {penalty.cumulative}
                                </span>
                                </button>

                                <AnimatePresence>
                                {expandedPenaltyIndex === i && (
                                    <motion.div
                                        initial={{ opacity: 0, scaleY: 0.95 }}
                                        animate={{ opacity: 1, scaleY: 1 }}
                                        exit={{ opacity: 0, scaleY: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="px-4 pb-4 text-[10px] md:text-sm text-slate-600 font-bold origin-top"
                                    >
                                    เวลา:{' '}
                                    {format(
                                        new Date(penalty.createdAt),
                                        'dd MMM yyyy HH:mm',
                                        { locale: th }
                                    )}
                                    </motion.div>
                                )}
                                </AnimatePresence>
                            </motion.div>
                            );
                        })}
                        </div>
                  </div>

                  {/* STATS */}
                  <div className="grid grid-cols-3 gap-2 md:gap-4">
                    <div className="bg-white/60 backdrop-blur-xl p-3 md:p-4 rounded-2xl border border-white/40 text-center">
                      <p className="text-[10px] md:text-xs text-slate-500 font-bold">
                        Level
                      </p>
                      <p className="text-base md:text-xl font-bold text-indigo-600">
                        {selectedLog.snapshotData?.statsAtDeath?.level ?? '-'}
                      </p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-xl p-3 md:p-4 rounded-2xl border border-white/40 text-center">
                      <p className="text-[10px] md:text-xs text-slate-500 font-bold">XP</p>
                      <p className="text-base md:text-xl font-bold text-yellow-600">
                        {selectedLog.snapshotData?.statsAtDeath?.xp ?? '-'}
                      </p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-xl p-3 md:p-4 rounded-2xl border border-white/40 text-center">
                      <p className="text-[10px] md:text-xs text-slate-500 font-bold">
                        Coins
                      </p>
                      <p className="text-base md:text-xl font-bold text-emerald-600">
                        {selectedLog.snapshotData?.statsAtDeath?.availablePoints ??
                          '-'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 font-bold text-center p-8">
                  เลือกรายการทางซ้ายเพื่อดูรายละเอียด
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DeathHistoryModal;