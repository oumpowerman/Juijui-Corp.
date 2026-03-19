
import React from 'react';
import { LabSequenceItem } from './ScriptLabView';
import { 
    DndContext, 
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import LabBlock from './LabBlock';
import { Plus, Layers, Info } from 'lucide-react';

interface LabMixerProps {
    sequence: LabSequenceItem[];
    setSequence: React.Dispatch<React.SetStateAction<LabSequenceItem[]>>;
    onRemoveItem: (id: string) => void;
    onUpdateItemContent: (id: string, content: string) => void;
    onUpdateItemTitle: (id: string, title: string) => void;
    onUpdateItemSheet?: (id: string, sheetId: string) => void;
    onAddBridge: () => void;
}

const LabMixer: React.FC<LabMixerProps> = ({ 
    sequence, setSequence, onRemoveItem, onUpdateItemContent, onUpdateItemTitle, onUpdateItemSheet, onAddBridge 
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Prevent accidental drags
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setSequence((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    return (
        <div className="flex-1 bg-[#0f0f1a] flex flex-col overflow-hidden relative font-kanit font-bold">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
            </div>

            {/* Mixer Header */}
            <div className="p-6 flex items-center justify-between shrink-0 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-xl">
                        <Layers className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-[20px] font-bold text-white">Mixer Sequence</h3>
                        <p className="text-[14px] font-bold text-white/30 uppercase tracking-widest">จัดลำดับและปรุงเนื้อหาที่นี่</p>
                    </div>
                </div>

                <button 
                    onClick={onAddBridge}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black flex items-center gap-2 transition-all active:scale-95 font-kanit font-bold"
                >
                    <Plus className="w-4 h-4 text-indigo-400" />
                    เพิ่ม Bridge / Transition
                </button>
            </div>

            {/* Sequence List */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin relative z-10">
                {sequence.length > 0 ? (
                    <DndContext 
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext 
                            items={sequence.map(i => i.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="flex flex-col gap-4">
                                {sequence.map((item) => (
                                    <LabBlock 
                                        key={item.id}
                                        item={item}
                                        onRemove={() => onRemoveItem(item.id)}
                                        onUpdateContent={(content) => onUpdateItemContent(item.id, content)}
                                        onUpdateTitle={(title) => onUpdateItemTitle(item.id, title)}
                                        onUpdateSheet={(sheetId) => onUpdateItemSheet?.(item.id, sheetId)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                        <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center">
                            <Plus className="w-10 h-10" />
                        </div>
                        <div className="max-w-xs">
                            <p className="text-sm font-black uppercase tracking-widest mb-2">ยังไม่มีรายการใน Mixer</p>
                            <p className="text-xs font-medium">เลือกสคริปต์จากคลังด้านซ้าย หรือเพิ่ม Bridge เพื่อเริ่มผสมเนื้อหา</p>
                        </div>
                    </div>
                )}
                
                {/* Bottom Spacer for padding */}
                <div className="h-20" />
            </div>

            {/* Tips Overlay */}
            <div className="absolute bottom-6 left-6 right-6 pointer-events-none">
                <div className="bg-indigo-500/10 backdrop-blur-md border border-indigo-500/20 p-3 rounded-2xl flex items-center gap-3 max-w-md mx-auto shadow-2xl">
                    <div className="p-1.5 bg-indigo-500 rounded-lg">
                        <Info className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-[14px] font-medium text-indigo-200/70">
                        Tip: ลากสลับลำดับได้อิสระ เนื้อหาใน Preview จะเปลี่ยนตามทันที
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LabMixer;
