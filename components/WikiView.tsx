
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { WikiArticle, User } from '../types';
import { useWiki } from '../hooks/useWiki';
import { Book, Search, Plus, Edit3, Trash2, Pin, FileText, ChevronRight, X, Save, Clock, Info, Briefcase, Users, Check, Layout, List, Image as ImageIcon, Heart, Share2, AlignLeft, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import MentorTip from './MentorTip';

interface WikiViewProps {
    currentUser: User;
}

const CATEGORIES = [
    { id: 'ALL', label: 'ทั้งหมด', icon: Book },
    { id: 'ONBOARDING', label: 'รับน้องใหม่', icon: Info },
    { id: 'RULES', label: 'กฎ & Workflow', icon: FileText },
    { id: 'TOOLS', label: 'เครื่องมือ & เทคนิค', icon: Save },
    { id: 'GENERAL', label: 'ทั่วไป', icon: Book },
];

const JOB_ROLES = [
    { id: 'ALL', label: 'Everyone' },
    { id: 'CREATIVE', label: 'Creative' },
    { id: 'EDITOR', label: 'Editor' },
    { id: 'PRODUCTION', label: 'Production' },
    { id: 'ADMIN', label: 'Admin' },
];

// --- UTILS: Custom Lightweight Markdown Renderer ---
// Note: In a real production app, use 'react-markdown' or 'rehype'.
// This is a custom lightweight parser to avoid new dependencies while delivering the feature.
const SimpleMarkdown: React.FC<{ content: string }> = ({ content }) => {
    const renderLine = (line: string, index: number) => {
        // Headers
        if (line.startsWith('### ')) return <h3 key={index} className="text-lg font-bold text-gray-800 mt-4 mb-2" id={`h-${index}`}>{line.replace('### ', '')}</h3>;
        if (line.startsWith('## ')) return <h2 key={index} className="text-xl font-bold text-indigo-900 mt-6 mb-3 border-b border-gray-100 pb-1" id={`h-${index}`}>{line.replace('## ', '')}</h2>;
        if (line.startsWith('# ')) return <h1 key={index} className="text-3xl font-black text-gray-900 mt-8 mb-4" id={`h-${index}`}>{line.replace('# ', '')}</h1>;
        
        // Lists
        if (line.startsWith('- ')) return <li key={index} className="ml-4 list-disc pl-1 mb-1 text-gray-700">{line.replace('- ', '')}</li>;
        if (line.match(/^\d+\. /)) return <li key={index} className="ml-4 list-decimal pl-1 mb-1 text-gray-700">{line.replace(/^\d+\. /, '')}</li>;

        // Blockquote
        if (line.startsWith('> ')) return <blockquote key={index} className="border-l-4 border-indigo-200 pl-4 italic text-gray-600 my-4 bg-indigo-50/30 p-2 rounded-r-lg">{line.replace('> ', '')}</blockquote>;

        // Image (Simple Syntax: ![Alt](Url))
        const imgMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
        if (imgMatch) {
            return (
                <div key={index} className="my-4 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                    <img src={imgMatch[2]} alt={imgMatch[1]} className="w-full h-auto object-cover max-h-[400px]" />
                    {imgMatch[1] && <p className="text-center text-xs text-gray-400 mt-1 py-1 bg-gray-50">{imgMatch[1]}</p>}
                </div>
            );
        }

        // Horizontal Rule
        if (line === '---') return <hr key={index} className="my-6 border-gray-200" />;

        // Paragraph (with simple bold/italic parsing)
        // Note: This is very basic. Real MD requires AST.
        const parsedText = line.split(/(\*\*.*?\*\*)/g).map((part, i) => 
            part.startsWith('**') && part.endsWith('**') ? <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong> : part
        );

        return line.trim() === '' ? <div key={index} className="h-4"></div> : <p key={index} className="mb-2 text-gray-600 leading-relaxed">{parsedText}</p>;
    };

    return <div className="markdown-body">{content.split('\n').map((line, i) => renderLine(line, i))}</div>;
};

// --- COMPONENT: Table of Contents ---
const TableOfContents: React.FC<{ content: string }> = ({ content }) => {
    const headers = content.split('\n').reduce((acc: any[], line, index) => {
        if (line.startsWith('# ') || line.startsWith('## ') || line.startsWith('### ')) {
            acc.push({ text: line.replace(/^#+\s/, ''), level: line.match(/^#+/)?.[0].length || 1, id: `h-${index}` });
        }
        return acc;
    }, []);

    if (headers.length === 0) return null;

    const scrollToHeader = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm sticky top-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center">
                <List className="w-3 h-3 mr-2" /> สารบัญ (On this page)
            </h4>
            <ul className="space-y-2">
                {headers.map((h, i) => (
                    <li 
                        key={i} 
                        className={`text-xs cursor-pointer hover:text-indigo-600 transition-colors ${h.level === 1 ? 'font-bold text-gray-800' : 'text-gray-500 pl-3 border-l border-gray-100'}`}
                        onClick={() => scrollToHeader(h.id)}
                    >
                        {h.text}
                    </li>
                ))}
            </ul>
        </div>
    );
};

const WikiView: React.FC<WikiViewProps> = ({ currentUser }) => {
    const { articles, addArticle, updateArticle, deleteArticle, toggleHelpful, isLoading } = useWiki();
    
    // UI State
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewingArticle, setViewingArticle] = useState<WikiArticle | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [editForm, setEditForm] = useState<Partial<WikiArticle>>({});

    const isAdmin = currentUser.role === 'ADMIN';

    // --- Filter Logic ---
    const filteredArticles = useMemo(() => {
        return articles.filter(a => {
            const matchCat = selectedCategory === 'ALL' || a.category === selectedCategory;
            const articleRoles = a.targetRoles || ['ALL'];
            const matchRole = selectedRoleFilter === 'ALL' 
                ? true 
                : articleRoles.includes('ALL') || articleRoles.includes(selectedRoleFilter);
            const matchSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                a.content.toLowerCase().includes(searchQuery.toLowerCase());
            return matchCat && matchRole && matchSearch;
        }).sort((a, b) => (Number(b.isPinned) - Number(a.isPinned)));
    }, [articles, selectedCategory, selectedRoleFilter, searchQuery]);

    // --- Handlers ---
    const handleCreate = () => {
        setEditForm({
            title: '',
            category: 'GENERAL',
            content: '',
            targetRoles: ['ALL'],
            isPinned: false,
            coverImage: '',
        });
        setViewingArticle(null);
        setIsEditing(true);
    };

    const handleEdit = (article: WikiArticle) => {
        setEditForm({ ...article });
        setViewingArticle(null);
        setIsEditing(true);
    };

    const handleSave = () => {
        if (!editForm.title || !editForm.content) {
            alert('กรุณากรอกหัวข้อและเนื้อหาครับ');
            return;
        }
        const payload: any = {
            ...editForm,
            targetRoles: (editForm.targetRoles && editForm.targetRoles.length > 0) ? editForm.targetRoles : ['ALL']
        };

        if (editForm.id) updateArticle(editForm.id, payload);
        else addArticle(payload);
        
        setIsEditing(false);
    };

    const handleDelete = (id: string) => {
        if(confirm('ยืนยันการลบบทความนี้?')) {
            deleteArticle(id);
            if (viewingArticle?.id === id) setViewingArticle(null);
        }
    };

    const toggleEditRole = (role: string) => {
        setEditForm(prev => {
            const currentRoles = prev.targetRoles || [];
            if (role === 'ALL') return { ...prev, targetRoles: ['ALL'] };
            let newRoles = currentRoles.filter(r => r !== 'ALL');
            if (newRoles.includes(role)) newRoles = newRoles.filter(r => r !== role);
            else newRoles.push(role);
            if (newRoles.length === 0) newRoles = ['ALL'];
            return { ...prev, targetRoles: newRoles };
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <MentorTip variant="blue" messages={[
                "Wiki โฉมใหม่! รองรับ Markdown แล้วนะ ลองใส่ # นำหน้าเพื่อทำหัวข้อ หรือ - เพื่อทำลิสต์ดูสิ",
                "เพิ่มรูปปก (Cover Image) ให้บทความดูน่าอ่านขึ้นได้ด้วย",
                "ด้านขวาในหน้าอ่าน จะมีสารบัญ (Table of Contents) ช่วยให้ข้ามไปหาหัวข้อที่ต้องการได้ไวขึ้น"
            ]} />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 flex items-center tracking-tight">
                        <Book className="w-8 h-8 mr-3 text-indigo-600" />
                        Wiki Library
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium">
                        คลังความรู้ คู่มือ และมาตรฐานการทำงาน
                    </p>
                </div>
                {isAdmin && (
                    <button 
                        onClick={handleCreate}
                        className="flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 group"
                    >
                        <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" /> เขียนบทความ
                    </button>
                )}
            </div>

            {/* Mobile Tabs (Horizontal Scroll) */}
            <div className="xl:hidden overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide flex gap-2">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${selectedCategory === cat.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-500 border-gray-200'}`}
                    >
                        <cat.icon className="w-3.5 h-3.5 mr-2" /> {cat.label}
                    </button>
                ))}
            </div>

            {/* Main Layout */}
            <div className="flex flex-col xl:flex-row gap-8">
                
                {/* Desktop Sidebar */}
                <div className="hidden xl:block w-64 flex-shrink-0 space-y-6">
                    {/* Search */}
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="ค้นหา..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none text-sm transition-all shadow-sm"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Categories */}
                    <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                        <h4 className="text-xs font-bold text-gray-400 uppercase px-3 py-2">หมวดหมู่</h4>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-bold transition-all mb-1 ${selectedCategory === cat.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                <div className={`p-1.5 rounded-lg mr-3 ${selectedCategory === cat.id ? 'bg-white text-indigo-600 shadow-sm' : 'bg-gray-100 text-gray-400'}`}>
                                    <cat.icon className="w-4 h-4" />
                                </div>
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Role Filter */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center">
                            <Briefcase className="w-3 h-3 mr-1" /> กรองตามตำแหน่ง
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {JOB_ROLES.map(role => (
                                <button
                                    key={role.id}
                                    onClick={() => setSelectedRoleFilter(role.id)}
                                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${selectedRoleFilter === role.id ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                                >
                                    {role.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="flex-1">
                    {/* Mobile Search & Filter */}
                    <div className="xl:hidden mb-4 flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="text" placeholder="ค้นหา..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        </div>
                        <select className="bg-white border border-gray-200 text-gray-600 text-sm font-bold rounded-xl px-3 outline-none" value={selectedRoleFilter} onChange={e => setSelectedRoleFilter(e.target.value)}>
                            {JOB_ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {filteredArticles.map(article => (
                            <div 
                                key={article.id} 
                                onClick={() => setViewingArticle(article)}
                                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-indigo-200 hover:-translate-y-1 transition-all cursor-pointer group flex flex-col overflow-hidden h-[320px]"
                            >
                                {/* Cover Image Area */}
                                <div className="h-32 bg-gray-100 relative overflow-hidden">
                                    {article.coverImage ? (
                                        <img src={article.coverImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center opacity-50">
                                            <Layout className="w-12 h-12 text-indigo-100" />
                                        </div>
                                    )}
                                    {article.isPinned && (
                                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-indigo-600 px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm flex items-center border border-white/50">
                                            <Pin className="w-3 h-3 mr-1 fill-indigo-600" /> Pinned
                                        </div>
                                    )}
                                    <div className="absolute bottom-3 left-3 flex gap-1">
                                        <span className="text-[10px] font-bold text-gray-700 bg-white/90 backdrop-blur px-2 py-0.5 rounded shadow-sm border border-gray-100">
                                            {CATEGORIES.find(c => c.id === article.category)?.label || article.category}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight mb-2">
                                        {article.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                                        {article.content}
                                    </p>
                                    
                                    <div className="pt-3 border-t border-gray-50 flex justify-between items-center text-xs text-gray-400 mt-auto">
                                        <div className="flex items-center">
                                            <Clock className="w-3.5 h-3.5 mr-1.5" />
                                            {format(article.lastUpdated, 'd MMM yy', { locale: th })}
                                        </div>
                                        {article.helpfulCount !== undefined && article.helpfulCount > 0 && (
                                            <div className="flex items-center text-pink-400 font-bold bg-pink-50 px-2 py-0.5 rounded-full">
                                                <Heart className="w-3 h-3 mr-1 fill-pink-400" /> {article.helpfulCount}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredArticles.length === 0 && (
                        <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-700">ไม่พบคู่มือที่ค้นหา</h3>
                            <p className="text-gray-400 text-sm">ลองเปลี่ยนคำค้นหา หรือหมวดหมู่ดูนะครับ</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- READER MODAL (Enhanced) --- */}
            {viewingArticle && (
                <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-5xl h-[95vh] sm:h-[90vh] sm:rounded-[2rem] rounded-t-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 relative">
                        
                        {/* Header Image */}
                        <div className="h-48 sm:h-64 bg-gray-100 relative shrink-0">
                            {viewingArticle.coverImage ? (
                                <img src={viewingArticle.coverImage} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center">
                                    <Layout className="w-20 h-20 text-indigo-200/50" />
                                </div>
                            )}
                            <button onClick={() => setViewingArticle(null)} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content Body */}
                        <div className="flex flex-1 overflow-hidden">
                            {/* Main Text */}
                            <div className="flex-1 overflow-y-auto p-6 sm:p-10 scrollbar-thin scrollbar-thumb-gray-200">
                                <div className="max-w-3xl mx-auto">
                                    {/* Meta Header */}
                                    <div className="mb-8 border-b border-gray-100 pb-6">
                                        <div className="flex gap-2 mb-4">
                                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 uppercase tracking-wide">
                                                {CATEGORIES.find(c => c.id === viewingArticle.category)?.label}
                                            </span>
                                            {viewingArticle.isPinned && (
                                                <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded border border-yellow-100 flex items-center">
                                                    <Pin className="w-3 h-3 mr-1 fill-yellow-600" /> Pinned
                                                </span>
                                            )}
                                        </div>
                                        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-4">{viewingArticle.title}</h1>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <div className="flex items-center">
                                                <Clock className="w-4 h-4 mr-1.5" /> 
                                                Last updated {format(viewingArticle.lastUpdated, 'd MMM yyyy')}
                                            </div>
                                            <div className="flex items-center">
                                                <Users className="w-4 h-4 mr-1.5" />
                                                For: {viewingArticle.targetRoles?.join(', ') || 'Everyone'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Markdown Content */}
                                    <div className="prose prose-indigo max-w-none prose-img:rounded-xl prose-headings:font-black">
                                        <SimpleMarkdown content={viewingArticle.content} />
                                    </div>

                                    {/* Footer Interaction */}
                                    <div className="mt-12 pt-8 border-t border-gray-100 flex justify-between items-center">
                                        <button 
                                            onClick={() => toggleHelpful(viewingArticle.id)}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 hover:bg-pink-50 text-gray-600 hover:text-pink-500 transition-colors font-bold border border-gray-200 hover:border-pink-200 group"
                                        >
                                            <Heart className="w-5 h-5 group-hover:fill-pink-500 transition-colors" /> 
                                            เป็นประโยชน์ ({viewingArticle.helpfulCount || 0})
                                        </button>
                                        
                                        {isAdmin && (
                                            <div className="flex gap-2">
                                                <button onClick={() => handleDelete(viewingArticle.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-5 h-5" /></button>
                                                <button onClick={() => handleEdit(viewingArticle)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit3 className="w-5 h-5" /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* TOC Sidebar (Desktop Only) */}
                            <div className="hidden xl:block w-72 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
                                <TableOfContents content={viewingArticle.content} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- EDITOR MODAL (Admin) --- */}
            {isEditing && (
                <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
                        
                        {/* Editor Toolbar */}
                        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-gray-800 flex items-center">
                                {editForm.id ? <Edit3 className="w-5 h-5 mr-2 text-indigo-600" /> : <Plus className="w-5 h-5 mr-2 text-indigo-600" />}
                                {editForm.id ? 'แก้ไขบทความ' : 'เขียนบทความใหม่'}
                            </h3>
                            <div className="flex gap-2">
                                <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-200 rounded-lg transition-colors">ยกเลิก</button>
                                <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition-all flex items-center">
                                    <Save className="w-4 h-4 mr-2" /> บันทึก
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 flex overflow-hidden">
                            {/* Inputs */}
                            <div className="flex-1 p-6 overflow-y-auto space-y-6">
                                {/* Title & Cover */}
                                <div className="space-y-4">
                                    <input 
                                        type="text" 
                                        placeholder="หัวข้อบทความ (Title)" 
                                        className="w-full text-2xl font-black text-gray-900 placeholder:text-gray-300 border-none outline-none focus:ring-0 px-0"
                                        value={editForm.title}
                                        onChange={e => setEditForm({...editForm, title: e.target.value})}
                                    />
                                    <div className="flex gap-4">
                                        <input 
                                            type="text" 
                                            placeholder="URL รูปปก (Cover Image Link)..." 
                                            className="flex-1 p-2 bg-gray-50 rounded-lg border border-gray-200 text-sm outline-none focus:border-indigo-500"
                                            value={editForm.coverImage || ''}
                                            onChange={e => setEditForm({...editForm, coverImage: e.target.value})}
                                        />
                                        <select 
                                            className="p-2 bg-gray-50 rounded-lg border border-gray-200 text-sm font-bold outline-none cursor-pointer"
                                            value={editForm.category}
                                            onChange={e => setEditForm({...editForm, category: e.target.value as any})}
                                        >
                                            {CATEGORIES.filter(c => c.id !== 'ALL').map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center cursor-pointer text-sm font-bold text-gray-600">
                                            <input type="checkbox" className="mr-2 rounded text-indigo-600 focus:ring-indigo-500" checked={editForm.isPinned} onChange={e => setEditForm({...editForm, isPinned: e.target.checked})} />
                                            ปักหมุด (Pin this)
                                        </label>
                                    </div>
                                </div>

                                {/* Toolbar Hint */}
                                <div className="flex gap-2 p-2 bg-gray-100 rounded-lg text-xs text-gray-500 font-medium">
                                    <span className="flex items-center"><Hash className="w-3 h-3 mr-1" /> # Header</span>
                                    <span className="flex items-center"><List className="w-3 h-3 mr-1" /> - List</span>
                                    <span className="flex items-center"><ImageIcon className="w-3 h-3 mr-1" /> ![Alt](URL) Image</span>
                                    <span className="flex items-center">**Bold**</span>
                                </div>

                                <textarea 
                                    className="w-full h-[500px] resize-none border-none outline-none text-gray-700 leading-relaxed font-mono text-sm bg-transparent"
                                    placeholder="เขียนเนื้อหาที่นี่... (รองรับ Markdown พื้นฐาน)"
                                    value={editForm.content}
                                    onChange={e => setEditForm({...editForm, content: e.target.value})}
                                />
                            </div>

                            {/* Preview Pane (Desktop) */}
                            <div className="hidden lg:block w-1/2 border-l border-gray-200 bg-gray-50 p-8 overflow-y-auto">
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">Live Preview</h4>
                                <div className="prose prose-sm max-w-none bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h1 className="text-2xl font-black mb-4">{editForm.title || 'Untitled'}</h1>
                                    {editForm.coverImage && <img src={editForm.coverImage} className="w-full h-40 object-cover rounded-lg mb-4" />}
                                    <SimpleMarkdown content={editForm.content || ''} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WikiView;
