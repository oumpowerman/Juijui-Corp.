import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import GlassyCard from './GlassyCard';
import { DIFFICULTY_LABELS } from '../../../../config/taxonomy';

interface ReportTaskTableProps {
    tasks: any[];
    userId: string;
}

const ReportTaskTable: React.FC<ReportTaskTableProps> = ({ tasks, userId }) => {
    return (
        <div className="mb-16">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-8 flex items-center">
                <CheckCircle2 className="w-5 h-5 mr-3 text-emerald-500" /> Task Fulfillment History
            </h3>
            <GlassyCard className="border-0 shadow-none bg-white/30" delay={0.6}>
                <div className="overflow-hidden rounded-[2.5rem] border border-white/40 shadow-xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/5 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                <th className="py-6 pl-10">Delivery Date</th>
                                <th className="py-6">Project / Task Title</th>
                                <th className="py-6 text-center">Involvement</th>
                                <th className="py-6 text-right pr-10">Performance</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs font-bold text-slate-600">
                            {tasks.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center text-slate-400 italic bg-white/20">
                                        No historical records found for this period.
                                    </td>
                                </tr>
                            ) : tasks.map((task, i) => {
                                const difficulty = task.difficulty || 'MEDIUM';
                                const xpValue = (DIFFICULTY_LABELS[difficulty as keyof typeof DIFFICULTY_LABELS]?.xp || 100) + ((task.estimatedHours || 0) * 20);
                                
                                // Detect role for this specific task
                                let myRole = 'Support';
                                if (task.ideaOwnerIds?.includes(userId)) myRole = 'Owner';
                                else if (task.editorIds?.includes(userId)) myRole = 'Editor';

                                return (
                                    <tr key={task.id} className="border-b border-white/20 hover:bg-white/60 transition-all duration-300 group">
                                        <td className="py-5 pl-10 font-mono text-slate-400 group-hover:text-indigo-500 transition-colors">
                                            {format(new Date(task.endDate), 'dd MMM yyyy')}
                                        </td>
                                        <td className="py-5 text-slate-800 max-w-[300px] truncate group-hover:translate-x-1 transition-transform">
                                            {task.title}
                                        </td>
                                        <td className="py-5 text-center">
                                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase shadow-sm ${
                                                myRole === 'Owner' ? 'bg-amber-100 text-amber-700' : 
                                                myRole === 'Editor' ? 'bg-purple-100 text-purple-700' : 
                                                'bg-indigo-100 text-indigo-700'
                                            }`}>
                                                {myRole}
                                            </span>
                                        </td>
                                        <td className="py-5 text-right pr-10">
                                            <div className="flex flex-col items-end">
                                                <span className="text-emerald-600 font-black">+{xpValue} XP</span>
                                                <span className="text-[9px] text-slate-300 uppercase tracking-tighter">{difficulty}</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </GlassyCard>
        </div>
    );
};

export default ReportTaskTable;
