import React from 'react';
import { User } from '../../../types';
import { Gavel, X, Heart, Trophy, Coins, Loader2, Check } from 'lucide-react';

interface GameMasterFormProps {
    user: User;
    adjustForm: {
        hp: number;
        xp: number;
        points: number;
        reason: string;
    };
    setAdjustForm: React.Dispatch<React.SetStateAction<any>>;
    isSaving: boolean;
    onCancel: () => void;
    onSave: () => void;
}

export const GameMasterForm: React.FC<GameMasterFormProps> = ({
    user,
    adjustForm,
    setAdjustForm,
    isSaving,
    onCancel,
    onSave
}) => {
    return (
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-purple-700 flex items-center gap-2">
                    <Gavel className="w-4 h-4"/> ปรับค่า Stats ของ {user.name}
                </span>
                <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 bg-white rounded-full p-1"><X className="w-4 h-4"/></button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
                <div><label className="text-[9px] font-bold text-gray-500 flex items-center mb-1"><Heart className="w-3 h-3 mr-1 text-red-400"/> HP (+/-)</label><input type="number" className="w-full text-xs p-2 rounded-lg border border-purple-200 bg-white font-bold" value={adjustForm.hp} onChange={e => setAdjustForm({...adjustForm, hp: Number(e.target.value)})} /></div>
                <div><label className="text-[9px] font-bold text-gray-500 flex items-center mb-1"><Trophy className="w-3 h-3 mr-1 text-yellow-400"/> XP (+/-)</label><input type="number" className="w-full text-xs p-2 rounded-lg border border-purple-200 bg-white font-bold" value={adjustForm.xp} onChange={e => setAdjustForm({...adjustForm, xp: Number(e.target.value)})} /></div>
                <div><label className="text-[9px] font-bold text-gray-500 flex items-center mb-1"><Coins className="w-3 h-3 mr-1 text-yellow-600"/> Coin (+/-)</label><input type="number" className="w-full text-xs p-2 rounded-lg border border-purple-200 bg-white font-bold" value={adjustForm.points} onChange={e => setAdjustForm({...adjustForm, points: Number(e.target.value)})} /></div>
            </div>
            <div className="mb-3"><label className="text-[9px] font-bold text-gray-500 mb-1 block">เหตุผล</label><input type="text" className="w-full text-xs p-2 rounded-lg border border-purple-200 bg-white" placeholder="เช่น ชดเชยระบบรวน..." value={adjustForm.reason} onChange={e => setAdjustForm({...adjustForm, reason: e.target.value})} /></div>
            <button onClick={onSave} disabled={isSaving} className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center shadow-md transition-all active:scale-95 disabled:opacity-70">{isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4 mr-1"/>} ยืนยันการปรับค่า</button>
        </div>
    );
};
