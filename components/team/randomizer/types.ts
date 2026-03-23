import { User } from '../../../types';

export interface RandomizerHistoryItem {
    id: string;
    created_at: string;
    topic: string;
    winner_ids: string[];
    created_by: string;
    winners?: User[];
}
