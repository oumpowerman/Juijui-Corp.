
import React, { useState } from 'react';
import { WikiArticle, User } from '../types';
import { useWiki } from '../hooks/useWiki';
import { Book, Search, Plus, Edit3, Trash2, Pin, FileText, ChevronRight, X, Save, Clock, Info, Briefcase, Users, Check } from 'lucide-react';
import { format } from 'date-fns';
import MentorTip from './MentorTip';

interface WikiViewProps {
    currentUser: User;
}

const CATEGORIES = [
    { id: 'ALL', label: 'ทั้งหมด (Categories)', icon: Book },
    { id: 'ONBOARDING', label: 'รับน้องใหม่ (Onboarding)', icon: Info },
    { id: 'RULES', label: 'กฎ & Workflow', icon: FileText },
    { id: 'TOOLS', label: 'เครื่องมือ & เทคนิค', icon: Save },
    { id: 'GENERAL', label: 'ทั่วไป', icon: Book },
];

const JOB_ROLES = [
    { id: 'ALL', label: 'ทุกคน (Everyone)' },
    { id: 'CREATIVE', label: 'Creative' },
    { id: 'EDITOR', label: 'Editor' },
    { id: 'PRODUCTION', label: 'Production' },
    { id: 'ADMIN', label: 'Admin / Co-ord' },
];

