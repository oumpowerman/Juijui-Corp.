
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { WikiArticle, User } from '../types';
import { useToast } from '../context/ToastContext';

export const useWiki = (currentUser?: User) => {
    const [articles, setArticles] = useState<WikiArticle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    const fetchArticles = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('wiki_articles')
                .select(`
                    *,
                    author:profiles!wiki_articles_created_by_fkey(full_name, avatar_url),
                    lastEditor:profiles!wiki_articles_updated_by_fkey(full_name, avatar_url)
                `)
                .order('is_pinned', { ascending: false })
                .order('updated_at', { ascending: false });

            if (error) throw error;

            if (data) {
                setArticles(data.map((a: any) => ({
                    id: a.id,
                    title: a.title,
                    category: a.category,
                    content: a.content,
                    targetRoles: a.target_roles || ['ALL'],
                    createdAt: new Date(a.created_at),
                    lastUpdated: new Date(a.updated_at),
                    isPinned: a.is_pinned,
                    coverImage: a.cover_image,
                    helpfulCount: a.helpful_count || 0,
                    createdBy: a.created_by,
                    updatedBy: a.updated_by,
                    author: a.author ? { name: a.author.full_name, avatarUrl: a.author.avatar_url } : undefined,
                    lastEditor: a.lastEditor ? { name: a.lastEditor.full_name, avatarUrl: a.lastEditor.avatar_url } : undefined,
                })));
            }
        } catch (err: any) {
            console.error('Fetch wiki failed:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Realtime Subscription
    useEffect(() => {
        fetchArticles();

        const channel = supabase
            .channel('realtime-wiki')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'wiki_articles' }, () => fetchArticles())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const addArticle = async (article: Omit<WikiArticle, 'id' | 'lastUpdated' | 'helpfulCount' | 'createdAt' | 'author' | 'lastEditor'>) => {
        if (!currentUser) return;
        try {
            const payload = {
                title: article.title,
                content: article.content,
                category: article.category,
                target_roles: article.targetRoles,
                is_pinned: article.isPinned,
                cover_image: article.coverImage,
                created_by: currentUser.id,
                updated_by: currentUser.id
            };

            const { error } = await supabase.from('wiki_articles').insert(payload);
            if (error) throw error;
            
            showToast('สร้างคู่มือใหม่เรียบร้อย 🎉', 'success');
        } catch (err: any) {
            console.error(err);
            showToast('สร้างไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const updateArticle = async (id: string, updates: Partial<WikiArticle>) => {
        if (!currentUser) return;
        try {
            const payload: any = {
                updated_at: new Date().toISOString(),
                updated_by: currentUser.id
            };
            if (updates.title) payload.title = updates.title;
            if (updates.content) payload.content = updates.content;
            if (updates.category) payload.category = updates.category;
            if (updates.targetRoles) payload.target_roles = updates.targetRoles;
            if (updates.isPinned !== undefined) payload.is_pinned = updates.isPinned;
            if (updates.coverImage !== undefined) payload.cover_image = updates.coverImage;
            if (updates.helpfulCount !== undefined) payload.helpful_count = updates.helpfulCount;

            const { error } = await supabase.from('wiki_articles').update(payload).eq('id', id);
            if (error) throw error;

            showToast('อัปเดตคู่มือเรียบร้อย ✅', 'success');
        } catch (err: any) {
            showToast('อัปเดตไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const deleteArticle = async (id: string) => {
        try {
            const { error } = await supabase.from('wiki_articles').delete().eq('id', id);
            if (error) throw error;
            showToast('ลบคู่มือแล้ว 🗑️', 'info');
        } catch (err: any) {
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const toggleHelpful = async (id: string) => {
        try {
            const article = articles.find(a => a.id === id);
            if (article) {
                const newCount = (article.helpfulCount || 0) + 1;
                await supabase.from('wiki_articles').update({ helpful_count: newCount }).eq('id', id);
                showToast('ขอบคุณที่กดถูกใจครับ ❤️', 'success');
            }
        } catch (err) {
            console.error(err);
        }
    };

    return {
        articles,
        isLoading,
        addArticle,
        updateArticle,
        deleteArticle,
        toggleHelpful
    };
};
