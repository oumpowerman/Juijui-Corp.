
import React from 'react';
import { MasterOption } from '../../../types';

interface Props {
    categories: MasterOption[];
    categoryKey: string;
    setCategoryKey: (key: string) => void;
}

const CategorySelector: React.FC<Props> = ({ categories, categoryKey, setCategoryKey }) => {
    return (
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">หมวดหมู่ (Category)</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                {categories.map(cat => (
                    <button
                        key={cat.key}
                        type="button"
                        onClick={() => setCategoryKey(cat.key)}
                        className={`
                            px-3 py-2 rounded-lg text-xs font-bold border transition-all text-left truncate
                            ${categoryKey === cat.key 
                                ? `${cat.color} ring-2 ring-offset-1 ring-gray-200 border-transparent shadow-sm` 
                                : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-200'
                            }
                        `}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CategorySelector;
