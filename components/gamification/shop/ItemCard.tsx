import React from 'react';
import { Heart, Shield, Clock, Zap } from 'lucide-react';
import { ShopItem } from '../../../types';

interface ItemCardProps {
    item: ShopItem;
    actionButton: React.ReactNode;
    iconBgColor?: string;
    showEffect?: boolean;
}

export const getEffectIcon = (type: string) => {
    switch (type) {
        case 'HEAL_HP': return <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />;
        case 'SKIP_DUTY': return <Shield className="w-4 h-4 text-blue-500 fill-blue-500" />;
        case 'REMOVE_LATE': return <Clock className="w-4 h-4 text-orange-500" />;
        default: return <Zap className="w-4 h-4 text-yellow-500" />;
    }
};

const ItemCard: React.FC<ItemCardProps> = ({ 
    item, 
    actionButton, 
    iconBgColor = "bg-gray-50",
    showEffect = true
}) => {
    return (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-indigo-200 transition-colors">
            <div className={`w-14 h-14 ${iconBgColor} rounded-2xl flex items-center justify-center text-3xl shadow-inner shrink-0`}>
                {item.icon}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800 truncate">{item.name}</h4>
                <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                {showEffect && (
                    <div className="flex items-center gap-1 mt-1">
                        {getEffectIcon(item.effectType)}
                        <span className="text-[10px] font-bold text-gray-400 uppercase">
                            {item.effectType.replace('_', ' ')}
                        </span>
                    </div>
                )}
            </div>
            <div className="shrink-0">
                {actionButton}
            </div>
        </div>
    );
};

export default ItemCard;
