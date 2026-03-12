
import React, { useState, useEffect, useMemo } from 'react';
import { WikiArticle, MasterOption } from '../../types';
import { 
    ArrowLeft, 
    Trash2, 
    Edit3, 
    Heart, 
    List, 
    Clock, 
    User, 
    Share2, 
    Maximize2, 
    Minimize2, 
    PanelLeftClose, 
    ChevronRight, 
    Home,
    Monitor,
    Smartphone,
    Expand,
    Shrink,
    Layout,
    Sparkles,
    Baseline,
    MoreHorizontal
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../../context/ToastContext';
import { WikiLayoutMode } from '../WikiView';
import { motion, AnimatePresence } from 'framer-motion';

interface WikiReaderProps {
    article: WikiArticle;
    category?: MasterOption;
    isAdmin: boolean;
    onBack: () => void;
    onEdit: (article: WikiArticle) => void;
    onDelete: (id: string) => void;
    onToggleHelpful: (id: string) => void;
    layoutMode: WikiLayoutMode;
    onCycleLayout: () => void;
    setLayoutMode: (mode: WikiLayoutMode) => void;
}

// --- Internal TOC Component ---
const TableOfContents = ({ content, isFullWidth }: { content: string; isFullWidth: boolean }) => {
    const [headers, setHeaders] = useState<{ id: string; text: string; level: number }[]>([]);

    useEffect(() => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const headerElements = doc.querySelectorAll('h1, h2, h3');
        
        const extracted = Array.from(headerElements).map((el, index) => {
            const text = el.textContent || '';
            const id = `header-${index}`; 
            return { id, text, level: parseInt(el.tagName.substring(1)) };
        });
        setHeaders(extracted);
    }, [content]);

    if (headers.length === 0 || isFullWidth) return null;

    return (
        <div className="hidden xl:block w-64 shrink-0 pl-8 sticky top-24 self-start max-h-[80vh] overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-700 delay-300 scrollbar-hide">
            <h4 className="text-[14px] font-kanit font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center opacity-70">
                <List className="w-3.5 h-3.5 mr-2 text-indigo-300" /> สารบัญ (Contents)
            </h4>
            <div className="border-l border-white/40 pl-4 space-y-4 relative">
                {headers.map((header, idx) => (
                    <div 
                        key={idx} 
                        className={`
                            text-xs text-slate-500 hover:text-indigo-500 cursor-pointer transition-all leading-relaxed hover:translate-x-1 duration-300
                            ${header.level === 3 ? 'pl-4 border-l border-transparent hover:border-indigo-100' : 'font-bold'}
                        `}
                        onClick={() => {
                             const elements = document.querySelectorAll(`h${header.level}`);
                             Array.from(elements).find(e => e.textContent === header.text)?.scrollIntoView({ behavior: 'smooth' });
                        }}
                    >
                        {header.text}
                    </div>
                ))}
            </div>
        </div>
    );
};

