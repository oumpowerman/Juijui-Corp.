import React from 'react';
import { Backpack } from 'lucide-react';
import { UserInventoryItem, ShopItem } from '../../../types';
import ItemCard from './ItemCard';

interface InventoryTabProps {
    inventory: UserInventoryItem[];
    onUse: (id: string, item: ShopItem) => void;
    onGoToShop: () => void;
}

const InventoryTab: React.FC<InventoryTabProps> = ({ inventory, onUse, onGoToShop }) => {
    if (inventory.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400">
                <Backpack className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>กระเป๋าว่างเปล่า</p>
                <button 
                    onClick={onGoToShop} 
                    className="text-indigo-600 font-bold text-sm mt-2 hover:underline"
                >
                    ไปซื้อของกันเถอะ
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {inventory.map(inv => (
                inv.item && (
                    <ItemCard 
                        key={inv.id}
                        item={inv.item}
                        iconBgColor="bg-indigo-50"
                        showEffect={false} // Match original UI
                        actionButton={
                            <button 
                                onClick={() => inv.item && onUse(inv.id, inv.item)}
                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold shadow-md shadow-green-200 transition-all active:scale-95 whitespace-nowrap"
                            >
                                ใช้ทันที
                            </button>
                        }
                    />
                )
            ))}
        </div>
    );
};

export default InventoryTab;
