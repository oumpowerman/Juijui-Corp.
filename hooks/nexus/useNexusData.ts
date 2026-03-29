
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { NexusIntegration, NexusFolder, User } from '../../types';

export const useNexusData = (currentUser: User) => {
    const [integrations, setIntegrations] = useState<NexusIntegration[]>([]);
    const [folders, setFolders] = useState<NexusFolder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            // Fetch Integrations
            const { data: integrationsData, error: integrationsError } = await supabase
                .from('nexus_integrations')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('updated_at', { ascending: false });

            if (integrationsError) throw integrationsError;
            
            // Map snake_case to camelCase
            const mappedIntegrations = (integrationsData || []).map((i: any) => ({
                ...i,
                thumbnailUrl: i.thumbnail_url,
                folderId: i.folder_id,
                userId: i.user_id,
                createdAt: i.created_at,
                updatedAt: i.updated_at
            }));
            setIntegrations(mappedIntegrations);
            localStorage.setItem(`nexus_integrations_${currentUser.id}`, JSON.stringify(mappedIntegrations));

            // Fetch Folders
            const { data: foldersData, error: foldersError } = await supabase
                .from('nexus_folders')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('name', { ascending: true });

            if (foldersError) {
                console.warn('Folders table might not exist yet');
            } else {
                // Map snake_case to camelCase
                const mappedFolders = (foldersData || []).map((f: any) => ({
                    ...f,
                    parentId: f.parent_id,
                    userId: f.user_id,
                    createdAt: f.created_at,
                    updatedAt: f.updated_at
                }));
                setFolders(mappedFolders);
                localStorage.setItem(`nexus_folders_${currentUser.id}`, JSON.stringify(mappedFolders));
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            const localInt = localStorage.getItem(`nexus_integrations_${currentUser.id}`);
            const localFold = localStorage.getItem(`nexus_folders_${currentUser.id}`);
            if (localInt) setIntegrations(JSON.parse(localInt));
            if (localFold) setFolders(JSON.parse(localFold));
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        integrations,
        setIntegrations,
        folders,
        setFolders,
        isLoading,
        fetchData
    };
};
