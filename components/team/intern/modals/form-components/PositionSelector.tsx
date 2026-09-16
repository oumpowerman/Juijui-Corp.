
import React, { useMemo, useState } from 'react';
import { Palette, Lightbulb, Clapperboard, Briefcase, Camera, TrendingUp, FileText, Users, Code, ShieldCheck, PenTool, Edit3, FolderKanban, UserCheck, Award, Building2 } from 'lucide-react';
import { useMasterData } from '../../../../../hooks/useMasterData';

interface PositionSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

// Icon mapper for position keywords
const getPositionIcon = (keyOrLabel: string) => {
    const text = (keyOrLabel || '').toUpperCase();
    if (text.includes('GRAPHIC') || text.includes('DESIGN')) return Palette;
    if (text.includes('CREATIVE') || text.includes('IDEA')) return Lightbulb;
    if (text.includes('EDITOR') || text.includes('CUT') || text.includes('VIDEO')) return Clapperboard;
    if (text.includes('PRODUCTION') || text.includes('PROD') || text.includes('FILM') || text.includes('CAMERA')) return Camera;
    if (text.includes('MARKETING') || text.includes('SALE') || text.includes('PR')) return TrendingUp;
    if (text.includes('CONTENT') || text.includes('COPY') || text.includes('WRITER')) return FileText;
    if (text.includes('HR') || text.includes('PEOPLE')) return Users;
    if (text.includes('DEV') || text.includes('TECH') || text.includes('IT') || text.includes('CODE')) return Code;
    if (text.includes('ADMIN') || text.includes('MANAG')) return ShieldCheck;
    if (text.includes('PM') || text.includes('PROJECT')) return FolderKanban;
    if (text.includes('PA') || text.includes('PERSONAL')) return UserCheck;
    if (text.includes('EA') || text.includes('EXECUTIVE')) return Award;
    if (text.includes('AE') || text.includes('ACCOUNT')) return Building2;
    return Briefcase;
};

// Fallback position options if Master Data is empty or initializing
const DEFAULT_FALLBACK_POSITIONS = [
    { key: 'GRAPHIC', label: 'Graphic' },
    { key: 'CREATIVE', label: 'Creative' },
    { key: 'EDITOR', label: 'Editor' },
    { key: 'PRODUCTION', label: 'Production' },
    { key: 'PM', label: 'PM (Project Manager)' },
    { key: 'PA', label: 'PA (Personal Assistant)' },
    { key: 'EA', label: 'EA (Executive Assistant)' },
    { key: 'AE', label: 'AE (Account Executive)' }
];

const PositionSelector: React.FC<PositionSelectorProps> = ({ value, onChange }) => {
    const { masterOptions, isLoading } = useMasterData();
    const [isCustomMode, setIsCustomMode] = useState(false);

    // Filter position options from Master Data
    const positionList = useMemo(() => {
        const fromMaster = masterOptions
            .filter(o => o.type === 'POSITION')
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        if (fromMaster.length > 0) {
            return fromMaster.map(pos => ({
                id: pos.id,
                key: pos.key,
                label: pos.label || pos.key,
            }));
        }

        return DEFAULT_FALLBACK_POSITIONS.map(pos => ({
            id: pos.key,
            key: pos.key,
            label: pos.label
        }));
    }, [masterOptions]);

    // Check if the current value exists in position list
    const matchedOption = useMemo(() => {
        if (!value) return null;
        const valUpper = value.trim().toUpperCase();
        return positionList.find(
            opt => opt.key.toUpperCase() === valUpper || opt.label.toUpperCase() === valUpper
        );
    }, [value, positionList]);

    // If current value is not in MasterData list, include it as a custom position option
    const optionsToRender = useMemo(() => {
        const list = [...positionList];
        if (value && value.trim() !== '' && !matchedOption) {
            list.push({
                id: `CUSTOM_${value}`,
                key: value,
                label: value
            });
        }
        return list;
    }, [positionList, value, matchedOption]);

    return (
        <div className="space-y-2">
            {!isCustomMode ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {optionsToRender.map((opt) => {
                        const Icon = getPositionIcon(opt.label || opt.key);
                        const isActive = value && (
                            value.trim().toUpperCase() === opt.key.toUpperCase() ||
                            value.trim().toUpperCase() === opt.label.toUpperCase()
                        );

                        return (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => onChange(opt.label || opt.key)}
                                className={`flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl border-2 transition-all gap-1.5 ${
                                    isActive
                                        ? 'border-indigo-500 bg-indigo-50/70 shadow-md scale-[1.02] text-indigo-700'
                                        : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50 text-gray-500'
                                }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                                <span className={`text-xs font-bold uppercase tracking-wider text-center truncate max-w-full ${
                                    isActive ? 'text-indigo-700' : 'text-gray-600'
                                }`}>
                                    {opt.label || opt.key}
                                </span>
                            </button>
                        );
                    })}

                    {/* Button to type custom position if needed */}
                    <button
                        type="button"
                        onClick={() => setIsCustomMode(true)}
                        className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 hover:bg-gray-100/60 hover:border-gray-300 transition-all gap-1.5 text-gray-400 hover:text-gray-600"
                        title="ระบุตำแหน่งอื่นเพิ่มเติม"
                    >
                        <Edit3 className="w-5 h-5" />
                        <span className="text-[11px] font-bold tracking-wider">ระบุเอง</span>
                    </button>
                </div>
            ) : (
                <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                        <PenTool className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                        <input
                            type="text"
                            autoFocus
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="พิมพ์ตำแหน่งงาน (เช่น Marketing, Video Editor...)"
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-indigo-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 rounded-xl text-sm font-kanit font-bold text-gray-800 outline-none transition-all"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsCustomMode(false)}
                        className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-600 transition-all shrink-0"
                    >
                        เลือกจากรายการ
                    </button>
                </div>
            )}

            <div className="flex justify-between items-center text-[10px] text-gray-400 font-medium px-1">
                <span>* ดึงข้อมูลตำแหน่งจากระบบ Master Data Management</span>
                {isLoading && <span className="text-indigo-500 font-bold animate-pulse">กำลังอัปเดตตำแหน่ง...</span>}
            </div>
        </div>
    );
};

export default PositionSelector;

