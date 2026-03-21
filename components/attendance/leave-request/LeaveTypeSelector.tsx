
import React from 'react';
import { MasterOption } from '../../../types';
import { LEAVE_THEMES } from './constants';
import * as LucideIcons from 'lucide-react';

interface Props {
    masterOptions: MasterOption[];
    onSelect: (key: string) => void;
}

const LeaveTypeSelector: React.FC<Props> = ({ masterOptions, onSelect }) => {
    // Standard Types from DB
    const leaveOptions = masterOptions
        .filter(o => o.type === 'LEAVE_TYPE' && o.isActive)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    const renderIcon = (iconName: string, className: string) => {
        const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.FileText;
        return <IconComponent className={className} />;
    };

    const getMetadata = (description?: string) => {
        try {
            return description ? JSON.parse(description) : {};
        } catch (e) {
            return {};
        }
    };

    const specialOptions = leaveOptions.filter(o => getMetadata(o.description).category === 'SPECIAL');
    const standardOptions = leaveOptions.filter(o => getMetadata(o.description).category === 'STANDARD');
    const correctionOptions = leaveOptions.filter(o => getMetadata(o.description).category === 'CORRECTION');
    const otherOptions = leaveOptions.filter(o => !['SPECIAL', 'STANDARD', 'CORRECTION'].includes(getMetadata(o.description).category));

    return (
        <div className="flex flex-col gap-6 pb-4">
            {/* Special Types (e.g. WFH, OT) */}
            {specialOptions.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <LucideIcons.Star className="w-4 h-4 text-amber-500" />
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">คำขอพิเศษ (Special)</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        {specialOptions.map(opt => {
                            const meta = getMetadata(opt.description);
                            const th = LEAVE_THEMES[opt.key] || LEAVE_THEMES['WFH'] || LEAVE_THEMES['DEFAULT'];
                            return (
                                <button 
                                    key={opt.key}
                                    onClick={() => onSelect(opt.key)} 
                                    className={`flex flex-row items-center justify-between p-4 rounded-2xl border-2 transition-all group active:scale-95 ${th.bg} ${th.border} hover:shadow-md`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                            {renderIcon(meta.icon || 'Home', `w-5 h-5 ${th.text}`)}
                                        </div>
                                        <div className="text-left">
                                            <span className={`font-black text-sm block ${th.text}`}>{opt.label}</span>
                                            {meta.subLabel && <span className={`text-[10px] font-medium opacity-80 ${th.text}`}>{meta.subLabel}</span>}
                                        </div>
                                    </div>
                                    <LucideIcons.ChevronRight className={`w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity ${th.text}`} />
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Standard Types */}
            {standardOptions.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <LucideIcons.Calendar className="w-4 h-4 text-indigo-500" />
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">ประเภทการลา (Leave)</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {standardOptions.map(opt => {
                            const meta = getMetadata(opt.description);
                            const th = LEAVE_THEMES[opt.key] || LEAVE_THEMES['DEFAULT'];
                            return (
                                <button 
                                    key={opt.key}
                                    onClick={() => onSelect(opt.key)}
                                    className="flex flex-col items-center justify-center p-4 rounded-2xl border border-gray-100 bg-white hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5 transition-all group active:scale-95"
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-colors ${th.bg} ${th.text}`}>
                                        {renderIcon(meta.icon || 'FileText', "w-6 h-6")}
                                    </div>
                                    <span className="font-bold text-gray-700 text-xs group-hover:text-indigo-600 text-center leading-tight">{opt.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Correction Types */}
            {correctionOptions.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <LucideIcons.Wrench className="w-4 h-4 text-rose-500" />
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">แก้ไขเวลาเข้า-ออก (Correction)</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {correctionOptions.map(opt => {
                            const meta = getMetadata(opt.description);
                            const th = LEAVE_THEMES[opt.key] || LEAVE_THEMES['DEFAULT'];
                            const hoverBorderColor = th.text.includes('rose') ? 'hover:border-rose-200' : 
                                                   th.text.includes('orange') ? 'hover:border-orange-200' : 
                                                   th.text.includes('amber') ? 'hover:border-amber-200' : 
                                                   'hover:border-indigo-200';
                            
                            return (
                                <button 
                                    key={opt.key}
                                    onClick={() => onSelect(opt.key)}
                                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border border-gray-100 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all group active:scale-95 ${hoverBorderColor}`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${th.bg} ${th.text}`}>
                                        {renderIcon(meta.icon || 'Clock', "w-6 h-6")}
                                    </div>
                                    <span className={`font-bold text-gray-700 text-xs text-center leading-tight group-hover:${th.text}`}>{opt.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Other Types */}
            {otherOptions.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <LucideIcons.MoreHorizontal className="w-4 h-4 text-gray-400" />
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">อื่นๆ (Other)</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {otherOptions.map(opt => {
                            const meta = getMetadata(opt.description);
                            const th = LEAVE_THEMES['DEFAULT'];
                            return (
                                <button 
                                    key={opt.key}
                                    onClick={() => onSelect(opt.key)}
                                    className="flex flex-col items-center justify-center p-4 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all group active:scale-95"
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${th.bg} ${th.text}`}>
                                        {renderIcon(meta.icon || 'FileText', "w-6 h-6")}
                                    </div>
                                    <span className="font-bold text-gray-700 text-xs text-center leading-tight">{opt.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveTypeSelector;
