
import React, { useState } from 'react';
import { useWiki } from '../../hooks/useWiki';
import { Book, Search, ChevronRight, ChevronDown, ExternalLink } from 'lucide-react';
import { WikiArticle } from '../../types';

interface TaskWikiProps {
    className?: string;
}

const TaskWiki: React.FC<TaskWikiProps> = ({ className }) => {
    const { articles, isLoading } = useWiki();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const filteredArticles = articles.filter(a => 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleExpand = (id: string) => {
        setExpandedId(prev => prev === id ? null : id);
    };

    return (
        <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
            {/* Header / Search */}
            <div className="bg-white px-6 py-4 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Book className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">คู่มือการทำงาน (Wiki)</h3>
                        <p className="text-xs text-gray-500">ติดขัดตรงไหน เปิดดู Guideline ได้เลย</p>
                    </div>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="ค้นหาวิธีการ..." 
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoading ? (
                    <div className="text-center py-10 text-gray-400">กำลังโหลดคู่มือ...</div>
                ) : filteredArticles.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 flex flex-col items-center">
                        <Book className="w-12 h-12 mb-2 opacity-20" />
                        <p>ไม่พบคู่มือที่ค้นหา</p>
                    </div>
                ) : (
                    filteredArticles.map(article => (
                        <div key={article.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                            <div 
                                onClick={() => toggleExpand(article.id)}
                                className="p-4 flex justify-between items-start cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex-1 min-w-0 pr-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 font-bold uppercase">
                                            {article.category}
                                        </span>
                                        {article.isPinned && (
                                            <span className="text-[10px] bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded border border-yellow-100 font-bold">
                                                Pinned
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-800 leading-snug">{article.title}</h4>
                                </div>
                                <button className="text-gray-400">
                                    {expandedId === article.id ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                </button>
                            </div>
                            
                            {expandedId === article.id && (
                                <div className="px-4 pb-4 pt-0 text-sm text-gray-600 border-t border-gray-100 bg-gray-50/50">
                                    <div className="prose prose-sm max-w-none pt-3 whitespace-pre-wrap leading-relaxed">
                                        {article.content}
                                    </div>
                                    <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-2">
                                        <span className="text-[10px] text-gray-400">สำหรับ:</span>
                                        <div className="flex gap-1 flex-wrap">
                                            {article.targetRoles?.map(role => (
                                                <span key={role} className="text-[9px] bg-gray-200 text-gray-600 px-1.5 rounded">
                                                    {role}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TaskWiki;
