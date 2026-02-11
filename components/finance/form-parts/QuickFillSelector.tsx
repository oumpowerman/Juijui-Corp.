
import React, { useState, useEffect } from 'react';
import { Zap, History, Loader2, Sparkles, TrendingUp, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface QuickFillSelectorProps {
    categoryKey: string;
    onSelect: (data: { name: string, amount?: string }) => void;
}

interface SmartSuggestion {
    id: string;
    label: string;
    value: string;
    amount: number;
    count: number;
    isStable: boolean; // New: Is price consistent?
    source: 'HISTORY' | 'STATIC';
}

// Fallback presets
const STATIC_PRESETS: Record<string, { label: string, value: string, amount?: number, icon: string }[]> = {
    'SUBSCRIPTION': [
        { label: 'Adobe', value: 'Adobe Creative Cloud', amount: 3560, icon: '🎨' },
        { label: 'Google', value: 'Google Workspace', amount: 0, icon: '📁' },
        { label: 'ChatGPT', value: 'ChatGPT Plus', amount: 720, icon: '🤖' },
        { label: 'Midjourney', value: 'Midjourney', amount: 1200, icon: '⛵' },
        { label: 'Internet', value: 'Internet (True/AIS)', amount: 799, icon: '🌐' }
    ],
    'FIXED_COST': [
        { label: 'ค่าเช่า', value: 'ค่าเช่าออฟฟิศ', amount: 25000, icon: '🏢' },
        { label: 'ค่าไฟ', value: 'ค่าไฟฟ้า', amount: 0, icon: '⚡' },
        { label: 'ค่าน้ำ', value: 'ค่าน้ำประปา', amount: 0, icon: '💧' },
        { label: 'แม่บ้าน', value: 'ค่าแม่บ้าน', amount: 12000, icon: '🧹' }
    ],
    'TRAVEL': [
        { label: 'Grab', value: 'Grab', icon: '🚖' },
        { label: 'ทางด่วน', value: 'ค่าทางด่วน', icon: '🛣️' },
        { label: 'น้ำมัน', value: 'ค่าน้ำมัน', icon: '⛽' },
        { label: 'BTS/MRT', value: 'ค่ารถไฟฟ้า', icon: '🚆' }
    ],
    'FOOD': [
        { label: 'สวัสดิการ', value: 'ค่าอาหารสวัสดิการทีม', icon: '🍱' },
        { label: 'เลี้ยงลูกค้า', value: 'ค่ารับรองลูกค้า', icon: '☕' },
        { label: 'Snack Box', value: 'ค่าขนมกองถ่าย', icon: '🍪' }
    ]
};

// Helper: Find the most frequent number (Mode) and check stability
const analyzePrices = (amounts: number[]): { smartAmount: number, isStable: boolean } => {
    if (amounts.length === 0) return { smartAmount: 0, isStable: false };
    
    const counts: Record<number, number> = {};
    let maxFreq = 0;
    let mode = amounts[0];

    amounts.forEach(a => {
        counts[a] = (counts[a] || 0) + 1;
        if (counts[a] > maxFreq) {
            maxFreq = counts[a];
            mode = a;
        }
    });

    // Stability Logic:
    // If items > 2 and the most frequent price appears less than 50% of the time, it's unstable.
    const confidence = maxFreq / amounts.length;
    const isStable = amounts.length <= 2 ? true : confidence >= 0.5;

    return {
        smartAmount: isStable ? mode : 0, // If unstable, suggest 0 to force user input
        isStable
    };
};

const QuickFillSelector: React.FC<QuickFillSelectorProps> = ({ categoryKey, onSelect }) => {
    const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!categoryKey) {
            setSuggestions([]);
            return;
        }

        const fetchSmartHistory = async () => {
            setIsLoading(true);
            try {
                // Performance Guard: Limit to last 60 transactions per category.
                // This ensures query remains fast even with 1M records.
                const { data, error } = await supabase
                    .from('finance_transactions')
                    .select('name, amount, created_at')
                    .eq('category_key', categoryKey)
                    .order('created_at', { ascending: false })
                    .limit(60);

                if (error) throw error;

                // Process Data in Memory (Client-side aggregation is fast for 60 items)
                const historyMap: Record<string, { amounts: number[], count: number }> = {};
                
                if (data) {
                    data.forEach((tx: any) => {
                        const name = tx.name.trim();
                        if (!historyMap[name]) {
                            historyMap[name] = { amounts: [], count: 0 };
                        }
                        historyMap[name].amounts.push(Number(tx.amount));
                        historyMap[name].count += 1;
                    });
                }

                // Convert to Suggestions
                const historyList: SmartSuggestion[] = Object.entries(historyMap).map(([name, val], idx) => {
                    const { smartAmount, isStable } = analyzePrices(val.amounts);
                    return {
                        id: `hist-${idx}`,
                        label: name,
                        value: name,
                        amount: smartAmount,
                        count: val.count,
                        isStable: isStable,
                        source: 'HISTORY'
                    };
                });

                // Sort by Frequency
                historyList.sort((a, b) => b.count - a.count);

                // Hybrid Merge: Fill remaining slots with Static Presets
                const finalSuggestions = [...historyList];
                const staticDefaults = STATIC_PRESETS[categoryKey] || [];
                
                // Only take top 8 history items, then fill gaps
                const limitedHistory = finalSuggestions.slice(0, 8);
                const existingNames = new Set(limitedHistory.map(s => s.value.toLowerCase()));

                staticDefaults.forEach((def, idx) => {
                    if (!existingNames.has(def.value.toLowerCase())) {
                        limitedHistory.push({
                            id: `static-${idx}`,
                            label: def.label,
                            value: def.value,
                            amount: def.amount || 0,
                            count: 0,
                            isStable: true, // Static presets are considered stable
                            source: 'STATIC'
                        });
                    }
                });

                setSuggestions(limitedHistory.slice(0, 12)); // Max 12 items total

            } catch (err) {
                console.error("Smart Fill Error:", err);
                const defaults = STATIC_PRESETS[categoryKey] || [];
                setSuggestions(defaults.map((d, i) => ({
                    id: `err-${i}`, label: d.label, value: d.value, amount: d.amount || 0, count: 0, isStable: true, source: 'STATIC'
                })));
            } finally {
                setIsLoading(false);
            }
        };

        fetchSmartHistory();

    }, [categoryKey]);

    if (!categoryKey) return null;
    if (!isLoading && suggestions.length === 0) return null;

    return (
        <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 animate-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold text-indigo-400 uppercase flex items-center">
                    {isLoading ? <Loader2 className="w-3 h-3 mr-1 animate-spin"/> : <Sparkles className="w-3 h-3 mr-1 text-yellow-500 fill-yellow-500"/>} 
                    {isLoading ? 'Analyzing History...' : 'Smart Suggestions (ประวัติการใช้)'}
                </label>
                {!isLoading && suggestions.length > 0 && (
                    <span className="text-[9px] text-indigo-300 font-medium">Based on recent usage</span>
                )}
            </div>
            
            <div className="flex flex-wrap gap-2">
                {suggestions.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelect({ 
                            name: item.value, 
                            amount: item.amount > 0 ? item.amount.toString() : undefined 
                        })}
                        className={`
                            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 border
                            ${item.source === 'HISTORY' 
                                ? 'bg-white text-indigo-600 border-indigo-100 hover:border-indigo-300 hover:shadow-md' 
                                : 'bg-white/50 text-gray-500 border-transparent hover:bg-white hover:border-gray-200'
                            }
                        `}
                        title={item.source === 'HISTORY' ? `ใช้บ่อย: ${item.count} ครั้งล่าสุด` : 'รายการแนะนำ'}
                    >
                        {item.source === 'HISTORY' ? <History className="w-3 h-3 opacity-50"/> : <Zap className="w-3 h-3 opacity-30"/>}
                        
                        <span>{item.label}</span>
                        
                        {/* Price Indicator */}
                        {item.amount > 0 ? (
                            <span className="text-[9px] bg-gray-100 px-1.5 rounded ml-1 text-gray-500 border border-gray-200">
                                ฿{item.amount.toLocaleString()}
                            </span>
                        ) : (
                            // Show warning icon if price is unstable/variable (amount = 0)
                            !item.isStable && item.source === 'HISTORY' && (
                                <AlertCircle className="w-3 h-3 text-orange-400 ml-1" aria-label="ราคาไม่แน่นอน" />
                            )
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QuickFillSelector;
