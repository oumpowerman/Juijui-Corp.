import React from 'react';
import { ShopItem, User } from '../../../types';
import ItemCard from './ItemCard';
import { FRAME_SHOP_CONFIG } from '../../../config/frameShop';
import { BACKGROUND_SHOP_CONFIG } from '../../../config/backgroundShop';

interface ShopTabProps {
    items: ShopItem[];
    currentUser: User;
    onBuy: (item: ShopItem) => void;
}

const ShopTab: React.FC<ShopTabProps> = ({ items, currentUser, onBuy }) => {
    // 1. Combined Items: DB Items + Code-defined Frames + Code-defined Backgrounds
    const frameItems: ShopItem[] = FRAME_SHOP_CONFIG.map(f => ({
        id: f.id,
        name: f.name,
        description: f.description,
        price: f.price,
        icon: f.id === 'frame-neo-cyber' ? '🌌' : f.id === 'frame-pastel-dream' ? '🎀' : f.id === 'frame-onyx-luxe' ? '🌑' : f.id === 'frame-voltage-overdrive' ? '⚡' : f.id === 'frame-neko-paradise' ? '🐾' : '🌿',
        effectType: 'OTHER',
        effectValue: 0,
        isActive: true
    }));

    const backgroundItems: ShopItem[] = BACKGROUND_SHOP_CONFIG.map(bg => ({
        id: bg.id,
        name: bg.name,
        description: bg.description,
        price: bg.price,
        icon: bg.id === 'bg-pastel-wave' ? '🌊' : bg.id === 'bg-season-summer' ? '☀️' : bg.id === 'bg-season-snow' ? '❄️' : bg.id === 'bg-season-rain' ? '🌧️' : '🍁',
        effectType: 'OTHER',
        effectValue: 0,
        isActive: true
    }));

    const allItems = [...items, ...frameItems, ...backgroundItems];

    return (
        <div className="space-y-6">
            {/* Category: Status Boosters (Existing) */}
            {items.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">Boosters & Items</h3>
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
                </div>
            )}

            {/* Category: Profile Frames (New) */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Avatar Skins & Frames</h3>
                    <span className="text-[9px] font-bold text-white bg-indigo-500 px-2 py-0.5 rounded-full animate-pulse">NEW RELEASE</span>
                </div>
                {frameItems.map(item => {
                    const isEquipped = (currentUser as any).equippedFrameId === item.id;
                    const isOwned = ((currentUser as any).ownedFrameIds || []).includes(item.id);
                    
                    return (
                        <ItemCard 
                            key={item.id}
                            item={item}
                            actionButton={
                                <button 
                                    onClick={() => onBuy(item)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold flex flex-col items-center min-w-[80px] transition-all active:scale-95 ${
                                        isEquipped
                                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 hover:bg-rose-600'
                                        : isOwned
                                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-200 hover:bg-amber-600'
                                        : currentUser.availablePoints >= item.price 
                                        ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-indigo-200 hover:shadow-indigo-300' 
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                    disabled={!isEquipped && !isOwned && currentUser.availablePoints < item.price}
                                >
                                    <span>
                                        {isEquipped ? 'UNEQUIP' : isOwned ? 'EQUIP' : item.price}
                                    </span>
                                    <span className="text-[9px] opacity-80">
                                        {isEquipped ? 'REMOVE' : isOwned ? 'OWNED' : 'POINTS'}
                                    </span>
                                </button>
                            }
                        />
                    );
                })}
            </div>

            {/* Category: Wallpaper Backgrounds (New) */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Wallpaper Skins & Backgrounds</h3>
                    <span className="text-[9px] font-bold text-white bg-rose-500 px-2 py-0.5 rounded-full animate-pulse">DASHBOARD BEAUTY</span>
                </div>
                {backgroundItems.map(item => {
                    const isDefaultBg = item.id === 'bg-pastel-wave';
                    const isEquipped = (currentUser as any).equippedBgId === item.id || 
                        ((!(currentUser as any).equippedBgId) && isDefaultBg);
                    const ownedBgIds = (currentUser as any).ownedBgIds || ['bg-pastel-wave'];
                    const isOwned = ownedBgIds.includes(item.id);
                    
                    return (
                        <ItemCard 
                            key={item.id}
                            item={item}
                            actionButton={
                                <button 
                                    onClick={() => onBuy(item)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold flex flex-col items-center min-w-[80px] transition-all ${
                                        isEquipped
                                        ? (isDefaultBg ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 cursor-default' : 'bg-rose-500 text-white shadow-lg shadow-rose-200 hover:bg-rose-600 active:scale-95')
                                        : isOwned
                                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-200 hover:bg-amber-600 active:scale-95'
                                        : currentUser.availablePoints >= item.price 
                                        ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-indigo-200 hover:shadow-indigo-300 active:scale-95' 
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                    disabled={(isDefaultBg && isEquipped) || (!isEquipped && !isOwned && currentUser.availablePoints < item.price)}
                                >
                                    <span>
                                        {isEquipped ? (isDefaultBg ? 'ACTIVE' : 'UNEQUIP') : isOwned ? 'EQUIP' : item.price}
                                    </span>
                                    <span className="text-[9px] opacity-80">
                                        {isEquipped ? (isDefaultBg ? 'DEFAULT' : 'REMOVE') : isOwned ? 'OWNED' : 'POINTS'}
                                    </span>
                                </button>
                            }
                        />
                    );
                })}
            </div>

            {allItems.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <p>ไม่มีสินค้าในขณะนี้</p>
                </div>
            )}
        </div>
    );
};

export default ShopTab;
