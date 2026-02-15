
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
    let theme = {
        bg: 'bg-white',
        border: 'border-gray-100',
        text: 'text-gray-600',
        accent: 'bg-gray-100',
        icon: <Package className="w-5 h-5" />,
        statusText: 'In Stock'
    };

    if (isEmpty) {
        theme = {
            bg: 'bg-red-50/50',
            border: 'border-red-200',
            text: 'text-red-600',
            accent: 'bg-red-100',
            icon: <AlertCircle className="w-5 h-5 animate-pulse" />,
            statusText: 'Empty!'
        };
    } else if (isCritical) {
        theme = {
            bg: 'bg-orange-50/50',
            border: 'border-orange-200',
            text: 'text-orange-600',
            accent: 'bg-orange-100',
            icon: <AlertCircle className="w-5 h-5" />,
            statusText: 'Low Stock'
        };
    } else {
        theme = {
            bg: 'bg-white',
            border: 'border-emerald-100',
            text: 'text-emerald-700',
            accent: 'bg-emerald-50',
            icon: <Check className="w-5 h-5" />,
            statusText: 'Good'
        };
    }

    return (
        <div className={`
            relative rounded-[2rem] border-2 p-4 flex flex-col h-full transition-all duration-300
            ${theme.bg} ${theme.border}
            hover:shadow-lg hover:-translate-y-1 hover:border-indigo-200 group
        `}>
            
            {/* Header: Edit & Status */}
            <div className="flex justify-between items-start mb-3">
                <span className={`
                    text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5
                    ${theme.accent} ${theme.text}
                `}>
                    {theme.icon} {theme.statusText}
                </span>
                
                <button 
                    onClick={() => onEdit(item)} 
                    className="p-2 text-gray-300 hover:text-indigo-500 hover:bg-white rounded-full transition-colors active:scale-90"
                >
                    <Edit className="w-4 h-4" />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex items-center gap-4 mb-4">
                {/* Image Bubble */}
                <div 
                    className="w-16 h-16 rounded-2xl bg-white border-2 border-gray-100 p-1 shrink-0 shadow-sm overflow-hidden relative cursor-pointer"
                    onClick={() => onEdit(item)}
                >
                    {item.imageUrl ? (
                        <img src={item.imageUrl} className="w-full h-full object-cover rounded-xl" alt={item.name} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50 rounded-xl">
                            <Box className="w-8 h-8 opacity-50" />
                        </div>
                    )}
                </div>

                {/* Text Info */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2 mb-1 group-hover:text-indigo-700 transition-colors">
                        {item.name}
                    </h4>
                    
                    {/* Tags or Category */}
                    <div className="flex flex-wrap gap-1">
                        {item.tags && item.tags.length > 0 ? (
                            item.tags.slice(0, 2).map(tag => (
                                <span key={tag} className="text-[9px] bg-white border border-gray-200 text-gray-500 px-1.5 rounded flex items-center">
                                    <Tag className="w-2 h-2 mr-0.5 opacity-50"/> {tag}
                                </span>
                            ))
                        ) : (
                             <span className="text-[10px] text-gray-400 italic">No tags</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Visual Stock Bar */}
            <div className="mt-auto space-y-3">
                <div className="flex justify-between items-end px-1">
                    <span className="text-xs font-bold text-gray-400">Storage Level</span>
                    <span className={`text-xs font-bold ${isCritical ? 'text-red-500' : 'text-gray-600'}`}>
                        {Math.round(percentage)}%
                    </span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-500 ${isCritical ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>

                {/* Control Capsule */}
                <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-1.5 shadow-sm">
                    <button 
                        onClick={() => handleAdjust(-1)}
                        disabled={currentQty <= 0}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <Minus className="w-5 h-5 stroke-[3px]" />
                    </button>

                    <div className="flex flex-col items-center px-2 min-w-[60px]">
                        <span className={`text-2xl font-black leading-none transition-transform duration-200 ${animateBump ? 'scale-125 text-indigo-600' : 'text-gray-800'}`}>
                            {currentQty}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">{item.unit}</span>
                    </div>

                    <button 
                        onClick={() => handleAdjust(1)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-green-50 hover:text-green-600 transition-all active:scale-90"
                    >
                        <Plus className="w-5 h-5 stroke-[3px]" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConsumableCard;