const WikiView: React.FC<WikiViewProps> = ({ currentUser }) => {
    const { articles, addArticle, updateArticle, deleteArticle } = useWiki();
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL'); // New Filter
    const [searchQuery, setSearchQuery] = useState('');
    const [viewingArticle, setViewingArticle] = useState<WikiArticle | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [editForm, setEditForm] = useState<Partial<WikiArticle>>({});

    const isAdmin = currentUser.role === 'ADMIN';

    const filteredArticles = articles.filter(a => {
        // 1. Category Filter
        const matchCat = selectedCategory === 'ALL' || a.category === selectedCategory;
        
        // 2. Role Filter (Does the article target this role OR is it for everyone?)
        const articleRoles = a.targetRoles || ['ALL'];
        const matchRole = selectedRoleFilter === 'ALL' 
            ? true // Show everything if filtering by ALL
            : articleRoles.includes('ALL') || articleRoles.includes(selectedRoleFilter);

        // 3. Search Filter
        const matchSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            a.content.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchCat && matchRole && matchSearch;
    }).sort((a, b) => (Number(b.isPinned) - Number(a.isPinned))); // Pinned first

    const handleCreate = () => {
        setEditForm({
            title: '',
            category: 'GENERAL',
            content: '',
            targetRoles: ['ALL'], // Default to everyone
            isPinned: false
        });
        setViewingArticle(null);
        setIsEditing(true);
    };

    const handleEdit = (article: WikiArticle) => {
        setEditForm({ ...article });
        setViewingArticle(null); // Close reader to open editor
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

        if (editForm.id) {
            updateArticle(editForm.id, payload);
        } else {
            addArticle(payload);
        }
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
            
            // Logic: 'ALL' is exclusive
            if (role === 'ALL') {
                return { ...prev, targetRoles: ['ALL'] };
            } else {
                // If selecting specific role, remove 'ALL' first
                let newRoles = currentRoles.filter(r => r !== 'ALL');
                
                if (newRoles.includes(role)) {
                    newRoles = newRoles.filter(r => r !== role);
                } else {
                    newRoles.push(role);
                }
                
                // If nothing selected, default back to ALL? Or strictly enforce selection. Let's enforce non-empty later.
                if (newRoles.length === 0) newRoles = ['ALL'];
                
                return { ...prev, targetRoles: newRoles };
            }
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <MentorTip variant="blue" messages={[
                "คู่มือบริษัท (Wiki) คือแหล่งรวมข้อมูลสำคัญ น้องใหม่เข้ามาให้อ่านหน้านี้ก่อนเลย!",
                "เลือก Filter ตามตำแหน่ง (Role) เพื่อดูเฉพาะข้อมูลที่เกี่ยวข้องกับงานเราได้นะ"
            ]} />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                        📚 คู่มือบริษัท (Company Wiki)
                    </h1>
                    <p className="text-gray-500 mt-1">
                        ศูนย์รวมข้อมูล วิธีการทำงาน เจาะจงตามตำแหน่ง
                    </p>
                </div>
                {isAdmin && (
                    <button 
                        onClick={handleCreate}
                        className="flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5 mr-2" /> เขียนคู่มือใหม่
                    </button>
                )}
            </div>

            {/* Navigation & Search */}
            <div className="flex flex-col xl:flex-row gap-6">
                
                {/* Sidebar (Categories & Roles) */}
                <div className="w-full xl:w-64 flex-shrink-0 space-y-6">
                    {/* Category Filter */}
                    <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-bold transition-all ${selectedCategory === cat.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                <cat.icon className={`w-4 h-4 mr-3 ${selectedCategory === cat.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Role Filter */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center">
                            <Briefcase className="w-3 h-3 mr-1" /> แยกตามตำแหน่ง
                        </h3>
                        <div className="space-y-1">
                            {JOB_ROLES.map(role => (
                                <button
                                    key={role.id}
                                    onClick={() => setSelectedRoleFilter(role.id)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${selectedRoleFilter === role.id ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'text-gray-600 hover:bg-gray-50 border border-transparent'}`}
                                >
                                    <span>{role.label}</span>
                                    {selectedRoleFilter === role.id && <Check className="w-3 h-3" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 space-y-6">
                    
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="ค้นหาคู่มือ..." 
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm shadow-sm"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Article Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredArticles.map(article => (
                            <div 
                                key={article.id} 
                                onClick={() => setViewingArticle(article)}
                                className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group relative overflow-hidden"
                            >
                                {article.isPinned && (
                                    <div className="absolute top-0 right-0 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-bl-xl text-[10px] font-bold flex items-center">
                                        <Pin className="w-3 h-3 mr-1 fill-indigo-600" /> Pinned
                                    </div>
                                )}
                                
                                <div className="mb-3 flex flex-wrap gap-2">
                                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded uppercase tracking-wide border border-gray-200">
                                        {article.category}
                                    </span>
                                    {/* Role Badges */}
                                    {article.targetRoles?.includes('ALL') ? (
                                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100 flex items-center">
                                            <Users className="w-3 h-3 mr-1" /> Everyone
                                        </span>
                                    ) : (
                                        article.targetRoles?.map(role => (
                                            <span key={role} className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 flex items-center">
                                                <Briefcase className="w-3 h-3 mr-1" /> {role}
                                            </span>
                                        ))
                                    )}
                                </div>

                                <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2">
                                    {article.title}
                                </h3>
                                <p className="text-sm text-gray-500 line-clamp-3 mb-4 h-[60px]">
                                    {article.content}
                                </p>
                                <div className="flex justify-between items-center pt-3 border-t border-gray-50 text-xs text-gray-400">
                                    <div className="flex items-center">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {format(article.lastUpdated, 'd MMM yyyy')}
                                    </div>
                                    <div className="flex items-center text-indigo-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                        อ่านต่อ <ChevronRight className="w-4 h-4 ml-1" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredArticles.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                            <Book className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-400">ไม่พบคู่มือที่ค้นหาในหมวดนี้</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- Reader Modal --- */}
            {viewingArticle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                            <div className="pr-8">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                        {viewingArticle.category}
                                    </span>
                                    {viewingArticle.isPinned && <Pin className="w-3 h-3 text-indigo-500 fill-indigo-500" />}
                                    
                                    {/* Roles in Reader */}
                                    {viewingArticle.targetRoles?.includes('ALL') ? (
                                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                                            For Everyone
                                        </span>
                                    ) : (
                                        viewingArticle.targetRoles?.map(role => (
                                            <span key={role} className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                                                For {role}
                                            </span>
                                        ))
                                    )}
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 leading-tight">{viewingArticle.title}</h2>
                            </div>
                            <button onClick={() => setViewingArticle(null)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-8 overflow-y-auto flex-1 prose prose-indigo max-w-none">
                            {/* Render text with line breaks */}
                            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {viewingArticle.content}
                            </div>
                        </div>

                        {isAdmin && (
                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                                <button 
                                    onClick={() => handleDelete(viewingArticle.id)}
                                    className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-bold transition-colors flex items-center"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" /> ลบ
                                </button>
                                <button 
                                    onClick={() => handleEdit(viewingArticle)}
                                    className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-bold transition-colors flex items-center shadow-sm"
                                >
                                    <Edit3 className="w-4 h-4 mr-2" /> แก้ไข
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- Editor Modal (Admin) --- */}
            {isEditing && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh] animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-gray-100 bg-indigo-600 text-white flex justify-between items-center">
                            <h3 className="font-bold text-lg flex items-center">
                                {editForm.id ? <Edit3 className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                                {editForm.id ? 'แก้ไขคู่มือ' : 'เขียนคู่มือใหม่'}
                            </h3>
                            <button onClick={() => setIsEditing(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">หัวข้อ (Title)</label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-bold"
                                    placeholder="ใส่ชื่อเรื่อง..."
                                    value={editForm.title}
                                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                                />
                            </div>

                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">หมวดหมู่ (Category)</label>
                                    <select 
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={editForm.category}
                                        onChange={e => setEditForm({...editForm, category: e.target.value as any})}
                                    >
                                        {CATEGORIES.filter(c => c.id !== 'ALL').map(c => (
                                            <option key={c.id} value={c.id}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-end pb-2">
                                    <label className="flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 mr-2"
                                            checked={editForm.isPinned}
                                            onChange={e => setEditForm({...editForm, isPinned: e.target.checked})}
                                        />
                                        <span className="text-sm font-bold text-gray-700">ปักหมุด (Pin)</span>
                                    </label>
                                </div>
                            </div>

                            {/* Target Role Selector */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                                    <Briefcase className="w-4 h-4 mr-1" /> เนื้อหานี้สำหรับใคร? (Target Role)
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {JOB_ROLES.map(role => {
                                        const isSelected = editForm.targetRoles?.includes(role.id);
                                        return (
                                            <button
                                                key={role.id}
                                                onClick={() => toggleEditRole(role.id)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center ${
                                                    isSelected 
                                                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm' 
                                                        : 'bg-white text-gray-600 border-gray-300 hover:border-purple-300'
                                                }`}
                                            >
                                                {isSelected && <Check className="w-3 h-3 mr-1" />}
                                                {role.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col">
                                <label className="block text-sm font-bold text-gray-700 mb-1">เนื้อหา (Content)</label>
                                <textarea 
                                    className="flex-1 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none min-h-[300px] resize-none"
                                    placeholder="เขียนรายละเอียดที่นี่..."
                                    value={editForm.content}
                                    onChange={e => setEditForm({...editForm, content: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button 
                                onClick={() => setIsEditing(false)}
                                className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button 
                                onClick={handleSave}
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center"
                            >
                                <Save className="w-5 h-5 mr-2" /> บันทึก
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WikiView;
