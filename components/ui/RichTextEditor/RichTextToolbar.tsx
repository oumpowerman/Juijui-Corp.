
import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/core';
import { 
    Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, 
    Quote, Undo, Redo, Strikethrough, Type, ChevronDown, Check, Plus, 
    Link as LinkIcon, Image as ImageIcon, MousePointer2, Palette,
    Type as TypeIcon, Baseline, Settings2
} from 'lucide-react';
import { PRESET_COLORS, PRESET_FONTS } from './constants';
import ImageInsertModal from './ImageInsertModal';
import ToolbarDropdown from './ToolbarDropdown';
import { motion, AnimatePresence } from 'framer-motion';

interface RichTextToolbarProps {
    editor: Editor;
    openLinkModal: () => void;
}

const MenuButton = ({ onClick, isActive, icon: Icon, title, label }: any) => (
    <button
        onClick={onClick}
        className={`
            p-1.5 rounded-lg transition-all flex items-center justify-center
            ${isActive 
                ? 'bg-indigo-100 text-indigo-600 shadow-inner' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}
        `}
        title={title}
        type="button"
    >
        <Icon className="w-4 h-4" />
        {label && <span className="ml-1 text-xs font-bold">{label}</span>}
    </button>
);

const Divider = () => <div className="w-px h-5 bg-gray-200 mx-1 shrink-0" />;

