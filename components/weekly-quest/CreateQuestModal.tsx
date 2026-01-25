
import React, { useState } from 'react';
import { Target, X, PlusCircle, Trash2, CheckCircle2, Sparkles, Calendar } from 'lucide-react';
import { Channel, MasterOption, WeeklyQuest, Platform } from '../../types';
import { CONTENT_FORMATS } from '../../constants';
import { format } from 'date-fns';

interface CreateQuestModalProps {
    isOpen: boolean;
    onClose: () => void;
    channels: Channel[];
    masterOptions: MasterOption[];
    weekStart: Date;
    onAddQuest: (quest: Omit<WeeklyQuest, 'id'>) => void;
}

// Local Interface
interface PendingQuestItem {
    id: string; 
    title: string;
    targetCount: number;
    platform?: Platform | 'ALL';
    formatKey?: string; 
    statusKey?: string; 
    questType: 'AUTO' | 'MANUAL';
}

const CreateQuestModal: React.FC<CreateQuestModalProps> = ({ isOpen, onClose, channels, masterOptions, weekStart, onAddQuest }) => {
    const [selectedChannelId, setSelectedChannelId] = useState<string>('');
    const [customChannelName, setCustomChannelName] = useState('');
    const [isCustomChannel, setIsCustomChannel] = useState(false);
    
    // New: Custom Start Date
    const [customStartDate, setCustomStartDate] = useState(format(weekStart, 'yyyy-MM-dd'));

    // Master Data
    const statusOptions = masterOptions.filter(o => o.type === 'STATUS' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);
    const formatOptions = masterOptions.filter(o => o.type === 'FORMAT' && o.isActive);
    const defaultStatusKey = statusOptions.length > 0 ? statusOptions[statusOptions.length - 1].key : 'DONE';

    const [questItems, setQuestItems] = useState<PendingQuestItem[]>([
        { id: '1', title: 'ลง Story 📱', targetCount: 5, platform: 'INSTAGRAM', statusKey: defaultStatusKey, questType: 'AUTO' },
    ]);

    const selectedChannelObj = channels.find(c => c.id === selectedChannelId);

    const handleAddDefaultItems = () => {
        setQuestItems([
            { id: crypto.randomUUID(), title: 'ลง Story (IG) 📱', targetCount: 5, platform: 'INSTAGRAM', statusKey: defaultStatusKey, questType: 'AUTO' },
            { id: crypto.randomUUID(), title: 'ลง Post (FB) 🖼️', targetCount: 3, platform: 'FACEBOOK', statusKey: defaultStatusKey, questType: 'AUTO' },
            { id: crypto.randomUUID(), title: 'ลง Reels/Shorts 🎬', targetCount: 3, platform: 'ALL', formatKey: 'REELS', statusKey: defaultStatusKey, questType: 'AUTO' },
            { id: crypto.randomUUID(), title: 'ทำความสะอาดสตู 🧹', targetCount: 1, questType: 'MANUAL' },
        ]);
    };

    const handleCreateGroup = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isCustomChannel && !selectedChannelId) {
            alert("กรุณาเลือกช่อง (Channel) หรือพิมพ์ชื่อใหม่ครับ");
            return;
        }

        const effectiveStartDate = new Date(customStartDate);

        questItems.forEach(item => {
            if(!item.title) return;
            const finalTitle = isCustomChannel ? `[${customChannelName}] ${item.title}` : item.title;
            onAddQuest({
                title: finalTitle,
                weekStartDate: effectiveStartDate, // Use the picker date
                targetCount: item.targetCount,
                channelId: isCustomChannel ? undefined : selectedChannelId,
                targetPlatform: item.questType === 'AUTO' ? item.platform : undefined,
                targetFormat: item.questType === 'AUTO' ? item.formatKey : undefined,
                targetStatus: item.questType === 'AUTO' ? item.statusKey : undefined,
                questType: item.questType,
                manualProgress: 0
            });
        });

        onClose();
        // Reset
        setQuestItems([{ id: '1', title: 'ลง Story 📱', targetCount: 5, platform: 'INSTAGRAM', statusKey: defaultStatusKey, questType: 'AUTO' }]);
        setSelectedChannelId('');
        setCustomChannelName('');
        setIsCustomChannel(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100 scale-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex justify-between items-start text-white shrink-0">
                    <div>
                        <h3 className="font-bold text-xl flex items-center gap-2">
                            <Target className="w-6 h-6 text-yellow-300" /> 
                            สร้างภารกิจใหม่ (Create Plan)
                        </h3>
                        <p className="text-indigo-100 text-sm mt-1">กำหนดเงื่อนไขให้ชัดเจน หรือสร้างแบบ Manual เพื่อนับยอดเอง</p>
                    </div>
                    <button onClick={onClose} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <form id="quest-form" onSubmit={handleCreateGroup} className="space-y-6">
                        
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Channel Selection */}
                            <div className="flex-1 space-y-3">
                                <label className="text-sm font-bold text-gray-700 flex items-center">1. ภารกิจนี้ของช่องไหน? (Select Channel)</label>
                                {!isCustomChannel ? (
                                    <div className="flex items-center gap-3">
                                        {/* Show Selected Logo */}
                                        {selectedChannelId && (
                                            <div className="w-12 h-12 shrink-0 rounded-xl border-2 border-gray-200 p-0.5 bg-white shadow-sm overflow-hidden">
                                                    {selectedChannelObj?.logoUrl ? (
                                                        <img src={selectedChannelObj.logoUrl} className="w-full h-full object-cover rounded-lg" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold">{selectedChannelObj?.name.substring(0,2)}</div>
                                                    )}
                                            </div>
                                        )}
                                        <div className="flex-1 flex gap-2">
                                            <select className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 font-bold text-gray-700 outline-none focus:border-indigo-500 bg-white" value={selectedChannelId} onChange={e => setSelectedChannelId(e.target.value)}>
                                                <option value="" disabled>-- เลือกช่อง (Brand) --</option>
                                                {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                            <button type="button" onClick={() => setIsCustomChannel(true)} className="px-3 py-2 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 text-xs font-bold whitespace-nowrap">หรือ พิมพ์ชื่อเอง</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-2 animate-in fade-in slide-in-from-right-4">
                                        <input type="text" autoFocus className="flex-1 border-2 border-indigo-200 rounded-xl px-4 py-2.5 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="พิมพ์ชื่อช่อง/แบรนด์ชั่วคราว..." value={customChannelName} onChange={e => setCustomChannelName(e.target.value)} />
                                        <button type="button" onClick={() => setIsCustomChannel(false)} className="px-3 py-2 text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 text-xs font-bold whitespace-nowrap">กลับไปเลือก</button>
                                    </div>
                                )}
                            </div>

                            {/* Date Selection */}
                            <div className="w-full md:w-1/3 space-y-3">
                                <label className="text-sm font-bold text-gray-700 flex items-center">เริ่มวันที่ (Start Date)</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input 
                                        type="date" 
                                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl font-bold text-gray-700 focus:border-indigo-500 outline-none"
                                        value={customStartDate}
                                        onChange={e => setCustomStartDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Quest Items */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <label className="text-sm font-bold text-gray-700 flex items-center">2. รายการภารกิจ (Quest Items)</label>
                                <button type="button" onClick={handleAddDefaultItems} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 flex items-center"><Sparkles className="w-3 h-3 mr-1" /> โหลดชุดมาตรฐาน</button>
                            </div>
                            
                            <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100">
                                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2 px-2">
                                    <div className="col-span-1">Type</div>
                                    <div className="col-span-3">ชื่องาน</div>
                                    <div className="col-span-2">Platform</div>
                                    <div className="col-span-2">Format</div>
                                    <div className="col-span-2">Status</div>
                                    <div className="col-span-1 text-center">เป้า</div>
                                    <div className="col-span-1"></div>
                                </div>

                                {questItems.map((item, index) => (
                                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                                        
                                        {/* Type Toggle */}
                                        <div className="col-span-1">
                                            <button
                                                type="button"
                                                onClick={() => setQuestItems(prev => prev.map(i => i.id === item.id ? { ...i, questType: i.questType === 'AUTO' ? 'MANUAL' : 'AUTO' } : i))}
                                                className={`w-full py-1.5 rounded text-[10px] font-bold border flex items-center justify-center ${
                                                    item.questType === 'AUTO' 
                                                    ? 'bg-blue-50 text-blue-600 border-blue-200' 
                                                    : 'bg-orange-50 text-orange-600 border-orange-200'
                                                }`}
                                                title={item.questType === 'AUTO' ? 'นับยอดอัตโนมัติจาก DB' : 'นับยอดเองด้วยมือ'}
                                            >
                                                {item.questType === 'AUTO' ? 'Auto' : 'Manual'}
                                            </button>
                                        </div>

                                        {/* Title */}
                                        <div className="col-span-3 flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">{index + 1}</div>
                                            <input type="text" className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:border-indigo-500 outline-none" placeholder="เช่น ลง Story" value={item.title} onChange={e => setQuestItems(prev => prev.map(i => i.id === item.id ? { ...i, title: e.target.value } : i))} />
                                        </div>
                                        
                                        {item.questType === 'AUTO' ? (
                                            <>
                                                {/* Platform */}
                                                <div className="col-span-2">
                                                    <select className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs font-bold text-gray-600 focus:border-indigo-500 outline-none bg-white" value={item.platform || ''} onChange={e => setQuestItems(prev => prev.map(i => i.id === item.id ? { ...i, platform: e.target.value as Platform | 'ALL' || undefined } : i))}>
                                                        <option value="">(ไม่ระบุ)</option>
                                                        <option value="ALL">🌐 ทุกช่องทาง</option>
                                                        <option value="INSTAGRAM">IG/Story</option>
                                                        <option value="FACEBOOK">Facebook</option>
                                                        <option value="TIKTOK">TikTok</option>
                                                        <option value="YOUTUBE">YouTube</option>
                                                    </select>
                                                </div>

                                                {/* Format */}
                                                <div className="col-span-2">
                                                    <select className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs font-bold text-gray-600 focus:border-indigo-500 outline-none bg-white" value={item.formatKey || ''} onChange={e => setQuestItems(prev => prev.map(i => i.id === item.id ? { ...i, formatKey: e.target.value || undefined } : i))}>
                                                        <option value="">(ไม่ระบุ)</option>
                                                        {formatOptions.length > 0 ? (
                                                            formatOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)
                                                        ) : (
                                                            Object.entries(CONTENT_FORMATS).map(([k, v]) => <option key={k} value={k}>{v.split(' ')[0]}</option>)
                                                        )}
                                                    </select>
                                                </div>

                                                {/* Status */}
                                                <div className="col-span-2">
                                                    <select className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs font-bold text-green-700 bg-green-50 focus:border-green-500 outline-none" value={item.statusKey || defaultStatusKey} onChange={e => setQuestItems(prev => prev.map(i => i.id === item.id ? { ...i, statusKey: e.target.value || undefined } : i))}>
                                                        {statusOptions.length > 0 ? (
                                                            statusOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)
                                                        ) : (
                                                            <>
                                                                <option value="DONE">Done ✅</option>
                                                                <option value="APPROVE">Approve 👍</option>
                                                            </>
                                                        )}
                                                    </select>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="col-span-6 flex items-center justify-center">
                                                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full w-full text-center">
                                                    -- Manual Tracking (นับเอง) --
                                                </span>
                                            </div>
                                        )}

                                        {/* Count */}
                                        <div className="col-span-1">
                                            <input type="number" min={1} className="w-full border border-gray-200 rounded-lg px-1 py-2 text-sm text-center focus:border-indigo-500 outline-none" value={item.targetCount} onChange={e => setQuestItems(prev => prev.map(i => i.id === item.id ? { ...i, targetCount: Number(e.target.value) } : i))} />
                                        </div>
                                        
                                        {/* Delete */}
                                        <div className="col-span-1 text-center">
                                            <button type="button" onClick={() => setQuestItems(prev => prev.filter(i => i.id !== item.id))} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={() => setQuestItems(prev => [...prev, { id: crypto.randomUUID(), title: '', targetCount: 1, statusKey: defaultStatusKey, questType: 'AUTO' }])} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-white transition-all flex items-center justify-center text-sm font-bold"><PlusCircle className="w-4 h-4 mr-2" /> เพิ่มรายการ</button>
                            </div>
                        </div>
                    </form>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors">ยกเลิก</button>
                        <button type="submit" form="quest-form" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center"><CheckCircle2 className="w-5 h-5 mr-2" /> สร้างภารกิจ</button>
                </div>
            </div>
        </div>
    );
};

export default CreateQuestModal;
