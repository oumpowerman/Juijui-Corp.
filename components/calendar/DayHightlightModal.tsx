
import React, { useState } from 'react';
import { X, Calendar, Check, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { MasterOption } from '../../types';

interface DayHighlightModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date | null;
    masterOptions: MasterOption[];
    currentHighlightType?: string;
    onSave: (typeKey: string, note?: string) => void;
    onRemove: () => void;
}

const DayHighlightModal: React.FC<DayHighlightModalProps> = ({
    isOpen, onClose, date, masterOptions, currentHighlightType, onSave, onRemove
}) => {
    const [note, setNote] = useState('');

    if (!isOpen || !date) return null;

    // Filter only EVENT_TYPE options
    const eventTypes = masterOptions
        .filter(o => o.type === 'EVENT_TYPE' && o.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder);

    const handleSelect = (key: string) => {
        onSave(key, note);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        {format(date, 'd MMM yyyy')}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-3">เลือกประเภทวัน (Day Type)</p>
                    
                    <div className="space-y-2 mb-4">
                        {eventTypes.length === 0 ? (
                             <div className="text-center py-4 text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed">
                                 ยังไม่ได้ตั้งค่า EVENT_TYPE <br/>ใน Master Data
                             </div>
                        ) : (
                            eventTypes.map(type => (
                                <button
                                    key={type.key}
                                    onClick={() => handleSelect(type.key)}
                                    className={`
                                        w-full flex items-center justify-between p-3 rounded-xl border transition-all
                                        ${currentHighlightType === type.key 
                                            ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' 
                                            : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded-full ${type.color?.split(' ')[0] || 'bg-gray-200'}`}></div>
                                        <span className={`text-sm font-bold ${currentHighlightType === type.key ? 'text-indigo-900' : 'text-gray-700'}`}>
                                            {type.label}
                                        </span>
                                    </div>
                                    {currentHighlightType === type.key && <Check className="w-4 h-4 text-indigo-600" />}
                                </button>
                            ))
                        )}
                    </div>

                    {currentHighlightType && (
                        <button 
                            onClick={() => { onRemove(); onClose(); }}
                            className="w-full py-2.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl text-xs font-bold flex items-center justify-center transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> ลบไฮไลท์ (Clear)
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DayHighlightModal;
