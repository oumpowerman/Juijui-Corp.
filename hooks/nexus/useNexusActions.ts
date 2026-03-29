
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { NexusIntegration, NexusFolder, User, NexusPlatform } from '../../types';
import { extractYouTubeId, getYouTubeThumbnail } from '../../utils/nexusUtils';
import { GoogleGenAI } from "@google/genai";

export const useNexusActions = (
    currentUser: User,
    integrations: NexusIntegration[],
    setIntegrations: React.Dispatch<React.SetStateAction<NexusIntegration[]>>,
    folders: NexusFolder[],
    setFolders: React.Dispatch<React.SetStateAction<NexusFolder[]>>,
    currentFolderId: string | null,
    aiEnabled: boolean,
    apiKey: string | undefined,
    showConfirm: (message: string) => Promise<boolean>
) => {
    const [isAdding, setIsAdding] = useState(false);

    const handleAddIntegration = async (url: string, platform: NexusPlatform) => {
        if (!currentUser) return;
        setIsAdding(true);
        try {
            let title = `New ${platform.toLowerCase().replace('_', ' ')} link`;
            let description = `Added on ${new Date().toLocaleDateString()}`;
            let thumbnailUrl = undefined;
            let integrationTags: string[] = [];

            // 1. Platform Specific Extraction
            let rawTitle = '';
            if (platform === NexusPlatform.YOUTUBE || platform === NexusPlatform.TIKTOK) {
                try {
                    const oembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
                    const res = await fetch(oembedUrl);
                    const data = await res.json();
                    if (data.title) {
                        title = data.title;
                        rawTitle = data.title;
                    }
                    if (data.thumbnail_url) thumbnailUrl = data.thumbnail_url;
                    if (data.author_name) description = `โดย ${data.author_name} • ${platform.toLowerCase()}`;
                } catch (e) {
                    console.warn(`${platform} oEmbed fallback failed`);
                }
            }

            if (platform === NexusPlatform.YOUTUBE && !thumbnailUrl) {
                const videoId = extractYouTubeId(url);
                if (videoId) thumbnailUrl = getYouTubeThumbnail(videoId);
            }

            // 2. AI Enrichment
            if (apiKey && aiEnabled) {
                try {
                    const ai = new GoogleGenAI({ apiKey });
                    const response = await ai.models.generateContent({
                        model: "gemini-3-flash-preview",
                        contents: `คุณคือ Nexus AI อัจฉริยะ หน้าที่ของคุณคือสกัดข้อมูลจาก URL นี้: ${url}
                        แพลตฟอร์ม: ${platform}
                        ชื่อที่ดึงมาได้เบื้องต้น: ${rawTitle || 'ไม่ทราบ'}
                        โฟลเดอร์ที่มีอยู่: ${folders.map(f => f.name).join(', ')}
                        
                        คำสั่งพิเศษ:
                        - ทุกอย่างต้องตอบเป็น "ภาษาไทย" (Thai Language)
                        - หากมีชื่อที่ดึงมาได้ (Base Title) ให้ใช้ชื่อนั้นเป็นหลัก แต่สามารถขัดเกลาให้สละสลวยขึ้นได้
                        - สรุปเนื้อหา (Description) ให้กระชับ น่าสนใจ และเป็นภาษาไทย
                        - คิด Hashtags ภาษาไทยที่เกี่ยวข้อง 3-5 คำ (เช่น #ความรู้, #บันเทิง, #งานออกแบบ)
                        - หากเป็น Google Drive/Sheet ให้พยายามเดาเนื้อหาจากชื่อไฟล์
                        - แนะนำชื่อโฟลเดอร์ที่เหมาะสมที่สุดจาก "โฟลเดอร์ที่มีอยู่" หากไม่มีที่เหมาะสมให้ตอบ null
                        
                        ตอบกลับในรูปแบบ JSON เท่านั้น:
                        {
                          "title": "ชื่อเรื่องภาษาไทย",
                          "description": "คำอธิบายภาษาไทยสั้นๆ",
                          "thumbnailUrl": "ลิงก์รูปภาพ (ถ้ามี)",
                          "tags": ["แท็ก1", "แท็ก2", "แท็ก3"],
                          "suggestedFolderName": "ชื่อโฟลเดอร์"
                        }`,
                        config: { responseMimeType: "application/json" }
                    });

                    const aiData = JSON.parse(response.text || '{}');
                    
                    if (aiData.title && (!rawTitle || rawTitle.length < 5)) {
                        title = aiData.title;
                    } else if (aiData.title && rawTitle) {
                        title = aiData.title;
                    }

                    if (aiData.description) description = aiData.description;
                    if (aiData.thumbnailUrl && !thumbnailUrl) thumbnailUrl = aiData.thumbnailUrl;
                    if (aiData.tags) integrationTags = aiData.tags;
                } catch (aiErr: any) {
                    console.warn('AI Metadata enrichment failed:', aiErr);
                }
            }

            // 3. Manual Fallback
            if (title.startsWith('New ') || title === "External Resource" || title.includes('link')) {
                try {
                    const urlObj = new URL(url);
                    const hostname = urlObj.hostname.replace('www.', '');
                    
                    if (platform === NexusPlatform.GENERIC) {
                        title = hostname.charAt(0).toUpperCase() + hostname.slice(1);
                    } else if (platform === NexusPlatform.CANVA) {
                        title = "Canva Design";
                    } else {
                        const pathParts = urlObj.pathname.split('/').filter(p => p.length > 5);
                        if (pathParts.length > 0) {
                            const lastPart = pathParts[pathParts.length - 1];
                            if (lastPart.includes('-')) {
                                title = lastPart.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                            } else {
                                title = `${platform.charAt(0) + platform.slice(1).toLowerCase().replace('_', ' ')} Resource`;
                            }
                        }
                    }
                } catch {}
            }

            const newIntegration: any = {
                user_id: currentUser.id,
                title,
                url,
                platform,
                description,
                thumbnail_url: thumbnailUrl,
                tags: integrationTags,
                folder_id: currentFolderId,
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('nexus_integrations')
                .insert([newIntegration])
                .select()
                .single();

            if (error) throw error;

            const mapped = {
                ...data,
                thumbnailUrl: data.thumbnail_url,
                folderId: data.folder_id,
                userId: data.user_id,
                createdAt: data.created_at,
                updatedAt: data.updated_at
            };

            const updated = [mapped, ...integrations];
            setIntegrations(updated);
            localStorage.setItem(`nexus_integrations_${currentUser.id}`, JSON.stringify(updated));
        } catch (err) {
            console.error('Error adding integration:', err);
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteIntegration = async (id: string) => {
        if (!currentUser) return;
        if (!await showConfirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) return;
        
        const updated = integrations.filter(i => i.id !== id);
        setIntegrations(updated);
        localStorage.setItem(`nexus_integrations_${currentUser.id}`, JSON.stringify(updated));
        
        try {
            await supabase.from('nexus_integrations').delete().eq('id', id);
        } catch (err) {
            console.error('Error deleting integration:', err);
        }
    };

    const handleUpdateIntegration = async (id: string, updates: Partial<NexusIntegration>) => {
        if (!currentUser) return;
        
        const updatedIntegrations = integrations.map(i => i.id === id ? { ...i, ...updates } : i);
        setIntegrations(updatedIntegrations);
        localStorage.setItem(`nexus_integrations_${currentUser.id}`, JSON.stringify(updatedIntegrations));

        try {
            const { error } = await supabase
                .from('nexus_integrations')
                .update({
                    title: updates.title,
                    description: updates.description,
                    folder_id: (updates as any).folderId !== undefined ? (updates as any).folderId : undefined,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
        } catch (err) {
            console.error('Error updating integration:', err);
        }
    };

    const handleSaveFolder = async (folderData: Partial<NexusFolder>, editingFolder: NexusFolder | null) => {
        if (!currentUser) return;

        try {
            if (editingFolder) {
                const { data, error } = await supabase
                    .from('nexus_folders')
                    .update({
                        name: folderData.name,
                        description: folderData.description,
                        color: folderData.color,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editingFolder.id)
                    .select()
                    .single();

                if (error) throw error;
                const mapped = {
                    ...data,
                    parentId: data.parent_id,
                    userId: data.user_id,
                    createdAt: data.created_at,
                    updatedAt: data.updated_at
                };
                setFolders(prev => prev.map(f => f.id === mapped.id ? mapped : f));
            } else {
                const newFolder = {
                    user_id: currentUser.id,
                    name: folderData.name,
                    description: folderData.description,
                    color: folderData.color,
                    parent_id: currentFolderId,
                    updated_at: new Date().toISOString()
                };

                const { data, error } = await supabase
                    .from('nexus_folders')
                    .insert([newFolder])
                    .select()
                    .single();

                if (error) throw error;
                const mapped = {
                    ...data,
                    parentId: data.parent_id,
                    userId: data.user_id,
                    createdAt: data.created_at,
                    updatedAt: data.updated_at
                };
                setFolders(prev => [...prev, mapped]);
            }
        } catch (err) {
            console.error('Error saving folder:', err);
        }
    };

    const handleDeleteFolder = async (folderId: string) => {
        if (!currentUser) return;
        if (!await showConfirm('คุณต้องการลบโฟลเดอร์นี้ใช่หรือไม่? (รายการข้างในจะถูกย้ายออกมารวมด้านนอก)')) return;

        try {
            const parentId = folders.find(f => f.id === folderId)?.parentId || null;
            await supabase
                .from('nexus_integrations')
                .update({ folder_id: parentId })
                .eq('folder_id', folderId);

            const { error } = await supabase
                .from('nexus_folders')
                .delete()
                .eq('id', folderId);

            if (error) throw error;
            setFolders(prev => prev.filter(f => f.id !== folderId));
            setIntegrations(prev => prev.map(i => i.folderId === folderId ? { ...i, folderId: parentId } : i));
        } catch (err) {
            console.error('Error deleting folder:', err);
        }
    };

    return {
        isAdding,
        handleAddIntegration,
        handleDeleteIntegration,
        handleUpdateIntegration,
        handleSaveFolder,
        handleDeleteFolder
    };
};
