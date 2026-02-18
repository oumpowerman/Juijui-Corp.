import React, { useState } from 'react';
import { X, ShoppingBag, Backpack, Zap, Heart, Shield, Clock, AlertTriangle, Loader2, History } from 'lucide-react';
import { ShopItem, UserInventoryItem, User } from '../../types';
import { useGamification } from '../../hooks/useGamification';
import MemberHistoryModal from './MemberHistoryModal';
import { useToast } from '../../context/ToastContext';

interface ItemShopModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User;
}

const ItemShopModal: React.FC<ItemShopModalProps> = ({ isOpen, onClose, currentUser }) => {
    const { shopItems, userInventory, buyItem, useItem, isLoading } = useGamification(currentUser);
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'SHOP' | 'INVENTORY'>('SHOP');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    if (!isOpen) return null;

    const handleBuy = async (item: ShopItem) => {
        const result = await buyItem(item);
        if (!result.success && result.message) {
            showToast(result.message, 'error');
        }
        // Success toasts are handled by global listener
    };

    const handleUse = async (id: string, item: ShopItem) => {
        const result = await useItem(id, item);
        if (!result.success && result.message) {
            // Check if it's an info message (like passive item) or error
            const type = item.effectType === 'SKIP_DUTY' ? 'info' : 'error';
            showToast(result.message, type);
        }
    };

    const getEffectIcon = (type: string) => {
        switch (type) {
            case 'HEAL_HP': return <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />;
            case 'SKIP_DUTY': return <Shield className="w-4 h-4 text-blue-500 fill-blue-500" />;
            case 'REMOVE_LATE': return <Clock className="w-4 h-4 text-orange-500" />;
            default: return <Zap className="w-4 h-4 text-yellow-500" />;
        }
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 border-4 border-indigo-50">
                
                {/* Header */}
                <div className="bg-indigo-600 p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ShoppingBag className="w-32 h-32" />
                    </div>
                    
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <h2 className="text-2xl font-black flex items-center gap-2">
                                <ShoppingBag className="w-6 h-6 text-yellow-300" /> ร้านค้าสวัสดิการ
                            </h2>
                            <p className="text-indigo-200 text-sm mt-1">ใช้แต้มแลกตัวช่วยชีวิต</p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-2 bg-black/20 p-3 rounded-xl border border-white/10 backdrop-blur-sm relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center border-4 border-white/20 shadow-inner">
                                <span className="text-lg">💰</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-indigo-200 uppercase">My Wallet</p>
                                <p className="text-xl font-black leading-none">{currentUser.availablePoints.toLocaleString()} JP</p>
                            </div>
                        </div>
                        
                        {/* History Button */}
                        <button 
                            onClick={() => setIsHistoryOpen(true)}
                            className="flex flex-col items-center justify-center text-[9px] font-bold text-indigo-200 hover:text-white transition-colors gap-1 px-2"
                        >
                            <div className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                                <History className="w-4 h-4" />
                            </div>
                            HISTORY
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                    <button 
                        onClick={() => setActiveTab('SHOP')}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'SHOP' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <ShoppingBag className="w-4 h-4" /> ซื้อของ (Buy)
                    </button>
                    <button 
                        onClick={() => setActiveTab('INVENTORY')}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'INVENTORY' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Backpack className="w-4 h-4" /> กระเป๋า ({userInventory.length})
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        </div>
                    )}

                    {activeTab === 'SHOP' ? (
                        <div className="space-y-3">
                            {shopItems.map(item => (
                                <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-indigo-200 transition-colors">
                                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                                        {item.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-800">{item.name}</h4>
                                        <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            {getEffectIcon(item.effectType)}
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">{item.effectType.replace('_', ' ')}</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleBuy(item)}
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
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {userInventory.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <Backpack className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>กระเป๋าว่างเปล่า</p>
                                    <button onClick={() => setActiveTab('SHOP')} className="text-indigo-600 font-bold text-sm mt-2 hover:underline">ไปซื้อของกันเถอะ</button>
                                </div>
                            ) : (
                                userInventory.map(inv => (
                                    <div key={inv.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl border border-indigo-100">
                                            {inv.item?.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-800">{inv.item?.name}</h4>
                                            <p className="text-xs text-gray-500">{inv.item?.description}</p>
                                        </div>
                                        <button 
                                            onClick={() => inv.item && handleUse(inv.id, inv.item)}
                                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold shadow-md shadow-green-200 transition-all active:scale-95 whitespace-nowrap"
                                        >
                                            ใช้ทันที
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* History Modal (Stacked) */}
            <MemberHistoryModal 
                isOpen={isHistoryOpen} 
                onClose={() => setIsHistoryOpen(false)} 
                currentUser={currentUser} 
            />
        </div>
    );
};

export default ItemShopModal;