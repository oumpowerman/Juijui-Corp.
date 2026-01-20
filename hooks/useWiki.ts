
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { WikiArticle } from '../types';
import { useToast } from '../context/ToastContext';

export const useWiki = () => {
    const [articles, setArticles] = useState<WikiArticle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    const fetchArticles = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('wiki_articles')
                .select('*')
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
                    lastUpdated: new Date(a.updated_at),
                    isPinned: a.is_pinned
                })));
            }
        } catch (err: any) {
            console.error('Fetch wiki failed:', err);
            // showToast('โหลดคู่มือไม่สำเร็จ', 'error');
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

    const addArticle = async (article: Omit<WikiArticle, 'id' | 'lastUpdated'>) => {
        try {
            const payload = {
                title: article.title,
                content: article.content,
                category: article.category,
                target_roles: article.targetRoles,
                is_pinned: article.isPinned
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
        try {
            const payload: any = {
                updated_at: new Date().toISOString()
            };
            if (updates.title) payload.title = updates.title;
            if (updates.content) payload.content = updates.content;
            if (updates.category) payload.category = updates.category;
            if (updates.targetRoles) payload.target_roles = updates.targetRoles;
            if (updates.isPinned !== undefined) payload.is_pinned = updates.isPinned;

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

    return {
        articles,
        isLoading,
        addArticle,
        updateArticle,
        deleteArticle
    };
};
