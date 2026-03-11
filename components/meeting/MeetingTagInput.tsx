import React, { useState, KeyboardEvent } from 'react';
import { Hash, X } from 'lucide-react';

interface MeetingTagInputProps {
    tags: string[];
    onTagsChange: (tags: string[]) => void;
    placeholder?: string;
}

const MeetingTagInput: React.FC<MeetingTagInputProps> = ({ tags, onTagsChange, placeholder }) => {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const newTag = inputValue.trim();
            if (newTag && !tags.includes(newTag)) {
                onTagsChange([...tags, newTag]);
                setInputValue('');
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        onTagsChange(tags.filter(t => t !== tagToRemove));
    };

    return (
        <div className="flex flex-wrap gap-2 items-center min-h-[32px] w-full">
            {tags.map(tag => (
                <span key={tag} className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center border border-amber-100 animate-in zoom-in duration-200">
                    <Hash className="w-3 h-3 mr-1 opacity-50" />
                    {tag}
                    <button 
                        type="button" 
                        onClick={() => removeTag(tag)} 
                        className="ml-1.5 hover:text-amber-900 bg-amber-100 rounded-full p-0.5 transition-colors"
                    >
                        <X className="w-2.5 h-2.5" />
                    </button>
                </span>
            ))}
            <input 
                type="text" 
                className="bg-transparent text-xs font-bold text-slate-700 outline-none flex-1 min-w-[100px] placeholder:text-slate-300 py-1"
                placeholder={tags.length === 0 ? placeholder || "พิมพ์แท็กแล้วกด Enter..." : ""}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
            />
        </div>
    );
};

export default MeetingTagInput;
