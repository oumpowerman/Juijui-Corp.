
import React, { useState, useEffect } from 'react';
import { WikiArticle, MasterOption } from '../../types';
import { ArrowLeft, Trash2, Edit3, Heart, List, Clock, User, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../../context/ToastContext';

interface WikiReaderProps {
    article: WikiArticle;
    category?: MasterOption;
    isAdmin: boolean;
    onBack: () => void;
    onEdit: (article: WikiArticle) => void;
    onDelete: (id: string) => void;
    onToggleHelpful: (id: string) => void;
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
            // Note: In a real implementation, you'd inject these IDs into the rendered HTML or use a library that does it.
            // Here we just extract for display.
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
            <div className="border-l-2 border-slate-100 pl-3 space-y-3">
                {headers.map((header, idx) => (
                    <div 
                        key={idx} 
                        className={`
                            text-xs text-slate-500 hover:text-indigo-600 cursor-pointer transition-colors leading-relaxed
                            ${header.level === 3 ? 'pl-3' : 'font-medium'}
                        `}
                        onClick={() => {
                            // Simple scroll attempt (best effort without ID injection)
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
    article, category, isAdmin, onBack, onEdit, onDelete, onToggleHelpful 
}) => {
    const { showToast } = useToast();
    const [isHelpfulAnim, setIsHelpfulAnim] = useState(false);

    const handleHelpful = () => {
        setIsHelpfulAnim(true);
        onToggleHelpful(article.id);
        setTimeout(() => setIsHelpfulAnim(false), 1000);
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        showToast('คัดลอกลิงก์แล้ว', 'success');
    };

    return (
        <>
            {/* Header Toolbar (Floating) */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-30 shadow-sm transition-all">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="lg:hidden p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className={`px-2 py-0.5 rounded font-bold border uppercase tracking-wider ${category?.color?.replace('text-', 'bg-').replace('bg-', 'bg-opacity-10 ') || 'bg-slate-100 border-slate-200'}`}>
                            {category?.label || 'General'}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" /> {format(article.lastUpdated, 'd MMM yy')}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={handleShare} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Share">
                        <Share2 className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-slate-200 mx-1"></div>
                    {isAdmin && (
                        <button onClick={() => onDelete(article.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                    <button onClick={() => onEdit(article)} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all font-bold flex items-center gap-2 text-xs">
                        <Edit3 className="w-4 h-4" /> <span className="hidden sm:inline">แก้ไข</span>
                    </button>
                </div>
            </div>

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 bg-white">
                <div className="relative">
                    
                    {/* Cover Image (Parallax-like) */}
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
                                    <div className="ml-auto flex items-center gap-1.5 bg-pink-50 text-pink-600 px-3 py-1.5 rounded-full text-xs font-bold border border-pink-100">
                                        <Heart className="w-3.5 h-3.5 fill-pink-600" /> {article.helpfulCount || 0} Likes
                                    </div>
                                </div>
                            </div>

                            {/* Prose Content */}
                            <article 
                                className="prose prose-slate prose-lg max-w-none 
                                prose-headings:font-black prose-headings:text-slate-800 prose-headings:tracking-tight
                                prose-p:text-slate-600 prose-p:leading-relaxed
                                prose-a:text-indigo-600 prose-a:font-bold prose-a:no-underline hover:prose-a:underline
                                prose-img:rounded-2xl prose-img:shadow-lg prose-img:border prose-img:border-slate-100
                                prose-blockquote:border-l-4 prose-blockquote:border-indigo-400 prose-blockquote:bg-indigo-50/50 prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:rounded-r-xl prose-blockquote:text-indigo-900 prose-blockquote:font-medium prose-blockquote:not-italic
                                prose-code:bg-slate-100 prose-code:text-slate-700 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-sm prose-code:font-bold
                                prose-li:marker:text-indigo-300"
                                dangerouslySetInnerHTML={{ __html: article.content }}
                            />
                            
                            {/* Footer Interaction */}
                            <div className="mt-20 pt-10 border-t border-dashed border-slate-200 flex flex-col items-center text-center">
                                <h4 className="text-lg font-bold text-slate-700 mb-2">บทความนี้มีประโยชน์ไหม?</h4>
                                <p className="text-slate-400 text-sm mb-6">ส่งกำลังใจให้คนเขียนด้วยการกดปุ่มด้านล่าง</p>
                                <button 
                                    onClick={handleHelpful}
                                    className={`
                                        group relative flex items-center gap-3 px-8 py-3 rounded-full text-sm font-bold transition-all duration-300
                                        ${isHelpfulAnim ? 'bg-pink-100 text-pink-600 scale-110' : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-pink-200 hover:text-pink-600 hover:shadow-lg hover:-translate-y-1'}
                                    `}
                                >
                                    <Heart className={`w-5 h-5 transition-all duration-300 ${isHelpfulAnim ? 'fill-pink-600 scale-125' : 'group-hover:fill-pink-100'}`} />
                                    <span>เยี่ยมมาก! (Helpful)</span>
                                    
                                    {isHelpfulAnim && (
                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-2xl animate-bounce">💖</span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Table of Contents (Sticky) */}
                        <TableOfContents content={article.content} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default WikiReader;
