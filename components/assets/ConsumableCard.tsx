
import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../../types';
import { Box, Minus, Plus, AlertCircle, Edit, Package, Check, Tag } from 'lucide-react';

interface ConsumableCardProps {
    item: InventoryItem;
    onUpdateStock: (id: string, newQty: number) => Promise<boolean>;
    onEdit: (item: InventoryItem) => void;
}

const ConsumableCard: React.FC<ConsumableCardProps> = ({ item, onUpdateStock, onEdit }) => {
    // Local state for optimistic UI updates
    const [currentQty, setCurrentQty] = useState(item.quantity);
    const [isUpdating, setIsUpdating] = useState(false);
    const [animateBump, setAnimateBump] = useState(false);

    // Sync with props if they change externally
    useEffect(() => {
        setCurrentQty(item.quantity);
    }, [item.quantity]);

    const handleAdjust = async (amount: number) => {
        if (isUpdating) return; // Prevent spamming
        
        const newQty = Math.max(0, currentQty + amount);
        setCurrentQty(newQty); // Optimistic
        setAnimateBump(true);
        setTimeout(() => setAnimateBump(false), 200); // Reset bump animation
        
        setIsUpdating(true);
        const success = await onUpdateStock(item.id, newQty);
        if (!success) {
            setCurrentQty(currentQty); // Revert on failure
        }
        setIsUpdating(false);
    };

    // --- Status Logic ---
    const max = item.maxCapacity || 100; // Fallback max for visual calculation
    const percentage = Math.min(100, Math.max(0, (currentQty / max) * 100));
    
    const isCritical = item.minThreshold !== undefined && currentQty <= item.minThreshold;
    const isEmpty = currentQty === 0;
    
    // Theme Configuration
    let theme;

    if (isEmpty) {
        theme = {
            bg: 'bg-red-50/80 backdrop-blur-md',
            border: 'border-red-200',
            text: 'text-red-600',
            accent: 'bg-red-100 border-2 border-red-200',
            icon: <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />,
            statusText: 'Empty!'
        };
    } else if (isCritical) {
        theme = {
            bg: 'bg-orange-50/80 backdrop-blur-md',
            border: 'border-orange-200',
            text: 'text-orange-600',
            accent: 'bg-orange-100 border-2 border-orange-200',
            icon: <AlertCircle className="w-5 h-5 text-orange-500 animate-bounce" />,
            statusText: 'Low Stock'
        };
    } else {
        theme = {
            bg: 'pastel-glass-cute',
            border: 'border-white',
            text: 'text-emerald-600',
            accent: 'bg-emerald-100 border-2 border-emerald-200',
            icon: <Check className="w-5 h-5 text-emerald-500" />,
            statusText: 'Good'
        };
    }

    return (
        <div className={`
            relative rounded-[2rem] border-2 p-5 flex flex-col h-full transition-all duration-300
            ${theme.bg} ${theme.border}
            hover:shadow-xl hover:-translate-y-2 hover:border-pink-300 group
        `}>
            
            {/* Header: Edit & Status */}
            <div className="flex justify-between items-start mb-4">
                <span className={`
                    text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm
                    ${theme.accent} ${theme.text}
                `}>
                    {theme.icon} {theme.statusText}
                </span>
                
                <button 
                    onClick={() => onEdit(item)} 
                    className="p-2.5 text-purple-400 hover:text-pink-600 hover:bg-pink-100 rounded-2xl transition-all cute-3d-button opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                    title="Edit Item"
                >
                    <Edit className="w-4 h-4" />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex items-center gap-4 mb-5">
                {/* Image Bubble */}
                <div 
                    className="w-16 h-16 rounded-2xl bg-white/80 border-2 border-purple-100 p-1 shrink-0 shadow-sm overflow-hidden relative cursor-pointer group-hover:shadow-md transition-all group-hover:rotate-3 group-hover:scale-110"
                    onClick={() => onEdit(item)}
                >
                    {item.imageUrl ? (
                        <img src={item.imageUrl} className="w-full h-full object-cover rounded-xl" alt={item.name} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-purple-300 bg-purple-50 rounded-xl">
                            <Box className="w-8 h-8 opacity-50" />
                        </div>
                    )}
                </div>

                {/* Text Info */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-black text-purple-900 text-lg leading-tight line-clamp-2 mb-1 group-hover:text-pink-600 transition-colors">
                        {item.name}
                    </h4>
                    
                    {/* Tags or Category */}
                    <div className="flex flex-wrap gap-1.5">
                        {item.tags && item.tags.length > 0 ? (
                            item.tags.slice(0, 2).map(tag => (
                                <span key={tag} className="text-[10px] bg-white border-2 border-indigo-100 text-indigo-500 px-2 py-0.5 rounded-lg flex items-center font-bold shadow-sm">
                                    <Tag className="w-3 h-3 mr-1 opacity-70"/> {tag}
                                </span>
                            ))
                        ) : (
                             <span className="text-[10px] text-purple-400 italic font-medium">No tags</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Visual Stock Bar */}
            <div className="mt-auto space-y-4">
                <div className="flex justify-between items-end px-1">
                    <span className="text-xs font-black text-purple-400 uppercase tracking-wide">Storage Level</span>
                    <span className={`text-xs font-black ${isCritical ? 'text-red-500' : 'text-purple-600'}`}>
                        {Math.round(percentage)}%
                    </span>
                </div>
                <div className="h-3 w-full bg-white/50 rounded-full overflow-hidden border-2 border-purple-100 shadow-inner">
                    <div 
                        className={`h-full rounded-full transition-all duration-500 ${isCritical ? 'bg-red-500' : 'bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400'}`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>

                {/* Control Capsule */}
                <div className="flex items-center justify-between bg-white/80 border-2 border-purple-100 rounded-3xl p-2 shadow-sm backdrop-blur-sm">
                    <button 
                        onClick={() => handleAdjust(-1)}
                        disabled={currentQty <= 0}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-purple-50 text-purple-500 hover:bg-red-100 hover:text-red-600 transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed cute-3d-button"
                    >
                        <Minus className="w-6 h-6 stroke-[3px]" />
                    </button>

                    <div className="flex flex-col items-center px-3 min-w-[70px]">
                        <span className={`text-3xl font-black leading-none transition-transform duration-200 ${animateBump ? 'scale-125 text-pink-600' : 'text-purple-800'}`}>
                            {currentQty}
                        </span>
                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider mt-1">{item.unit}</span>
                    </div>

                    <button 
                        onClick={() => handleAdjust(1)}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-purple-50 text-purple-500 hover:bg-emerald-100 hover:text-emerald-600 transition-all active:scale-90 cute-3d-button"
                    >
                        <Plus className="w-6 h-6 stroke-[3px]" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConsumableCard;
