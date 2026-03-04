import React from 'react';
import { ShopItem, User } from '../../../types';
import ItemCard from './ItemCard';

interface ShopTabProps {
    items: ShopItem[];
    currentUser: User;
    onBuy: (item: ShopItem) => void;
}

const ShopTab: React.FC<ShopTabProps> = ({ items, currentUser, onBuy }) => {
    return (
        <div className="space-y-3">
            {items.map(item => (
                <ItemCard 
                    key={item.id}
                    item={item}
                    actionButton={
                        <button 
                            onClick={() => onBuy(item)}
                            disabled={currentUser.availablePoints < item.price}
                            className={`px-4 py-2 rounded-xl text-sm font-bold flex flex-col items-center min-w-[80px] transition-all active:scale-95 ${
                                currentUser.availablePoints >= item.price 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            <span>{item.price}</span>
                            <span className="text-[9px] opacity-80">POINTS</span>
                        </button>
                    }
                />
            ))}
            {items.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <p>ไม่มีสินค้าในขณะนี้</p>
                </div>
            )}
        </div>
    );
};

export default ShopTab;
