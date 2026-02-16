
import { InventoryItem } from './index';

// Extended type for UI presentation (handling Stacks)
export interface PresentationAsset extends InventoryItem {
    isStack?: boolean;
    stackCount?: number;
    stackItems?: InventoryItem[]; // Keep reference to children
}
