
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
        <div className="hidden xl:block w-64 shrink-0 pl-8 sticky top-24 self-start max-h-[80vh] overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-700 delay-300">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                <List className="w-3 h-3 mr-2" /> สารบัญ (Contents)
            </h4>
            <div className="border-l-2 border-slate-100 pl-3 space-y-3 relative">
                {headers.map((header, idx) => (
                    <div 
                        key={idx} 
                        className={`
                            text-xs text-slate-500 hover:text-indigo-600 cursor-pointer transition-colors leading-relaxed hover:translate-x-1 duration-200
                            ${header.level === 3 ? 'pl-3 border-l border-transparent hover:border-indigo-200' : 'font-bold'}
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
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col gap-2 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-sm transition-all shrink-0">
                
                {/* Row 1: Breadcrumbs & Mobile Back */}
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <button onClick={onBack} className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 mr-2">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    
                    <span className="flex items-center hover:text-slate-600 cursor-pointer"><Home className="w-3 h-3 mr-1"/> Wiki</span>
                    <ChevronRight className="w-3 h-3 opacity-50" />
                    <span className={`px-2 py-0.5 rounded border uppercase tracking-wider ${category?.color?.replace('text-', 'bg-').replace('bg-', 'bg-opacity-10 ') || 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                        {category?.label || 'General'}
                    </span>
                    <ChevronRight className="w-3 h-3 opacity-50" />
                    <span className="text-slate-800 font-bold truncate max-w-[150px] md:max-w-xs">{article.title}</span>
                </div>

                {/* Row 2: Controls */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> 
                            Updated {format(article.lastUpdated, 'd MMM yy')}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={onCycleLayout}
                            className="hidden lg:flex p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors items-center gap-2"
                            title="Change Layout"
                        >
                            <LayoutIcon className="w-4 h-4" />
                        </button>

                        <div className="w-px h-4 bg-slate-200 mx-1 hidden lg:block"></div>

                        <button onClick={handleShare} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Share">
                            <Share2 className="w-4 h-4" />
                        </button>
                        
                        {isAdmin && (
                            <button onClick={() => onDelete(article.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                        <button onClick={() => onEdit(article)} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all font-bold flex items-center gap-2 text-xs border border-indigo-100">
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
                            <div className="mb-8">
                                <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-6 leading-tight tracking-tight drop-shadow-sm">
                                    {article.title}
                                </h1>
                                
                                <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                                    {/* Author */}
                                    <div className="flex items-center gap-3">
                                        {article.lastEditor?.avatarUrl ? (
                                            <img src={article.lastEditor.avatarUrl} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500"><User className="w-5 h-5"/></div>
                                        )}
                                        <div>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Written By</p>
                                            <p className="text-sm font-bold text-slate-700">{article.lastEditor?.name || 'Unknown'}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Helpful Count */}
                                    <div className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${hasLikedLocal ? 'bg-pink-100 text-pink-700 border-pink-200' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                        <Heart className={`w-3.5 h-3.5 ${hasLikedLocal ? 'fill-pink-600 text-pink-600' : 'text-slate-400'}`} /> 
                                        {optimisticLikes} Likes
                                    </div>
                                </div>
                            </div>

                            {/* Prose Content (Synced with Editor Styles) */}
                            <article 
                                className="
                                    prose prose-slate prose-lg max-w-none text-slate-700
                                    
                                    /* Ensure Lists are visible and styled */
                                    [&_ol]:list-decimal [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:mb-1
                                    
                                    /* Heading Styles matched with Editor */
                                    [&_h1]:text-4xl [&_h1]:font-black [&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:text-slate-900
                                    [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-slate-800
                                    [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-slate-800
                                    
                                    /* Blockquotes */
                                    [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-300 [&_blockquote]:pl-6 [&_blockquote]:py-2 [&_blockquote]:italic [&_blockquote]:bg-gray-50 [&_blockquote]:rounded-r-lg
                                    
                                    /* Links - Distinct Style */
                                    [&_a]:text-blue-600 [&_a]:font-bold [&_a]:underline [&_a]:decoration-blue-300 [&_a]:decoration-2 [&_a]:underline-offset-2 
                                    hover:[&_a]:bg-blue-50 hover:[&_a]:text-blue-700 hover:[&_a]:decoration-blue-500 [&_a]:transition-all [&_a]:duration-200
                                    
                                    /* Code */
                                    [&_code]:bg-slate-800 [&_code]:text-green-400 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:font-mono [&_code]:text-sm
                                    
                                    /* Images */
                                    [&_img]:rounded-3xl [&_img]:shadow-lg [&_img]:border-2 [&_img]:border-slate-100 [&_img]:my-6
                                "
                                dangerouslySetInnerHTML={{ __html: article.content }}
                            />
                            
                            {/* Footer Interaction */}
                            <div className="mt-20 pt-10 border-t-2 border-dashed border-slate-100 flex flex-col items-center text-center bg-gradient-to-b from-white to-slate-50/50 rounded-b-3xl -mx-6 px-6 pb-10">
                                <h4 className="text-xl font-black text-slate-700 mb-2">บทความนี้มีประโยชน์ไหม?</h4>
                                <p className="text-slate-400 text-sm mb-6 font-medium">ส่งกำลังใจให้คนเขียนด้วยการกดปุ่มด้านล่าง</p>
                                <button 
                                    onClick={handleHelpful}
                                    disabled={hasLikedLocal}
                                    className={`
                                        group relative flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-bold transition-all duration-300 shadow-lg
                                        ${hasLikedLocal 
                                            ? 'bg-pink-100 text-pink-600 border-2 border-pink-200 cursor-default scale-100' 
                                            : 'bg-white border-2 border-slate-100 text-slate-600 hover:border-pink-200 hover:text-pink-600 hover:shadow-pink-100 hover:-translate-y-1 active:scale-95'}
                                    `}
                                >
                                    <Heart className={`w-6 h-6 transition-all duration-500 ${isHelpfulAnim || hasLikedLocal ? 'fill-pink-500 text-pink-500 scale-125' : 'group-hover:fill-pink-200'}`} />
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
