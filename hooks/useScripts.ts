
import { useCallback, useEffect, useState, useRef } from 'react';
import { useQuery, useQueryClient, useMutation, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Script, ScriptSummary, User, ScriptType } from '../types';
import { useToast } from '../context/ToastContext';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import { GoogleGenAI } from "@google/genai";

export interface FetchScriptsOptions {
    page?: number;
    pageSize?: number;
    searchQuery?: string;
    viewTab?: 'QUEUE' | 'LIBRARY' | 'HISTORY';
    filterOwner?: string[];
    filterChannel?: string[];
    filterCategory?: string;
    filterTags?: string[];
    filterStatus?: string[];
    sortOrder?: 'ASC' | 'DESC';
    isDeepSearch?: boolean;
    isPersonal?: boolean;
    append?: boolean;
}

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
    locker: s.locker ? { name: s.locker.full_name, avatarUrl: s.locker.avatar_url } : undefined,
    shareToken: s.share_token,
    isPublic: s.is_public,
    isPersonal: s.is_personal
});

// --- API Functions ---

const fetchScriptsApi = async (currentUser: User, options: FetchScriptsOptions) => {
    let query = supabase
        .from('scripts')
        .select(`
            id, title, status, version, author_id, content_id, created_at, updated_at, 
            estimated_duration, script_type, is_in_shoot_queue, channel_id, category, tags, objective,
            idea_owner_id, locked_by, locked_at, share_token, is_public, is_personal,
            author:profiles!scripts_author_id_fkey(full_name, avatar_url),
            idea_owner:profiles!scripts_idea_owner_id_fkey(full_name, avatar_url),
            locker:profiles!scripts_locked_by_fkey(full_name, avatar_url),
            contents (title)
        `, { count: 'exact' });

    if (options.isPersonal !== undefined) {
        query = query.eq('is_personal', options.isPersonal);
        if (options.isPersonal) {
            query = query.or(`author_id.eq.${currentUser.id},idea_owner_id.eq.${currentUser.id}`);
        }
    }

    if (options.viewTab === 'QUEUE') {
        query = query.eq('is_in_shoot_queue', true);
    } else if (options.viewTab === 'HISTORY') {
        query = query.eq('status', 'DONE');
    } else if (options.viewTab === 'LIBRARY') {
        query = query.eq('is_in_shoot_queue', false).neq('status', 'DONE');
    }

    if (options.filterOwner && options.filterOwner.length > 0) {
        query = query.in('author_id', options.filterOwner);
    }

    if (options.filterChannel && options.filterChannel.length > 0) {
        query = query.in('channel_id', options.filterChannel);
    }

    if (options.filterCategory && options.filterCategory !== 'ALL') {
        query = query.eq('category', options.filterCategory);
    }
    
    if (options.filterStatus && options.filterStatus.length > 0 && !options.filterStatus.includes('ALL')) {
        query = query.in('status', options.filterStatus);
    }

    if (options.filterTags && options.filterTags.length > 0) {
        query = query.contains('tags', options.filterTags);
    }

    if (options.searchQuery) {
        if (options.isDeepSearch) {
            query = query.or(`title.ilike.%${options.searchQuery}%,tags.cs.{${options.searchQuery}},content.ilike.%${options.searchQuery}%,sheets_text.ilike.%${options.searchQuery}%`);
        } else {
            query = query.or(`title.ilike.%${options.searchQuery}%,tags.cs.{${options.searchQuery}}`);
        }
    }

    const isAscending = options.sortOrder === 'ASC';
    if (options.viewTab !== 'QUEUE') {
         query = query.order('updated_at', { ascending: isAscending });
    } else {
         query = query.order('is_in_shoot_queue', { ascending: false });
         query = query.order('updated_at', { ascending: isAscending });
    }

    if (options.page && options.pageSize) {
        query = query.range((options.page - 1) * options.pageSize, options.page * options.pageSize - 1);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return {
        scripts: (data || []).map(mapScriptSummary),
        totalCount: count || 0
    };
};

// --- HOOKS ---

export const useScriptRealtime = () => {
    const queryClient = useQueryClient();
    useEffect(() => {
        const channel = supabase
            .channel('realtime-scripts-global')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'scripts' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['scripts'] });
                    queryClient.invalidateQueries({ queryKey: ['script_stats'] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);
};

export const useScriptMutations = (currentUser: User) => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();

    const createScript = async (scriptData: Partial<Script>) => {
        try {
            const payload = {
                title: scriptData.title,
                content: scriptData.content || '',
                status: 'DRAFT',
                version: 1,
                author_id: scriptData.authorId || currentUser.id,
                idea_owner_id: scriptData.ideaOwnerId || currentUser.id,
                content_id: scriptData.contentId || null,
                script_type: scriptData.scriptType || 'MONOLOGUE',
                channel_id: scriptData.channelId || null,
                category: scriptData.category || null,
                tags: scriptData.tags || [],
                objective: scriptData.objective || '',
                is_in_shoot_queue: false,
                is_personal: scriptData.isPersonal !== undefined ? scriptData.isPersonal : true
            };

            const { data, error } = await supabase.from('scripts').insert(payload).select().single();
            if (error) throw error;
            
            queryClient.invalidateQueries({ queryKey: ['scripts'] });
            queryClient.invalidateQueries({ queryKey: ['script_stats'] });
            showToast('สร้างสคริปต์ใหม่เรียบร้อย', 'success');
            return data.id;
        } catch (err: any) {
            console.error(err);
            showToast('สร้างไม่สำเร็จ: ' + err.message, 'error');
            return null;
        }
    };

    const updateScript = async (id: string, updates: Partial<Script>): Promise<boolean> => {
        try {
            const payload: any = {
                updated_at: new Date().toISOString()
            };
            
            if (updates.title !== undefined) payload.title = updates.title;
            if (updates.content !== undefined) payload.content = updates.content;
            if (updates.status !== undefined) payload.status = updates.status;
            if (updates.estimatedDuration !== undefined) payload.estimated_duration = updates.estimatedDuration;
            if (updates.scriptType !== undefined) payload.script_type = updates.scriptType;
            if (updates.characters !== undefined) payload.characters = updates.characters;
            if (updates.ideaOwnerId !== undefined) payload.idea_owner_id = updates.ideaOwnerId;
            if (updates.authorId !== undefined) payload.author_id = updates.authorId;
            if (updates.isInShootQueue !== undefined) payload.is_in_shoot_queue = updates.isInShootQueue;
            if (updates.isPublic !== undefined) payload.is_public = updates.isPublic;
            if (updates.shareToken !== undefined) payload.share_token = updates.shareToken;
            if (updates.isPersonal !== undefined) payload.is_personal = updates.isPersonal;
            if (updates.channelId !== undefined) payload.channel_id = updates.channelId;
            if (updates.category !== undefined) payload.category = updates.category;
            if (updates.tags !== undefined) payload.tags = updates.tags;
            if (updates.objective !== undefined) payload.objective = updates.objective;
            if (updates.contentId !== undefined) payload.content_id = updates.contentId;
            if (updates.sheets !== undefined) payload.sheets = updates.sheets;

            const { error } = await supabase
                .from('scripts')
                .update(payload)
                .eq('id', id);

            if (error) throw error;

            queryClient.invalidateQueries({ queryKey: ['scripts'] });
            queryClient.invalidateQueries({ queryKey: ['script', id] });
            queryClient.invalidateQueries({ queryKey: ['script_stats'] });

            return true;
        } catch (err) {
            console.error('Update script failed', err);
            return false;
        }
    };

    const promoteToContent = async (scriptId: string, contentData: any) => {
        try {
            const { data: newContent, error: contentError } = await supabase
                .from('contents')
                .insert(contentData)
                .select()
                .single();

            if (contentError) throw contentError;

            const { error: scriptError } = await supabase
                .from('scripts')
                .update({ 
                    content_id: newContent.id,
                    channel_id: newContent.channel_id,
                    category: newContent.category
                })
                .eq('id', scriptId);

            if (scriptError) throw scriptError;

            queryClient.invalidateQueries({ queryKey: ['scripts'] });
            queryClient.invalidateQueries({ queryKey: ['script', scriptId] });
            
            showToast('ส่งเข้ากระบวนการผลิตเรียบร้อย! 🚀', 'success');
            return true;
        } catch (err: any) {
            console.error(err);
            showToast('Promote ไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const deleteScript = async (id: string) => {
        if (!await showConfirm('ยืนยันการลบสคริปต์?')) return;
        try {
            const { error } = await supabase.from('scripts').delete().eq('id', id);
            if (error) throw error;
            
            queryClient.invalidateQueries({ queryKey: ['scripts'] });
            queryClient.invalidateQueries({ queryKey: ['script_stats'] });
            showToast('ลบสคริปต์แล้ว', 'info');
        } catch (err: any) {
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const toggleShootQueue = async (id: string, currentStatus: boolean): Promise<boolean> => {
        try {
            const success = await updateScript(id, { isInShootQueue: !currentStatus });
            if (success) {
                showToast(
                    !currentStatus ? 'เพิ่มเข้าคิวถ่ายทำแล้ว 🎬' : 'เอาออกจากคิวแล้ว', 
                    !currentStatus ? 'success' : 'info'
                );
                return true;
            }
            return false;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    const generateScriptWithAI = async (prompt: string, type: 'HOOK' | 'OUTLINE' | 'FULL') => {
        try {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                showToast('API Key ไม่ถูกต้อง', 'error');
                return null;
            }

            const ai = new GoogleGenAI({ apiKey });

            let finalPrompt = '';
            if (type === 'HOOK') {
                finalPrompt = `ช่วยคิด Hook ให้น่าสนใจ 3 แบบ สำหรับคลิปหัวข้อ: "${prompt}" (ขอสั้นๆ กระชับ ไม่เกิน 2 บรรทัดต่อแบบ)`;
            } else if (type === 'OUTLINE') {
                finalPrompt = `ช่วยวางโครงเรื่อง (Outline) สำหรับคลิปหัวข้อ: "${prompt}" โดยแบ่งเป็น Hook, Body (3 points), Conclusion/CTA`;
            } else {
                finalPrompt = `เขียนบทสคริปต์เต็มรูปแบบ สำหรับหัวข้อ: "${prompt}" โดยขอภาษาที่เป็นกันเอง เข้าใจง่าย เหมาะสำหรับ TikTok/Reels`;
            }

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: finalPrompt,
            });

            return response.text;

        } catch (err: any) {
            console.error("AI Error:", err);
            showToast('AI Error: ' + err.message, 'error');
            return null;
        }
    };

    return {
        createScript,
        updateScript,
        promoteToContent,
        deleteScript,
        toggleShootQueue,
        generateScriptWithAI
    };
};

export const useScriptList = (currentUser: User, options: FetchScriptsOptions) => {
    useScriptRealtime();
    return useQuery({
        queryKey: ['scripts', options],
        queryFn: () => fetchScriptsApi(currentUser, options),
        enabled: !!currentUser,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
};

export const useInfiniteScripts = (currentUser: User, options: Omit<FetchScriptsOptions, 'page'>) => {
    return useInfiniteQuery({
        queryKey: ['scripts', 'infinite', options],
        queryFn: ({ pageParam = 1 }) => fetchScriptsApi(currentUser, { ...options, page: pageParam }),
        getNextPageParam: (lastPage, allPages) => {
            const totalFetched = allPages.flatMap(p => p.scripts).length;
            if (totalFetched < lastPage.totalCount) {
                return allPages.length + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
        enabled: !!currentUser,
        staleTime: 1000 * 60 * 2,
    });
};

export const useScript = (id: string | null) => {
    return useQuery({
        queryKey: ['script', id],
        queryFn: async () => {
            if (!id) return null;
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
                characters: data.characters || [],
                sheets: data.sheets || []
            } as Script;
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useScriptStats = (currentUser: User, options: Omit<FetchScriptsOptions, 'viewTab' | 'page' | 'pageSize' | 'sortOrder'>) => {
    useScriptRealtime();
    return useQuery({
        queryKey: ['script_stats', options],
        queryFn: async () => {
            const applyFilters = (query: any) => {
                let q = query;
                if (options.isPersonal !== undefined) {
                    q = q.eq('is_personal', options.isPersonal);
                    if (options.isPersonal && currentUser) {
                        q = q.or(`author_id.eq.${currentUser.id},idea_owner_id.eq.${currentUser.id}`);
                    }
                }
                if (options.filterOwner && options.filterOwner.length > 0) q = q.in('author_id', options.filterOwner);
                if (options.filterChannel && options.filterChannel.length > 0) q = q.in('channel_id', options.filterChannel);
                if (options.filterCategory && options.filterCategory !== 'ALL') q = q.eq('category', options.filterCategory);
                if (options.filterTags && options.filterTags.length > 0) q = q.contains('tags', options.filterTags);
                if (options.searchQuery) {
                    if (options.isDeepSearch) {
                        q = q.or(`title.ilike.%${options.searchQuery}%,content.ilike.%${options.searchQuery}%,tags.cs.{${options.searchQuery}},sheets_text.ilike.%${options.searchQuery}%`);
                    } else {
                        q = q.or(`title.ilike.%${options.searchQuery}%,tags.cs.{${options.searchQuery}}`);
                    }
                }
                return q;
            };

            const queueReq = applyFilters(supabase.from('scripts').select('id', { count: 'exact', head: true }).eq('is_in_shoot_queue', true));
            const historyReq = applyFilters(supabase.from('scripts').select('id', { count: 'exact', head: true }).eq('status', 'DONE'));
            const libraryReq = applyFilters(supabase.from('scripts').select('id', { count: 'exact', head: true }).eq('is_in_shoot_queue', false).neq('status', 'DONE'));
            const draftReq = applyFilters(supabase.from('scripts').select('id', { count: 'exact', head: true }).eq('is_in_shoot_queue', false).eq('status', 'DRAFT'));

            const [q, h, l, d] = await Promise.all([queueReq, historyReq, libraryReq, draftReq]);

            return {
                queue: q.count || 0,
                history: h.count || 0,
                library: l.count || 0,
                drafts: d.count || 0
            };
        },
        enabled: !!currentUser,
        staleTime: 1000 * 60 * 2,
    });
};

// --- Main Hook (Legacy/Facade) ---

export const useScripts = (currentUser: User, initialOptions?: FetchScriptsOptions) => {
    const queryClient = useQueryClient();
    const [options, setOptions] = useState<FetchScriptsOptions>(initialOptions || { page: 1, pageSize: 20 });
    const [allScripts, setAllScripts] = useState<ScriptSummary[]>([]);
    
    // Sync options if initialOptions changes (from parent state)
    useEffect(() => {
        if (initialOptions) {
            setOptions(initialOptions);
        }
    }, [initialOptions]);

    const { data, isLoading, refetch } = useScriptList(currentUser, options);
    const mutations = useScriptMutations(currentUser);

    // Keep refetch stable
    const refetchRef = useRef(refetch);
    useEffect(() => {
        refetchRef.current = refetch;
    }, [refetch]);

    // Handle appending for "Load More" functionality
    useEffect(() => {
        if (data) {
            if (options.append) {
                setAllScripts(prev => {
                    // Avoid duplicates
                    const existingIds = new Set(prev.map(s => s.id));
                    const newScripts = data.scripts.filter(s => !existingIds.has(s.id));
                    return [...prev, ...newScripts];
                });
            } else {
                setAllScripts(data.scripts);
            }
        }
    }, [data, options.append]);

    const fetchScripts = useCallback(async (newOptions?: FetchScriptsOptions) => {
        if (newOptions) {
            setOptions(prev => {
                // Deep check to avoid redundant updates if options are same
                const next = { ...prev, ...newOptions };
                if (JSON.stringify(next) === JSON.stringify(prev)) return prev;
                return next;
            });
        } else {
            refetchRef.current();
        }
    }, []);

    const getScriptById = async (id: string): Promise<Script | null> => {
        return queryClient.fetchQuery({
            queryKey: ['script', id],
            queryFn: async () => {
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
                    characters: data.characters || [],
                    sheets: data.sheets || []
                } as Script;
            },
            staleTime: 1000 * 60 * 5,
        });
    };

    const getScriptSummaryById = async (id: string): Promise<ScriptSummary | null> => {
        try {
            const { data, error } = await supabase
                .from('scripts')
                .select(`
                    id, title, status, version, author_id, content_id, created_at, updated_at, 
                    estimated_duration, script_type, is_in_shoot_queue, channel_id, category, tags, objective,
                    idea_owner_id, locked_by, locked_at, share_token, is_public, is_personal,
                    author:profiles!scripts_author_id_fkey(full_name, avatar_url),
                    idea_owner:profiles!scripts_idea_owner_id_fkey(full_name, avatar_url),
                    locker:profiles!scripts_locked_by_fkey(full_name, avatar_url)
                `)
                .eq('id', id)
                .maybeSingle();

            if (error) throw error;
            if (data) return mapScriptSummary(data);
            return null;
        } catch (err) {
            return null;
        }
    };

    const getScriptByContentId = async (contentId: string): Promise<ScriptSummary | null> => {
        try {
            const { data, error } = await supabase
                .from('scripts')
                .select(`
                    id, title, status, version, author_id, content_id, created_at, updated_at, 
                    estimated_duration, script_type, is_in_shoot_queue, channel_id, category, tags, objective,
                    idea_owner_id, locked_by, locked_at, share_token, is_public, is_personal,
                    author:profiles!scripts_author_id_fkey(full_name, avatar_url),
                    idea_owner:profiles!scripts_idea_owner_id_fkey(full_name, avatar_url),
                    locker:profiles!scripts_locked_by_fkey(full_name, avatar_url)
                `)
                .eq('content_id', contentId)
                .maybeSingle();

            if (error) throw error;
            if (data) return mapScriptSummary(data);
            return null;
        } catch (err) {
            return null;
        }
    };

    return {
        scripts: allScripts,
        totalCount: data?.totalCount || 0,
        isLoading,
        fetchScripts,
        getScriptById,
        getScriptSummaryById,
        getScriptByContentId, 
        ...mutations
    };
};
