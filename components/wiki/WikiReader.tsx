
import React, { useState, useEffect } from 'react';
import { WikiArticle, MasterOption } from '../../types';
import { ArrowLeft, Trash2, Edit3, Heart, List, Clock, User, Share2, Maximize2, Minimize2, PanelLeftClose, ChevronRight, Home } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../../context/ToastContext';
import { WikiLayoutMode } from '../WikiView';

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
}

// --- Internal TOC Component ---
const TableOfContents = ({ content }: { content: string }) => {
    const [headers, setHeaders] = useState<{ id: string; text: string; level: number }[]>([]);

    useEffect(() => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const headerElements = doc.querySelectorAll('h1, h2, h3');
        
        const extracted = Array.from(headerElements).map((el, index) => {
            const text = el.textContent || '';
            const id = `header-${index}`; 
            // Add ID to original elements in a real DOM scenario would be done via a transformer, 
            // but here we just scroll by text match for simplicity in this version.
            return { id, text, level: parseInt(el.tagName.substring(1)) };
        });
        setHeaders(extracted);
    }, [content]);

    if (headers.length === 0) return null;

    return (
        <div className="hidden xl:block w-64 shrink-0 pl-8 sticky top-24 self-start max-h-[80vh] overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-700 delay-300 scrollbar-hide">
            <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center opacity-70">
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
    article, category, isAdmin, onBack, onEdit, onDelete, onToggleHelpful, layoutMode, onCycleLayout
}) => {
    const { showToast } = useToast();
    const [isHelpfulAnim, setIsHelpfulAnim] = useState(false);
    
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

    const LayoutIcon = layoutMode === 'STANDARD' ? Maximize2 : layoutMode === 'FOCUS' ? PanelLeftClose : Minimize2;

    return (
        <div className="flex flex-col h-full bg-white">
            
            {/* Header Toolbar (Sticky) */}
            <div className="px-6 py-4 border-b border-white/40 flex flex-col gap-3 bg-white/40 backdrop-blur-xl sticky top-0 z-30 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.05)] transition-all shrink-0">
                
                {/* Row 1: Breadcrumbs & Mobile Back */}
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <button onClick={onBack} className="lg:hidden p-2 hover:bg-white/60 rounded-xl text-slate-600 mr-2 border border-white/60 shadow-sm transition-all active:scale-90">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    
                    <span className="flex items-center hover:text-indigo-400 cursor-pointer transition-colors"><Home className="w-3 h-3 mr-1.5"/> Wiki</span>
                    <ChevronRight className="w-3 h-3 opacity-30" />
                    <span className={`px-3 py-1 rounded-full border backdrop-blur-sm shadow-sm ${category?.color?.replace('text-', 'bg-').replace('bg-', 'bg-opacity-10 ') || 'bg-slate-100/50 border-white/60 text-slate-500'}`}>
                        {category?.label || 'General'}
                    </span>
                    <ChevronRight className="w-3 h-3 opacity-30" />
                    <span className="text-slate-700 truncate max-w-[150px] md:max-w-xs">{article.title}</span>
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
                        <button 
                            onClick={onCycleLayout}
                            className="hidden lg:flex p-2.5 text-slate-400 hover:text-indigo-500 hover:bg-white/60 rounded-2xl transition-all items-center gap-2 border border-transparent hover:border-white/60 hover:shadow-sm"
                            title="Change Layout"
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
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 bg-white">
                <div className="relative">
                    
                    {/* Cover Image */}
                    {article.coverImage && (
                        <div className="h-64 md:h-80 w-full bg-slate-100 relative overflow-hidden group">
                            <img src={article.coverImage} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="cover" />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-white"></div>
                        </div>
                    )}

                    <div className={`flex flex-col xl:flex-row gap-8 max-w-6xl mx-auto px-6 lg:px-12 pb-20 ${article.coverImage ? '-mt-20 relative z-10' : 'pt-12'}`}>
                        
                        {/* Main Article */}
                        <div className="flex-1 min-w-0">
                            
                            {/* Title Block */}
                            <div className="mb-12">
                                <h1 className="text-4xl md:text-6xl font-bold text-slate-800 mb-8 leading-[1.1] tracking-tight drop-shadow-sm">
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
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-0.5">Written By</p>
                                            <p className="text-base font-bold text-slate-700">{article.lastEditor?.name || 'Unknown'}</p>
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
                                className="
                                    prose prose-slate prose-lg max-w-none text-slate-700
                                    
                                    /* Ensure Lists are visible and styled */
                                    [&_ol]:list-decimal [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:mb-2
                                    
                                    /* Heading Styles matched with Editor */
                                    [&_h1]:text-5xl [&_h1]:font-bold [&_h1]:mb-6 [&_h1]:mt-12 [&_h1]:text-slate-900 [&_h1]:tracking-tight
                                    [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:text-slate-800 [&_h2]:tracking-tight
                                    [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-slate-800
                                    
                                    /* Blockquotes */
                                    [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-200 [&_blockquote]:pl-8 [&_blockquote]:py-4 [&_blockquote]:italic [&_blockquote]:bg-indigo-50/30 [&_blockquote]:rounded-3xl [&_blockquote]:text-slate-600
                                    
                                    /* Links - Distinct Style */
                                    [&_a]:text-indigo-500 [&_a]:font-bold [&_a]:underline [&_a]:decoration-indigo-200 [&_a]:decoration-2 [&_a]:underline-offset-4 
                                    hover:[&_a]:bg-indigo-50 hover:[&_a]:text-indigo-600 hover:[&_a]:decoration-indigo-400 [&_a]:transition-all [&_a]:duration-300
                                    
                                    /* Code */
                                    [&_code]:bg-slate-800 [&_code]:text-indigo-300 [&_code]:px-2 [&_code]:py-1 [&_code]:rounded-xl [&_code]:font-mono [&_code]:text-sm [&_code]:shadow-inner
                                    
                                    /* Images */
                                    [&_img]:rounded-[2.5rem] [&_img]:shadow-2xl [&_img]:border-4 [&_img]:border-white/60 [&_img]:my-12 [&_img]:transition-transform [&_img]:duration-700 hover:[&_img]:scale-[1.01]
                                "
                                dangerouslySetInnerHTML={{ __html: article.content }}
                            />
                            
                            {/* Footer Interaction */}
                            <div className="mt-24 pt-12 border-t border-white/40 flex flex-col items-center text-center bg-white/20 backdrop-blur-md rounded-[3rem] -mx-6 px-6 pb-12 shadow-inner border border-white/60">
                                <h4 className="text-2xl font-bold text-slate-700 mb-3 tracking-tight">บทความนี้มีประโยชน์ไหม?</h4>
                                <p className="text-slate-400 text-sm mb-8 font-bold opacity-70">ส่งกำลังใจให้คนเขียนด้วยการกดปุ่มด้านล่าง ✨</p>
                                <button 
                                    onClick={handleHelpful}
                                    disabled={hasLikedLocal}
                                    className={`
                                        group relative flex items-center gap-4 px-10 py-5 rounded-[2rem] text-lg font-bold transition-all duration-500 shadow-xl
                                        ${hasLikedLocal 
                                            ? 'bg-pink-100/80 text-pink-600 border-2 border-pink-200 cursor-default scale-100' 
                                            : 'bg-white border-2 border-white/80 text-slate-600 hover:border-pink-200 hover:text-pink-600 hover:shadow-pink-100 hover:-translate-y-2 active:scale-95'}
                                    `}
                                >
                                    <Heart className={`w-7 h-7 transition-all duration-700 ${isHelpfulAnim || hasLikedLocal ? 'fill-pink-500 text-pink-500 scale-125 rotate-[360deg]' : 'group-hover:fill-pink-200'}`} />
                                    <span>{hasLikedLocal ? 'ขอบคุณครับ! (Liked)' : 'เยี่ยมมาก! (Helpful)'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Table of Contents (Sticky) */}
                        <TableOfContents content={article.content} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WikiReader;
