
import React, { useState } from 'react';
import { IndividualGoal } from '../../../types';
import { Target, Plus, Trash2 } from 'lucide-react';

interface OKRSectionProps {
    goals: IndividualGoal[];
    isAdmin: boolean;
    onAddGoal: (title: string, target: number, unit: string) => void;
    onUpdateActual: (id: string, value: number) => void;
    onDeleteGoal: (id: string) => void;
}

const OKRSection: React.FC<OKRSectionProps> = ({ goals, isAdmin, onAddGoal, onUpdateActual, onDeleteGoal }) => {
    const [newTitle, setNewTitle] = useState('');
    const [newTarget, setNewTarget] = useState(10);
    const [newUnit, setNewUnit] = useState('คลิป');

    const handleAdd = () => {
        if (!newTitle.trim()) return;
        onAddGoal(newTitle, newTarget, newUnit);
        setNewTitle('');
    };

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-blue-500" /> 
                    ผลงาน (OKRs)
                </h3>
                {isAdmin && (
                    <div className="flex gap-2">
                        <input type="text" placeholder="ชื่อเป้าหมาย..." className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs w-28 focus:ring-2 focus:ring-blue-100 outline-none" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                        <input type="number" className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:ring-2 focus:ring-blue-100 outline-none" value={newTarget} onChange={e => setNewTarget(Number(e.target.value))} />
                        <button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg transition-colors"><Plus className="w-4 h-4" /></button>
                    </div>
                )}
            </div>

            {goals.length === 0 ? (
                <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                    <p className="text-sm">ยังไม่มีเป้าหมายสำหรับเดือนนี้</p>
                    {isAdmin && <p className="text-xs mt-1 text-blue-500 font-bold cursor-pointer" onClick={() => document.querySelector('input')?.focus()}>+ เพิ่มเป้าหมาย</p>}
                </div>
            ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {goals.map(g => {
                        const percent = Math.min(100, Math.round((g.actualValue / g.targetValue) * 100));
                        return (
                            <div key={g.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-200 transition-colors">
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold text-gray-700 text-sm truncate pr-2">{g.title}</span>
                                    <span className="text-xs font-bold text-gray-500 whitespace-nowrap">{g.actualValue} / {g.targetValue} {g.unit}</span>
                                </div>
                                <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden mb-3">
                                    <div className={`h-full rounded-full transition-all duration-700 ${percent >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${percent}%` }}></div>
                                </div>
                                
                                {isAdmin ? (
                                    <div className="flex items-center gap-3 justify-end pt-2 border-t border-gray-200/50">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">Actual:</span>
                                            <input 
                                                type="number" 
                                                className="w-16 p-1 text-center font-bold border border-gray-300 rounded text-xs focus:border-blue-400 outline-none" 
                                                value={g.actualValue} 
                                                onChange={(e) => onUpdateActual(g.id, Number(e.target.value))}
                                            />
                                        </div>
                                        <button onClick={() => onDeleteGoal(g.id)} className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                                    </div>
                                ) : (
                                    <div className="text-right">
                                        <span className={`text-xs font-bold ${percent >= 100 ? 'text-green-600' : 'text-blue-600'}`}>{percent}% Achieved</span>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export default OKRSection;
