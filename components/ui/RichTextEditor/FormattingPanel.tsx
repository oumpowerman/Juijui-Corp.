
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Editor } from '@tiptap/core';
import { 
    AlignLeft, 
    Type, 
    MoveHorizontal,
    RotateCcw,
    X
} from 'lucide-react';

export interface FormattingSettings {
    lineHeight: string;
    paraSpacing: string;
    indent: string;
    letterSpacing: string;
}

interface FormattingPanelProps {
    editor: Editor;
    onClose: () => void;
}

const ControlGroup = ({ label, icon: Icon, value, min, max, step, unit = '', onChange }: any) => {
    // Convert string value to number for slider
    const numericValue = parseFloat(value) || 0;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <Icon className="w-3 h-3" />
                    {label}
                </div>
                <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                    {numericValue}{unit}
                </span>
            </div>
            <input 
                type="range"
                min={min}
                max={max}
                step={step}
                value={numericValue}
                onChange={(e) => onChange(e.target.value + unit)}
                className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-600 transition-all"
            />
        </div>
    );
};

const FormattingPanel: React.FC<FormattingPanelProps> = ({ editor, onClose }) => {
    const [settings, setSettings] = useState<FormattingSettings>({
        lineHeight: '1.6',
        paraSpacing: '16px',
        indent: '0px',
        letterSpacing: '0px'
    });

    // Sync settings from editor selection
    useEffect(() => {
        const updateSettings = () => {
            const attrs = editor.getAttributes('paragraph');
            setSettings({
                lineHeight: attrs.lineHeight || '1.6',
                paraSpacing: attrs.paraSpacing || '16px',
                indent: attrs.indent || '0px',
                letterSpacing: attrs.letterSpacing || '0px'
            });
        };

        editor.on('selectionUpdate', updateSettings);
        updateSettings(); // Initial sync

        return () => {
            editor.off('selectionUpdate', updateSettings);
        };
    }, [editor]);

    const updateAttribute = (key: keyof FormattingSettings, value: string) => {
        editor.chain().focus().updateAttributes('paragraph', { [key]: value }).run();
        // Also update headings if active
        if (editor.isActive('heading')) {
            editor.chain().focus().updateAttributes('heading', { [key]: value }).run();
        }
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const reset = () => {
        const defaultSettings = {
            lineHeight: '1.6',
            paraSpacing: '16px',
            indent: '0px',
            letterSpacing: '0px'
        };
        editor.chain().focus().updateAttributes('paragraph', {
            lineHeight: null,
            paraSpacing: null,
            indent: null,
            letterSpacing: null
        }).run();
        setSettings(defaultSettings);
    };

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-[60] overflow-hidden"
        >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 flex items-center gap-2">
                    <AlignLeft className="w-3.5 h-3.5 text-indigo-500" />
                    Selection Style
                </h3>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={reset}
                        className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Reset Selection"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button 
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                <ControlGroup 
                    label="Line Height"
                    icon={Type}
                    value={settings.lineHeight}
                    min={1}
                    max={3}
                    step={0.1}
                    unit=""
                    onChange={(val: string) => updateAttribute('lineHeight', val)}
                />

                <ControlGroup 
                    label="Para Spacing"
                    icon={AlignLeft}
                    value={settings.paraSpacing}
                    min={0}
                    max={60}
                    step={2}
                    unit="px"
                    onChange={(val: string) => updateAttribute('paraSpacing', val)}
                />

                <ControlGroup 
                    label="First Line Indent"
                    icon={AlignLeft}
                    value={settings.indent}
                    min={0}
                    max={100}
                    step={4}
                    unit="px"
                    onChange={(val: string) => updateAttribute('indent', val)}
                />

                <ControlGroup 
                    label="Letter Spacing"
                    icon={MoveHorizontal}
                    value={settings.letterSpacing}
                    min={-2}
                    max={10}
                    step={0.5}
                    unit="px"
                    onChange={(val: string) => updateAttribute('letterSpacing', val)}
                />
            </div>

            <div className="mt-4 p-2 bg-indigo-50/50 rounded-lg border border-indigo-100/50">
                <p className="text-[9px] text-indigo-600 font-medium leading-tight">
                    * ปรับแต่งเฉพาะส่วนที่เลือก หรือย่อหน้าที่ Cursor วางอยู่
                </p>
            </div>
        </motion.div>
    );
};

export default FormattingPanel;
