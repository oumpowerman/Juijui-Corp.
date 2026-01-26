
import React from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Quote, Undo, Redo, Strikethrough } from 'lucide-react';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
    readOnly?: boolean;
    className?: string;
    minHeight?: string;
    onEditorReady?: (editor: Editor) => void; // New prop to expose instance
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
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: placeholder,
            }),
        ],
        content: content, // Initial content
        editable: !readOnly,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: `prose prose-sm sm:prose-base focus:outline-none max-w-none ${className}`,
                style: `min-height: ${minHeight}; outline: none;`,
            },
        },
    });

    // Expose editor instance to parent
    React.useEffect(() => {
        if (editor && onEditorReady) {
            onEditorReady(editor);
        }
    }, [editor, onEditorReady]);

    // Sync content if it changes externally (e.g. from DB load or AI generation)
    // We strictly check to avoid loop/cursor jump issues
    React.useEffect(() => {
        if (editor && content !== editor.getHTML()) {
             // Only update if editor is empty OR not focused (to prevent overwriting while typing)
             // OR if the content length difference is significant (paste/AI gen)
             if (!editor.isFocused || editor.isEmpty) {
                 editor.commands.setContent(content);
             }
        }
    }, [content, editor]);

    if (!editor) {
        return null;
    }

    const MenuButton = ({ onClick, isActive, icon: Icon, title }: any) => (
        <button
            onClick={onClick}
            className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
            title={title}
            type="button"
        >
            <Icon className="w-4 h-4" />
        </button>
    );

    return (
        <div className="flex flex-col w-full h-full relative group">
            {/* 1. Main Toolbar (Sticky) */}
            {!readOnly && (
                <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50/50 backdrop-blur-sm sticky top-0 z-20 flex-wrap">
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
                    <div className="w-px h-4 bg-gray-300 mx-1"></div>
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
                    <div className="w-px h-4 bg-gray-300 mx-1"></div>
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
                    <div className="flex-1"></div>
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
                </div>
            )}

            {/* 3. Editor Content */}
            <div className="flex-1 overflow-y-auto cursor-text p-4 md:p-8" onClick={() => editor.chain().focus().run()}>
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};

export default RichTextEditor;