const RichTextToolbar: React.FC<RichTextToolbarProps> = ({ editor, openLinkModal }) => {
    const [isColorOpen, setIsColorOpen] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const colorMenuRef = useRef<HTMLDivElement>(null);
    const colorBtnRef = useRef<HTMLButtonElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Click outside handler for Color Menu
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (colorMenuRef.current && !colorMenuRef.current.contains(event.target as Node) && 
                colorBtnRef.current && !colorBtnRef.current.contains(event.target as Node)) {
                setIsColorOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const currentColor = editor.getAttributes('textStyle').color || '#000000';
    const currentFontFamily = editor.getAttributes('textStyle').fontFamily || '';
    const currentFontSize = editor.getAttributes('textStyle').fontSize || '';
    const currentFontWeight = editor.getAttributes('textStyle').fontWeight || '400';

    const FONT_SIZE_OPTIONS = [
        { label: 'Auto', value: '' },
        { label: '12 px', value: '12' },
        { label: '14 px', value: '14' },
        { label: '16 px', value: '16' },
        { label: '18 px', value: '18' },
        { label: '20 px', value: '20' },
        { label: '24 px', value: '24' },
        { label: '30 px', value: '30' },
        { label: '36 px', value: '36' },
        { label: '48 px', value: '48' },
    ];

    const TYPOGRAPHY_OPTIONS = [
        { label: 'Thin (300)', value: '300' },
        { label: 'Regular (400)', value: '400' },
        { label: 'Medium (500)', value: '500' },
        { label: 'Semi Bold (600)', value: '600' },
        { label: 'Bold (700)', value: '700' },
        { label: 'Extra Bold (800)', value: '800' },
        { label: 'Black (900)', value: '900' },
    ];

    const handleImageUrlInsert = (url: string) => {
        (editor.chain().focus() as any).setImage({ src: url }).run();
    };

    return (
        <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm sticky top-0 z-20 flex-wrap rounded-t-[2rem]">
            
            {/* Image Insert Modal */}
            <ImageInsertModal 
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
                onUrlInsert={handleImageUrlInsert}
            />

            {/* 1. History */}
            <MenuButton 
                onClick={() => (editor.chain().focus() as any).undo().run()} 
                isActive={false} 
                icon={Undo} 
                title="Undo" 
            />
            <MenuButton 
                onClick={() => (editor.chain().focus() as any).redo().run()} 
                isActive={false} 
                icon={Redo} 
                title="Redo" 
            />
            
            <Divider />

            {/* 2. Headings */}
            <MenuButton 
                onClick={() => (editor.chain().focus() as any).toggleHeading({ level: 1 }).run()} 
                isActive={editor.isActive('heading', { level: 1 })} 
                icon={Heading1} 
                title="Heading 1" 
            />
            <MenuButton 
                onClick={() => (editor.chain().focus() as any).toggleHeading({ level: 2 }).run()} 
                isActive={editor.isActive('heading', { level: 2 })} 
                icon={Heading2} 
                title="Heading 2" 
            />
            <MenuButton 
                onClick={() => (editor.chain().focus() as any).toggleHeading({ level: 3 }).run()} 
                isActive={editor.isActive('heading', { level: 3 })} 
                icon={Heading3} 
                title="Heading 3" 
            />

            <Divider />
            
            {/* 3. Font Family, Size & Color */}
            <div className="flex items-center gap-1">
                <ToolbarDropdown 
                    value={currentFontFamily}
                    onChange={(val) => (editor.chain().focus() as any).setFontFamily(val).run()}
                    options={PRESET_FONTS.map(f => ({ label: f.label, value: f.value, preview: f.value }))}
                    icon={TypeIcon}
                    title="Font Family"
                    width="w-28"
                    placeholder="Font"
                />

                <ToolbarDropdown 
                    value={currentFontSize}
                    onChange={(val) => (editor.chain().focus() as any).setFontSize(val).run()}
                    options={FONT_SIZE_OPTIONS}
                    icon={Baseline}
                    title="Font Size"
                    width="w-20"
                    placeholder="Size"
                />

                <ToolbarDropdown 
                    value={currentFontWeight}
                    onChange={(val) => (editor.chain().focus() as any).setFontWeight(val).run()}
                    options={TYPOGRAPHY_OPTIONS}
                    icon={Settings2}
                    title="Font Weight"
                    width="w-24"
                    placeholder="Weight"
                />
            </div>

            <div className="relative">
                <button
                    ref={colorBtnRef}
                    onClick={() => setIsColorOpen(!isColorOpen)}
                    className="flex items-center gap-1 h-8 px-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-all active:scale-95"
                    title="Text Color"
                    type="button"
                >
                    <div className="w-4 h-4 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: currentColor }}></div>
                    <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isColorOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {isColorOpen && (
                        <motion.div 
                            ref={colorMenuRef}
                            initial={{ opacity: 0, y: 4, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 mt-2 p-3 bg-white rounded-2xl shadow-2xl border border-gray-100 grid grid-cols-5 gap-2 z-50 w-48 origin-top-left"
                        >
                            {PRESET_COLORS.map(color => (
                                <button
                                    key={color}
                                    onClick={() => {
                                        (editor.chain().focus() as any).setColor(color).run();
                                        setIsColorOpen(false);
                                    }}
                                    className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center ${currentColor === color ? 'border-indigo-500 shadow-md scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                    type="button"
                                >
                                    {currentColor === color && <Check className="w-3 h-3 text-white drop-shadow-md" />}
                                </button>
                            ))}
                            {/* Custom Color Picker Trigger */}
                            <div className="relative w-7 h-7 rounded-full overflow-hidden border-2 border-gray-200 hover:border-gray-400 cursor-pointer transition-colors">
                                <input
                                    type="color"
                                    onInput={(e) => (editor.chain().focus() as any).setColor((e.target as HTMLInputElement).value).run()}
                                    value={currentColor}
                                    className="absolute inset-0 w-[150%] h-[150%] -top-1 -left-1 cursor-pointer p-0 border-0"
                                    title="Custom Color"
                                />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-gradient-to-br from-transparent to-black/10">
                                    <Plus className="w-3 h-3 text-gray-500 mix-blend-difference" />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <Divider />

            {/* 4. Formatting */}
            <MenuButton 
                onClick={() => (editor.chain().focus() as any).toggleBold().run()} 
                isActive={editor.isActive('bold')} 
                icon={Bold} 
                title="Bold" 
            />
            <MenuButton 
                onClick={() => (editor.chain().focus() as any).toggleItalic().run()} 
                isActive={editor.isActive('italic')} 
                icon={Italic} 
                title="Italic" 
            />
             <MenuButton 
                onClick={() => (editor.chain().focus() as any).toggleStrike().run()} 
                isActive={editor.isActive('strike')} 
                icon={Strikethrough} 
                title="Strikethrough" 
            />
            <MenuButton 
                onClick={openLinkModal} 
                isActive={editor.isActive('link')} 
                icon={LinkIcon} 
                title="Link" 
            />
            
            <button 
                onClick={() => setIsImageModalOpen(true)}
                className="p-1.5 rounded-lg transition-all flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                title="Insert Image"
                type="button"
            >
                <ImageIcon className="w-4 h-4" />
            </button>

            <button 
                onClick={() => (editor.chain().focus() as any).setDrawing().run()}
                className="p-1.5 rounded-lg transition-all flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                title="Add Drawing"
                type="button"
            >
                <Palette className="w-4 h-4" />
            </button>
            
            <Divider />
            
            {/* 5. Lists */}
            <MenuButton 
                onClick={() => (editor.chain().focus() as any).toggleBulletList().run()} 
                isActive={editor.isActive('bulletList')} 
                icon={List} 
                title="Bullet List" 
            />
            <MenuButton 
                onClick={() => (editor.chain().focus() as any).toggleOrderedList().run()} 
                isActive={editor.isActive('orderedList')} 
                icon={ListOrdered} 
                title="Ordered List" 
            />
            <MenuButton 
                onClick={() => (editor.chain().focus() as any).toggleBlockquote().run()} 
                isActive={editor.isActive('blockquote')} 
                icon={Quote} 
                title="Quote" 
            />
            
        </div>
    );
};

export default RichTextToolbar;
