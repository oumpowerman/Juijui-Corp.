
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Script, ScriptSummary, User, ScriptType } from '../types';
import { useToast } from '../context/ToastContext';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import { GoogleGenerativeAI } from "@google/generative-ai";

interface FetchScriptsOptions {
    page: number;
    pageSize: number;
    searchQuery?: string;
    viewTab?: 'QUEUE' | 'LIBRARY' | 'HISTORY';
    filterOwner?: string;
    filterChannel?: string;
    filterCategory?: string;
    filterStatus?: string;
}

export const useScripts = (currentUser: User) => {
    const [scripts, setScripts] = useState<ScriptSummary[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();

    // Helper to map DB result to ScriptSummary object
    const mapScriptSummary = (s: any): ScriptSummary => ({
        id: s.id,
        title: s.title,
        status: s.status,
        version: s.version,
        authorId: s.author_id,
        contentId: s.content_id,
        createdAt: new Date(s.created_at),
        updatedAt: new Date(s.updated_at),
        author: s.author ? { name: s.author.full_name, avatarUrl: s.author.avatar_url } : undefined,
        ideaOwnerId: s.idea_owner_id,
        ideaOwner: s.idea_owner ? { name: s.idea_owner.full_name, avatarUrl: s.idea_owner.avatar_url } : undefined,
        linkedTaskTitle: s.contents?.title,
        estimatedDuration: s.estimated_duration || 0,
        scriptType: (s.script_type as ScriptType) || 'MONOLOGUE',
        isInShootQueue: s.is_in_shoot_queue || false,
        channelId: s.channel_id,
        category: s.category,
        tags: s.tags || [],
        objective: s.objective,
        lockedBy: s.locked_by,
        lockedAt: s.locked_at ? new Date(s.locked_at) : undefined,
        locker: s.locker ? { name: s.locker.full_name, avatarUrl: s.locker.avatar_url } : undefined
    });

    const fetchScripts = useCallback(async (options: FetchScriptsOptions) => {
        setIsLoading(true);
        try {
            // OPTIMIZATION: Select specific columns excluding 'content'
            let query = supabase
                .from('scripts')
                .select(`
                    id, title, status, version, author_id, content_id, created_at, updated_at, 
                    estimated_duration, script_type, is_in_shoot_queue, channel_id, category, tags, objective,
                    idea_owner_id, locked_by, locked_at,
                    author:profiles!scripts_author_id_fkey(full_name, avatar_url),
                    idea_owner:profiles!scripts_idea_owner_id_fkey(full_name, avatar_url),
                    locker:profiles!scripts_locked_by_fkey(full_name, avatar_url),
                    contents (title)
                `, { count: 'exact' });

            // 1. Tab Filter
            if (options.viewTab === 'QUEUE') {
                query = query.eq('is_in_shoot_queue', true);
            } else if (options.viewTab === 'HISTORY') {
                query = query.eq('status', 'DONE');
            } else {
                // LIBRARY: Active scripts not in queue and not done
                query = query.eq('is_in_shoot_queue', false).neq('status', 'DONE');
            }

            // 2. Specific Filters
            if (options.filterOwner && options.filterOwner !== 'ALL') {
                query = query.or(`author_id.eq.${options.filterOwner},idea_owner_id.eq.${options.filterOwner}`);
            }
            if (options.filterChannel && options.filterChannel !== 'ALL') {
                query = query.eq('channel_id', options.filterChannel);
            }
            if (options.filterCategory && options.filterCategory !== 'ALL') {
                query = query.eq('category', options.filterCategory);
            }
            if (options.filterStatus && options.filterStatus !== 'ALL') {
                query = query.eq('status', options.filterStatus);
            }

            // 3. Search (Server-side)
            if (options.searchQuery) {
                query = query.or(`title.ilike.%${options.searchQuery}%,tags.cs.{${options.searchQuery}}`);
            }

            // 4. Sorting & Pagination
            query = query
                .order('is_in_shoot_queue', { ascending: false })
                .order('updated_at', { ascending: false })
                .range((options.page - 1) * options.pageSize, options.page * options.pageSize - 1);

            const { data, error, count } = await query;

            if (error) throw error;

            if (data) {
                setScripts(data.map(mapScriptSummary));
                setTotalCount(count || 0);
            }
        } catch (err: any) {
            console.error('Fetch scripts failed:', err);
            showToast('โหลดข้อมูลไม่สำเร็จ', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    // Fetch FULL script content by ID
    const getScriptById = async (id: string): Promise<Script | null> => {
        try {
            const { data, error } = await supabase
                .from('scripts')
                .select(`
                    *,
                    author:profiles!scripts_author_id_fkey(full_name, avatar_url),
                    idea_owner:profiles!scripts_idea_owner_id_fkey(full_name, avatar_url),
                    locker:profiles!scripts_locked_by_fkey(full_name, avatar_url),
                    contents (title)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!data) return null;

            return {
                ...mapScriptSummary(data),
                content: data.content || '',
                characters: data.characters || []
            };
        } catch (err) {
            console.error('Fetch script detail failed', err);
            return null;
        }
    };

    // Create Script
    const createScript = async (scriptData: Partial<Script>) => {
        try {
            const payload = {
                title: scriptData.title,
                content: scriptData.content || '',
                status: 'DRAFT',
                version: 1,
                author_id: currentUser.id,
                idea_owner_id: currentUser.id,
                content_id: scriptData.contentId || null,
                script_type: scriptData.scriptType || 'MONOLOGUE',
                channel_id: scriptData.channelId || null,
                category: scriptData.category || null,
                tags: scriptData.tags || [],
                objective: scriptData.objective || '',
                is_in_shoot_queue: false
            };

            const { data, error } = await supabase.from('scripts').insert(payload).select().single();
            if (error) throw error;
            setTotalCount(prev => prev + 1);
            
            showToast('สร้างสคริปต์ใหม่เรียบร้อย', 'success');
            return data.id;
        } catch (err: any) {
            console.error(err);
            showToast('สร้างไม่สำเร็จ: ' + err.message, 'error');
            return null;
        }
    };

    const updateScript = async (id: string, updates: Partial<Script>) => {
        try {
            const payload: any = {
                updated_at: new Date().toISOString()
            };
            if (updates.title) payload.title = updates.title;
            if (updates.content) payload.content = updates.content;
            if (updates.status) payload.status = updates.status;
            if (updates.estimatedDuration) payload.estimated_duration = updates.estimatedDuration;
            if (updates.scriptType) payload.script_type = updates.scriptType;
            if (updates.characters) payload.characters = updates.characters;
            if (updates.ideaOwnerId) payload.idea_owner_id = updates.ideaOwnerId;
            if (updates.isInShootQueue !== undefined) payload.is_in_shoot_queue = updates.isInShootQueue;

            const { error } = await supabase.from('scripts').update(payload).eq('id', id);
            if (error) throw error;

            // Optimistic update for list view
            setScripts(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
        } catch (err) {
            console.error('Update script failed', err);
        }
    };

    const deleteScript = async (id: string) => {
        if (!await showConfirm('ยืนยันการลบสคริปต์?')) return;
        try {
            const { error } = await supabase.from('scripts').delete().eq('id', id);
            if (error) throw error;
            setScripts(prev => prev.filter(s => s.id !== id));
            showToast('ลบสคริปต์แล้ว', 'info');
            setTotalCount(prev => prev - 1);
        } catch (err: any) {
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const toggleShootQueue = async (id: string, currentStatus: boolean) => {
        try {
            await updateScript(id, { isInShootQueue: !currentStatus });
            showToast(
                !currentStatus ? 'เพิ่มเข้าคิวถ่ายทำแล้ว 🎬' : 'เอาออกจากคิวแล้ว', 
                !currentStatus ? 'success' : 'info'
            );
            // Refresh logic will be handled by UI triggering fetch or optimistic update in updateScript
        } catch (err) {
            console.error(err);
        }
    };

    const generateScriptWithAI = async (prompt: string, type: 'HOOK' | 'OUTLINE' | 'FULL') => {
        try {
            if (typeof process === 'undefined' || !process.env.API_KEY) {
                showToast('API Key ไม่ถูกต้อง', 'error');
                return null;
            }

            const genAI = new GoogleGenerativeAI(process.env.API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            let finalPrompt = '';
            if (type === 'HOOK') {
                finalPrompt = `ช่วยคิด Hook ให้น่าสนใจ 3 แบบ สำหรับคลิปหัวข้อ: "${prompt}" (ขอสั้นๆ กระชับ ไม่เกิน 2 บรรทัดต่อแบบ)`;
            } else if (type === 'OUTLINE') {
                finalPrompt = `ช่วยวางโครงเรื่อง (Outline) สำหรับคลิปหัวข้อ: "${prompt}" โดยแบ่งเป็น Hook, Body (3 points), Conclusion/CTA`;
            } else {
                finalPrompt = `เขียนบทสคริปต์เต็มรูปแบบ สำหรับหัวข้อ: "${prompt}" โดยขอภาษาที่เป็นกันเอง เข้าใจง่าย เหมาะสำหรับ TikTok/Reels`;
            }

            const result = await model.generateContent(finalPrompt);
            const response = await result.response;
            return response.text();

        } catch (err: any) {
            console.error("AI Error:", err);
            showToast('AI Error: ' + err.message, 'error');
            return null;
        }
    };

    return {
        scripts,
        totalCount,
        isLoading,
        fetchScripts,
        getScriptById,
        createScript,
        updateScript,
        deleteScript,
        toggleShootQueue,
        generateScriptWithAI
    };
};
