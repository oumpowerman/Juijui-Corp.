
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Script, User, ScriptType } from '../types';
import { useToast } from '../context/ToastContext';
import { GoogleGenerativeAI } from "@google/generative-ai";

export const useScripts = (currentUser: User) => {
    const [scripts, setScripts] = useState<Script[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    const fetchScripts = async () => {
        setIsLoading(true);
        try {
            // Updated query to fetch new columns
            const { data, error } = await supabase
                .from('scripts')
                .select(`
                    *,
                    author:profiles!scripts_author_id_fkey(full_name, avatar_url),
                    idea_owner:profiles!scripts_idea_owner_id_fkey(full_name, avatar_url),
                    contents (title)
                `)
                .order('is_in_shoot_queue', { ascending: false }) // Show queued items first
                .order('updated_at', { ascending: false });

            if (error) throw error;

            if (data) {
                setScripts(data.map((s: any) => ({
                    id: s.id,
                    title: s.title,
                    content: s.content || '',
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
                    characters: s.characters || [],
                    isInShootQueue: s.is_in_shoot_queue || false,
                    // Map new fields
                    channelId: s.channel_id,
                    category: s.category,
                    tags: s.tags || [],
                    objective: s.objective
                })));
            }
        } catch (err: any) {
            console.error('Fetch scripts failed:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Realtime
    useEffect(() => {
        fetchScripts();
        const channel = supabase.channel('realtime-scripts')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'scripts' }, () => fetchScripts())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    // Create Script with extended data
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
                characters: scriptData.characters || [],
                is_in_shoot_queue: false,
                // New Fields
                channel_id: scriptData.channelId || null,
                category: scriptData.category || null,
                tags: scriptData.tags || [],
                objective: scriptData.objective || ''
            };

            const { data, error } = await supabase.from('scripts').insert(payload).select().single();
            if (error) throw error;

            showToast('สร้างสคริปต์ใหม่แล้ว 📝', 'success');
            return data.id; 
        } catch (err: any) {
            showToast('สร้างไม่สำเร็จ: ' + err.message, 'error');
            return null;
        }
    };

    const updateScript = async (id: string, updates: Partial<Script>) => {
        try {
            const payload: any = {
                updated_at: new Date().toISOString()
            };
            if (updates.title !== undefined) payload.title = updates.title;
            if (updates.content !== undefined) payload.content = updates.content;
            if (updates.status !== undefined) payload.status = updates.status;
            if (updates.version !== undefined) payload.version = updates.version;
            if (updates.estimatedDuration !== undefined) payload.estimated_duration = updates.estimatedDuration;
            
            if (updates.scriptType !== undefined) payload.script_type = updates.scriptType;
            if (updates.characters !== undefined) payload.characters = updates.characters;
            if (updates.isInShootQueue !== undefined) payload.is_in_shoot_queue = updates.isInShootQueue;
            
            if (updates.ideaOwnerId !== undefined) payload.idea_owner_id = updates.ideaOwnerId;
            
            // Update new fields
            if (updates.channelId !== undefined) payload.channel_id = updates.channelId;
            if (updates.category !== undefined) payload.category = updates.category;
            if (updates.tags !== undefined) payload.tags = updates.tags;
            if (updates.objective !== undefined) payload.objective = updates.objective;

            const { error } = await supabase.from('scripts').update(payload).eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.error('Update script failed', err);
        }
    };

    const toggleShootQueue = async (id: string, currentStatus: boolean) => {
        try {
            await updateScript(id, { isInShootQueue: !currentStatus });
            showToast(!currentStatus ? 'เพิ่มลงรายการถ่ายวันนี้แล้ว 🎒' : 'เอาออกจากรายการแล้ว', 'success');
        } catch(err) {
            showToast('อัปเดตไม่สำเร็จ', 'error');
        }
    };

    const deleteScript = async (id: string) => {
        if (!confirm('ยืนยันการลบสคริปต์นี้? (กู้คืนไม่ได้นะ)')) return;
        try {
            await supabase.from('scripts').delete().eq('id', id);
            showToast('ลบเรียบร้อย', 'info');
        } catch (err) {
            showToast('ลบไม่สำเร็จ', 'error');
        }
    };

    const generateScriptWithAI = async (prompt: string, type: 'HOOK' | 'OUTLINE' | 'FULL') => {
        try {
            const apiKey = process.env.API_KEY;
            if (!apiKey) throw new Error("API Key Missing");

            const genAI = new GoogleGenerativeAI(apiKey);
            
            let systemInstruction = "You are a professional creative scriptwriter for social media (TikTok, Reels, YouTube).";
            let fullPrompt = "";

            if (type === 'HOOK') {
                fullPrompt = `Generate 5 viral hooks for a video about: "${prompt}". Keep them punchy, under 5 seconds reading time each. Thai language.`;
            } else if (type === 'OUTLINE') {
                fullPrompt = `Create a video outline (Intro, Body points, CTA) for: "${prompt}". Thai language.`;
            } else {
                fullPrompt = `Write a full script for a video about: "${prompt}". Include visual cues in [brackets]. Thai language. Casual and engaging tone.`;
            }

            const finalPrompt = `${systemInstruction}\n\nTask: ${fullPrompt}`;

            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(finalPrompt);
            const response = await result.response;
            return response.text();

        } catch (err: any) {
            console.error(err);
            showToast('AI Error: ' + err.message, 'error');
            return null;
        }
    };

    return {
        scripts,
        isLoading,
        createScript,
        updateScript,
        deleteScript,
        toggleShootQueue,
        generateScriptWithAI
    };
};
