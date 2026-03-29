
import { NexusIntegration, NexusFolder } from '../../../types';

export const filterIntegrations = (
    integrations: NexusIntegration[],
    activeTab: string,
    selectedTags: string[],
    searchQuery: string,
    currentFolderId: string | null
) => {
    return integrations.filter(item => {
        // 1. Search Logic (Global if searching, otherwise folder-scoped)
        const matchesSearch = searchQuery === '' 
            ? item.folderId === currentFolderId
            : (item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
               item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
               item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
        
        if (!matchesSearch) return false;

        // 2. Tab Logic
        const matchesTab = activeTab === 'ALL' || item.platform.includes(activeTab);
        if (!matchesTab) return false;

        // 3. Tag Logic
        const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => item.tags.includes(tag));
        return matchesTags;
    });
};

export const filterFolders = (
    folders: NexusFolder[],
    searchQuery: string,
    currentFolderId: string | null
) => {
    // Only show folders if NOT searching (folders are navigational)
    if (searchQuery !== '') return [];
    return folders.filter(f => f.parentId === currentFolderId);
};
