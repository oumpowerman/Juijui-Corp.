
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Editor, Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, Quote, Undo, Redo, Strikethrough, Palette, Type, ChevronDown, Check, Plus, Link as LinkIcon, Unlink } from 'lucide-react';
import EditorLinkModal from './EditorLinkModal';

// --- Custom Extension for Font Size ---
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize.replace('px', ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}px`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }: any) => {
        return chain().setMark('textStyle', { fontSize }).run();
      },
      unsetFontSize: () => ({ chain }: any) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
      },
    } as any;
  },
});

const PRESET_COLORS = [
    '#000000', // Black
    '#4B5563', // Gray
    '#EF4444', // Red
    '#F97316', // Orange
    '#EAB308', // Yellow
    '#22C55E', // Green
    '#3B82F6', // Blue
    '#A855F7', // Purple
];

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
    readOnly?: boolean;
    className?: string;
    minHeight?: string;
    onEditorReady?: (editor: Editor) => void; 
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
    content, 
    onChange, 
    placeholder = 'Start typing...', 
    readOnly = false,
    className = '',
    minHeight = '300px',
    onEditorReady
}) => {
    // Modal State
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [currentLinkUrl, setCurrentLinkUrl] = useState('');

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                // Ensure history is enabled and deep enough
                history: {
                    depth: 100,
                    newGroupDelay: 500,
                }
            } as any),
            Placeholder.configure({
                placeholder: placeholder,
            }),
            TextStyle,
            Color,
            FontSize,
            Link.configure({
                openOnClick: false,
                autolink: true,
                defaultProtocol: 'https',
            }),
        ],
        content: content, 
        editable: !readOnly,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: `prose prose-sm sm:prose-base focus:outline-none max-w-none ${className} [&_ol]:list-decimal [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:pl-5 [&_h1]:text-3xl [&_h1]:font-black [&_h1]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic`,
                style: `min-height: ${minHeight}; outline: none;`,
            },
            handleKeyDown: (view, event) => {
                if (event.key === 'Tab') {
                    return false; 
                }
            }
        },
    });

    const [isColorOpen, setIsColorOpen] = useState(false);
    const colorMenuRef = useRef<HTMLDivElement>(null);
    const colorBtnRef = useRef<HTMLButtonElement>(null);

    // Initial content sync
    React.useEffect(() => {
        if (editor && onEditorReady) {
            onEditorReady(editor);
        }
    }, [editor, onEditorReady]);

    // Handle external content updates
    React.useEffect(() => {
        if (editor && content !== editor.getHTML()) {
             if (!editor.isFocused || editor.isEmpty) {
                 editor.commands.setContent(content);
             }
        }
    }, [content, editor]);

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

    // --- Link Handling Logic ---
    const openLinkModal = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href;
        setCurrentLinkUrl(previousUrl || '');
        setIsLinkModalOpen(true);
    }, [editor]);

    const handleSaveLink = (url: string) => {
        if (!editor) return;
        
        // Critical: Focus back to editor before applying command
        editor.chain().focus().extendMarkRange('link');

        if (url === '') {
            editor.chain().focus().unsetLink().run();
        } else {
            editor.chain().focus().setLink({ href: url }).run();
        }
        setIsLinkModalOpen(false);
    };

    const handleUnlink = () => {
        if (!editor) return;
        editor.chain().focus().unsetLink().run();
        setIsLinkModalOpen(false);
    }

    if (!editor) {
        return null;
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

    const currentColor = editor.getAttributes('textStyle').color || '#000000';

    return (
        <div className="flex flex-col w-full relative group">
            {/* Toolbar */}
            {!readOnly && (
                <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm sticky top-0 z-20 flex-wrap rounded-t-[2rem]">
                    
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
                    
                    {/* 3. Font Size & Color */}
                     <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 h-8 shadow-sm">
                        <Type className="w-3 h-3 text-gray-400 mr-1" />
                        <select
                            onChange={(e) => (editor.chain().focus() as any).setFontSize(e.target.value).run()}
                            value={editor.getAttributes('textStyle').fontSize || ''}
                            className="bg-transparent text-xs font-bold text-gray-600 outline-none w-16 cursor-pointer py-1"
                            title="Font Size"
                        >
                            <option value="">Auto</option>
                            <option value="12">12 px</option>
                            <option value="14">14 px</option>
                            <option value="16">16 px</option>
                            <option value="18">18 px</option>
                            <option value="20">20 px</option>
                            <option value="24">24 px</option>
                            <option value="30">30 px</option>
                            <option value="36">36 px</option>
                        </select>
                    </div>

                    <div className="relative">
                        <button
                            ref={colorBtnRef}
                            onClick={() => setIsColorOpen(!isColorOpen)}
                            className="flex items-center gap-1 h-8 px-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                            title="Text Color"
                            type="button"
                        >
                            <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: currentColor }}></div>
                            <ChevronDown className="w-3 h-3 text-gray-400" />
                        </button>

                        {isColorOpen && (
                            <div ref={colorMenuRef} className="absolute top-full left-0 mt-2 p-3 bg-white rounded-xl shadow-xl border border-gray-100 grid grid-cols-4 gap-2 z-50 w-40 animate-in fade-in zoom-in-95">
                                {PRESET_COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => {
                                            (editor.chain().focus() as any).setColor(color).run();
                                            setIsColorOpen(false);
                                        }}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center ${currentColor === color ? 'border-indigo-500 shadow-sm scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: color }}
                                        title={color}
                                        type="button"
                                    >
                                        {currentColor === color && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                                    </button>
                                ))}
                                {/* Custom Color Picker Trigger */}
                                <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200 hover:border-gray-400 cursor-pointer">
                                    <input
                                        type="color"
                                        onInput={(e) => (editor.chain().focus() as any).setColor((e.target as HTMLInputElement).value).run()}
                                        value={currentColor}
                                        className="absolute inset-0 w-[150%] h-[150%] -top-1 -left-1 cursor-pointer p-0 border-0"
                                        title="Custom Color"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-gradient-to-br from-transparent to-black/20">
                                        <Plus className="w-3 h-3 text-gray-500 mix-blend-difference text-white" />
                                    </div>
                                </div>
                            </div>
                        )}
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
            )}

            {/* Editor Content Area */}
            <div className="cursor-text p-4 md:p-8" onClick={() => editor.chain().focus().run()}>
                <EditorContent editor={editor} />
            </div>

            {/* Custom Link Modal */}
            <EditorLinkModal 
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                initialUrl={currentLinkUrl}
                onSave={handleSaveLink}
                onUnlink={handleUnlink}
            />
        </div>
    );
};

export default RichTextEditor;
