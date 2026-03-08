
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import BubbleMenuExtension from '@tiptap/extension-bubble-menu'
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import FontFamily from '@tiptap/extension-font-family';
import { ResizableImage } from './ResizableImageExtension';
import { resizeImage, fileToBase64 } from '../../../utils/imageUtils';
import EditorLinkModal from '../EditorLinkModal';
import { FontSize } from './FontSizeExtension';
import { FontWeight } from './FontWeightExtension';
import { DrawingExtension } from './DrawingExtension';
import RichTextToolbar from './RichTextToolbar';

export interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
    readOnly?: boolean;
    className?: string;
    minHeight?: string;
    onEditorReady?: (editor: Editor) => void; 
    extensions?: any[]; 
    bubbleMenuContent?: (editor: Editor) => React.ReactNode; 
    onKeyDown?: (view: any, event: KeyboardEvent) => boolean | void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
    content, 
    onChange, 
    placeholder = 'Start typing...', 
    readOnly = false,
    className = '',
    minHeight = '300px',
    onEditorReady,
    extensions = [],
    bubbleMenuContent,
    onKeyDown
}) => {
    // Modal State
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [currentLinkUrl, setCurrentLinkUrl] = useState('');

    const bubbleMenuRef = useRef<HTMLDivElement | null>(null);

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
            FontWeight,
            FontFamily,
            DrawingExtension,
            ResizableImage.configure({
                allowBase64: true,
            }),
            Link.configure({
                openOnClick: false,
                autolink: true,
                defaultProtocol: 'https',
            }),
            BubbleMenuExtension,
            ...extensions, 
        ],
        content: content, 
        editable: !readOnly,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            if (html !== content) {
                onChange(html);
            }
        },
        editorProps: {
            attributes: {
                class: `prose prose-sm sm:prose-base text-black caret-black focus:outline-none max-w-none ${className} [&_.ProseMirror]:caret-black [&_ol]:list-decimal [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:pl-5 [&_h1]:text-3xl [&_h1]:font-black [&_h1]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic`,
                style: `min-height: ${minHeight}; outline: none;`,
            },
            handleKeyDown: (view, event) => {
                if (event.key === 'Tab') {
                    return false; 
                }
                if (onKeyDown) {
                    return onKeyDown(view, event) as any;
                }
                return false;
            },
            handlePaste: (view, event) => {
                const items = event.clipboardData?.items;
                if (!items) return false;

                let handled = false;
                for (const item of Array.from(items)) {
                    if (item.type.startsWith('image/')) {
                        const file = item.getAsFile();
                        if (file) {
                            handled = true;
                            (async () => {
                                try {
                                    const resizedBlob = await resizeImage(file, 1200, 1200);
                                    const base64 = await fileToBase64(resizedBlob);
                                    view.dispatch(view.state.tr.replaceSelectionWith(
                                        view.state.schema.nodes.resizableImage.create({ src: base64 })
                                    ));
                                } catch (e) {
                                    console.error('Failed to process pasted image:', e);
                                }
                            })();
                        }
                    }
                }
                return handled;
            },
            handleDrop: (view, event, slice, moved) => {
                if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
                    const file = event.dataTransfer.files[0];
                    if (file.type.startsWith('image/')) {
                        (async () => {
                            try {
                                const resizedBlob = await resizeImage(file, 1200, 1200);
                                const base64 = await fileToBase64(resizedBlob);
                                const { schema } = view.state;
                                const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                                if (coordinates) {
                                    const node = schema.nodes.resizableImage.create({ src: base64 });
                                    const transaction = view.state.tr.insert(coordinates.pos, node);
                                    view.dispatch(transaction);
                                }
                            } catch (e) {
                                console.error('Failed to process dropped image:', e);
                            }
                        })();
                        return true;
                    }
                }
                return false;
            }
        },
    });

    useEffect(() => {
        return () => {
            editor?.destroy();
        };
    }, [editor]);

    // Initial content sync
    useEffect(() => {
        if (editor && onEditorReady) {
            onEditorReady(editor);
        }
    }, [editor, onEditorReady]);

    // Handle external content updates
    useEffect(() => {
        if (editor && !editor.isFocused && content !== editor.getHTML()) {
            editor.commands.setContent(content, false);
        }
    }, [content, editor]);

    // --- Link Handling Logic ---
    const openLinkModal = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href;
        setCurrentLinkUrl(previousUrl || '');
        setIsLinkModalOpen(true);
    }, [editor]);

    const handleSaveLink = (url: string) => {
        if (!editor) return;
        const chain = editor.chain().focus().extendMarkRange('link');
        if (url === '') {
            chain.unsetLink().run();
        } else {
            chain.setLink({ href: url }).run();
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

    return (
        <div className="flex flex-col w-full relative group">
            {/* Bubble Menu for Comments */}
            {editor && bubbleMenuContent && (
                <BubbleMenu 
                    editor={editor} 
                    tippyOptions={{ 
                        duration: 100,
                        zIndex: 10, // Lower than Toolbar (z-20) so it hides when text scrolls under
                        maxWidth: 'none',
                        moveTransition: 'transform 0.1s ease-out',
                    }}
                >
                    {bubbleMenuContent(editor)}
                </BubbleMenu>
            )}

            {/* Toolbar */}
            {!readOnly && (
                <RichTextToolbar 
                    editor={editor} 
                    openLinkModal={openLinkModal} 
                />
            )}

            {/* Editor Content Area */}
            <div className="cursor-text p-4 md:p-8 caret-black" onClick={() => editor.chain().focus().run()}>
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