const WikiReader: React.FC<WikiReaderProps> = ({ 
    article, category, isAdmin, onBack, onEdit, onDelete, onToggleHelpful, layoutMode, onCycleLayout, setLayoutMode
}) => {
    const { showToast } = useToast();
    const [isHelpfulAnim, setIsHelpfulAnim] = useState(false);
    const [contentWidth, setContentWidth] = useState<'READABLE' | 'FULL'>('READABLE');
    const [lineSpacing, setLineSpacing] = useState<'COMPACT' | 'NORMAL' | 'SPACIOUS'>('NORMAL');
    
    const [optimisticLikes, setOptimisticLikes] = useState(article.helpfulCount || 0);
    const [hasLikedLocal, setHasLikedLocal] = useState(false);

    useEffect(() => {
        setOptimisticLikes(article.helpfulCount || 0);
        setHasLikedLocal(false);
    }, [article.id, article.helpfulCount]);

    const handleHelpful = () => {
        if (hasLikedLocal) return;

        setIsHelpfulAnim(true);
        setHasLikedLocal(true);
        setOptimisticLikes(prev => prev + 1);
        onToggleHelpful(article.id);
        setTimeout(() => setIsHelpfulAnim(false), 1000);
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        showToast('คัดลอกลิงก์แล้ว 🔗', 'success');
    };

    const toggleTheaterMode = () => {
        if (layoutMode === 'ZEN') {
            setLayoutMode('FOCUS');
        } else {
            setLayoutMode('ZEN');
        }
    };

    // --- Smart Content Processing ---
    const processedContent = useMemo(() => {
        if (!article.content) return '';
        
        // 1. Auto-Divider: Replace <p>-----</p> (5 or more dashes) with a minimalist divider
        // We look for paragraphs that contain only dashes (5+) and optional whitespace
        let html = article.content.replace(
            /<p>\s*([-—]{5,})\s*<\/p>/g, 
            '<div class="my-12 flex justify-center items-center gap-4 opacity-40"><div class="h-[1px] w-24 bg-gradient-to-r from-transparent to-slate-200"></div><div class="h-[1px] w-24 bg-gradient-to-l from-transparent to-slate-200"></div></div>'
        );

        return html;
    }, [article.content]);

    const LayoutIcon = layoutMode === 'STANDARD' ? Maximize2 : layoutMode === 'FOCUS' ? PanelLeftClose : Minimize2;

    return (
        <div className="flex flex-col h-full bg-white relative">
            
            {/* Floating Back Button (Visible in ZEN or when header collapsed) */}
            <AnimatePresence>
                {layoutMode === 'ZEN' && (
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onClick={onBack}
                        className="fixed bottom-8 left-8 z-50 p-4 bg-slate-900 text-white rounded-full shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 group"
                    >
                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Header Toolbar (Sticky) */}
            <div className="px-6 py-4 border-b border-white/40 flex flex-col gap-3 bg-white/40 backdrop-blur-xl sticky top-0 z-30 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.05)] transition-all shrink-0">
                
                {/* Row 1: Breadcrumbs & Mobile Back */}
                <div className="flex items-center gap-2 text-[12px] font-kanit text-slate-400 font-medium uppercase tracking-wider">
                    <button onClick={onBack} className="lg:hidden p-2 hover:bg-white/60 rounded-xl text-slate-600 mr-2 border border-white/60 shadow-sm transition-all active:scale-90">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    
                    <span className="flex items-center hover:text-indigo-400 cursor-pointer transition-colors"><Home className="w-3 h-3 mr-1.5"/> Wiki</span>
                    <ChevronRight className="w-3 h-3 opacity-30" />
                    <span className={`px-3 py-1 rounded-full border backdrop-blur-sm shadow-sm ${category?.color?.replace('text-', 'bg-').replace('bg-', 'bg-opacity-10 ') || 'bg-slate-100/50 border-white/60 text-slate-500'}`}>
                        {category?.label || 'General'}
                    </span>
                    <ChevronRight className="w-3 h-3 opacity-30" />
                    <span className="text-slate-800 truncate max-w-[150px] md:max-w-xs">{article.title}</span>
                </div>

                {/* Row 2: Controls */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold">
                        <span className="flex items-center bg-white/40 px-3 py-1.5 rounded-xl border border-white/60 shadow-sm">
                            <Clock className="w-3.5 h-3.5 mr-2 text-indigo-300" /> 
                            Updated {format(article.lastUpdated, 'd MMM yy')}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Line Spacing Switcher */}
                        <div className="hidden md:flex bg-white/40 backdrop-blur-md p-1 rounded-xl border border-white/60 shadow-inner mr-2">
                            <button 
                                onClick={() => setLineSpacing('COMPACT')}
                                className={`p-1.5 rounded-lg transition-all ${lineSpacing === 'COMPACT' ? 'bg-white shadow-sm text-indigo-500' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Compact Spacing"
                            >
                                <div className="flex flex-col gap-0.5 items-center justify-center w-4 h-4">
                                    <div className="w-3 h-0.5 bg-current"></div>
                                    <div className="w-3 h-0.5 bg-current"></div>
                                    <div className="w-3 h-0.5 bg-current"></div>
                                </div>
                            </button>
                            <button 
                                onClick={() => setLineSpacing('NORMAL')}
                                className={`p-1.5 rounded-lg transition-all ${lineSpacing === 'NORMAL' ? 'bg-white shadow-sm text-indigo-500' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Normal Spacing"
                            >
                                <div className="flex flex-col gap-1 items-center justify-center w-4 h-4">
                                    <div className="w-3 h-0.5 bg-current"></div>
                                    <div className="w-3 h-0.5 bg-current"></div>
                                    <div className="w-3 h-0.5 bg-current"></div>
                                </div>
                            </button>
                            <button 
                                onClick={() => setLineSpacing('SPACIOUS')}
                                className={`p-1.5 rounded-lg transition-all ${lineSpacing === 'SPACIOUS' ? 'bg-white shadow-sm text-indigo-500' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Spacious Spacing"
                            >
                                <div className="flex flex-col gap-1.5 items-center justify-center w-4 h-4">
                                    <div className="w-3 h-0.5 bg-current"></div>
                                    <div className="w-3 h-0.5 bg-current"></div>
                                    <div className="w-3 h-0.5 bg-current"></div>
                                </div>
                            </button>
                        </div>

                        {/* Content Width Switcher */}
                        <div className="hidden lg:flex bg-white/40 backdrop-blur-md p-1 rounded-xl border border-white/60 shadow-inner mr-2">
                            <button 
                                onClick={() => setContentWidth('READABLE')}
                                className={`p-1.5 rounded-lg transition-all ${contentWidth === 'READABLE' ? 'bg-white shadow-sm text-indigo-500' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Readable Width"
                            >
                                <Smartphone className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setContentWidth('FULL')}
                                className={`p-1.5 rounded-lg transition-all ${contentWidth === 'FULL' ? 'bg-white shadow-sm text-indigo-500' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Full Width"
                            >
                                <Monitor className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Theater Mode Toggle */}
                        <button 
                            onClick={toggleTheaterMode}
                            className={`hidden lg:flex p-2.5 rounded-2xl transition-all items-center gap-2 border ${layoutMode === 'ZEN' ? 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-sm' : 'text-slate-400 hover:text-indigo-500 hover:bg-white/60 border-transparent hover:border-white/60'}`}
                            title={layoutMode === 'ZEN' ? "Exit Theater Mode" : "Theater Mode"}
                        >
                            {layoutMode === 'ZEN' ? <Shrink className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
                        </button>

                        <button 
                            onClick={onCycleLayout}
                            className="hidden lg:flex p-2.5 text-slate-400 hover:text-indigo-500 hover:bg-white/60 rounded-2xl transition-all items-center gap-2 border border-transparent hover:border-white/60 hover:shadow-sm"
                            title="Cycle Layout"
                        >
                            <LayoutIcon className="w-4 h-4" />
                        </button>

                        <div className="w-px h-5 bg-white/40 mx-1 hidden lg:block"></div>

                        <button onClick={handleShare} className="p-2.5 text-slate-400 hover:text-indigo-500 hover:bg-white/60 rounded-2xl transition-all border border-transparent hover:border-white/60 hover:shadow-sm" title="Share">
                            <Share2 className="w-4 h-4" />
                        </button>
                        
                        {isAdmin && (
                            <button onClick={() => onDelete(article.id)} className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-50/50 rounded-2xl transition-all border border-transparent hover:border-red-100 hover:shadow-sm" title="Delete">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                        <button onClick={() => onEdit(article)} className="px-5 py-2.5 text-indigo-500 bg-white/60 hover:bg-white rounded-2xl transition-all font-bold flex items-center gap-2 text-xs border border-white/80 shadow-[0_4px_12px_-2px_rgba(99,102,241,0.1)] hover:shadow-[0_8px_24px_-4px_rgba(99,102,241,0.2)] hover:-translate-y-0.5">
                            <Edit3 className="w-4 h-4" /> <span className="hidden sm:inline">แก้ไข</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 bg-white transition-all duration-700">
                <div className="relative">
                    
                    {/* Cover Image */}
                    {article.coverImage && (
                        <div className={`w-full bg-slate-100 relative overflow-hidden group transition-all duration-700 ${contentWidth === 'FULL' ? 'h-96 md:h-[500px]' : 'h-64 md:h-80'}`}>
                            <img src={article.coverImage} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="cover" />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-white"></div>
                        </div>
                    )}

                    <div className={`
                        flex flex-col xl:flex-row gap-8 mx-auto px-6 lg:px-12 pb-20 transition-all duration-700
                        ${contentWidth === 'FULL' ? 'max-w-none' : 'max-w-6xl'}
                        ${article.coverImage ? '-mt-20 relative z-10' : 'pt-12'}
                    `}>
                        
                        {/* Main Article */}
                        <div className={`flex-1 min-w-0 transition-all duration-700 ${contentWidth === 'READABLE' ? 'max-w-4xl mx-auto' : ''}`}>
                            
                            {/* Title Block */}
                            <div className="mb-12">
                                <h1 className={`font-bold text-slate-800 mb-8 leading-[1.1] tracking-tight drop-shadow-sm transition-all duration-700 ${contentWidth === 'FULL' ? 'text-5xl md:text-6xl' : 'text-4xl md:text-4xl'}`}>
                                    {article.title}
                                </h1>
                                
                                <div className="flex items-center gap-6 border-b border-white/40 pb-8">
                                    {/* Author */}
                                    <div className="flex items-center gap-4">
                                        {article.lastEditor?.avatarUrl ? (
                                            <img src={article.lastEditor.avatarUrl} className="w-12 h-12 rounded-2xl border-2 border-white shadow-md" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-white/60 shadow-sm"><User className="w-6 h-6"/></div>
                                        )}
                                        <div>
                                            <p className="text-[12px] fonr-kanit text-slate-400 font-bold uppercase tracking-[0.2em] mb-0.5">Written By</p>
                                            <p className="text-base font-kanit font-bold text-slate-700">{article.lastEditor?.name || 'Unknown'}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Helpful Count */}
                                    <div className={`ml-auto flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold border backdrop-blur-md transition-all duration-500 shadow-sm ${hasLikedLocal ? 'bg-pink-100/80 text-pink-600 border-pink-200 shadow-pink-100' : 'bg-white/40 text-slate-500 border-white/60 hover:bg-white/60 hover:border-pink-100 hover:text-pink-400'}`}>
                                        <Heart className={`w-4 h-4 transition-transform duration-500 ${hasLikedLocal ? 'fill-pink-500 text-pink-500 scale-110' : 'text-slate-400 group-hover:scale-110'}`} /> 
                                        {optimisticLikes} Likes
                                    </div>
                                </div>
                            </div>

                            {/* Prose Content (Synced with Editor Styles) */}
                            <article 
                                className={`
                                    prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap transition-all duration-700
                                    ${contentWidth === 'FULL' ? 'prose-xl' : 'prose-lg'}
                                    ${lineSpacing === 'COMPACT' ? 'leading-normal' : lineSpacing === 'SPACIOUS' ? 'leading-loose' : 'leading-relaxed'}
                                    
                                    /* Ensure Lists are visible and styled */
                                    [&_ol]:list-decimal [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:mb-2
                                    
                                    /* Handle Empty Paragraphs (Multiple Enters) */
                                    [&_p:empty]:min-h-[1em] [&_p:empty]:mb-4
                                    [&_p>br:only-child]:min-h-[1em]
                                    
                                    /* Heading Styles matched with Editor */
                                    [&_h1]:text-5xl [&_h1]:font-bold [&_h1]:mb-6 [&_h1]:mt-12 [&_h1]:text-slate-900 [&_h1]:tracking-tight
                                    [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:text-slate-800 [&_h2]:tracking-tight
                                    [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-slate-800
                                    
                                    /* Blockquotes */
                                    [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-200 [&_blockquote]:pl-8 [&_blockquote]:py-4 [&_blockquote]:bg-indigo-50/30 [&_blockquote]:rounded-3xl [&_blockquote]:text-slate-600
                                    
                                    /* Links - Distinct Style */
                                    [&_a]:text-indigo-500 [&_a]:font-bold [&_a]:underline [&_a]:decoration-indigo-200 [&_a]:decoration-2 [&_a]:underline-offset-4 
                                    hover:[&_a]:bg-indigo-50 hover:[&_a]:text-indigo-600 hover:[&_a]:decoration-indigo-400 [&_a]:transition-all [&_a]:duration-300
                                    
                                    /* Code */
                                    [&_code]:bg-slate-800 [&_code]:text-indigo-300 [&_code]:px-2 [&_code]:py-1 [&_code]:rounded-xl [&_code]:font-mono [&_code]:text-sm [&_code]:shadow-inner
                                    
                                    /* Images */
                                    [&_img]:rounded-[2.5rem] [&_img]:shadow-2xl [&_img]:border-4 [&_img]:border-white/60 [&_img]:my-12 [&_img]:transition-transform [&_img]:duration-700 hover:[&_img]:scale-[1.01]
                                `}
                                dangerouslySetInnerHTML={{ __html: processedContent }}
                            />
                            
                            {/* Footer Interaction - Full Width Layered Design */}
                            <div className="mt-16 pt-12 border-t border-slate-100">
                                <div className="bg-white/50 backdrop-blur-xl rounded-[3rem] border border-white/80 p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] w-full relative overflow-hidden group transition-all duration-700 hover:shadow-[0_40px_80px_-16px_rgba(99,102,241,0.12)]">
                                    {/* Decorative Background Glows */}
                                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-pink-100/20 rounded-full blur-3xl group-hover:bg-pink-200/30 transition-colors duration-700"></div>
                                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-100/20 rounded-full blur-3xl group-hover:bg-indigo-200/30 transition-colors duration-700"></div>

                                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-white rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center justify-center transform -rotate-6 group-hover:rotate-0 transition-transform duration-500 shrink-0">
                                                <Sparkles className="w-8 h-8 text-yellow-400" />
                                            </div>
                                            <div className="text-center md:text-left">
                                                <h4 className="text-2xl font-black text-slate-800 mb-1 tracking-tight">บทความนี้มีประโยชน์ไหม?</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] opacity-70">ส่งกำลังใจให้คนเขียนด้วยการกดปุ่มด้านล่าง ✨</p>
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={handleHelpful}
                                            disabled={hasLikedLocal}
                                            className={`
                                                group/btn relative flex items-center gap-4 px-10 py-4 rounded-2xl text-base font-black transition-all duration-500 shadow-xl shrink-0
                                                ${hasLikedLocal 
                                                    ? 'bg-pink-50 text-pink-500 border border-pink-100 cursor-default' 
                                                    : 'bg-slate-900 text-white hover:bg-indigo-600 hover:shadow-indigo-200 hover:-translate-y-1.5 active:scale-95'}
                                            `}
                                        >
                                            <Heart className={`w-6 h-6 transition-all duration-700 ${isHelpfulAnim || hasLikedLocal ? 'fill-pink-500 text-pink-500 scale-125 rotate-[360deg]' : 'group-hover/btn:scale-110'}`} />
                                            <span>{hasLikedLocal ? 'ขอบคุณครับ!' : 'เยี่ยมมาก! (Helpful)'}</span>
                                            
                                            {!hasLikedLocal && (
                                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Table of Contents (Sticky) */}
                        <TableOfContents content={processedContent} isFullWidth={contentWidth === 'FULL'} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WikiReader;
