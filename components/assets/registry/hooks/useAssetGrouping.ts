
import { useMemo } from 'react';
import { InventoryItem } from '../../../../types';
import { PresentationAsset } from '../../../../types/assets-ui';

export const useAssetGrouping = (assets: InventoryItem[], expandedStack: string | null) => {
    
    const displayAssets = useMemo(() => {
        if (expandedStack) {
            // If viewing a stack, filter only items in that stack
            return assets.filter(a => a.groupLabel === expandedStack) as PresentationAsset[];
        }

        // Otherwise, group by label
        const groups: Record<string, InventoryItem[]> = {};
        const singles: PresentationAsset[] = [];

        assets.forEach(item => {
            if (item.groupLabel) {
                if (!groups[item.groupLabel]) groups[item.groupLabel] = [];
                groups[item.groupLabel].push(item);
            } else {
                singles.push(item);
            }
        });

        const stacks: PresentationAsset[] = Object.entries(groups).map(([label, items]) => {
            // Create a virtual "Stack Item" representing the group
            // We use the first item as the visual representative
            const rep = items[0];
            return {
                ...rep,
                id: `stack-${label}`, // Virtual ID
                isStack: true,        // Flag for rendering
                stackCount: items.length,
                name: label,          // Use group label as name
                stackItems: items     // Keep reference if needed
            };
        });

        // Combine and Sort
        // Safe Sort: Handle missing createdAt by defaulting to 0
        return [...stacks, ...singles].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA; 
        });

    }, [assets, expandedStack]);

    return { displayAssets };
};
